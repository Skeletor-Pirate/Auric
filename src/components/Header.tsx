import React from "react";
import { PersonalityMode } from "../types";
import { Sparkles, Shield, HeartHandshake, Mic } from "lucide-react";

interface HeaderProps {
  personality: PersonalityMode;
  activeMainTab: "voice" | "consoles" | "insights";
  onMainTabChange: (tab: "voice" | "consoles" | "insights") => void;
  onOpenSafetyModal: () => void;
  isListening: boolean;
  isSpeaking: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  personality,
  activeMainTab,
  onMainTabChange,
  onOpenSafetyModal,
  isListening,
  isSpeaking,
}) => {
  const getPersonalityLabel = () => {
    switch (personality) {
      case "sarcastic_bestie":
        return "Sarcastic Bestie 💅";
      case "coach_mode":
        return "Coach Kat ⚡";
      case "late_night":
        return "Late Night Confidant 🌙";
      case "chill_friend":
      default:
        return "Chill Friend ☕";
    }
  };

  return (
    <header className="bg-[#050508]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between text-white shadow-2xl">
      {/* Brand Title with Gradient Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] text-white font-black text-xl">
          K
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white">
              AURIC<span className="text-pink-500">.AI</span>
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 uppercase tracking-widest hidden sm:inline-block">
              SER PROSODY v2.4
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium">
            Vocal Emotion Analysis & Companion
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-full border border-white/10">
        <button
          onClick={() => onMainTabChange("voice")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
            activeMainTab === "voice"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.35)]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Voice Companion</span>
        </button>

        <button
          onClick={() => onMainTabChange("consoles")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
            activeMainTab === "consoles"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.35)]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mini Consoles</span>
        </button>

        <button
          onClick={() => onMainTabChange("insights")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
            activeMainTab === "insights"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.35)]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>Vibe Reports</span>
        </button>
      </div>

      {/* Right Action: Status Pill & Safety Modal Button */}
      <div className="flex items-center gap-3">
        {/* Live Session Status Pill */}
        <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-medium text-white/80 hidden md:flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isListening
                ? "bg-pink-500 animate-ping"
                : isSpeaking
                ? "bg-cyan-400 animate-pulse"
                : "bg-green-400 animate-pulse"
            }`}
          />
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/70">
            {isListening ? "Analyzing..." : isSpeaking ? "Speaking" : "Live Session"}
          </span>
        </div>

        {/* Safety Alert Trigger */}
        <button
          onClick={onOpenSafetyModal}
          className="p-2 sm:px-3 sm:py-1.5 rounded-full text-white/60 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Safety & Crisis Resources"
        >
          <Shield className="w-4 h-4 text-rose-400" />
          <span className="hidden lg:inline text-[11px] uppercase tracking-wider">Safety</span>
        </button>
      </div>
    </header>
  );
};

