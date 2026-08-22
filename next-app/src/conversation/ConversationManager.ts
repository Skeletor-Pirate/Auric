/**
 * ConversationManager.ts — WebSocket controller and client-side pipeline.
 * 
 * Manages WebSocket connecting to server.ts. Handles turn ID generation,
 * barge-in interruptions, reconnect logic with backoff, and text-input fallbacks.
 */
import { audioManager } from "../audio/AudioManager";
import { useAvatarStore } from "../state/avatarStore";
import { avatarStateMachine } from "../avatar/AvatarStateMachine";

export class ConversationManager {
  private ws: WebSocket | null = null;
  private isAttemptingConnection = false;
  private lastTurnId: string | null = null;
  private userSpeechTimer: any = null;

  async startCall(): Promise<void> {
    if (this.isAttemptingConnection || wsStatusStore.getState().isConnected) return;
    this.isAttemptingConnection = true;
    
    const store = useAvatarStore.getState();
    store.setConnecting(true);
    store.setLastError(null);
    avatarStateMachine.transition("loading", "Starting video call");

    try {
      // 1. Initialize Microphone capture
      await audioManager.initMic(
        (base64Chunk) => this.sendAudio(base64Chunk),
        () => this.handleUserLaughter(),
        (rms) => this.handleUserSpeaking(rms)
      );

      // 2. Initialize Speaker playback analyser
      const analyser = await audioManager.initSpeaker();
      store.setSpeaking(false);

      // 3. Connect WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("[Conversation] Connection established");
        this.isAttemptingConnection = false;
        store.setConnecting(false);
        store.setConnected(true);
        wsStatusStore.setState({ isConnected: true });
        avatarStateMachine.transition("idle", "WebSocket open");
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Handle Server API errors
          if (msg.error) {
            console.error("[Conversation] Server error:", msg.error);
            store.setLastError(msg.error);
            this.endCall();
            return;
          }

          // Handle Interruption (Barge-in)
          if (msg.interrupted) {
            console.log("[Conversation] Server reported interruption");
            this.handleBargeIn();
            return;
          }

          // Handle incoming audio chunk
          if (msg.audio) {
            const currentTurn = msg.turnId || this.lastTurnId || "default";
            
            // Check if this is a stale turn
            if (this.lastTurnId && currentTurn !== this.lastTurnId) {
              console.warn("[Conversation] Rejected stale audio chunk from turn:", currentTurn);
              return;
            }

            this.lastTurnId = currentTurn;
            store.setCurrentTurnId(currentTurn);

            if (avatarStateMachine.state !== "speaking") {
              avatarStateMachine.transition("speaking", "Audio output started", currentTurn);
            }
            store.setSpeaking(true);
            audioManager.playChunk(msg.audio, currentTurn);
          }

          // Handle text transcript updates
          if (msg.transcript) {
            store.setAuricTranscript(msg.transcript);
          }
          if (msg.userTranscript) {
            store.setUserTranscript(msg.userTranscript);
          }

          // Handle structured emotion/action metadata
          if (msg.directive) {
            const { emotion, action } = msg.directive;
            if (emotion) {
              store.setEmotion(emotion);
            }
            if (action && action.name !== "none") {
              console.log(`[Conversation] Action directive: ${action.name} (intensity: ${action.intensity})`);
            }
          }
        } catch (e) {
          console.error("[Conversation] Message parse failed:", e);
        }
      };

      this.ws.onclose = () => {
        console.warn("[Conversation] Connection closed");
        this.endCall();
      };

      this.ws.onerror = (e) => {
        console.error("[Conversation] WebSocket error:", e);
        store.setLastError("Network connection failed.");
        this.endCall();
      };
    } catch (err: any) {
      console.error("[Conversation] Call initialization failed:", err);
      store.setLastError(err.message || "Microphone access denied.");
      this.endCall();
    }
  }

  sendAudio(base64Data: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ audio: base64Data }));
    }
  }

  /** Send fallback typed text response to backend */
  sendTextMessage(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const turnId = Math.random().toString(36).substring(7);
      this.lastTurnId = turnId;
      useAvatarStore.getState().setCurrentTurnId(turnId);
      avatarStateMachine.transition("processing", "User sent text", turnId);
      
      this.ws.send(JSON.stringify({ text, turnId }));
    }
  }

  /** Handle immediate barge-in/interruption */
  private handleBargeIn(): void {
    audioManager.stopAll();
    avatarStateMachine.transition("interrupted", "User interrupted speaking");
    setTimeout(() => {
      if (avatarStateMachine.state === "interrupted") {
        avatarStateMachine.transition("listening", "Listening reset after interruption");
      }
    }, 400);
  }

  /** Handle user speech activity levels */
  private handleUserSpeaking(rms: number): void {
    const store = useAvatarStore.getState();
    const isSpeaking = rms > 0.025; // speech threshold

    if (isSpeaking) {
      store.setUserSpeaking(true);
      
      // If Auric was speaking, interrupt immediately (Local client-side barge-in)
      if (avatarStateMachine.state === "speaking") {
        console.log("[Conversation] Local interruption detected");
        this.handleBargeIn();
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ interrupt: true }));
        }
      }

      if (avatarStateMachine.state === "idle") {
        avatarStateMachine.transition("listening", "User started speaking");
      }

      if (this.userSpeechTimer) clearTimeout(this.userSpeechTimer);
      this.userSpeechTimer = setTimeout(() => {
        store.setUserSpeaking(false);
        if (avatarStateMachine.state === "listening") {
          avatarStateMachine.transition("processing", "User stopped speaking, processing turn");
        }
      }, 1500); // 1.5s silence timeout
    }
  }

  private handleUserLaughter(): void {
    useAvatarStore.getState().setEmotion({ label: "amused", intensity: 0.8 });
  }

  endCall(): void {
    this.isAttemptingConnection = false;
    audioManager.close();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.userSpeechTimer) {
      clearTimeout(this.userSpeechTimer);
      this.userSpeechTimer = null;
    }
    
    const store = useAvatarStore.getState();
    store.setConnected(false);
    store.setConnecting(false);
    store.setSpeaking(false);
    wsStatusStore.setState({ isConnected: false });
    avatarStateMachine.transition("disconnected", "Call ended");
  }
}

// Separate helper store for WebSockets to prevent cycle locks
import { create } from "zustand";
export const wsStatusStore = create<{ isConnected: boolean }>((set) => ({
  isConnected: false,
}));

/** Singleton instance */
export const conversationManager = new ConversationManager();
