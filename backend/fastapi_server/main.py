import os
import json
import asyncio
import base64
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlmodel import SQLModel, Field, Session, create_engine, select
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST

from .gemini_client import GeminiStreamer
from .models import Conversation
from .db import get_session, engine

app = FastAPI()

# ---------- JWT for LiveKit ----------
LIVEKIT_SECRET = os.getenv("LIVEKIT_SECRET", "devsecret")
ALGORITHM = "HS256"

def create_livekit_token() -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "exp": now + datetime.timedelta(hours=24),
        "iat": now,
        "iss": "auric-avatar",
        "sub": "user",
    }
    return jwt.encode(payload, LIVEKIT_SECRET, algorithm=ALGORITHM)

@app.get("/api/token")
async def get_livekit_token():
    token = create_livekit_token()
    return {"token": token, "wsUrl": "ws://localhost:7880"}

# ---------- Health & Metrics ----------
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"}

# Prometheus counters
AUDIO_CHUNKS = Counter("audio_chunks_total", "Total audio chunks received from client")
GEMINI_RESPONSES = Counter("gemini_responses_total", "Total responses received from Gemini")
ERRORS = Counter("errors_total", "Total errors raised in the server")

@app.get("/metrics")
async def metrics():
    return JSONResponse(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

# ---------- Gemini WebSocket Proxy ----------
@app.websocket("/ws/gemini")
async def websocket_gemini(ws: WebSocket, session: Session = Depends(get_session)):
    await ws.accept()
    streamer = GeminiStreamer()
    try:
        async for message in ws.iter_bytes():
            # Each message is a raw PCM chunk (16kHz mono).
            AUDIO_CHUNKS.inc()
            # Forward to Gemini streamer and get async generator of responses.
            async for gemini_msg in streamer.process_chunk(message):
                GEMINI_RESPONSES.inc()
                # gemini_msg is a dict like {"audio": "base64", "transcript": "...", "emotion": "joy"}
                # Store in DB
                db_entry = Conversation(
                    user_audio=message,
                    assistant_audio=base64.b64decode(gemini_msg.get("audio", "")),
                    transcript=gemini_msg.get("transcript", ""),
                    emotion=gemini_msg.get("emotion"),
                )
                session.add(db_entry)
                session.commit()
                # Echo back to client
                await ws.send_json(gemini_msg)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        ERRORS.inc()
        await ws.close(code=1011)
        raise e

# ---------- Startup ----------
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
