/**
 * TranscriptPanel.tsx — Live conversation dialogue panel.
 * 
 * Displays transcripts from both user and Katie.
 * Distinguishes state indices (Listening, Thinking, Speaking).
 */
import React, { useRef, useEffect } from "react";
import { useAvatarStore } from "../state/avatarStore";

export const TranscriptPanel: React.FC = () => {
  const isConnected = useAvatarStore((s) => s.isConnected);
  const avatarState = useAvatarStore((s) => s.avatarState);
  const userTranscript = useAvatarStore((s) => s.userTranscript);
  const katieTranscript = useAvatarStore((s) => s.katieTranscript);
  const isUserSpeaking = useAvatarStore((s) => s.isUserSpeaking);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [userTranscript, katieTranscript]);

  if (!isConnected) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute top-24 right-6 w-80 max-h-[400px] p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-y-auto flex flex-col gap-3 shadow-2xl z-20 text-left transition-all duration-300"
    >
      <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-black border-b border-white/5 pb-1">
        Transcript
      </h3>

      {/* User block */}
      {userTranscript && (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider font-bold text-rose-400">You</span>
          <p className="text-xs text-white/90 leading-relaxed font-medium bg-white/5 p-2 rounded-xl border border-white/5">
            {userTranscript}
          </p>
        </div>
      )}

      {/* Katie block */}
      {katieTranscript && (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400">Katie</span>
          <p className="text-xs text-white/90 leading-relaxed font-medium bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
            {katieTranscript}
          </p>
        </div>
      )}

      {/* State notifications */}
      <div className="flex items-center gap-1.5 mt-1 border-t border-white/5 pt-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isUserSpeaking ? "bg-rose-400" : avatarState === "speaking" ? "bg-emerald-400" : "bg-white/40"
          }`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
            isUserSpeaking ? "bg-rose-500" : avatarState === "speaking" ? "bg-emerald-500" : "bg-white/50"
          }`} />
        </span>
        <span className="text-[9px] font-mono uppercase tracking-wider text-white/50">
          {isUserSpeaking 
            ? "User Speaking..." 
            : avatarState === "processing" 
            ? "Katie Thinking..." 
            : avatarState === "speaking" 
            ? "Katie Replying..." 
            : "Listening..."}
        </span>
      </div>
    </div>
  );
};
