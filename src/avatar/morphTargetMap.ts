/**
 * morphTargetMap.ts — Configurable mapping from semantic morph target names
 * to the actual names found in the Auric GLB model.
 *
 * The Auric GLB uses standard ARKit/ReadyPlayerMe naming for 51 facial blendshapes.
 * No viseme targets exist — lip sync uses amplitude-driven Mode A.
 *
 * All indices refer to the AvatarHead mesh (Mesh 2, node index 76).
 */

/** Semantic morph target categories */
export const MORPH_TARGETS = {
  // === EYE BLINK ===
  eyeBlinkLeft: "eyeBlinkLeft",         // [8]
  eyeBlinkRight: "eyeBlinkRight",       // [9]

  // === EYE SQUINT ===
  eyeSquintLeft: "eyeSquintLeft",       // [18]
  eyeSquintRight: "eyeSquintRight",     // [19]

  // === EYE WIDE ===
  eyeWideLeft: "eyeWideLeft",           // [20]
  eyeWideRight: "eyeWideRight",         // [21]

  // === EYE LOOK ===
  eyeLookDownLeft: "eyeLookDownLeft",   // [10]
  eyeLookDownRight: "eyeLookDownRight", // [11]
  eyeLookInLeft: "eyeLookInLeft",       // [12]
  eyeLookInRight: "eyeLookInRight",     // [13]
  eyeLookOutLeft: "eyeLookOutLeft",     // [14]
  eyeLookOutRight: "eyeLookOutRight",   // [15]
  eyeLookUpLeft: "eyeLookUpLeft",       // [16]
  eyeLookUpRight: "eyeLookUpRight",     // [17]

  // === BROW ===
  browDownLeft: "browDownLeft",         // [0]
  browDownRight: "browDownRight",       // [1]
  browInnerUp: "browInnerUp",           // [2]
  browOuterUpLeft: "browOuterUpLeft",   // [3]
  browOuterUpRight: "browOuterUpRight", // [4]

  // === JAW ===
  jawOpen: "jawOpen",                   // [24]
  jawForward: "jawForward",             // [22]
  jawLeft: "jawLeft",                   // [23]
  jawRight: "jawRight",                 // [25]

  // === MOUTH SHAPE ===
  mouthClose: "mouthClose",             // [26]
  mouthFunnel: "mouthFunnel",           // [31]
  mouthPucker: "mouthPucker",           // [37]
  mouthLeft: "mouthLeft",               // [32]
  mouthRight: "mouthRight",             // [38]

  // === MOUTH SMILE/FROWN ===
  mouthSmileLeft: "mouthSmileLeft",     // [43]
  mouthSmileRight: "mouthSmileRight",   // [44]
  mouthFrownLeft: "mouthFrownLeft",     // [29]
  mouthFrownRight: "mouthFrownRight",   // [30]

  // === MOUTH DETAILED ===
  mouthDimpleLeft: "mouthDimpleLeft",     // [27]
  mouthDimpleRight: "mouthDimpleRight",   // [28]
  mouthStretchLeft: "mouthStretchLeft",   // [45]
  mouthStretchRight: "mouthStretchRight", // [46]
  mouthRollLower: "mouthRollLower",       // [39]
  mouthRollUpper: "mouthRollUpper",       // [40]
  mouthShrugLower: "mouthShrugLower",     // [41]
  mouthShrugUpper: "mouthShrugUpper",     // [42]
  mouthPressLeft: "mouthPressLeft",       // [35]
  mouthPressRight: "mouthPressRight",     // [36]
  mouthLowerDownLeft: "mouthLowerDownLeft",   // [33]
  mouthLowerDownRight: "mouthLowerDownRight", // [34]
  mouthUpperUpLeft: "mouthUpperUpLeft",       // [47]
  mouthUpperUpRight: "mouthUpperUpRight",     // [48]

  // === CHEEK ===
  cheekPuff: "cheekPuff",                 // [5]
  cheekSquintLeft: "cheekSquintLeft",     // [6]
  cheekSquintRight: "cheekSquintRight",   // [7]

  // === NOSE ===
  noseSneerLeft: "noseSneerLeft",         // [49]
  noseSneerRight: "noseSneerRight",       // [50]
} as const;

export type MorphTargetName = keyof typeof MORPH_TARGETS;

/** Bone names used for procedural animation */
export const BONES = {
  root: "AvatarRoot",
  hips: "Hips",
  spine: "Spine",
  spine1: "Spine1",
  spine2: "Spine2",
  neck: "Neck",
  neck1: "Neck1",
  neck2: "Neck2",
  head: "Head",
  headTop: "HeadTop_End",
  leftEye: "LeftEye",
  rightEye: "RightEye",
  leftShoulder: "LeftShoulder",
  leftArm: "LeftArm",
  leftForeArm: "LeftForeArm",
  leftForeArm1: "LeftForeArm1",
  leftForeArm2: "LeftForeArm2",
  leftHand: "LeftHand",
  rightShoulder: "RightShoulder",
  rightArm: "RightArm",
  rightForeArm: "RightForeArm",
  rightForeArm1: "RightForeArm1",
  rightForeArm2: "RightForeArm2",
  rightHand: "RightHand",
  leftUpLeg: "LeftUpLeg",
  leftLeg: "LeftLeg",
  leftFoot: "LeftFoot",
  rightUpLeg: "RightUpLeg",
  rightLeg: "RightLeg",
  rightFoot: "RightFoot",
} as const;

export type BoneName = typeof BONES[keyof typeof BONES];

/** Meshes with morph targets */
export const MORPH_MESHES = {
  head: "AvatarHead",        // 51 targets — primary face mesh
  eyelashes: "AvatarEyelashes", // 29 targets — synced with head
  teethLower: "AvatarTeethLower", // 4 targets — jaw only
} as const;

/**
 * Safe morph target setter. Returns false if target not found.
 */
export function setMorphTarget(
  dict: Record<string, number> | undefined,
  influences: number[] | undefined,
  name: string,
  value: number,
  lerp?: number
): boolean {
  if (!dict || !influences) return false;
  const idx = dict[name];
  if (idx === undefined) return false;
  if (lerp !== undefined) {
    influences[idx] += (value - influences[idx]) * lerp;
  } else {
    influences[idx] = value;
  }
  return true;
}

/**
 * Read current morph target value. Returns 0 if not found.
 */
export function getMorphTarget(
  dict: Record<string, number> | undefined,
  influences: number[] | undefined,
  name: string
): number {
  if (!dict || !influences) return 0;
  const idx = dict[name];
  if (idx === undefined) return 0;
  return influences[idx];
}
