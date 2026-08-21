/**
 * EmotionController.ts — Manager for conversational emotion states.
 * 
 * Maps valence, arousal, and conversational context to facial presets.
 * Smooths weight transitions over time (hysteresis) to prevent rapid snapping.
 */
import type { Emotion } from "../state/avatarStore";
import type { FaceExpressionController } from "./FaceExpressionController";

export class EmotionController {
  private faceController: FaceExpressionController;
  private currentEmotion: Emotion = {
    label: "neutral",
    intensity: 0,
    valence: 0,
    arousal: 0,
    interest: 0.5,
  };
  
  private smoothingFactor = 0.05; // smoothing rate for valence/arousal/interest

  constructor(faceController: FaceExpressionController) {
    this.faceController = faceController;
  }

  /** Update emotion parameters and apply smoothing */
  updateEmotion(targetEmotion: Emotion, delta: number): void {
    // Apply hysteresis / smoothing
    const lerp = (current: number, target: number) => {
      return current + (target - current) * this.smoothingFactor;
    };

    // Label updates immediately, but weights blend smoothly
    this.currentEmotion.label = targetEmotion.label;
    this.currentEmotion.intensity = lerp(this.currentEmotion.intensity, targetEmotion.intensity);
    this.currentEmotion.valence = lerp(this.currentEmotion.valence, targetEmotion.valence);
    this.currentEmotion.arousal = lerp(this.currentEmotion.arousal, targetEmotion.arousal);
    this.currentEmotion.interest = lerp(this.currentEmotion.interest, targetEmotion.interest);

    // Apply smoothed emotion to face controller
    this.faceController.setEmotion(this.currentEmotion);
  }

  getCurrentEmotion(): Emotion {
    return this.currentEmotion;
  }
}
