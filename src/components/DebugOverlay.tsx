/**
 * DebugOverlay.tsx — Diagnostic overlay for Auric OS.
 * 
 * Renders pipeline latency metrics, connection nodes,
 * FSM states, live audio levels, etc.
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
    <div className="absolute top-6 left-6 w-80 p-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl flex flex-col gap-3.5 text-left text-[11px] font-mono text-gray-800 shadow-2xl z-40 max-h-[85vh] overflow-y-auto select-text pointer-events-auto">
      <h2 className="text-xs font-bold text-gray-600 border-b border-gray-200 pb-1.5 uppercase tracking-widest flex items-center justify-between">
        <span>Auric Diagnostics</span>
        <span className="text-[10px] text-gray-400 font-mono">v2.0</span>
      </h2>

      {/* Connection & General */}
      <div className="flex flex-col gap-1 border-b border-gray-200 pb-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Connection:</span>
          <span className={isConnected ? "text-emerald-500 font-bold" : "text-gray-400"}>
            {isConnected ? "ACTIVE (WSS)" : "OFFLINE"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">UI FPS:</span>
          <span className={fps >= 55 ? "text-emerald-500" : fps >= 30 ? "text-amber-500" : "text-rose-500"}>
            {fps} FPS
          </span>
        </div>
      </div>

      {/* State Machine */}
      <div className="flex flex-col gap-1 border-b border-gray-200 pb-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Core FSM:</span>
          <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 rounded font-bold uppercase text-[9px]">
            {avatarState}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Active Turn ID:</span>
          <span className="truncate max-w-[120px] text-gray-700">{currentTurnId || "none"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Audio Synthesis:</span>
          <span className={isSpeaking ? "text-emerald-500 animate-pulse font-bold" : "text-gray-400"}>
            {isSpeaking ? "ACTIVE" : "IDLE"}
          </span>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="flex flex-col gap-1">
        <h4 className="text-[10px] uppercase text-gray-500 tracking-wider font-bold mb-1">Keyboard Shortcuts</h4>
        <div className="grid grid-cols-1 gap-1.5 text-[9px] text-gray-600 font-sans mt-0.5">
          <div className="bg-gray-100 p-1.5 rounded border border-gray-200 flex items-center justify-between">
            <span>Toggle Debug Panel</span>
            <kbd className="bg-white px-2 py-0.5 border border-gray-200 rounded text-gray-600 font-mono font-bold shadow-sm">D</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
