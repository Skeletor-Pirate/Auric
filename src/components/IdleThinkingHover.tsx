/**
 * IdleThinkingHover.tsx — Agent "pretend to think" hover state.
 *
 * When the user hasn't spoken for 3 minutes while on a connected call,
 * Auric pretends to be deep in thought: a floating thinking bubble appears
 * with animated dots so she looks alive and engaged.
 */
import React, { useEffect, useState } from "react";
import { useAvatarStore } from "../state/avatarStore";

const IDLE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

export const IdleThinkingHover: React.FC = () => {
  const isConnected = useAvatarStore((s) => s.isConnected);
  const isSpeaking = useAvatarStore((s) => s.isSpeaking);
  const isUserSpeaking = useAvatarStore((s) => s.isUserSpeaking);

  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [thinking, setThinking] = useState(false);

  // Track every user utterance as activity
  useEffect(() => {
    if (isUserSpeaking || isSpeaking) {
      setLastActivity(Date.now());
      setThinking(false);
    }
  }, [isUserSpeaking, isSpeaking]);

  // Watch for the 3-minute silence window
  useEffect(() => {
    if (!isConnected) {
      setThinking(false);
      return;
    }

    const interval = setInterval(() => {
      const idle = Date.now() - lastActivity;
      if (!isUserSpeaking && !isSpeaking && idle >= IDLE_THRESHOLD_MS) {
        setThinking(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, lastActivity, isUserSpeaking, isSpeaking]);

  if (!isConnected || !thinking) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[130%] z-30 pointer-events-none flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
      {/* Thinking bubble */}
      <div className="relative px-5 py-3 bg-[var(--panel-strong)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mr-1">
            Auric's thinking
          </span>
          <span className="auric-think-dot w-1.5 h-1.5 rounded-full bg-pink-400" />
          <span className="auric-think-dot w-1.5 h-1.5 rounded-full bg-pink-400" />
          <span className="auric-think-dot w-1.5 h-1.5 rounded-full bg-pink-400" />
        </div>
        {/* Bubble tail */}
        <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-[var(--panel-strong)] border-r border-b border-[var(--border)] rotate-45" />
      </div>
      <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
        Hmm... what should I say next?
      </p>
    </div>
  );
};
export default IdleThinkingHover;