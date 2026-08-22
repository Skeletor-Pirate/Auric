/**
 * ConversationManager.ts — WebSpeech + Groq client-side pipeline.
 * 
 * Uses ephemeral SpeechRecognition objects for absolute stability.
 */
import { useAvatarStore } from "../state/avatarStore";
import { avatarStateMachine } from "../avatar/AvatarStateMachine";

export class ConversationManager {
  private recognition: any = null;
  private isAttemptingConnection = false;
  private chatHistory: any[] = [];
  private synthInterval: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private failsafeTimer: any = null;

  async startCall(): Promise<void> {
    if (this.isAttemptingConnection || useAvatarStore.getState().isConnected) return;
    this.isAttemptingConnection = true;
    
    const store = useAvatarStore.getState();
    store.setConnecting(true);
    store.setLastError(null);
    avatarStateMachine.transition("loading", "Starting audio call");

    try {
      this.isAttemptingConnection = false;
      store.setConnecting(false);
      store.setConnected(true);
      this.startListening();
    } catch (err: any) {
      console.error("[Conversation] Call initialization failed:", err);
      store.setLastError("Failed to initialize WebSpeech API.");
      this.endCall();
    }
  }

  private startListening() {
      const store = useAvatarStore.getState();
      if (!store.isConnected || store.isSpeaking || store.isProcessing) return;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          store.setLastError("Speech Recognition API is not supported in this browser. Please use Chrome or Edge.");
          this.endCall();
          return;
      }

      if (this.recognition) {
          this.recognition.onend = null;
          try { this.recognition.abort(); } catch (e) {}
      }

      this.recognition = new SpeechRecognition();
      // continuous = false makes it automatically detect when you stop speaking a sentence
      this.recognition.continuous = false; 
      this.recognition.interimResults = true;
      
      this.recognition.onstart = () => {
        avatarStateMachine.transition("idle", "Recognition active");
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (interimTranscript) {
           store.setUserTranscript(interimTranscript);
        }

        if (finalTranscript) {
           store.setUserTranscript(finalTranscript);
           this.handleUserText(finalTranscript);
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error === "not-allowed") {
             store.setLastError("Microphone access denied.");
             this.endCall();
        }
      };

      this.recognition.onend = () => {
         // Auto restart if still connected, not speaking, and not processing
         const currentStore = useAvatarStore.getState();
         if (currentStore.isConnected && !currentStore.isSpeaking && !currentStore.isProcessing) {
             setTimeout(() => this.startListening(), 100);
         }
      };

      try {
          this.recognition.start();
      } catch (e) {
          console.error("Failed to start recognition", e);
      }
  }

  async handleUserText(text: string) {
    if (!text.trim()) return;
    
    const store = useAvatarStore.getState();
    store.setProcessing(true);
    
    // Stop listening while we process and talk
    if (this.recognition) {
       this.recognition.onend = null;
       try { this.recognition.abort(); } catch(e) {}
    }
    window.speechSynthesis.cancel();
    
    const turnId = Math.random().toString(36).substring(7);
    store.setCurrentTurnId(turnId);
    avatarStateMachine.transition("processing", "User sent text", turnId);
    
    try {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const response = await fetch(`${protocol}//${host}/api/chat`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ text, history: this.chatHistory })
        });
        
        if (!response.ok) {
           throw new Error("Failed to get response from Groq");
        }
        
        const data = await response.json();
        const aiText = data.response;
        
        this.chatHistory.push({ role: "user", content: text });
        this.chatHistory.push({ role: "assistant", content: aiText });
        
        store.setAuricTranscript(aiText);
        store.setProcessing(false);
        
        this.speakResponse(aiText, turnId);
    } catch (e) {
       console.error(e);
       store.setProcessing(false);
       store.setLastError("Network or API error while processing.");
       this.startListening(); // Resume listening on error
    }
  }

  speakResponse(text: string, turnId: string) {
     this.currentUtterance = new SpeechSynthesisUtterance(text);
     const utterance = this.currentUtterance;
     
     const voices = window.speechSynthesis.getVoices();
     const voice = voices.find(v => v.name.includes("Female") || v.name.includes("Google UK English Female") || v.name.includes("Zira")) || voices[0];
     if (voice) utterance.voice = voice;
     utterance.rate = 1.1;
     utterance.pitch = 0.9;
     
     const store = useAvatarStore.getState();
     
     utterance.onstart = () => {
        store.setSpeaking(true);
        avatarStateMachine.transition("speaking", "Audio output started", turnId);
        
        this.synthInterval = setInterval(() => {
           store.setEmotion({ label: "neutral", intensity: Math.random() * 0.5 + 0.5 });
        }, 100);
     };
     
     utterance.onend = () => {
        if (this.failsafeTimer) clearTimeout(this.failsafeTimer);
        
        store.setSpeaking(false);
        avatarStateMachine.transition("listening", "Model finished speaking");
        clearInterval(this.synthInterval);
        this.currentUtterance = null;
        
        // Wait 500ms for echoes to clear, then listen
        setTimeout(() => this.startListening(), 500);
     };
     
     // Failsafe: if the speech gets stuck, force clear it
     if (this.failsafeTimer) clearTimeout(this.failsafeTimer);
     this.failsafeTimer = setTimeout(() => {
        const currentStore = useAvatarStore.getState();
        if (currentStore.isSpeaking && this.currentUtterance === utterance) {
            console.warn("Failsafe: utterance onend never fired.");
            if (this.currentUtterance.onend) {
                this.currentUtterance.onend(new Event("end"));
            }
        }
     }, Math.max(15000, text.length * 100)); 

     window.speechSynthesis.speak(utterance);
  }

  sendTextMessage(text: string): void {
     this.handleUserText(text);
  }

  endCall(): void {
    this.isAttemptingConnection = false;
    if (this.recognition) {
       this.recognition.onend = null;
       try { this.recognition.abort(); } catch(e) {}
       this.recognition = null;
    }
    window.speechSynthesis.cancel();
    clearInterval(this.synthInterval);
    if (this.failsafeTimer) clearTimeout(this.failsafeTimer);
    
    const store = useAvatarStore.getState();
    store.setConnected(false);
    store.setConnecting(false);
    store.setSpeaking(false);
    store.setProcessing(false);
    avatarStateMachine.transition("disconnected", "Call ended");
  }
}

export const conversationManager = new ConversationManager();
