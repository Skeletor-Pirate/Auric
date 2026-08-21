/**
 * AppShell.tsx — Shell layout wrapper.
 * 
 * Sets up global overlay styling grid, imports contextual overlays,
 * and tracks audio analyzer syncs.
 */
import React, { useEffect, useState } from "react";
import { AvatarViewport } from "./AvatarViewport";
import { CallControls } from "./CallControls";
import { TranscriptPanel } from "./TranscriptPanel";
import { DebugOverlay } from "./DebugOverlay";
import { SettingsPanel } from "./SettingsPanel";
import { useAvatarStore } from "../state/avatarStore";
import { registerKeyboardShortcuts } from "../debug/KeyboardShortcuts";
import { audioManager } from "../audio/AudioManager";
import { ConversationProvider } from "./ConversationProvider";

export const AppShell: React.FC = () => {
  const isConnected = useAvatarStore((s) => s.isConnected);
  const isSpeaking = useAvatarStore((s) => s.isSpeaking);
  const isUserSpeaking = useAvatarStore((s) => s.isUserSpeaking);
  
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Initialize keyboard shortcuts
  useEffect(() => {
    const unbind = registerKeyboardShortcuts();
    return () => {
      unbind();
      audioManager.close();
    };
  }, []);

  // Poll for audio analyser creation
  useEffect(() => {
    const checkAnalyser = setInterval(() => {
      if (audioManager.analyser) {
        setAnalyser(audioManager.analyser);
        clearInterval(checkAnalyser);
      }
    }, 100);
    return () => clearInterval(checkAnalyser);
  }, []);

  return (
    <ConversationProvider>
      <div className="w-screen h-screen bg-[#050508] relative overflow-hidden select-none">
        
        {/* 3D WebGL Seated Avatar Room */}
        <AvatarViewport analyserNode={analyser} />

        {/* Floating Status Badges */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-3 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-lg border border-white/10 rounded-full">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-white/40"}`} />
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">
                {isConnected ? "Video Call Active" : "Offline"}
              </span>
            </div>
            {isConnected && isSpeaking && (
              <div className="px-3 py-1.5 bg-pink-500/20 backdrop-blur-lg border border-pink-500/30 text-pink-400 rounded-full text-[10px] uppercase font-bold tracking-widest animate-pulse">
                Speaking
              </div>
            )}
            {isConnected && isUserSpeaking && (
              <div className="px-3 py-1.5 bg-emerald-500/20 backdrop-blur-lg border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] uppercase font-bold tracking-widest animate-pulse">
                User Speaking
              </div>
            )}
          </div>
        </div>

        {/* Floating dialogue transcript logger */}
        <TranscriptPanel />

        {/* Settings overlays */}
        <SettingsPanel />

        {/* Diagnostics logs overlay */}
        <DebugOverlay />

        {/* Call controllers */}
        <CallControls />
        
      </div>
    </ConversationProvider>
  );
};
export default AppShell;
