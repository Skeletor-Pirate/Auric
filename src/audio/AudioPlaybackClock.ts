/**
 * AudioPlaybackClock.ts — Playback clock synchronization.
 * 
 * Exposes current audio playback offset, buffered size, turn tracking,
 * and audio energy levels to keep mouth animation synced perfectly to audible output.
 */
export class AudioPlaybackClock {
  private playbackStartTime = 0;
  private timeOffset = 0;
  private isPlaying = false;
  private currentTurnId: string | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array | null = null;

  start(turnId: string, audioCtxTime: number, duration: number): void {
    this.playbackStartTime = audioCtxTime;
    this.isPlaying = true;
    this.currentTurnId = turnId;
    this.timeOffset = 0;
  }

  stop(): void {
    this.isPlaying = false;
    this.playbackStartTime = 0;
    this.currentTurnId = null;
    this.timeOffset = 0;
  }

  interrupt(): void {
    this.stop();
  }

  setAnalyser(analyser: AnalyserNode | null): void {
    this.analyser = analyser;
    this.freqData = null; // re-allocate for the new analyser's bin count
  }

  getCurrentPlaybackTime(audioCtxTime: number): number {
    if (!this.isPlaying) return 0;
    return audioCtxTime - this.playbackStartTime;
  }

  isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentTurnId(): string | null {
    return this.currentTurnId;
  }

  /** Calculate current audio RMS amplitude from the analyser node */
  getAudioLevel(): number {
    if (!this.isPlaying || !this.analyser) return 0;

    if (!this.freqData || this.freqData.length !== this.analyser.frequencyBinCount) {
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }
    this.analyser.getByteFrequencyData(this.freqData);

    let sum = 0;
    for (let i = 0; i < this.freqData.length; i++) {
      sum += this.freqData[i] * this.freqData[i];
    }
    return Math.sqrt(sum / this.freqData.length) / 255;
  }
}

/** Singleton instance */
export const audioPlaybackClock = new AudioPlaybackClock();
