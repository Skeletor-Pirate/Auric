/**
 * LoadingOverlay.tsx — Call-connecting loading animation.
 *
 * Appears only while a call is being established (connecting). Uses a
 * translucent dark backdrop so the room/avatar stay visible, and never
 * paints a theme-colored wall over the scene.
 */
import React from "react";
import { useAvatarStore } from "../state/avatarStore";

interface LoadingOverlayProps {
  /** Force-show regardless of store flags (e.g. initial boot). */
  show?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show }) => {
  const isConnecting = useAvatarStore((s) => s.isConnecting);

  const visible = show || isConnecting;

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-[45] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-500 pointer-events-none">
      {/* Animated pulsing rings */}
      <div className="relative flex items-center justify-center mb-8">
        <span className="absolute w-24 h-24 rounded-full border border-pink-500/30 animate-ping" />
        <span className="absolute w-20 h-20 rounded-full border border-purple-500/20 animate-ping [animation-delay:0.3s]" />
        <div className="relative w-16 h-16 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.5)] text-white font-black text-2xl animate-pulse">
          K
        </div>
      </div>

      {/* Status text */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-bold tracking-widest text-white uppercase animate-pulse">
          Waking up Katie...
        </p>

        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-loading-bar" />
        </div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-white/60">
          Just a moment
        </p>
      </div>
    </div>
  );
};
export default LoadingOverlay;