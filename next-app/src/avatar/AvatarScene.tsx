/**
 * AvatarScene.tsx — The React Three Fiber 3D Canvas context.
 * 
 * Sets up perspective camera, lighting (key, fill, rim, screen glare),
 * environment props (desk, mug, chair), and wraps AvatarModel inside Suspense.
 */
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AvatarModel } from "./AvatarModel";
import { useAvatarStore } from "../state/avatarStore";

interface AvatarSceneProps {
  analyserNode: AnalyserNode | null;
}

const ModelLoadingFallback = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#08080c] text-white z-50">
      <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium tracking-widest text-white/80 animate-pulse uppercase">
        Loading 3D Avatar...
      </p>
    </div>
  );
};

export const AvatarScene: React.FC<AvatarSceneProps> = ({ analyserNode }) => {
  const bgUrl = useAvatarStore((s) => s.bgUrl);

  return (
    <div 
      className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
      style={{ backgroundImage: `url(${bgUrl || '/room/4ed3764ec12cb31f2562c968d5ba5c73.png'})` }}
    >
      {/* Dim room overlay */}
      <div className="absolute inset-0 bg-black/35 pointer-events-none z-0" />

      <Suspense fallback={<ModelLoadingFallback />}>
        <Canvas
          shadows
          camera={{ fov: 42, near: 0.1, far: 100, position: [0, 1.15, 1.0] }}
          gl={{ antialias: true, alpha: true, toneMappingExposure: 1.08 }}
          className="w-full h-full block relative z-10"
          onCreated={({ gl, camera }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            camera.lookAt(0, 1.05, 0);
          }}
        >
          {/* Studio Lighting */}
          <ambientLight intensity={0.42} color={0xffffff} />
          
          <directionalLight
            castShadow
            intensity={1.35}
            position={[1.4, 3.2, 2.2]}
            color={0xfff2e5}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          
          <directionalLight
            intensity={0.75}
            position={[-1.8, 1.8, 1.2]}
            color={0xe0e8ff}
          />
          
          <directionalLight
            intensity={1.2}
            position={[0, 3.0, -2.2]}
            color={0xffffff}
          />

          {/* Dynamic Video Call Screen Glare */}
          <ScreenGlarePointLight />

          {/* Room Environment Props (Desk, Chair, Coffee Mug) */}
          <EnvironmentProps />

          {/* Avatar Model */}
          <AvatarModel analyserNode={analyserNode} />
        </Canvas>
      </Suspense>
    </div>
  );
};

// Component to handle dynamic screen glare flicker
const ScreenGlarePointLight = () => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      const elapsed = clock.getElapsedTime();
      const flicker = Math.sin(elapsed * 4.8) * Math.cos(elapsed * 2.5);
      lightRef.current.intensity = 0.45 + flicker * 0.12;
      // Shift hue slightly over time (cool blue-ish tones)
      lightRef.current.color.setHSL(0.55 + Math.sin(elapsed * 0.4) * 0.04, 0.8, 0.88);
    }
  });

  return <pointLight ref={lightRef} position={[0, 1.1, 0.6]} distance={3.5} />;
};

// Static meshes representing the desk environment
const EnvironmentProps = () => {
  return (
    <group>
      {/* Desk surface */}
      <mesh position={[0, 0.61, 0.35]} receiveShadow castShadow>
        <boxGeometry args={[1.4, 0.04, 0.8]} />
        <meshStandardMaterial color={0x1a1210} roughness={0.32} metalness={0.1} />
      </mesh>

      {/* Red coffee mug */}
      <mesh position={[-0.35, 0.67, 0.25]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.09, 16]} />
        <meshStandardMaterial color={0xe11d48} roughness={0.25} />
      </mesh>

      {/* Desk chair seat */}
      <mesh position={[0, 0.38, -0.05]} receiveShadow>
        <boxGeometry args={[0.5, 0.05, 0.5]} />
        <meshStandardMaterial color={0x242130} roughness={0.85} />
      </mesh>
    </group>
  );
};

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
