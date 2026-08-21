import { AcousticMetrics } from "../types";

export class LiveAudioAnalyzer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isAnalyzing: boolean = false;
  private animationFrameId: number | null = null;

  // Real-time tracking buffers
  private pitchSamples: number[] = [];
  private energySamples: number[] = [];
  private speechStartTimestamp: number = 0;
  private pauseDurationTotal: number = 0;
  private lastSilenceTimestamp: number = 0;
  private speechBurstCount: number = 0;

  // Callbacks
  private onMetricsUpdate?: (metrics: AcousticMetrics, rawWaveform: Uint8Array) => void;

  public async startMicrophone(
    onMetrics?: (metrics: AcousticMetrics, rawWaveform: Uint8Array) => void
  ): Promise<boolean> {
    try {
      this.onMetricsUpdate = onMetrics;
      this.recordedChunks = [];
      this.pitchSamples = [];
      this.energySamples = [];
      this.pauseDurationTotal = 0;
      this.speechBurstCount = 0;
      this.speechStartTimestamp = performance.now();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.microphoneStream = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      // Start MediaRecorder for sending actual audio to Gemini
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/wav",
      ];
      let selectedMime = "";
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      this.mediaRecorder.start(100);

      this.isAnalyzing = true;
      this.processAudioLoop();
      return true;
    } catch (err) {
      console.error("Microphone initialization error:", err);
      return false;
    }
  }

  private processAudioLoop = () => {
    if (!this.isAnalyzing || !this.analyser || !this.audioCtx) return;

    const timeBuffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(timeBuffer);

    const freqBuffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(freqBuffer);

    const rawWaveform = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(rawWaveform);

    // 1. Calculate RMS Energy and dB
    let sumSquares = 0;
    for (let i = 0; i < timeBuffer.length; i++) {
      sumSquares += timeBuffer[i] * timeBuffer[i];
    }
    const rms = Math.sqrt(sumSquares / timeBuffer.length);
    const db = rms > 0.00001 ? 20 * Math.log10(rms) : -100;
    this.energySamples.push(db);

    // 2. Pitch Detection via Auto-correlation
    const pitch = this.detectPitchAutocorrelation(timeBuffer, this.audioCtx.sampleRate);
    if (pitch > 60 && pitch < 500) {
      this.pitchSamples.push(pitch);
    }

    // 3. Zero Crossing Rate
    let zeroCrossings = 0;
    for (let i = 1; i < timeBuffer.length; i++) {
      if ((timeBuffer[i] >= 0 && timeBuffer[i - 1] < 0) || (timeBuffer[i] < 0 && timeBuffer[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zcr = zeroCrossings / timeBuffer.length;

    // 4. Spectral Centroid
    let num = 0;
    let den = 0;
    const nyquist = this.audioCtx.sampleRate / 2;
    for (let i = 0; i < freqBuffer.length; i++) {
      const freq = (i / freqBuffer.length) * nyquist;
      num += freq * freqBuffer[i];
      den += freqBuffer[i];
    }
    const spectralCentroid = den > 0 ? num / den : 1000;

    // 5. Silence / Pause Tracking & Speech rate
    const now = performance.now();
    const isSpeaking = rms > 0.02; // Threshold for vocal activity
    if (!isSpeaking) {
      if (this.lastSilenceTimestamp === 0) {
        this.lastSilenceTimestamp = now;
      }
    } else {
      if (this.lastSilenceTimestamp > 0) {
        const silenceDuration = (now - this.lastSilenceTimestamp) / 1000;
        if (silenceDuration > 0.3) {
          this.pauseDurationTotal += silenceDuration;
          this.speechBurstCount++;
        }
        this.lastSilenceTimestamp = 0;
      }
    }

    // Averages
    const validPitches = this.pitchSamples.slice(-40);
    const avgPitch = validPitches.length > 0 ? validPitches.reduce((a, b) => a + b, 0) / validPitches.length : 180;
    const pitchVariance =
      validPitches.length > 1
        ? Math.sqrt(
            validPitches.reduce((acc, val) => acc + Math.pow(val - avgPitch, 2), 0) / validPitches.length
          )
        : 15;

    const totalElapsedSec = Math.max((now - this.speechStartTimestamp) / 1000, 0.5);
    // Estimated words per minute based on speech bursts and rhythm
    const estimatedWpm = Math.min(Math.max((this.speechBurstCount / totalElapsedSec) * 60 * 2.5, 90), 220);

    // Vocal strain estimator (high high-frequency spectral centroid + low pitch variance + high energy)
    const vocalStrain = Math.min(
      Math.max(
        (spectralCentroid / 3000) * 40 +
          (db > -18 ? 30 : 10) +
          (pitchVariance < 10 ? 25 : 0),
        5
      ),
      95
    );

    const metrics: AcousticMetrics = {
      pitchAvgHz: Math.round(avgPitch),
      pitchVariance: Math.round(pitchVariance),
      energyDb: Math.round(db),
      speechRateWpm: Math.round(estimatedWpm),
      pauseDurationSec: Number(this.pauseDurationTotal.toFixed(2)),
      zeroCrossingRate: Number(zcr.toFixed(3)),
      spectralCentroid: Math.round(spectralCentroid),
      vocalStrainScore: Math.round(vocalStrain),
    };

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(metrics, rawWaveform);
    }

    this.animationFrameId = requestAnimationFrame(this.processAudioLoop);
  };

  // Autocorrelation pitch detector algorithm
  private detectPitchAutocorrelation(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let sumOfSquares = 0;
    for (let i = 0; i < SIZE; i++) {
      sumOfSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumOfSquares / SIZE);
    if (rms < 0.015) return -1; // Not enough vocal energy

    // Trim edges to find active range
    let r1 = 0;
    let r2 = SIZE - 1;
    const threshold = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < threshold) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < threshold) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmedBuffer = buffer.slice(r1, r2);
    const c = new Float32Array(trimmedBuffer.length);
    for (let i = 0; i < trimmedBuffer.length; i++) {
      for (let j = 0; j < trimmedBuffer.length - i; j++) {
        c[i] = c[i] + trimmedBuffer[j] * trimmedBuffer[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < trimmedBuffer.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;
    if (T0 === 0) return -1;

    return sampleRate / T0;
  }

  public async stopMicrophone(): Promise<{ audioBlob: Blob; audioBase64: string; mimeType: string }> {
    this.isAnalyzing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.onstop = async () => {
          const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
          const audioBlob = new Blob(this.recordedChunks, { type: mimeType });
          const audioBase64 = await this.blobToBase64(audioBlob);

          // Cleanup stream tracks
          if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach((track) => track.stop());
            this.microphoneStream = null;
          }
          if (this.audioCtx && this.audioCtx.state !== "closed") {
            this.audioCtx.close().catch(() => {});
            this.audioCtx = null;
          }

          resolve({ audioBlob, audioBase64, mimeType });
        };
        this.mediaRecorder.stop();
      } else {
        const dummyBlob = new Blob([], { type: "audio/webm" });
        resolve({ audioBlob: dummyBlob, audioBase64: "", mimeType: "audio/webm" });
      }
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        // Strip data:audio/xyz;base64, prefix
        const base64 = res.includes(",") ? res.split(",")[1] : res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
