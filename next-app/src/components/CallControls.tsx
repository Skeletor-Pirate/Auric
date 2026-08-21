/**
 * CallControls.tsx — Front-end floating action panel.
 * 
 * Includes start call, end call, mute, and debug mode buttons.
 * Renders state indicators in glassmorphic styles.
 */
import React from "react";
import { PhoneOff, Phone, Settings, RotateCcw, ShieldAlert, Terminal } from "lucide-react";
import { useAvatarStore } from "../state/avatarStore";
import { conversationManager } from "../conversation/ConversationManager";

export const CallControls: React.FC = () => {
  const isConnected = useAvatarStore((s) => s.isConnected);
  const isConnecting = useAvatarStore((s) => s.isConnecting);
  const debugMode = useAvatarStore((s) => s.debugMode);
  const toggleDebug = useAvatarStore((s) => s.toggleDebug);
  const toggleSettings = useAvatarStore((s) => s.toggleSettings);
  const lastError = useAvatarStore((s) => s.lastError);

  const handleCallToggle = () => {
    if (isConnected) {
      conversationManager.endCall();
    } else {
      conversationManager.startCall();
    }
  };

  return (
    <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-4 pointer-events-none">
      {/* Error alert banner */}
      {lastError && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/25 backdrop-blur-xl border border-red-500/40 text-red-200 rounded-2xl text-xs font-semibold shadow-lg pointer-events-auto animate-in fade-in max-w-sm">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{lastError}</span>
        </div>
      )}

      <div className="flex items-center gap-4 px-6 py-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl pointer-events-auto">
        {/* Toggle Debug Overlay */}
        <button
          onClick={toggleDebug}
          className={`p-3.5 rounded-full transition-all backdrop-blur-md ${
            debugMode
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
          }`}
          title="Toggle Debug Mode [D]"
        >
          <Terminal className="w-5 h-5" />
        </button>

        {/* Start / End call action */}
        {isConnected ? (
          <button
            onClick={handleCallToggle}
            className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 flex items-center justify-center"
            title="End Video Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={handleCallToggle}
            disabled={isConnecting}
            className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center"
            title={isConnecting ? "Connecting..." : "Start Video Call"}
          >
            <Phone className={`w-6 h-6 ${isConnecting ? "animate-spin" : "animate-pulse"}`} />
          </button>
        )}

        {/* Toggle Settings Overlay */}
        <button
          onClick={toggleSettings}
          className="p-3.5 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
