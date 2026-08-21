/**
 * AvatarModel.tsx — R3F GLB loader and animation wrapper.
 * 
 * Loads model.glb, initializes body/face/lipsync/look-at/gesture/micro-action controllers,
 * and updates them on every frame via useFrame.
 */
import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useAvatarStore } from "../state/avatarStore";
import { useGazeStore } from "../state/gazeStore";
import { avatarStateMachine } from "./AvatarStateMachine";

// Controllers
import { BodyAnimationController } from "./BodyAnimationController";
import { FaceExpressionController } from "./FaceExpressionController";
import { LipSyncController } from "./LipSyncController";
import { LookAtController } from "./LookAtController";
import { GestureController } from "./GestureController";
import { MicroActionScheduler } from "./MicroActionScheduler";
import { EmotionController } from "./EmotionController";

interface AvatarModelProps {
  analyserNode: AnalyserNode | null;
}

export const AvatarModel: React.FC<AvatarModelProps> = ({ analyserNode }) => {
  // Load GLB
  const { scene } = useGLTF("/model.glb") as any;

  // Store selections
  const emotion = useAvatarStore((s) => s.emotion);
  const isSpeaking = useAvatarStore((s) => s.isSpeaking);
  const setModelLoaded = useAvatarStore((s) => s.setModelLoaded);
  const setMorphTargetCount = useAvatarStore((s) => s.setMorphTargetCount);
  const gaze = useGazeStore((s) => ({ x: s.x, y: s.y }));

  // Instantiated Controllers
  const bodyAnimRef = useRef(new BodyAnimationController());
  const faceExprRef = useRef(new FaceExpressionController());
  const lipSyncRef = useRef(new LipSyncController());
  const lookAtRef = useRef(new LookAtController());
  const gestureRef = useRef(new GestureController());
  const microActionRef = useRef(new MicroActionScheduler());
  const emotionCtrlRef = useRef<EmotionController | null>(null);

  // Clean-up lock
  const isCleanedUp = useRef(false);

  useEffect(() => {
    isCleanedUp.current = false;
    const model = scene;
    model.position.set(0, -0.56, -0.05);

    // 1. Gather bone references
    bodyAnimRef.current.initialize(model);
    lookAtRef.current.initialize(bodyAnimRef.current.allBones);
    gestureRef.current.initialize(bodyAnimRef.current.allBones);

    // 2. Gather morph target meshes
    const morphMeshes: { dictionary: Record<string, number>; influences: number[] }[] = [];
    model.traverse((child: any) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        morphMeshes.push({
          dictionary: child.morphTargetDictionary,
          influences: child.morphTargetInfluences,
        });
      }
    });

    // 3. Initialize Face/LipSync/Emotion controllers
    faceExprRef.current.initialize(morphMeshes);
    lipSyncRef.current.initialize(morphMeshes);
    emotionCtrlRef.current = new EmotionController(faceExprRef.current);

    // Count targets for debug
    const mainHeadMesh = morphMeshes.find((m) => Object.keys(m.dictionary).length > 30);
    if (mainHeadMesh) {
      setMorphTargetCount(Object.keys(mainHeadMesh.dictionary).length);
    }

    // 4. Setup MicroActionScheduler callbacks
    microActionRef.current.registerCallbacks({
      onBlink: () => faceExprRef.current.forceBlink(),
      onYawn: (duration) => {
        // Yawn logic (opens mouth)
        const transition = (t: number) => {
          const dict = mainHeadMesh?.dictionary;
          const inf = mainHeadMesh?.influences;
          if (dict && inf) {
            const jawVal = Math.sin(t * Math.PI) * 0.85;
            const eyeSquint = Math.sin(t * Math.PI) * 0.72;
            const head = bodyAnimRef.current.getBone("Head");
            const spine1 = bodyAnimRef.current.getBone("Spine1");
            
            // Apply morphs
            dict["jawOpen"] !== undefined && (inf[dict["jawOpen"]] = jawVal);
            dict["eyeSquintLeft"] !== undefined && (inf[dict["eyeSquintLeft"]] = eyeSquint);
            dict["eyeSquintRight"] !== undefined && (inf[dict["eyeSquintRight"]] = eyeSquint);
            
            // Adjust bones procedurally during yawn
            if (head) head.rotation.x = -Math.sin(t * Math.PI) * 0.16;
            if (spine1) spine1.rotation.x += Math.sin(t * Math.PI) * 0.05;
          }
        };
        
        let elapsed = 0;
        const tick = () => {
          if (isCleanedUp.current) return;
          elapsed += 0.016;
          transition(elapsed / duration);
          if (elapsed < duration) requestAnimationFrame(tick);
        };
        tick();
      },
      onSigh: (duration) => {
        // Sigh logic (procedural shoulders + chest drop)
        const spine1 = bodyAnimRef.current.getBone("Spine1");
        const leftShoulder = bodyAnimRef.current.getBone("LeftShoulder");
        const rightShoulder = bodyAnimRef.current.getBone("RightShoulder");
        
        let elapsed = 0;
        const tick = () => {
          if (isCleanedUp.current) return;
          elapsed += 0.016;
          const t = elapsed / duration;
          const val = Math.sin(t * Math.PI);
          
          if (spine1) spine1.rotation.x = val * -0.05;
          if (leftShoulder) leftShoulder.rotation.z = val * -0.08;
          if (rightShoulder) rightShoulder.rotation.z = val * 0.08;
          
          if (elapsed < duration) requestAnimationFrame(tick);
        };
        tick();
      },
      onGesture: (name) => {
        gestureRef.current.triggerGesture(name as any);
      },
      onPostureShift: () => {
        const hips = bodyAnimRef.current.getBone("Hips");
        if (hips) {
          const targetY = -0.08 + (Math.random() - 0.5) * 0.02;
          hips.position.y = targetY;
        }
      },
    });

    // 6. Custom events for manual diagnostics
    const onDebugBlink = () => faceExprRef.current.forceBlink();
    const onDebugYawn = () => microActionRef.current["triggers"].onYawn(3.5);
    const onDebugGesture = () => {
      const poses: ("point" | "hair" | "table" | "fidget")[] = ["point", "hair", "fidget", "table"];
      const targetPose = poses[Math.floor(Math.random() * poses.length)];
      gestureRef.current.triggerGesture(targetPose);
    };

    window.addEventListener("debug-force-blink", onDebugBlink);
    window.addEventListener("debug-force-yawn", onDebugYawn);
    window.addEventListener("debug-force-gesture", onDebugGesture);

    // Track active speaking state
    lipSyncRef.current.connectAnalyser(analyserNode);

    setModelLoaded(true);

    return () => {
      isCleanedUp.current = true;
      window.removeEventListener("debug-force-blink", onDebugBlink);
      window.removeEventListener("debug-force-yawn", onDebugYawn);
      window.removeEventListener("debug-force-gesture", onDebugGesture);
      
      bodyAnimRef.current.dispose();
      faceExprRef.current.dispose();
      lipSyncRef.current.dispose();
      lookAtRef.current.dispose();
      gestureRef.current.dispose();
      microActionRef.current.dispose();
    };
  }, [scene, setModelLoaded, setMorphTargetCount]);

  // Update speaking status to LipSync
  useEffect(() => {
    lipSyncRef.current.connectAnalyser(analyserNode);
    if (isSpeaking) {
      lipSyncRef.current.startSpeaking("active-turn");
    } else {
      lipSyncRef.current.stopSpeaking();
    }
  }, [isSpeaking, analyserNode]);

  // Frame Update Loop (60 FPS)
  useFrame((state, delta) => {
    if (isCleanedUp.current) return;
    const elapsed = state.clock.getElapsedTime();
    const activeState = avatarStateMachine.state;

    // 1. Update Body Pose & Breathing
    bodyAnimRef.current.update(delta, elapsed);

    // 2. Update Micro-Action biological triggers
    microActionRef.current.update(delta, activeState);

    // 3. Update Gesture blends
    gestureRef.current.update(delta, elapsed, isSpeaking);

    // 4. Update Gaze and Head LookAt Tracking
    lookAtRef.current.setGaze(gaze.x, gaze.y);
    lookAtRef.current.update(delta, elapsed, emotion.label, isSpeaking);

    // 5. Update Emotion blending
    if (emotionCtrlRef.current) {
      emotionCtrlRef.current.updateEmotion(emotion, delta);
    }

    // 6. Update Face Expression (Expressions + Blinking)
    faceExprRef.current.update(delta, elapsed);

    // 7. Update Real-time LipSync from analyserNode
    lipSyncRef.current.update(delta);
  });

  return <primitive object={scene} />;
};

useGLTF.preload("/model.glb");
