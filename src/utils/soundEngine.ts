// Web Audio Player & Ambient Synthesizer for AURIC companion

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientNoiseSource: AudioNode | null = null;
  public isAmbientPlaying: boolean = false;
  public isSpeaking: boolean = false;

  private initContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play TTS audio returned from backend (either base64 encoded audio container or raw PCM)
  public async playGeminiTTS(
    base64Audio: string,
    sampleRate: number = 24000,
    onEnded?: () => void
  ): Promise<boolean> {
    try {
      this.stopSpeech();
      const ctx = this.initContext();

      // Convert base64 to ArrayBuffer
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;

      try {
        // Try standard decodeAudioData (WAV/MP3/AAC/OGG)
        const arrayBufferCopy = bytes.buffer.slice(0);
        audioBuffer = await ctx.decodeAudioData(arrayBufferCopy);
      } catch (decodeErr) {
        // Fallback: decode raw 16-bit PCM little-endian audio returned by Live/TTS
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768.0;
        }
        audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
        audioBuffer.getChannelData(0).set(float32);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Add gentle gain / dynamics compressor for warmth
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-20, ctx.currentTime);
      compressor.knee.setValueAtTime(40, ctx.currentTime);
      compressor.ratio.setValueAtTime(4, ctx.currentTime);
      compressor.attack.setValueAtTime(0, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.1, ctx.currentTime);

      source.connect(compressor);
      compressor.connect(gain);
      gain.connect(ctx.destination);

      this.currentSource = source;
      this.isSpeaking = true;

      source.onended = () => {
        this.isSpeaking = false;
        this.currentSource = null;
        if (onEnded) onEnded();
      };

      source.start(0);
      return true;
    } catch (err) {
      console.error("Failed to play Gemini TTS audio:", err);
      this.isSpeaking = false;
      return false;
    }
  }

  // Fallback to browser Web Speech API if TTS endpoint isn't available
  public playWebSpeechFallback(text: string, emotion: string = "Calm", onEnded?: () => void) {
    if (!("speechSynthesis" in window)) {
      if (onEnded) onEnded();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Adjust rate and pitch based on emotion
    if (emotion === "Sad" || emotion === "Flat/Depressed") {
      utterance.rate = 0.85;
      utterance.pitch = 0.95;
    } else if (emotion === "Anxious" || emotion === "Stressed") {
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
    } else if (emotion === "Happy" || emotion === "Excited") {
      utterance.rate = 1.1;
      utterance.pitch = 1.15;
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
    }

    // Pick best English voice
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Samantha") ||
          v.name.includes("Google") ||
          v.name.includes("Natural") ||
          v.name.includes("Female") ||
          v.name.includes("Karen") ||
          v.name.includes("Zira"))
    );
    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }

    this.isSpeaking = true;
    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnded) onEnded();
    };
    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnded) onEnded();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeech() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (_) {}
      this.currentSource = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  // Play soothing chime tone for breathing exercise transitions (Inhale / Hold / Exhale)
  public playBreathingBell(type: "inhale" | "hold" | "exhale" | "complete") {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freqMap = {
        inhale: 528, // Love / healing frequency
        hold: 432, // Grounding
        exhale: 396, // Liberation / release
        complete: 639, // Joy / connection
      };

      osc.type = "sine";
      osc.frequency.setValueAtTime(freqMap[type] || 432, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    } catch (_) {}
  }

  // Start soothing ambient soundscape (432Hz warm harmonic pad + brown noise)
  public toggleAmbientSoundscape(soundType: "432hz" | "brown_noise" | "rain" = "432hz"): boolean {
    if (this.isAmbientPlaying) {
      this.stopAmbientSoundscape();
      return false;
    }

    const ctx = this.initContext();
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.ambientGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.5);
    this.ambientGain.connect(ctx.destination);

    if (soundType === "432hz") {
      // Create lush 432Hz chord pad (Root: 432, Minor Third: 518.4, Fifth: 648)
      const freqs = [216, 432, 518.4, 648];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Gentle vibrato LFO
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.1 + Math.random() * 0.15, ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        oscGain.gain.setValueAtTime(0.25 / freqs.length, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(this.ambientGain!);

        osc.start();
        this.ambientOscillators.push(osc);
      });
    } else {
      // Brown noise generator for deep focus / soothing
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain compensation
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Low pass filter
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(soundType === "rain" ? 800 : 350, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);
      whiteNoise.start();
      this.ambientNoiseSource = whiteNoise;
    }

    this.isAmbientPlaying = true;
    return true;
  }

  public stopAmbientSoundscape() {
    if (this.ambientGain && this.audioCtx) {
      this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.5);
      setTimeout(() => {
        this.ambientOscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (_) {}
        });
        this.ambientOscillators = [];
        if (this.ambientNoiseSource) {
          try {
            (this.ambientNoiseSource as any).stop?.();
            this.ambientNoiseSource.disconnect();
          } catch (_) {}
          this.ambientNoiseSource = null;
        }
        if (this.ambientGain) {
          this.ambientGain.disconnect();
          this.ambientGain = null;
        }
        this.isAmbientPlaying = false;
      }, 600);
    } else {
      this.isAmbientPlaying = false;
    }
  }
}

export const soundEngine = new SoundEngine();
