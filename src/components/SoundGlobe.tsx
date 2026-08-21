import React, { useEffect, useRef, useState } from "react";
import { audioManager } from "../audio/AudioManager";
import { useAvatarStore } from "../state/avatarStore";

export const SoundGlobe: React.FC = () => {
  const globeRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  
  const darkMode = useAvatarStore((s) => s.darkMode);
  const isConnected = useAvatarStore((s) => s.isConnected);
  const isSpeaking = useAvatarStore((s) => s.isSpeaking);

  useEffect(() => {
    let animationFrameId: number;
    let time = 0;

    const updateGlobe = () => {
      if (!globeRef.current || !glowRef.current) return;
      
      let scale = 1;
      let opacity = 0.5;
      let glowIntensity = 0;
      time += 0.05;

      if (isConnected) {
        const analyser = audioManager.analyser;
        if (analyser) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          
          // Scale heavily based on audio average
          scale = 1 + (average / 128) * 0.4;
          opacity = 0.6 + (average / 255) * 0.4;
          glowIntensity = (average / 128) * 40;
          
          setIsActive(average > 5);
        } else {
          // Connected but no audio streaming: gentle idle breath
          scale = 1 + Math.sin(time) * 0.03;
          opacity = 0.6 + Math.sin(time * 0.5) * 0.1;
          glowIntensity = 10 + Math.sin(time) * 10;
        }
      } else {
        // Disconnected: very slow, small idle breath
        scale = 0.95 + Math.sin(time * 0.5) * 0.02;
        opacity = 0.3;
        glowIntensity = 0;
      }

      // Apply transforms
      globeRef.current.style.transform = `scale(${scale})`;
      
      // Update core colors based on dark mode & connection state
      if (darkMode) {
        globeRef.current.style.background = isConnected 
          ? `radial-gradient(circle at 30% 30%, rgba(99, 102, 241, ${opacity}), rgba(17, 24, 39, 0.9))` 
          : `radial-gradient(circle at 30% 30%, rgba(75, 85, 99, ${opacity}), rgba(17, 24, 39, 0.9))`;
        globeRef.current.style.boxShadow = isConnected 
          ? `inset -10px -10px 40px rgba(0,0,0,0.5), 0 0 ${20 + glowIntensity}px rgba(99, 102, 241, ${opacity * 0.5})` 
          : `inset -10px -10px 40px rgba(0,0,0,0.5)`;
      } else {
        globeRef.current.style.background = isConnected 
          ? `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(167, 139, 250, ${opacity * 0.5}))` 
          : `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(209, 213, 219, 0.5))`;
        globeRef.current.style.boxShadow = isConnected 
          ? `inset -10px -10px 40px rgba(0,0,0,0.1), 0 0 ${20 + glowIntensity}px rgba(139, 92, 246, ${opacity * 0.3})` 
          : `inset -10px -10px 40px rgba(0,0,0,0.1)`;
      }

      // Dynamic outer glow ring
      glowRef.current.style.transform = `scale(${scale * 1.15})`;
      glowRef.current.style.opacity = isConnected ? (0.2 + (glowIntensity / 100)).toString() : "0.05";
      
      animationFrameId = requestAnimationFrame(updateGlobe);
    };

    updateGlobe();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isConnected, darkMode]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      
      {/* Dynamic Outer Glow Ring */}
      <div 
        ref={glowRef}
        className={`absolute w-64 h-64 rounded-full border border-current transition-transform duration-75 ease-out blur-[2px] ${
          darkMode ? (isConnected ? "text-indigo-500" : "text-gray-600") : (isConnected ? "text-purple-400" : "text-gray-300")
        }`}
      ></div>
      
      {/* Core Globe */}
      <div
        ref={globeRef}
        className={`w-56 h-56 rounded-full border relative z-10 transition-transform duration-75 ease-out backdrop-blur-md flex items-center justify-center ${
          darkMode ? "border-white/10" : "border-white/50"
        }`}
      >
        {/* Inner specular highlight to make it look like a 3D glass sphere */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
        {/* Small bright reflection dot */}
        <div className="absolute top-8 left-12 w-8 h-4 rounded-full bg-white/40 blur-[2px] rotate-[-30deg] pointer-events-none"></div>
      </div>
      
      {/* Text Label perfectly centered at the bottom of the container */}
      <div className={`absolute bottom-8 text-[10px] uppercase tracking-[0.4em] font-bold z-20 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        Auric Core
      </div>
      
    </div>
  );
};
