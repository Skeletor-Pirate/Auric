/**
 * LipSyncController.ts — Amplitude-driven lip sync (Mode A).
 *
 * Owns: jawOpen, jawForward, mouthFunnel, mouthPucker, mouthClose,
 *       mouthLowerDown*, mouthUpperUp*, mouthStretch*
 * Does NOT own: smile/frown, brows, cheeks (FaceExpression).
 *
 * Mode A: Reads RMS audio level → smooths → drives jaw + lip morph targets.
 * No viseme targets exist in the GLB, so this is the only available mode.
 */
import { setMorphTarget, MORPH_TARGETS } from "./morphTargetMap";
import type { MorphMeshRef } from "./FaceExpressionController";

export interface LipSyncState {
  isActive: boolean;
  smoothedLevel: number;
  rawLevel: number;
  currentViseme: "silence" | "amplitude";
}

export class LipSyncController {
  private meshRefs: MorphMeshRef[] = [];

  // Smoothing state
  private smoothedLow = 0;
  private smoothedMid = 0;
  private smoothedHigh = 0;
  private smoothedRms = 0;

  // Configuration
  private readonly attackSmoothing = 0.45; // fast attack
  private readonly releaseSmoothing = 0.15; // slow release
  private readonly maxJaw = 0.85;
  private readonly silenceThreshold = 0.02;

  // External audio source
  private analyserNode: AnalyserNode | null = null;
  private freqData: Uint8Array | null = null;
  private isPlaying = false;
  private currentTurnId: string | null = null;

  get state(): LipSyncState {
    return {
      isActive: this.isPlaying,
      smoothedLevel: this.smoothedRms,
      rawLevel: this.smoothedLow,
      currentViseme: this.isPlaying && this.smoothedRms > this.silenceThreshold ? "amplitude" : "silence",
    };
  }

  initialize(meshRefs: MorphMeshRef[]): void {
    this.meshRefs = meshRefs;
    console.log("[LipSync] Mode A (amplitude-driven) initialized");
  }

  /** Connect to an AnalyserNode from the audio playback chain */
  connectAnalyser(analyser: AnalyserNode | null): void {
    this.analyserNode = analyser;
    this.freqData = null; // re-allocate for the new analyser's bin count
  }

  /** Called when audio playback starts */
  startSpeaking(turnId: string): void {
    this.isPlaying = true;
    this.currentTurnId = turnId;
  }

  /** Called when audio playback stops or is interrupted */
  stopSpeaking(): void {
    this.isPlaying = false;
    this.currentTurnId = null;
  }

  /** Reject events from stale turns */
  isCurrentTurn(turnId: string): boolean {
    return this.currentTurnId === turnId;
  }

  /** Call every frame */
  update(_delta: number): void {
    if (!this.isPlaying || !this.analyserNode) {
      // Blend mouth back to neutral smoothly
      this.smoothedLow *= 0.88;
      this.smoothedMid *= 0.88;
      this.smoothedHigh *= 0.88;
      this.smoothedRms *= 0.88;
      this.applyMouthWeights(this.smoothedLow, this.smoothedMid, this.smoothedHigh);
      return;
    }

    // Read frequency data (buffer cached across frames to avoid GC churn)
    const analyser = this.analyserNode;
    if (!this.freqData || this.freqData.length !== analyser.frequencyBinCount) {
      this.freqData = new Uint8Array(analyser.frequencyBinCount);
    }
    const fd = this.freqData;
    analyser.getByteFrequencyData(fd);

    // Split into frequency bands
    const binCount = fd.length;
    let lowSum = 0, midSum = 0, highSum = 0;
    const lowEnd = Math.min(10, binCount);
    const midEnd = Math.min(35, binCount);
    const highEnd = Math.min(100, binCount);

    for (let i = 1; i <= lowEnd; i++) lowSum += fd[i];
    for (let i = lowEnd + 1; i <= midEnd; i++) midSum += fd[i];
    for (let i = midEnd + 1; i <= highEnd; i++) highSum += fd[i];

    const avgLow = lowSum / Math.max(lowEnd, 1) / 255;
    const avgMid = midSum / Math.max(midEnd - lowEnd, 1) / 255;
    const avgHigh = highSum / Math.max(highEnd - midEnd, 1) / 255;

    // Smooth with asymmetric attack/release
    const smoothFn = (current: number, target: number) => {
      const factor = target > current ? this.attackSmoothing : this.releaseSmoothing;
      return current + (target - current) * factor;
    };

    this.smoothedLow = smoothFn(this.smoothedLow, avgLow);
    this.smoothedMid = smoothFn(this.smoothedMid, avgMid);
    this.smoothedHigh = smoothFn(this.smoothedHigh, avgHigh);
    this.smoothedRms = (this.smoothedLow + this.smoothedMid + this.smoothedHigh) / 3;

    this.applyMouthWeights(this.smoothedLow, this.smoothedMid, this.smoothedHigh);
  }

  private applyMouthWeights(low: number, mid: number, high: number): void {
    // Derive mouth shape from frequency bands
    let jaw = Math.min(low * 1.8, this.maxJaw);
    const funnel = low * 0.65;
    const pucker = mid * 0.7;
    const close = high * 0.85;

    // When high consonant energy is strong, reduce jaw opening
    if (close > 0.3) jaw = Math.min(jaw, 0.2);

    // Small asymmetry for naturalness
    const asymmetry = Math.sin(Date.now() * 0.003) * 0.03;

    for (const ref of this.meshRefs) {
      const { dictionary: dict, influences: inf } = ref;

      setMorphTarget(dict, inf, MORPH_TARGETS.jawOpen, jaw, 0.5);
      setMorphTarget(dict, inf, MORPH_TARGETS.mouthFunnel, funnel, 0.4);
      setMorphTarget(dict, inf, MORPH_TARGETS.mouthPucker, pucker, 0.4);
      setMorphTarget(dict, inf, MORPH_TARGETS.mouthClose, close, 0.4);
      setMorphTarget(dict, inf, MORPH_TARGETS.mouthStretchLeft, mid * 0.3 + asymmetry, 0.3);
      setMorphTarget(dict, inf, MORPH_TARGETS.mouthStretchRight, mid * 0.3 - asymmetry, 0.3);
      setMorphTarget(dict, inf, MORPH_TARGETS.mouthLowerDownLeft, jaw * 0.3, 0.35);
      setMorphTarget(dict, inf, MORPH_TARGETS.mouthLowerDownRight, jaw * 0.3, 0.35);
    }
  }

  dispose(): void {
    this.meshRefs = [];
    this.analyserNode = null;
    this.freqData = null;
  }
}
