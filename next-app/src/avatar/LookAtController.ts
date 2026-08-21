/**
 * LookAtController.ts — Procedural Gaze and Head Tracking.
 * 
 * Input: Cursor position in normalized device coordinates ([-1, 1]).
 * Output: Smooth rotation of LeftEye, RightEye, Head, Neck, and Spine bones.
 * 
 * Includes micro-saccades (small random eye offsets) and gaze-breaks
 * to make the gaze look natural and not robotic.
 */
import * as THREE from "three";
import { BONES } from "./morphTargetMap";

export class LookAtController {
  private bones: Map<string, THREE.Bone> = new Map();
  private cursorNDC = new THREE.Vector2(0, 0);
  private gazeTargetWorld = new THREE.Vector3(0, 1.15, 2.0);
  private currentGazeWorld = new THREE.Vector3(0, 1.15, 2.0);
  
  // Saccades (tiny random adjustments)
  private saccadeTimer = 0.5;
  private saccadeOffset = new THREE.Vector3();
  
  // Gaze breaking (looking away randomly or when board/idle)
  private gazeBreakTimer = 4.0;
  private isBreakingGaze = false;
  private gazeBreakOffset = new THREE.Vector3();

  // Smoothing rates
  private readonly eyeLerp = 0.15;
  private readonly headLerp = 0.05;
  private readonly neckLerp = 0.03;

  // Rotation limits (Euler angles in radians)
  private readonly limits = {
    eyeYaw: 0.22,    // ~12.5 deg
    eyePitch: 0.16,  // ~9 deg
    headYaw: 0.42,   // ~24 deg
    headPitch: 0.32, // ~18 deg
    neckYaw: 0.25,   // ~14 deg
    neckPitch: 0.20, // ~11 deg
  };

  initialize(bones: Map<string, THREE.Bone>): void {
    this.bones = bones;
  }

  /** Public method to set gaze from external source (e.g., EyeGazeTracker) */
  setGaze(x: number, y: number): void {
    // Update internal cursor NDC and recompute target world coordinates
    this.cursorNDC.set(x, y);
    const targetX = x * 0.8; // same scaling as updateTarget
    const targetY = 1.15 + y * 0.6;
    this.gazeTargetWorld.set(targetX, targetY, 1.8);
  }

  /** Update target coordinate based on NDC client mouse movement */
  updateTarget(ndcX: number, ndcY: number): void {
    this.cursorNDC.set(ndcX, ndcY);
    
    // Project mouse onto a virtual plane at z = 1.8 in front of the camera
    // Framing has camera around z = 1.0, lookAt = 0.0, 1.05, 0.0
    const targetX = ndcX * 0.8;
    const targetY = 1.15 + ndcY * 0.6;
    this.gazeTargetWorld.set(targetX, targetY, 1.8);
  }

  /** Run every frame in the R3F loop */
  update(delta: number, elapsed: number, emotionLabel: string, isSpeaking: boolean): void {
    const b = (name: string) => this.bones.get(name);
    const head = b(BONES.head);
    if (!head) return;

    // === SACCADES ===
    this.saccadeTimer -= delta;
    if (this.saccadeTimer <= 0) {
      this.saccadeOffset.set(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.03,
        0
      );
      this.saccadeTimer = 0.6 + Math.random() * 1.5;
    }

    // === GAZE BREAKS ===
    this.gazeBreakTimer -= delta;
    if (this.gazeBreakTimer <= 0) {
      const shouldBreak = Math.random() < (emotionLabel === "bored" ? 0.6 : 0.2);
      if (shouldBreak) {
        this.isBreakingGaze = true;
        // Look away to the side or down
        const dir = Math.random() > 0.5 ? 1 : -1;
        this.gazeBreakOffset.set(
          dir * (0.5 + Math.random() * 0.5),
          -0.3 - Math.random() * 0.3,
          -0.5
        );
        this.gazeBreakTimer = 1.0 + Math.random() * 2.0; // keep lookaway brief
      } else {
        this.isBreakingGaze = false;
        this.gazeBreakOffset.set(0, 0, 0);
        this.gazeBreakTimer = 3.0 + Math.random() * 5.0;
      }
    }

    // Blend base target, saccade, and gaze break
    const activeTarget = new THREE.Vector3()
      .copy(this.gazeTargetWorld)
      .add(this.saccadeOffset)
      .add(this.gazeBreakOffset);

    // Smoothly interpolate current gaze coordinate
    this.currentGazeWorld.lerp(activeTarget, 0.08);

    // === INVERSE KINEMATICS CALCULATION ===
    // Head world position
    const headWP = new THREE.Vector3();
    head.getWorldPosition(headWP);

    // Direction vector from head to gaze target
    const dir = new THREE.Vector3().subVectors(this.currentGazeWorld, headWP).normalize();

    // Yaw (horizontal) and Pitch (vertical) angles
    const yaw = Math.atan2(dir.x, dir.z);
    const pitch = -Math.asin(dir.y);

    // === APPLY ROTATIONS WITH STRICT LIMITS ===
    const leftEye = b(BONES.leftEye);
    const rightEye = b(BONES.rightEye);
    const neck = b(BONES.neck);
    const spine2 = b(BONES.spine2);

    // 1. Eyes (Fast, small range)
    const eyeYaw = THREE.MathUtils.clamp(yaw, -this.limits.eyeYaw, this.limits.eyeYaw);
    const eyePitch = THREE.MathUtils.clamp(pitch, -this.limits.eyePitch, this.limits.eyePitch);
    if (leftEye) {
      leftEye.rotation.y = THREE.MathUtils.lerp(leftEye.rotation.y, eyeYaw, this.eyeLerp);
      leftEye.rotation.x = THREE.MathUtils.lerp(leftEye.rotation.x, eyePitch, this.eyeLerp);
    }
    if (rightEye) {
      rightEye.rotation.y = THREE.MathUtils.lerp(rightEye.rotation.y, eyeYaw, this.eyeLerp);
      rightEye.rotation.x = THREE.MathUtils.lerp(rightEye.rotation.x, eyePitch, this.eyeLerp);
    }

    // 2. Head (Medium speed, medium range)
    const headYaw = THREE.MathUtils.clamp(yaw * 0.45, -this.limits.headYaw, this.limits.headYaw);
    const headPitch = THREE.MathUtils.clamp(pitch * 0.45, -this.limits.headPitch, this.limits.headPitch);
    const headRoll = 0.08 + (isSpeaking ? Math.sin(elapsed * 2) * 0.015 : 0); // slight head tilt + speaking bobbing
    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, headYaw, this.headLerp);
    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, headPitch, this.headLerp);
    head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, headRoll, this.headLerp);

    // 3. Neck (Slow, small range)
    const neckYaw = THREE.MathUtils.clamp(yaw * 0.35, -this.limits.neckYaw, this.limits.neckYaw);
    const neckPitch = THREE.MathUtils.clamp(pitch * 0.35, -this.limits.neckPitch, this.limits.neckPitch);
    if (neck) {
      neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, neckYaw, this.neckLerp);
      neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, neckPitch, this.neckLerp);
    }

    // 4. Torso/Spine2 (Minimal influence)
    if (spine2) {
      const torsoYaw = THREE.MathUtils.clamp(yaw * 0.1, -0.05, 0.05);
      spine2.rotation.y = THREE.MathUtils.lerp(spine2.rotation.y, torsoYaw, 0.02);
    }
  }

  dispose(): void {
    this.bones.clear();
  }
}
