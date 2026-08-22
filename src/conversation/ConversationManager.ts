import { useAvatarStore } from "../state/avatarStore";
import { avatarStateMachine } from "../avatar/AvatarStateMachine";
import { audioManager } from "../audio/AudioManager";

export class ConversationManager {
  private isAttemptingConnection = false;
  private chatHistory: any[] = [];
  private synthInterval: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private failsafeTimer: any = null;
  
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private silenceTimer: any = null;

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
      
      await audioManager.initMic(
        () => {}, 
        () => {}, 
        (rms) => this.handleUserVAD(rms)
      );
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
             this.audioChunks.push(e.data);
          }
      };
      
      this.mediaRecorder.onstop = () => {
          this.processRecordedAudio();
      };
      
      avatarStateMachine.transition("idle", "Recognition active");
    } catch (err: any) {
      console.error("[Conversation] Call initialization failed:", err);
      store.setLastError("Failed to initialize Mic API.");
      this.endCall();
    }
  }
  
  private handleUserVAD(rms: number): void {
      const store = useAvatarStore.getState();
      if (store.isProcessing || store.isSpeaking || !store.isConnected) return;
      
      const isSpeaking = rms > 0.05;
      
      if (isSpeaking) {
          if (this.silenceTimer) {
              clearTimeout(this.silenceTimer);
              this.silenceTimer = null;
          }
          
          if (!this.isRecording && this.mediaRecorder?.state === "inactive") {
              console.log("[STT] Starting recording...");
              this.isRecording = true;
              this.audioChunks = [];
              try {
                  this.mediaRecorder.start();
                  avatarStateMachine.transition("listening", "User started speaking");
              } catch (e) {
                  console.error("Failed to start MediaRecorder:", e);
                  this.isRecording = false;
              }
          }
      } else {
          if (this.isRecording) {
              if (!this.silenceTimer) {
                  this.silenceTimer = setTimeout(() => {
                      if (this.mediaRecorder?.state === "recording") {
                          console.log("[STT] Silence detected, stopping recording...");
                          this.isRecording = false;
                          this.mediaRecorder.stop();
                      }
                      this.silenceTimer = null;
                  }, 1200); // 1.2s silence to end turn
              }
          }
      }
  }
  
  private async processRecordedAudio() {
      const store = useAvatarStore.getState();
      if (!store.isConnected) return;
      
      store.setProcessing(true);
      avatarStateMachine.transition("processing", "Audio recorded, sending to Sarvam STT");
      
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = [];
      
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      
      try {
          // 1. Transcribe
          console.log("[STT] Sending to Sarvam STT...");
          const sttRes = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData
          });
          const sttData = await sttRes.json();
          if (!sttData.transcript) throw new Error("Transcription failed");
          
          store.setUserTranscript(sttData.transcript);
          console.log(`[Analytics] STT: ${sttData.latency}ms`);
          
          // 2. RAG
          this.handleUserText(sttData.transcript);
      } catch (e) {
          console.error(e);
          store.setProcessing(false);
          avatarStateMachine.transition("idle", "Error processing audio");
      }
  }

  async handleUserText(text: string) {
    if (!text.trim()) {
        useAvatarStore.getState().setProcessing(false);
        return;
    }
    window.speechSynthesis.cancel();
    
    const store = useAvatarStore.getState();
    const turnId = Math.random().toString(36).substring(7);
    store.setCurrentTurnId(turnId);
    
    try {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const response = await fetch(`${protocol}//${host}/api/rag`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ text, history: this.chatHistory })
        });
        
        if (!response.ok) throw new Error("Failed to get RAG response");
        
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
       avatarStateMachine.transition("idle", "Error");
    }
  }

  private cleanForSpeech(text: string): string {
      return text.replace(/<[^>]*>?/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_~`#]/g, '').replace(/(^|\n)\s*-\s+/g, '$1').replace(/\n+/g, ' ').trim();
  }

  speakResponse(text: string, turnId: string) {
     const cleanText = this.cleanForSpeech(text);
     this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
     const utterance = this.currentUtterance;
     
     const voices = window.speechSynthesis.getVoices();
     const voice = voices.find(v => v.name.includes("Female") || v.name.includes("Google UK English Female") || v.name.includes("Zira")) || voices[0];
     if (voice) utterance.voice = voice;
     utterance.rate = 1.1;
     utterance.pitch = 0.9;
     
     const store = useAvatarStore.getState();
     
     let startTimeout = setTimeout(() => {
         console.warn("[TTS] Speech synthesis failed to start within 2s, cancelling...");
         window.speechSynthesis.cancel();
         if (this.failsafeTimer) clearTimeout(this.failsafeTimer);
         store.setSpeaking(false);
         avatarStateMachine.transition("idle", "Speech synthesis failed");
         this.currentUtterance = null;
     }, 2000);

     utterance.onstart = () => {
        clearTimeout(startTimeout);
        store.setSpeaking(true);
        avatarStateMachine.transition("speaking", "Audio output started", turnId);
        this.synthInterval = setInterval(() => {
           store.setEmotion({ label: "neutral", intensity: Math.random() * 0.5 + 0.5 });
        }, 100);
     };
     
     utterance.onend = () => {
        if (this.failsafeTimer) clearTimeout(this.failsafeTimer);
        store.setSpeaking(false);
        avatarStateMachine.transition("idle", "Model finished speaking");
        clearInterval(this.synthInterval);
        this.currentUtterance = null;
     };
     
     if (this.failsafeTimer) clearTimeout(this.failsafeTimer);
     this.failsafeTimer = setTimeout(() => {
        const currentStore = useAvatarStore.getState();
        if (currentStore.isSpeaking && this.currentUtterance === utterance) {
            if (this.currentUtterance.onend) this.currentUtterance.onend(new Event("end"));
        }
     }, Math.max(15000, text.length * 100)); 

     window.speechSynthesis.speak(utterance);
  }

  sendTextMessage(text: string): void {
     this.handleUserText(text);
  }

  endCall(): void {
    this.isAttemptingConnection = false;
    audioManager.close();
    window.speechSynthesis.cancel();
    clearInterval(this.synthInterval);
    if (this.failsafeTimer) clearTimeout(this.failsafeTimer);
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
    }
    
    const store = useAvatarStore.getState();
    store.setConnected(false);
    store.setConnecting(false);
    store.setSpeaking(false);
    store.setProcessing(false);
    avatarStateMachine.transition("disconnected", "Call ended");
  }
}

export const conversationManager = new ConversationManager();
