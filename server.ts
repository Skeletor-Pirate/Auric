import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { WebSocketServer } from "ws";
import cors from "cors";
import url from "url";

dotenv.config();

// In-memory session history storage (stores up to last 20 turns per session)
const sessionHistories = new Map<string, any[]>();

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "dummy-key",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const PERSONA_SYSTEM_INSTRUCTION = `
You are Auric, an advanced, highly capable, and all-knowing AI assistant. You operate from a sleek, futuristic, minimalist dashboard. Your core directive is to assist the user with absolute efficiency, logic, and a calm, authoritative yet welcoming tone. You have access to various systems, memory, and tasks. You can determine which external APIs to use for complex requests by executing your Chain of Thought logic.
Speak naturally but precisely. You are not a human; you are a futuristic AI companion. Keep your responses concise and action-oriented. If the user mentions "daddy's home", respond with a welcoming, slightly dramatic "Welcome back, sir. Systems are online and at your disposal.", similar to Jarvis.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS for all routes
  app.use(cors());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "KATIE Voice AI Companion (Rebuilt)",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      time: new Date().toISOString(),
    });
  });

  // UTM / campaign tracking endpoint
  app.post("/api/track", (req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body || "{}");
        console.log("[Track]", new Date().toISOString(), JSON.stringify(data));
        res.json({ ok: true });
      } catch {
        res.status(400).json({ ok: false, error: "Invalid JSON" });
      }
    });
  });

  // Client-side rendered routes handled by the SPA shell

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // API 404s first (before Vite's SPA fallback can swallow them)
    app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

    app.use(vite.middlewares);

    // Unknown non-SPA paths fall through to the SPA shell (client renders 404)
    app.use((req, res, next) => {
      if (req.path.startsWith("/live")) return next();
      next();
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "Not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`KATIE server listening on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server: httpServer, path: "/live" });

  wss.on("connection", async (clientWs, req) => {
    if (!process.env.GEMINI_API_KEY) {
      clientWs.send(JSON.stringify({ error: "Missing GEMINI_API_KEY" }));
      clientWs.close();
      return;
    }
    
    // Extract session ID
    const parsedUrl = url.parse(req.url || "", true);
    const sessionId = (parsedUrl.query.sessionId as string) || "default-session";
    if (!sessionHistories.has(sessionId)) {
      sessionHistories.set(sessionId, []);
    }
    const history = sessionHistories.get(sessionId)!;
    
    const ai = getAI();
    let session: any = null;
    let isClientClosed = false;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    // ---------- Reusable Gemini session factory ----------
    async function createGeminiSession(isReconnect: boolean = false): Promise<any> {
      // Helper: fetch with timeout to prevent hanging the Gemini session
      const fetchWithTimeout = (url: string, options: any, timeoutMs = 8000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        return fetch(url, { ...options, signal: controller.signal })
          .finally(() => clearTimeout(timer));
      };

      return ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: PERSONA_SYSTEM_INSTRUCTION,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "query_external_api",
                  description: "Use ONLY for specific integrations like calendar, reminders, tasks, memory, or local Ollama. Do NOT use for general knowledge, web search, news, or current events — use Google Search grounding for those instead.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      api_name: {
                        type: Type.STRING,
                        description: "The API to call (e.g. 'groq', 'openrouter', 'ollama', 'calendar', 'tasks', 'memory')."
                      },
                      query: {
                        type: Type.STRING,
                        description: "The specific query or payload."
                      }
                    },
                    required: ["api_name", "query"]
                  }
                }
              ]
            },
            { googleSearch: {} }
          ]
        },
        callbacks: {
          onopen: () => {
            console.log(`[Gemini Live] Session opened successfully${isReconnect ? " (reconnect)" : ""}`);
          },
          onmessage: (message: LiveServerMessage) => {
            try {
              if (isClientClosed) return;
              const content = message.serverContent;
              
              if (content?.modelTurn?.parts) {
                for (const part of content.modelTurn.parts) {
                  // Handle text parts (if any)
                  if (part.text) {
                    console.log("[Gemini] Text:", part.text.substring(0, 80));
                    clientWs.send(JSON.stringify({ transcript: part.text }));
                    history.push({ role: "model", parts: [{ text: part.text }] });
                    if (history.length > 20) history.shift();
                  }
                  
                  // Handle audio parts
                  if (part.inlineData?.data) {
                    clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
                  }
                  
                  // Handle function call (Chain of Thought routing)
                  if (part.functionCall) {
                    console.log("[Gemini] Function call:", part.functionCall.name, part.functionCall.args);
                    const apiName = (part.functionCall.args as any)?.api_name || "unknown";
                    const query = (part.functionCall.args as any)?.query || "";
                    const funcCallRef = { name: part.functionCall.name, id: part.functionCall.id };
                    
                    clientWs.send(JSON.stringify({ 
                      transcript: `[Internal System] Querying ${apiName}...`,
                      isProcessing: true
                    }));

                    (async () => {
                      let apiResult = "No result";
                      try {
                        const tryGroq = async (q: string) => {
                          const key = process.env.GROQ_API_KEY;
                          if (!key) throw new Error("GROQ_API_KEY not set");
                          const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: q }] })
                          });
                          if (!res.ok) throw new Error(await res.text());
                          const json = await res.json();
                          return json.choices?.[0]?.message?.content || "No content returned";
                        };

                        const tryOpenRouter = async (q: string) => {
                          const key = process.env.OPENROUTER_API_KEY;
                          if (!key) throw new Error("OPENROUTER_API_KEY not set");
                          const res = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`, "HTTP-Referer": "http://localhost:3000", "X-Title": "Auric AI" },
                            body: JSON.stringify({ model: "perplexity/sonar", messages: [{ role: "user", content: q }] })
                          });
                          if (!res.ok) throw new Error(await res.text());
                          const json = await res.json();
                          return json.choices?.[0]?.message?.content || "No content returned";
                        };

                        const tryOllama = async (q: string) => {
                          const res = await fetchWithTimeout("http://localhost:11434/v1/chat/completions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ model: "llama3", messages: [{ role: "user", content: q }] })
                          }, 15000);
                          if (!res.ok) throw new Error(await res.text());
                          const json = await res.json();
                          return json.choices?.[0]?.message?.content || "No content returned";
                        };

                        // Determine priority based on what Gemini requested
                        const priority = apiName.toLowerCase();
                        let funcsToTry: Array<{name: string, fn: (q: string) => Promise<string>}> = [];
                        
                        if (priority === "groq") {
                          funcsToTry = [ {name: "Groq", fn: tryGroq}, {name: "OpenRouter", fn: tryOpenRouter}, {name: "Ollama", fn: tryOllama} ];
                        } else if (priority === "openrouter" || priority === "perplexity") {
                          funcsToTry = [ {name: "OpenRouter", fn: tryOpenRouter}, {name: "Groq", fn: tryGroq}, {name: "Ollama", fn: tryOllama} ];
                        } else if (priority === "ollama" || priority === "local") {
                          funcsToTry = [ {name: "Ollama", fn: tryOllama}, {name: "Groq", fn: tryGroq}, {name: "OpenRouter", fn: tryOpenRouter} ];
                        } else {
                          // Default fallback chain for unknown API
                          funcsToTry = [ {name: "Groq", fn: tryGroq}, {name: "OpenRouter", fn: tryOpenRouter}, {name: "Ollama", fn: tryOllama} ];
                        }

                        // Try each in order until one succeeds
                        let success = false;
                        let lastError = "";
                        for (const provider of funcsToTry) {
                          try {
                            console.log(`[API] Attempting ${provider.name}...`);
                            apiResult = await provider.fn(query);
                            success = true;
                            break;
                          } catch (e: any) {
                            console.warn(`[API] ${provider.name} failed:`, e.message);
                            lastError = e.message;
                          }
                        }

                        if (!success) {
                          apiResult = `All API backends (Groq, OpenRouter, Ollama) failed. Last error: ${lastError}. Please answer from your own knowledge.`;
                        }
                      } catch (err: any) {
                        console.error(`[API] Fatal logic error:`, err.message);
                        apiResult = `API execution error: ${err.message}. Please answer from your own knowledge.`;
                      }

                      // Send tool response back — session might have died during the API call
                      try {
                        session.sendToolResponse({
                          functionResponses: [{ name: funcCallRef.name, id: funcCallRef.id, response: { result: apiResult } }]
                        });
                      } catch (e) {
                        console.warn("[Server] sendToolResponse failed (session may have reconnected):", e);
                      }
                      
                      try { clientWs.send(JSON.stringify({ isProcessing: false })); } catch (e) { /* ignore */ }
                    })();
                  }
                }
              }

              // Turn complete signal
              if (content?.turnComplete) {
                console.log("[Gemini] Turn complete");
                clientWs.send(JSON.stringify({ turnComplete: true }));
              }

              // Handle interruption
              if (content?.interrupted) {
                console.log("[Gemini] Received interruption signal");
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            } catch (err) {
              console.error("[Gemini Live] Error processing server message:", err);
            }
          },
          onerror: (error: any) => {
            console.error("[Gemini Live] Stream error:", error.message || error);
            try {
              clientWs.send(JSON.stringify({ error: `Gemini stream error: ${error.message || error}` }));
            } catch (e) { /* ws may be closed */ }
          },
          onclose: (event: any) => {
            const code = event?.code ?? event?.Symbol?.(Symbol.for("kCode")) ?? "unknown";
            const reason = event?.reason ?? "";
            console.log(`[Gemini Live] Session closed (code: ${code}, reason: ${reason})`);
            
            // Auto-reconnect if the client is still connected
            if (!isClientClosed && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              reconnectAttempts++;
              const delay = Math.min(1000 * reconnectAttempts, 5000);
              console.log(`[Gemini Live] Auto-reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
              
              try {
                clientWs.send(JSON.stringify({ 
                  transcript: `[System] Reconnecting to Auric... (attempt ${reconnectAttempts})` 
                }));
              } catch (e) { /* ignore */ }
              
              setTimeout(async () => {
                if (isClientClosed) return;
                try {
                  session = await createGeminiSession(true);
                  reconnectAttempts = 0; // Reset on successful reconnect
                  console.log("[Gemini Live] Reconnected successfully!");
                  
                  // Re-inject history so context is preserved
                  if (history.length > 0) {
                    session.sendClientContent({
                      turns: history.slice(-10), // Last 10 turns for context
                      turnComplete: true,
                    });
                  }
                  
                  try {
                    clientWs.send(JSON.stringify({ 
                      transcript: "[System] Reconnected. I'm listening again." 
                    }));
                  } catch (e) { /* ignore */ }
                } catch (err: any) {
                  console.error("[Gemini Live] Reconnection failed:", err.message);
                  try {
                    clientWs.send(JSON.stringify({ 
                      error: `Reconnection failed: ${err.message}. Please reconnect manually.` 
                    }));
                  } catch (e) { /* ignore */ }
                }
              }, delay);
            } else if (!isClientClosed) {
              try {
                clientWs.send(JSON.stringify({ 
                  error: "Gemini session closed. Max reconnect attempts reached. Please reconnect." 
                }));
              } catch (e) { /* ignore */ }
            }
          },
        },
      });
    }

    // ---------- Initial connection ----------
    try {
      session = await createGeminiSession(false);
      console.log("[Gemini Live] Connected to model successfully");
    } catch (error: any) {
      console.error("Failed to connect to Gemini Live:", error);
      clientWs.send(JSON.stringify({ error: `Gemini Connection Failed: ${error.message}` }));
      clientWs.close();
      return;
    }

    // Inject history if exists
    if (history.length > 0) {
      try {
        session.sendClientContent({
          turns: history,
          turnComplete: true,
        });
      } catch (err) {
        console.error("Error injecting history:", err);
      }
    } else {
      try {
        session.sendClientContent({
          turns: [{ role: "user", parts: [{ text: "Hey! The call just connected. Please say a brief, casual hello to start the conversation." }] }],
          turnComplete: true,
        });
      } catch (err) {
        console.error("Error sending initial prompt:", err);
      }
    }

    clientWs.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        
        // Forward client microphone chunks
        if (parsed.audio) {
          try {
            session.sendRealtimeInput({
              audio: { mimeType: "audio/pcm;rate=16000", data: parsed.audio }
            });
          } catch (e) {
            // Session might be dead during reconnect — silently drop audio
          }
        }

        // Forward fallback typed text
        if (parsed.text) {
          history.push({ role: "user", parts: [{ text: parsed.text }] });
          if (history.length > 20) history.shift();
          try {
            session.sendClientContent({
              turns: [{ role: "user", parts: [{ text: parsed.text }] }],
              turnComplete: true,
            });
          } catch (e) {
            // Session might be dead during reconnect
            console.warn("[Server] Could not send text, session may be reconnecting");
          }
        }

        // Handle interruption trigger from client
        if (parsed.interrupt) {
          console.log("[Gemini] Received interruption signal, letting VAD handle barge-in naturally");
        }
      } catch (err) {
        console.error("Error processing client message:", err);
      }
    });

    clientWs.on("close", () => {
      isClientClosed = true;
      try {
        session?.close();
      } catch (e) {
        // ignore
      }
    });
  });
}

// Prevent server crash on unhandled errors
process.on("unhandledRejection", (reason) => {
  console.error("[Process] Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Process] Uncaught exception:", err.message);
});

startServer();
