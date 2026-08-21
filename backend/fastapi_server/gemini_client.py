"""
gemini_client.py — Gemini Live streaming client for the FastAPI backend.

Wraps the Google Generative AI SDK's live.connect() WebSocket stream.
"""
import os
import json
import asyncio
from typing import AsyncGenerator

from google import genai
from google.genai import types


class GeminiStreamer:
    """Manages a single Gemini Live session and yields response chunks."""

    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY environment variable is not set")
        self.client = genai.Client(api_key=api_key)
        self.session = None

    async def process_chunk(self, pcm_bytes: bytes) -> AsyncGenerator[dict, None]:
        """Send a PCM audio chunk and asynchronously yield response dicts."""
        # Lazily connect on the first chunk
        if self.session is None:
            self.session = await self.client.aio.live.connect(
                model="models/gemini-2.5-flash-native-audio-latest",
                config=types.LiveConnectConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name="Zephyr"
                            )
                        )
                    ),
                ),
            )

        # Send audio
        await self.session.send(input=pcm_bytes, end_of_turn=True)

        # Drain any queued responses
        turn = self.session.receive()
        async for response in turn:
            parts = response.server_content.model_turn.parts if response.server_content else []
            for part in parts:
                result: dict = {}
                if part.inline_data:
                    result["audio"] = part.inline_data.data
                if part.text:
                    try:
                        parsed = json.loads(part.text)
                        result["transcript"] = parsed.get("spoken_text", part.text)
                        result["emotion"] = parsed.get("emotion", {}).get("label")
                    except json.JSONDecodeError:
                        result["transcript"] = part.text
                if result:
                    yield result

    async def close(self) -> None:
        if self.session:
            await self.session.close()
            self.session = None
