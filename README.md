# Auric OS (Katie Voice AI Companion)

## Overview

**Auric OS** (formerly Katie Voice AI Companion) is a real-time, highly capable Voice AI assistant built on the **Google Gemini Live API**. It features a modern, glassmorphic UI, real-time voice streaming over WebSockets, native web-search grounding, and an automatic API fallback cascade for external LLM routing.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + Vite + TypeScript | High-performance SPA with fast HMR |
| **Styling** | Tailwind CSS v4 | Utility-first CSS with custom glassmorphic aesthetics and dark mode |
| **State Management** | Zustand | Reactive UI state without re-render bloat |
| **Backend** | Express (Node.js) | Static file serving and WebSocket proxy |
| **Real-time Comms** | `ws` (WebSockets) | Bi-directional streaming for PCM audio and JSON payloads |
| **AI (Voice & Brain)** | `@google/genai` | Native Google Gemini Live API for real-time STT, LLM, and TTS |
| **AI (Fallback Routing)** | Groq / OpenRouter / Ollama | External providers for specialized tasks and knowledge via Gemini Chain-of-Thought routing |

## Features

- **Real-Time Voice Streaming:** Communicates instantly via bi-directional WebSockets using Google Gemini's native Live capabilities.
- **Dynamic API Fallback Cascade:** Automatically routes complex queries to `Groq`, then `OpenRouter`, then local `Ollama` if one provider is down or out of quota.
- **Native Web Grounding:** Uses Google Search natively within Gemini to answer real-time questions (e.g., stock prices, news).
- **Auto-Reconnection:** Automatically reconnects dropped websocket sessions with exponential backoff while preserving conversation context.
- **Premium UI/UX:** A stunning, cinematic glassmorphic interface with reactive sound globes, telemetry widgets, and an interactive transcript panel.
- **Dark Mode & Ambiance:** Fully togglable dark mode and virtual environment backgrounds.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd katie
   ```

2. **Create a `.env` file** in the root directory with your API keys:
   ```dotenv
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Architecture Note

Unlike previous iterations that relied on LiveKit or separate FastAPI backends, this version uses a unified Express + Vite architecture. The Express server directly proxies the Gemini Live WebSocket, handling API routing, timeouts, and fallback logic securely on the server side before streaming the resulting audio down to the React client.

## Contributing

Feel free to fork the repo, create a feature branch, and open a pull request. Ensure all TypeScript builds pass and UI elements conform to the established glassmorphic design system.

## License

MIT – see `LICENSE` file.
