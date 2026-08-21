import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface KatieThreeAvatarProps {
  isSpeaking: boolean;
  analyserNode: AnalyserNode | null;
  emotion: string;
  bgUrl: string;
  userLaughterActive: boolean;
}

/* Helper: safely read/write a morph target influence by name */
function setMorph(
  dict: Record<string, number>,
  inf: number[],
  name: string,
  value: number,
  lerpFactor?: number
) {
  const idx = dict[name];
  if (idx === undefined) return;
  if (lerpFactor !== undefined) {
    inf[idx] = THREE.MathUtils.lerp(inf[idx], value, lerpFactor);
  } else {
    inf[idx] = value;
  }
}

export const KatieThreeAvatar: React.FC<KatieThreeAvatarProps> = ({
  isSpeaking,
  analyserNode,
  emotion,
  bgUrl,
  userLaughterActive,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const propsRef = useRef({ isSpeaking, analyserNode, emotion, userLaughterActive });
  useEffect(() => {
    propsRef.current = { isSpeaking, analyserNode, emotion, userLaughterActive };
  }, [isSpeaking, analyserNode, emotion, userLaughterActive]);

  useEffect(() => {
    let isCleanedUp = false;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    /* ───────────── Scene Setup ───────────── */
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.15, 1.0);
    camera.lookAt(0, 1.05, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    /* ───────────── Lighting ───────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.42));

    const keyLight = new THREE.DirectionalLight(0xfff2e5, 1.35);
    keyLight.position.set(1.4, 3.2, 2.2);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0e8ff, 0.75);
    fillLight.position.set(-1.8, 1.8, 1.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 3.0, -2.2);
    scene.add(rimLight);

    // Dynamic video-call screen glare
    const screenLight = new THREE.PointLight(0xd9f2ff, 0.45, 3.5);
    screenLight.position.set(0, 1.1, 0.6);
    scene.add(screenLight);

    /* ───────────── Desk + Chair Props ───────────── */
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.32, metalness: 0.1 });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.8), deskMat);
    deskTop.position.set(0, 0.61, 0.35);
    deskTop.receiveShadow = true;
    deskTop.castShadow = true;
    scene.add(deskTop);

    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.09, 16),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.25 })
    );
    mug.position.set(-0.35, 0.67, 0.25);
    mug.castShadow = true;
    scene.add(mug);

    const chairSeat = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.05, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x242130, roughness: 0.85 })
    );
    chairSeat.position.set(0, 0.38, -0.05);
    chairSeat.receiveShadow = true;
    scene.add(chairSeat);

    /* ───────────── References ───────────── */
    let headMesh: THREE.SkinnedMesh | null = null;
    const bones: Record<string, THREE.Bone | null> = {
      Head: null, Neck: null, LeftEye: null, RightEye: null,
      Spine: null, Spine1: null, Spine2: null,
      LeftArm: null, LeftForeArm: null, RightArm: null, RightForeArm: null,
      LeftUpLeg: null, LeftLeg: null, RightUpLeg: null, RightLeg: null,
    };

    const gazeTarget = new THREE.Vector3(0, 1.25, 2.0);
    const saccadeOffset = new THREE.Vector3(0, 0, 0);

    /* ───────────── Animation State ───────────── */
    const a = {
      blinkTime: 0,
      blinkDur: 0.15,
      nextBlink: 2.0,
      isBlinking: false,

      rightArmState: "table" as "table" | "point" | "hair" | "fidget",
      nextGesture: 3.0,

      nextGazeShift: 4.0,
      gazeMode: "camera" as "camera" | "away_left" | "away_right" | "away_down",

      isYawning: false,
      yawnTime: 0,
      yawnDur: 3.5,
      nextYawn: 660 + Math.random() * 540,

      nextSaccade: 0.8,
      noseTwitchTime: 0,
      noseTwitchDur: 0.35,
      isNoseTwitching: false,
      nextNoseTwitch: 6.0,

      laughTime: 0,
      smoothLow: 0,
      smoothMid: 0,
      smoothHigh: 0,
    };

    /* ───────────── Load Model ───────────── */
    const loader = new GLTFLoader();
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const BONE_NAMES = Object.keys(bones);

    loader.load(
      "/model.glb",
      (gltf) => {
        if (isCleanedUp) return; // StrictMode guard

        const model = gltf.scene;
        model.position.set(0, -0.56, -0.05);

        model.traverse((child) => {
          if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mesh = child as THREE.SkinnedMesh;
            // The head mesh node is named "AvatarHead" and has 51 morph targets
            if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
              if (child.name === "AvatarHead" || Object.keys(mesh.morphTargetDictionary).length > 30) {
                headMesh = mesh;
                console.log("[Katie] Found head mesh:", child.name, "with", Object.keys(mesh.morphTargetDictionary).length, "morph targets");
              }
            }
          }
          // Collect bones
          if (BONE_NAMES.includes(child.name)) {
            bones[child.name] = child as THREE.Bone;
          }
        });

        console.log("[Katie] Bones found:", Object.entries(bones).filter(([, v]) => v !== null).map(([k]) => k).join(", "));
        console.log("[Katie] Head mesh:", headMesh ? "YES" : "NO");

        scene.add(model);

        /* ───────────── Animation Loop ───────────── */
        const animate = () => {
          if (isCleanedUp) return;

          const delta = clock.getDelta();
          const elapsed = clock.getElapsedTime();
          const p = propsRef.current;

          // Screen glare flicker
          const flicker = Math.sin(elapsed * 4.8) * Math.cos(elapsed * 2.5);
          screenLight.intensity = 0.4 + flicker * 0.12;
          screenLight.color.setHSL(0.55 + Math.sin(elapsed * 0.4) * 0.04, 0.8, 0.88);

          /* ── Seated Pose Lock ── */
          if (bones.LeftUpLeg) bones.LeftUpLeg.rotation.set(-1.42, 0.1, 0);
          if (bones.RightUpLeg) bones.RightUpLeg.rotation.set(-1.42, -0.1, 0);
          if (bones.LeftLeg) bones.LeftLeg.rotation.set(1.45, 0, 0);
          if (bones.RightLeg) bones.RightLeg.rotation.set(1.45, 0, 0);

          /* ── Gaze Shifts ── */
          a.nextGazeShift -= delta;
          if (a.nextGazeShift <= 0) {
            const pool = (p.emotion === "Bored" || p.emotion === "Sarcastic")
              ? ["camera", "away_left", "away_right", "away_down"]
              : ["camera", "camera", "away_left", "away_right"];
            a.gazeMode = pool[Math.floor(Math.random() * pool.length)] as any;
            a.nextGazeShift = 4.0 + Math.random() * 5.0;
          }

          const tg = new THREE.Vector3(0, 1.25, 1.8);
          if (a.gazeMode === "away_left") tg.set(-0.65, 1.18, 1.2);
          else if (a.gazeMode === "away_right") tg.set(0.65, 1.22, 1.2);
          else if (a.gazeMode === "away_down") tg.set(0.0, 0.65, 0.85);
          gazeTarget.lerp(tg, 0.05);

          // Eye saccades
          a.nextSaccade -= delta;
          if (a.nextSaccade <= 0) {
            saccadeOffset.set((Math.random() - 0.5) * 0.035, (Math.random() - 0.5) * 0.025, 0);
            a.nextSaccade = 0.6 + Math.random() * 1.6;
          }

          /* ── Breathing ── */
          const breath = Math.sin(elapsed * 1.5);
          const sway = Math.sin(elapsed * 0.45) * 0.015;
          if (bones.Spine1) {
            bones.Spine1.rotation.x = breath * 0.012 + sway;
            bones.Spine1.scale.set(1 + breath * 0.002, 1, 1 + breath * 0.002);
          }
          if (bones.Spine) bones.Spine.rotation.z = Math.sin(elapsed * 0.38) * 0.018;

          // Lean forward for gossip/happy
          const targetZ = (p.emotion === "Gossip" || p.emotion === "Happy") ? -0.01 : -0.05;
          model.position.z = THREE.MathUtils.lerp(model.position.z, targetZ, 0.05);

          /* ── Laughter Shaking ── */
          if (p.userLaughterActive) {
            a.laughTime += delta;
            if (bones.Spine2) {
              bones.Spine2.rotation.y = Math.sin(a.laughTime * 25) * 0.04;
              bones.Spine2.rotation.x = Math.cos(a.laughTime * 20) * 0.02 - 0.05;
            }
          } else {
            a.laughTime = 0;
            if (bones.Spine2) bones.Spine2.rotation.set(0, 0, 0);
          }

          /* ── Yawning ── */
          a.nextYawn -= delta;
          if (a.nextYawn <= 0 && !a.isYawning) {
            a.isYawning = true;
            a.yawnTime = 0;
          }

          let yawnJaw = 0, yawnSquint = 0, yawnHeadX = 0;
          if (a.isYawning) {
            a.yawnTime += delta;
            const prog = a.yawnTime / a.yawnDur;
            const curve = Math.sin(prog * Math.PI);
            yawnJaw = curve * 0.85;
            yawnSquint = curve * 0.72;
            yawnHeadX = -curve * 0.16;
            if (bones.Spine1) bones.Spine1.rotation.x = breath * 0.012 + curve * 0.05;
            if (prog >= 1.0) {
              a.isYawning = false;
              a.nextYawn = 660 + Math.random() * 540;
            }
          }

          /* ── Left Arm (chin rest) ── */
          if (bones.LeftArm && bones.LeftForeArm) {
            bones.LeftArm.rotation.set(-1.05, -0.35, -0.15);
            bones.LeftForeArm.rotation.set(1.95, -0.32, 0.2);
          }

          /* ── Right Arm Gestures ── */
          a.nextGesture -= delta;
          if (a.nextGesture <= 0) {
            const pool = p.isSpeaking
              ? ["point", "hair", "table", "fidget"]
              : ["table", "fidget", "table"];
            a.rightArmState = pool[Math.floor(Math.random() * pool.length)] as any;
            a.nextGesture = 4.0 + Math.random() * 5.0;
          }

          if (bones.RightArm && bones.RightForeArm) {
            const rA = bones.RightArm;
            const rF = bones.RightForeArm;
            const fn = Math.sin(elapsed * 2.5) * 0.02;

            const targets: Record<string, number[]> = {
              table: [-0.68 + fn, 0.28, 0.25, 1.3, 0, 0],
              point: [-0.85 + Math.sin(elapsed * 3) * 0.08, 0.15, 0.32, 1.15 + Math.sin(elapsed * 2) * 0.1, 0, 0],
              hair: [-1.35, -0.15, 0.75, 1.8, -0.2, -0.2],
              fidget: [-0.55, 0.38, 0.12, 1.48 + fn * 0.5, 0, 0],
            };
            const t = targets[a.rightArmState] || targets.table;

            rA.rotation.set(
              THREE.MathUtils.lerp(rA.rotation.x, t[0], 0.08),
              THREE.MathUtils.lerp(rA.rotation.y, t[1], 0.08),
              THREE.MathUtils.lerp(rA.rotation.z, t[2], 0.08),
            );
            rF.rotation.set(
              THREE.MathUtils.lerp(rF.rotation.x, t[3], 0.08),
              THREE.MathUtils.lerp(rF.rotation.y, t[4], 0.08),
              THREE.MathUtils.lerp(rF.rotation.z, t[5], 0.08),
            );
          }

          /* ── Head/Neck IK ── */
          if (bones.Head && bones.Neck) {
            const hWP = new THREE.Vector3();
            bones.Head.getWorldPosition(hWP);
            const fg = new THREE.Vector3().copy(gazeTarget).add(saccadeOffset);
            const dir = new THREE.Vector3().subVectors(fg, hWP).normalize();
            const yaw = THREE.MathUtils.clamp(Math.atan2(dir.x, dir.z), -0.42, 0.42);
            const pitch = THREE.MathUtils.clamp(-Math.asin(dir.y), -0.32, 0.32);

            const boredomX = p.emotion === "Bored" ? 0.08 : 0;
            const laughTilt = p.userLaughterActive ? -0.15 : 0;

            bones.Neck.rotation.y = THREE.MathUtils.lerp(bones.Neck.rotation.y, yaw * 0.65, 0.06);
            bones.Neck.rotation.x = THREE.MathUtils.lerp(bones.Neck.rotation.x, pitch * 0.65 + yawnHeadX * 0.5 + boredomX * 0.5 + laughTilt * 0.5, 0.06);

            bones.Head.rotation.z = THREE.MathUtils.lerp(bones.Head.rotation.z, 0.08, 0.06);
            bones.Head.rotation.y = THREE.MathUtils.lerp(bones.Head.rotation.y, yaw * 0.35, 0.06);
            bones.Head.rotation.x = THREE.MathUtils.lerp(bones.Head.rotation.x, pitch * 0.35 + yawnHeadX * 0.5 + boredomX * 0.5 + laughTilt * 0.5, 0.06);
          }

          /* ── Eye Bone IK ── */
          if (bones.LeftEye && bones.RightEye && bones.Head) {
            const hWP = new THREE.Vector3();
            bones.Head.getWorldPosition(hWP);
            const fg = new THREE.Vector3().copy(gazeTarget).add(saccadeOffset);
            const dir = new THREE.Vector3().subVectors(fg, hWP).normalize();
            const ey = THREE.MathUtils.clamp(Math.atan2(dir.x, dir.z), -0.22, 0.22);
            const ep = THREE.MathUtils.clamp(-Math.asin(dir.y), -0.16, 0.16);

            bones.LeftEye.rotation.y = THREE.MathUtils.lerp(bones.LeftEye.rotation.y, ey, 0.15);
            bones.LeftEye.rotation.x = THREE.MathUtils.lerp(bones.LeftEye.rotation.x, ep, 0.15);
            bones.RightEye.rotation.y = THREE.MathUtils.lerp(bones.RightEye.rotation.y, ey, 0.15);
            bones.RightEye.rotation.x = THREE.MathUtils.lerp(bones.RightEye.rotation.x, ep, 0.15);
          }

          /* ── Morph Target Engine ── */
          if (headMesh && headMesh.morphTargetDictionary && headMesh.morphTargetInfluences) {
            const dict = headMesh.morphTargetDictionary;
            const inf = headMesh.morphTargetInfluences;

            // Blinking
            a.nextBlink -= delta;
            if (a.nextBlink <= 0 && !a.isBlinking) {
              a.isBlinking = true;
              a.blinkTime = 0;
              a.blinkDur = 0.12 + Math.random() * 0.07;
            }
            if (a.isBlinking) {
              a.blinkTime += delta;
              const prog = a.blinkTime / a.blinkDur;
              if (prog < 0.5) {
                const v = prog * 2;
                setMorph(dict, inf, "eyeBlinkLeft", v);
                setMorph(dict, inf, "eyeBlinkRight", v);
              } else if (prog < 1.0) {
                const v = 1.0 - (prog - 0.5) * 2;
                setMorph(dict, inf, "eyeBlinkLeft", v);
                setMorph(dict, inf, "eyeBlinkRight", v);
              } else {
                setMorph(dict, inf, "eyeBlinkLeft", 0);
                setMorph(dict, inf, "eyeBlinkRight", 0);
                a.isBlinking = false;
                a.nextBlink = 3.0 + Math.random() * 3.0;
              }
            }

            // Nose twitch
            a.nextNoseTwitch -= delta;
            if (a.nextNoseTwitch <= 0 && !a.isNoseTwitching) {
              a.isNoseTwitching = true;
              a.noseTwitchTime = 0;
            }
            let twitchVal = 0;
            if (a.isNoseTwitching) {
              a.noseTwitchTime += delta;
              const r = a.noseTwitchTime / a.noseTwitchDur;
              twitchVal = Math.sin(r * Math.PI) * 0.45;
              if (r >= 1.0) {
                a.isNoseTwitching = false;
                a.nextNoseTwitch = 6.0 + Math.random() * 8.0;
              }
            }
            setMorph(dict, inf, "noseSneerLeft", twitchVal, 0.15);
            setMorph(dict, inf, "noseSneerRight", twitchVal, 0.15);

            // Frequency-based lip sync
            let speakSmileOffset = 0;
            if (p.isSpeaking && p.analyserNode && !a.isYawning) {
              const fd = new Uint8Array(p.analyserNode.frequencyBinCount);
              p.analyserNode.getByteFrequencyData(fd);

              let lowS = 0;
              for (let i = 1; i <= Math.min(10, fd.length - 1); i++) lowS += fd[i];
              const avgLow = lowS / 10 / 255;

              let midS = 0;
              for (let i = 11; i <= Math.min(35, fd.length - 1); i++) midS += fd[i];
              const avgMid = midS / 25 / 255;

              let hiS = 0;
              for (let i = 36; i <= Math.min(100, fd.length - 1); i++) hiS += fd[i];
              const avgHi = hiS / 65 / 255;

              a.smoothLow = THREE.MathUtils.lerp(a.smoothLow, avgLow, 0.42);
              a.smoothMid = THREE.MathUtils.lerp(a.smoothMid, avgMid, 0.42);
              a.smoothHigh = THREE.MathUtils.lerp(a.smoothHigh, avgHi, 0.42);

              let jaw = Math.min(a.smoothLow * 1.9, 0.85);
              const funnel = a.smoothLow * 0.75;
              const pucker = a.smoothMid * 0.8;
              const close = a.smoothHigh * 0.95;
              speakSmileOffset = a.smoothMid * 0.28;
              if (close > 0.3) jaw = Math.min(jaw, 0.2);

              setMorph(dict, inf, "jawOpen", jaw, 0.5);
              setMorph(dict, inf, "mouthFunnel", funnel, 0.4);
              setMorph(dict, inf, "mouthPucker", pucker, 0.4);
              setMorph(dict, inf, "mouthClose", close, 0.4);
            } else if (!a.isYawning && !p.userLaughterActive) {
              setMorph(dict, inf, "jawOpen", 0, 0.22);
              setMorph(dict, inf, "mouthFunnel", 0, 0.22);
              setMorph(dict, inf, "mouthPucker", 0, 0.22);
              setMorph(dict, inf, "mouthClose", 0, 0.22);
            }

            // Yawn overrides
            if (a.isYawning) {
              setMorph(dict, inf, "jawOpen", yawnJaw, 0.35);
              setMorph(dict, inf, "eyeSquintLeft", yawnSquint, 0.35);
              setMorph(dict, inf, "eyeSquintRight", yawnSquint, 0.35);
              setMorph(dict, inf, "browInnerUp", yawnSquint * 0.4, 0.35);
            }

            // Emotion expressions
            let smileL = 0, smileR = 0, frownL = 0, frownR = 0;
            let browUp = 0, browDown = 0, eyeSquint = 0, eyeWide = 0, laughJaw = 0;

            if (p.userLaughterActive) {
              smileL = 0.8; smileR = 0.8; laughJaw = 0.45; eyeSquint = 0.55;
            } else {
              switch (p.emotion) {
                case "Happy": case "Delight":
                  smileL = 0.72; smileR = 0.72; eyeWide = 0.35; break;
                case "Sad": case "Comfort":
                  frownL = 0.48; frownR = 0.48; browUp = 0.3; break;
                case "Sarcastic": case "Gossip":
                  smileL = 0.6; smileR = 0.08 + speakSmileOffset; browUp = 0.4; break;
                case "Annoyance":
                  frownL = 0.3; frownR = 0.3; eyeSquint = 0.35; browDown = 0.35; break;
                case "Bored":
                  frownL = 0.15; frownR = 0.15; eyeSquint = 0.55; break;
                case "Shocked":
                  browUp = 0.7; eyeWide = 0.75; laughJaw = 0.35; break;
              }
            }

            if (!a.isYawning) {
              setMorph(dict, inf, "mouthSmileLeft", smileL + speakSmileOffset, 0.08);
              setMorph(dict, inf, "mouthSmileRight", smileR, 0.08);
              setMorph(dict, inf, "mouthFrownLeft", frownL, 0.08);
              setMorph(dict, inf, "mouthFrownRight", frownR, 0.08);
              setMorph(dict, inf, "browInnerUp", browUp, 0.08);
              setMorph(dict, inf, "browDownLeft", browDown, 0.08);
              setMorph(dict, inf, "browDownRight", browDown, 0.08);
              setMorph(dict, inf, "eyeSquintLeft", eyeSquint, 0.08);
              setMorph(dict, inf, "eyeSquintRight", eyeSquint, 0.08);
              setMorph(dict, inf, "eyeWideLeft", eyeWide, 0.08);
              setMorph(dict, inf, "eyeWideRight", eyeWide, 0.08);
              if (laughJaw > 0) setMorph(dict, inf, "jawOpen", laughJaw, 0.1);
            }
          }

          renderer.render(scene, camera);
          animationFrameId = requestAnimationFrame(animate);
        };

        animate();
      },
      (xhr) => {
        console.log(`[Katie] Loading model: ${((xhr.loaded / xhr.total) * 100).toFixed(1)}%`);
      },
      (error) => {
        console.error("[Katie] Failed to load GLB model:", error);
      }
    );

    /* ───────────── Resize Handler ───────────── */
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(() => handleResize());
    ro.observe(container);

    /* ───────────── Cleanup ───────────── */
    return () => {
      isCleanedUp = true;
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
      renderer.dispose();
      scene.traverse((obj) => {
        if (!(obj as any).isMesh) return;
        const m = obj as THREE.Mesh;
        m.geometry.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material.dispose();
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      <div className="absolute inset-0 bg-black/10 pointer-events-none z-0" />
      <canvas
        ref={canvasRef}
        className="w-full h-full block relative z-10"
      />
    </div>
  );
};
