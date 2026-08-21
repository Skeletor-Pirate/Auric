/**
 * FaceExpressionController.ts — Procedural facial expression + blinking.
 *
 * Owns: brows, cheeks, eyelids (blink), smile/frown, emotional pose.
 * Does NOT own: jaw/lips (LipSync), eye look targets (LookAt).
 *
 * Expression weights are smoothed and clamped. Blinking is randomized 3–6s.
 */
import * as THREE from "three";
import { setMorphTarget, MORPH_TARGETS, type MorphTargetName } from "./morphTargetMap";
import type { Emotion } from "../state/avatarStore";

/** Morph mesh reference (dict + influences) */
export interface MorphMeshRef {
  dictionary: Record<string, number>;
  influences: number[];
}

/** Expression preset — maps morph target names to target weights */
type ExpressionPreset = Partial<Record<MorphTargetName, number>>;

const EXPRESSIONS: Record<string, ExpressionPreset> = {
  neutral: {},
  amused: {
    mouthSmileLeft: 0.45,
    mouthSmileRight: 0.55,
    cheekSquintLeft: 0.3,
    cheekSquintRight: 0.3,
    eyeSquintLeft: 0.2,
    eyeSquintRight: 0.2,
  },
  intrigued: {
    browInnerUp: 0.3,
    browOuterUpLeft: 0.15,
    mouthSmileLeft: 0.15,
    eyeWideLeft: 0.1,
    eyeWideRight: 0.1,
  },
  shocked: {
    browInnerUp: 0.6,
    browOuterUpLeft: 0.5,
    browOuterUpRight: 0.5,
    eyeWideLeft: 0.6,
    eyeWideRight: 0.6,
    jawOpen: 0.25,
  },
  bored: {
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
    mouthFrownLeft: 0.1,
    mouthFrownRight: 0.1,
    browDownLeft: 0.15,
    browDownRight: 0.15,
  },
  warm: {
    mouthSmileLeft: 0.35,
    mouthSmileRight: 0.35,
    cheekSquintLeft: 0.15,
    cheekSquintRight: 0.15,
    browInnerUp: 0.1,
  },
  skeptical: {
    browOuterUpLeft: 0.35,
    browDownRight: 0.2,
    mouthSmileLeft: 0.15,
    mouthPucker: 0.1,
  },
  tired: {
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.4,
    eyeBlinkLeft: 0.15,
    eyeBlinkRight: 0.15,
    browDownLeft: 0.1,
    browDownRight: 0.1,
  },
};

// Morph targets owned by this controller (expression channel).
// LipSync owns: jawOpen, jawForward, mouthFunnel, mouthPucker, mouthClose, mouthLowerDown*, mouthUpperUp*, mouthStretch*
const EXPRESSION_OWNED_TARGETS: MorphTargetName[] = [
  "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
  "cheekPuff", "cheekSquintLeft", "cheekSquintRight",
  "eyeSquintLeft", "eyeSquintRight", "eyeWideLeft", "eyeWideRight",
  "mouthSmileLeft", "mouthSmileRight", "mouthFrownLeft", "mouthFrownRight",
  "mouthDimpleLeft", "mouthDimpleRight", "mouthPressLeft", "mouthPressRight",
  "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper",
  "mouthLeft", "mouthRight",
  "noseSneerLeft", "noseSneerRight",
];

export class FaceExpressionController {
  private meshRefs: MorphMeshRef[] = [];
  private currentExpression: ExpressionPreset = {};
  private targetExpression: ExpressionPreset = {};
  private expressionSmoothing = 0.06; // per-frame lerp factor

  // Blink state
  private nextBlinkTime = 2.0;
  private isBlinking = false;
  private blinkProgress = 0;
  private blinkDuration = 0.14;

  // Nose twitch
  private nextNoseTwitch = 6.0;
  private isNoseTwitching = false;
  private noseTwitchProgress = 0;
  private noseTwitchDuration = 0.35;

  /** Register meshes with morph targets */
  initialize(meshRefs: MorphMeshRef[]): void {
    this.meshRefs = meshRefs;
    console.log(`[FaceExpression] Registered ${meshRefs.length} morph meshes`);
  }

  /** Set target emotion. Expression will blend smoothly. */
  setEmotion(emotion: Emotion): void {
    const preset = EXPRESSIONS[emotion.label] || EXPRESSIONS.neutral;
    this.targetExpression = {};

    // Scale preset weights by intensity
    for (const [key, baseWeight] of Object.entries(preset)) {
      this.targetExpression[key as MorphTargetName] = (baseWeight as number) * Math.min(emotion.intensity, 1.0);
    }
  }

  /** Force a blink now (for debug/testing) */
  forceBlink(): void {
    this.isBlinking = true;
    this.blinkProgress = 0;
    this.blinkDuration = 0.12 + Math.random() * 0.06;
  }

  /** Call every frame */
  update(delta: number, elapsed: number): void {
    // === BLINK SCHEDULER ===
    this.nextBlinkTime -= delta;
    if (this.nextBlinkTime <= 0 && !this.isBlinking) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.blinkDuration = 0.12 + Math.random() * 0.06;
    }

    let blinkLeft = 0, blinkRight = 0;
    if (this.isBlinking) {
      this.blinkProgress += delta;
      const t = this.blinkProgress / this.blinkDuration;
      if (t < 0.5) {
        blinkLeft = blinkRight = t * 2; // close
      } else if (t < 1.0) {
        blinkLeft = blinkRight = 1.0 - (t - 0.5) * 2; // open
      } else {
        blinkLeft = blinkRight = 0;
        this.isBlinking = false;
        this.nextBlinkTime = 3.0 + Math.random() * 3.0;
      }
    }

    // === NOSE TWITCH ===
    this.nextNoseTwitch -= delta;
    if (this.nextNoseTwitch <= 0 && !this.isNoseTwitching) {
      this.isNoseTwitching = true;
      this.noseTwitchProgress = 0;
    }

    let noseTwitch = 0;
    if (this.isNoseTwitching) {
      this.noseTwitchProgress += delta;
      const t = this.noseTwitchProgress / this.noseTwitchDuration;
      noseTwitch = Math.sin(t * Math.PI) * 0.35;
      if (t >= 1.0) {
        this.isNoseTwitching = false;
        this.nextNoseTwitch = 6.0 + Math.random() * 8.0;
      }
    }

    // === SMOOTH EXPRESSION BLENDING ===
    const smoothed: Record<string, number> = {};
    for (const target of EXPRESSION_OWNED_TARGETS) {
      const targetVal = (this.targetExpression[target] as number) || 0;
      const currentVal = (this.currentExpression[target] as number) || 0;
      smoothed[target] = currentVal + (targetVal - currentVal) * this.expressionSmoothing;
    }
    this.currentExpression = smoothed as ExpressionPreset;

    // === APPLY TO ALL MORPH MESHES ===
    for (const ref of this.meshRefs) {
      const { dictionary: dict, influences: inf } = ref;

      // Blink (highest priority for eyelids)
      setMorphTarget(dict, inf, MORPH_TARGETS.eyeBlinkLeft, blinkLeft);
      setMorphTarget(dict, inf, MORPH_TARGETS.eyeBlinkRight, blinkRight);

      // Nose twitch
      setMorphTarget(dict, inf, MORPH_TARGETS.noseSneerLeft, noseTwitch, 0.15);
      setMorphTarget(dict, inf, MORPH_TARGETS.noseSneerRight, noseTwitch, 0.15);

      // Expression targets (only write targets we own)
      for (const target of EXPRESSION_OWNED_TARGETS) {
        if (target === "noseSneerLeft" || target === "noseSneerRight") continue; // handled above
        const val = (this.currentExpression[target] as number) || 0;
        setMorphTarget(dict, inf, MORPH_TARGETS[target], val, 0.08);
      }
    }
  }

  dispose(): void {
    this.meshRefs = [];
  }
}
