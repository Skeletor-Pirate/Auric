/**
 * DebugOverlay.tsx — Diagnostic overlay.
 * 
 * Renders pipeline latency metrics, connection nodes,
 * FSM states, live audio levels, and morph weights.
 */
import React, { useEffect, useState } from "react";
import { useAvatarStore } from "../state/avatarStore";
import { avatarStateMachine } from "../avatar/AvatarStateMachine";

export const DebugOverlay: React.FC = () => {
  const debugMode = useAvatarStore((s) => s.debugMode);
  const avatarState = useAvatarStore((s) => s.avatarState);
  const isConnected = useAvatarStore((s) => s.isConnected);
  const isSpeaking = useAvatarStore((s) => s.isSpeaking);
  const currentTurnId = useAvatarStore((s) => s.currentTurnId);
  const emotion = useAvatarStore((s) => s.emotion);
  const modelLoaded = useAvatarStore((s) => s.modelLoaded);
  const morphTargetCount = useAvatarStore((s) => s.morphTargetCount);

  const [fps, setFps] = useState(60);

  // Calculate FPS dynamically
  useEffect(() => {
    if (!debugMode) return;
    let frames = 0;
    let lastTime = performance.now();
    let animId = 0;

    const tick = () => {
      frames++;
      const time = performance.now();
      if (time >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (time - lastTime)));
        frames = 0;
        lastTime = time;
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [debugMode]);

  if (!debugMode) return null;

  return (
    <div className="absolute top-6 left-6 w-80 p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col gap-3.5 text-left text-[11px] font-mono text-white/90 shadow-2xl z-40 max-h-[85vh] overflow-y-auto select-text pointer-events-auto">
      <h2 className="text-xs font-bold text-rose-400 border-b border-white/10 pb-1.5 uppercase tracking-widest flex items-center justify-between">
        <span>Diagnostics Panel</span>
        <span className="text-[10px] text-white/40 font-mono">v1.1</span>
      </h2>

      {/* Connection & General */}
      <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
        <div className="flex justify-between">
          <span className="text-white/50">Connection:</span>
          <span className={isConnected ? "text-emerald-400 font-bold" : "text-white/40"}>
            {isConnected ? "ACTIVE (WSS)" : "OFFLINE"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">FPS:</span>
          <span className={fps >= 55 ? "text-emerald-400" : fps >= 30 ? "text-amber-400" : "text-rose-400"}>
            {fps} FPS
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Model Status:</span>
          <span className={modelLoaded ? "text-emerald-400" : "text-rose-400"}>
            {modelLoaded ? "LOADED" : "LOADING"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Morph Targets:</span>
          <span>{morphTargetCount} detected</span>
        </div>
      </div>

      {/* State Machine */}
      <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
        <div className="flex justify-between items-center">
          <span className="text-white/50">Authoritative FSM:</span>
          <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded font-bold uppercase text-[9px]">
            {avatarState}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Active Turn ID:</span>
          <span className="truncate max-w-[120px] text-white/70">{currentTurnId || "none"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Audio Playback:</span>
          <span className={isSpeaking ? "text-emerald-400 animate-pulse" : "text-white/40"}>
            {isSpeaking ? "PLAYING" : "SILENT"}
          </span>
        </div>
      </div>

      {/* Emotion States */}
      <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
        <h4 className="text-[10px] uppercase text-rose-400/80 tracking-wider font-bold mb-1">Emotion Vectors</h4>
        <div className="flex justify-between">
          <span className="text-white/50">Label Preset:</span>
          <span className="text-white font-bold uppercase">{emotion.label}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Intensity:</span>
          <span>{emotion.intensity.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Valence:</span>
          <span>{emotion.valence.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Arousal:</span>
          <span>{emotion.arousal.toFixed(2)}</span>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="flex flex-col gap-1">
        <h4 className="text-[10px] uppercase text-rose-400/80 tracking-wider font-bold mb-1">Keyboard Simulators</h4>
        <div className="grid grid-cols-2 gap-1.5 text-[9px] text-white/50 font-sans mt-0.5">
          <div className="bg-white/5 p-1 rounded border border-white/5">
            <kbd className="bg-white/10 px-1 rounded text-white font-mono">D</kbd> Toggle Panel
          </div>
          <div className="bg-white/5 p-1 rounded border border-white/5">
            <kbd className="bg-white/10 px-1 rounded text-white font-mono">B</kbd> Force Blink
          </div>
          <div className="bg-white/5 p-1 rounded border border-white/5">
            <kbd className="bg-white/10 px-1 rounded text-white font-mono">S</kbd> Force Shock
          </div>
          <div className="bg-white/5 p-1 rounded border border-white/5">
            <kbd className="bg-white/10 px-1 rounded text-white font-mono">I</kbd> Force Intrigue
          </div>
          <div className="bg-white/5 p-1 rounded border border-white/5">
            <kbd className="bg-white/10 px-1 rounded text-white font-mono">Y</kbd> Force Yawn
          </div>
          <div className="bg-white/5 p-1 rounded border border-white/5">
            <kbd className="bg-white/10 px-1 rounded text-white font-mono">R</kbd> Reset Avatar
          </div>
        </div>
      </div>
    </div>
  );
};
