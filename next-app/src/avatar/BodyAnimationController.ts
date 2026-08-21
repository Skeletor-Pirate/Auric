/**
 * BodyAnimationController.ts — Procedural body animation.
 *
 * Owns: seated pose, breathing, weight shifting, arm resting.
 * Does NOT own: head/eyes (LookAt), facial expressions, lip sync, gestures.
 *
 * All rotations are additive to the bind pose via Euler angles.
 */
import * as THREE from "three";
import { BONES } from "./morphTargetMap";

export interface BodyAnimationState {
  breathPhase: number;
  swayPhase: number;
  isSeated: boolean;
}

export class BodyAnimationController {
  private bones: Map<string, THREE.Bone> = new Map();
  private state: BodyAnimationState = {
    breathPhase: 0,
    swayPhase: 0,
    isSeated: false,
  };

  /** Call once after GLB loads to register bone references */
  initialize(root: THREE.Object3D): void {
    const boneNames = Object.values(BONES);
    root.traverse((child) => {
      if (boneNames.includes(child.name as any)) {
        this.bones.set(child.name, child as THREE.Bone);
      }
    });
    console.log(`[BodyAnimation] Registered ${this.bones.size} bones`);
    this.applySeatedPose();
  }

  /** Lock legs, adjust hips/spine for seated position */
  private applySeatedPose(): void {
    const b = (name: string) => this.bones.get(name);

    // Hips: lower to chair height
    const hips = b(BONES.hips);
    if (hips) {
      hips.position.y -= 0.08; // slight adjustment
    }

    // Upper legs: rotated forward for sitting
    const leftUpLeg = b(BONES.leftUpLeg);
    const rightUpLeg = b(BONES.rightUpLeg);
    if (leftUpLeg) leftUpLeg.rotation.set(-1.42, 0.1, 0.05);
    if (rightUpLeg) rightUpLeg.rotation.set(-1.42, -0.1, -0.05);

    // Lower legs: bent at knee
    const leftLeg = b(BONES.leftLeg);
    const rightLeg = b(BONES.rightLeg);
    if (leftLeg) leftLeg.rotation.set(1.45, 0, 0);
    if (rightLeg) rightLeg.rotation.set(1.45, 0, 0);

    // Feet: flat
    const leftFoot = b(BONES.leftFoot);
    const rightFoot = b(BONES.rightFoot);
    if (leftFoot) leftFoot.rotation.set(0.1, 0, 0);
    if (rightFoot) rightFoot.rotation.set(0.1, 0, 0);

    // Left arm: resting on desk, chin rest pose
    const leftShoulder = b(BONES.leftShoulder);
    const leftArm = b(BONES.leftArm);
    const leftForeArm = b(BONES.leftForeArm);
    if (leftShoulder) leftShoulder.rotation.set(0, 0, -0.12);
    if (leftArm) leftArm.rotation.set(-1.05, -0.35, -0.15);
    if (leftForeArm) leftForeArm.rotation.set(1.95, -0.32, 0.2);

    // Right arm: relaxed on desk
    const rightShoulder = b(BONES.rightShoulder);
    const rightArm = b(BONES.rightArm);
    const rightForeArm = b(BONES.rightForeArm);
    if (rightShoulder) rightShoulder.rotation.set(0, 0, 0.12);
    if (rightArm) rightArm.rotation.set(-0.68, 0.28, 0.25);
    if (rightForeArm) rightForeArm.rotation.set(1.3, 0, 0);

    this.state.isSeated = true;
    console.log("[BodyAnimation] Seated pose applied");
  }

  /** Call every frame with delta time */
  update(delta: number, elapsed: number): void {
    this.state.breathPhase = elapsed;
    this.state.swayPhase = elapsed;

    const b = (name: string) => this.bones.get(name);

    // === BREATHING ===
    const breathCycle = Math.sin(elapsed * 1.5); // ~0.4 Hz
    const spine1 = b(BONES.spine1);
    if (spine1) {
      spine1.rotation.x = breathCycle * 0.012;
      spine1.scale.set(
        1 + breathCycle * 0.002,
        1,
        1 + breathCycle * 0.002
      );
    }

    // === SUBTLE SWAY ===
    const sway = Math.sin(elapsed * 0.38) * 0.015;
    const spine = b(BONES.spine);
    if (spine) {
      spine.rotation.z = sway;
    }

    // === SLIGHT SPINE2 MOVEMENT ===
    const spine2 = b(BONES.spine2);
    if (spine2) {
      spine2.rotation.x = Math.sin(elapsed * 0.7) * 0.005;
      spine2.rotation.z = Math.cos(elapsed * 0.45) * 0.008;
    }
  }

  getBone(name: string): THREE.Bone | undefined {
    return this.bones.get(name);
  }

  get allBones(): Map<string, THREE.Bone> {
    return this.bones;
  }

  dispose(): void {
    this.bones.clear();
  }
}
