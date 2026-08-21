/**
 * AudioManager.ts — Context, buffering, and node managers.
 * 
 * Sets up AudioContext, ScriptProcessor for mic capture at 16kHz,
 * AudioContext for speaker output at 24kHz, and buffers audio blocks.
 */
import { base64ToPcm } from "../lib/audio-utils";
import { audioPlaybackClock } from "./AudioPlaybackClock";
import { useAvatarStore } from "../state/avatarStore";

export class AudioManager {
  private micContext: AudioContext | null = null;
  private speakerContext: AudioContext | null = null;
  private micProcessor: ScriptProcessorNode | null = null;
  private mediaStream: MediaStream | null = null;

  private activeSources: AudioBufferSourceNode[] = [];
  private nextPlayTime = 0;
  
  analyser: AnalyserNode | null = null;

  async initMic(
    onAudioChunk: (base64Pcm: string) => void,
    onLaughter: () => void,
    onSpeaking: (level: number) => void
  ): Promise<void> {
    // 1. Request microphone permission
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 2. Create 16kHz mic context
    this.micContext = new AudioContext({ sampleRate: 16000 });
    const source = this.micContext.createMediaStreamSource(this.mediaStream);
    
    // ScriptProcessor capturing mono chunks
    this.micProcessor = this.micContext.createScriptProcessor(4096, 1, 1);
    source.connect(this.micProcessor);
    this.micProcessor.connect(this.micContext.destination);

    // Audio capture loop
    this.micProcessor.onaudioprocess = (e) => {
      const pcmFloat = e.inputBuffer.getChannelData(0);
      
      // Calculate RMS amplitude
      let sum = 0;
      for (let i = 0; i < pcmFloat.length; i++) {
        sum += pcmFloat[i] * pcmFloat[i];
      }
      const rms = Math.sqrt(sum / pcmFloat.length);
      onSpeaking(rms);

      // Trigger user laughter detection (high spike)
      if (rms > 0.18) {
        onLaughter();
      }

      // Convert Float32 to Int16 PCM Base64 and send
      const int16Buffer = new ArrayBuffer(pcmFloat.length * 2);
      const view = new DataView(int16Buffer);
      for (let i = 0; i < pcmFloat.length; i++) {
        const s = Math.max(-1, Math.min(1, pcmFloat[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
      
      let binary = "";
      const bytes = new Uint8Array(int16Buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      onAudioChunk(btoa(binary));
    };

    if (this.micContext.state === "suspended") {
      await this.micContext.resume();
    }
  }

  async initSpeaker(): Promise<AnalyserNode> {
    // Speaker context at 24kHz (Gemini standard output)
    this.speakerContext = new AudioContext({ sampleRate: 24000 });
    
    this.analyser = this.speakerContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(this.speakerContext.destination);
    
    audioPlaybackClock.setAnalyser(this.analyser);

    if (this.speakerContext.state === "suspended") {
      await this.speakerContext.resume();
    }

    this.nextPlayTime = this.speakerContext.currentTime;
    return this.analyser;
  }

  /** Queue base64 audio chunk for playback */
  playChunk(base64Data: string, turnId: string): void {
    if (!this.speakerContext || !this.analyser) return;

    try {
      const pcm = base64ToPcm(base64Data);
      const buffer = this.speakerContext.createBuffer(1, pcm.length, 24000);
      buffer.getChannelData(0).set(pcm);

      const source = this.speakerContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.analyser);

      const now = this.speakerContext.currentTime;
      const startTime = Math.max(now, this.nextPlayTime);
      source.start(startTime);

      // Track active source nodes
      this.activeSources.push(source);
      audioPlaybackClock.start(turnId, startTime, buffer.duration);

      source.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== source);
        if (this.activeSources.length === 0) {
          audioPlaybackClock.stop();
          useAvatarStore.getState().setSpeaking(false);
        }
      };

      this.nextPlayTime = startTime + buffer.duration;
    } catch (e) {
      console.error("[AudioManager] Playback failed:", e);
    }
  }

  /** Force stop all playing chunks immediately (Barge-in) */
  stopAll(): void {
    this.activeSources.forEach((src) => {
      try {
        src.stop();
      } catch (e) {
        // ignore
      }
    });
    this.activeSources = [];
    audioPlaybackClock.interrupt();
    if (this.speakerContext) {
      this.nextPlayTime = this.speakerContext.currentTime;
    }
    useAvatarStore.getState().setSpeaking(false);
  }

  /** Clean up all microphone streams and contexts */
  close(): void {
    this.stopAll();
    
    if (this.micProcessor) {
      this.micProcessor.disconnect();
      this.micProcessor = null;
    }
    if (this.micContext) {
      this.micContext.close().catch(() => {});
      this.micContext = null;
    }
    if (this.speakerContext) {
      this.speakerContext.close().catch(() => {});
      this.speakerContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    audioPlaybackClock.stop();
  }
}

/** Singleton instance */
export const audioManager = new AudioManager();
