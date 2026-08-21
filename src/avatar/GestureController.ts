/**
 * GestureController.ts — Procedural Gestures and Arm Movements.
 * 
 * Owns: Right arm, right forearm, right hand, right fingers.
 * Blends with: Base body animations (e.g. breathing, swaying).
 * Does NOT own: Left arm (reserved for chin rest), head, face.
 * 
 * Controls hand gesture states:
 * - table: resting casually on desk
 * - point: pointing forward during conversation
 * - hair: adjusting hair/touching face
 * - fidget: playing with a pen or tapping fingers on the desk
 */
import * as THREE from "three";
import { BONES } from "./morphTargetMap";

export type GestureState = "table" | "point" | "hair" | "fidget";

export class GestureController {
  private bones: Map<string, THREE.Bone> = new Map();
  private currentState: GestureState = "table";
  private targetState: GestureState = "table";
  private transitionProgress = 1.0;
  private transitionDuration = 0.8; // seconds

  // Store Euler rotations for right shoulder, arm, and forearm for each state
  // Format: [x, y, z] in radians
  private poses: Record<GestureState, { arm: number[]; forearm: number[]; hand: number[] }> = {
    table: {
      arm: [0.5, -0.2, -2.7],
      forearm: [-1.2, 0.15, -0.1],
      hand: [0.2, 0, -0.1],
    },
    point: {
      arm: [0.3, -0.3, -2.0],
      forearm: [-1.6, 0.1, -0.1],
      hand: [0.0, 0.1, 0],
    },
    hair: {
      arm: [-0.2, -0.2, -1.3],
      forearm: [-2.2, 0.1, -0.2],
      hand: [-0.1, -0.1, 0.2],
    },
    fidget: {
      arm: [0.4, -0.1, -2.4],
      forearm: [-1.4, 0.15, -0.1],
      hand: [0.05, 0, -0.15],
    },
  };

  // Interpolated values for current pose
  private currentArmRot = new THREE.Vector3();
  private currentForearmRot = new THREE.Vector3();
  private currentHandRot = new THREE.Vector3();

  initialize(bones: Map<string, THREE.Bone>): void {
    this.bones = bones;
    const p = this.poses.table;
    this.currentArmRot.fromArray(p.arm);
    this.currentForearmRot.fromArray(p.forearm);
    this.currentHandRot.fromArray(p.hand);
  }

  /** Trigger transition to a new gesture state */
  triggerGesture(state: GestureState): void {
    if (this.targetState === state) return;
    this.currentState = this.targetState;
    this.targetState = state;
    this.transitionProgress = 0.0;
  }

  /** Call every frame */
  update(delta: number, elapsed: number, isSpeaking: boolean): void {
    const b = (name: string) => this.bones.get(name);
    const rightArm = b(BONES.rightArm);
    const rightForeArm = b(BONES.rightForeArm);
    const rightHand = b(BONES.rightHand);

    if (!rightArm || !rightForeArm) return;

    // === GESTURE STATE INTERPOLATION ===
    if (this.transitionProgress < 1.0) {
      this.transitionProgress += delta / this.transitionDuration;
      if (this.transitionProgress > 1.0) this.transitionProgress = 1.0;
    }

    const ease = THREE.MathUtils.smoothstep(this.transitionProgress, 0, 1);

    const fromPose = this.poses[this.currentState];
    const toPose = this.poses[this.targetState];

    // Lerp Arm
    const fromArm = new THREE.Vector3().fromArray(fromPose.arm);
    const toArm = new THREE.Vector3().fromArray(toPose.arm);
    this.currentArmRot.lerpVectors(fromArm, toArm, ease);

    // Lerp Forearm
    const fromForearm = new THREE.Vector3().fromArray(fromPose.forearm);
    const toForearm = new THREE.Vector3().fromArray(toPose.forearm);
    this.currentForearmRot.lerpVectors(fromForearm, toForearm, ease);

    // Lerp Hand
    const fromHand = new THREE.Vector3().fromArray(fromPose.hand);
    const toHand = new THREE.Vector3().fromArray(toPose.hand);
    this.currentHandRot.lerpVectors(fromHand, toHand, ease);

    // === MICRO-MOVEMENT & GESTURE JITTER ===
    // Subtle breathing/speaking jitters applied to right arm to avoid looking locked/robotic
    const speakerJitter = isSpeaking ? Math.sin(elapsed * 4.5) * 0.025 : 0;
    const breathingJitter = Math.cos(elapsed * 1.5) * 0.01;

    rightArm.rotation.set(
      this.currentArmRot.x + breathingJitter + speakerJitter,
      this.currentArmRot.y,
      this.currentArmRot.z
    );

    rightForeArm.rotation.set(
      this.currentForearmRot.x + speakerJitter * 0.5,
      this.currentForearmRot.y,
      this.currentForearmRot.z
    );

    if (rightHand) {
      rightHand.rotation.set(
        this.currentHandRot.x,
        this.currentHandRot.y,
        this.currentHandRot.z + Math.sin(elapsed * 2.0) * 0.02
      );
    }
  }

  dispose(): void {
    this.bones.clear();
  }
}
