import React, { useEffect, useState } from "react";
import { EmotionCategory, PersonalityMode } from "../types";

interface KatieAvatarProps {
  emotion: EmotionCategory;
  isListening: boolean;
  isSpeaking: boolean;
  audioEnergy?: number;
  personality: PersonalityMode;
}

export const KatieAvatar: React.FC<KatieAvatarProps> = ({
  emotion,
  isListening,
  isSpeaking,
  audioEnergy = 0,
  personality,
}) => {
  const [blink, setBlink] = useState(false);
  const [floatOffset, setFloatOffset] = useState(0);

  // Periodic blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3800 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Float idle motion
  useEffect(() => {
    let t = 0;
    const interval = setInterval(() => {
      t += 0.05;
      setFloatOffset(Math.sin(t) * 6);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Emotion-based theme palettes
  const getEmotionTheme = () => {
    switch (emotion) {
      case "Happy":
      case "Excited":
        return {
          glow: "rgba(245, 158, 11, 0.45)",
          gradient: "from-amber-400 via-pink-500 to-purple-600",
          border: "border-pink-500/30",
          auraRing: "rgba(245, 158, 11, 0.25)",
          mouthHeight: isSpeaking ? 18 : 6,
          mouthCurve: -12, // Smile curve
          eyeHeight: blink ? 2 : 12,
          badgeBg: "bg-pink-500/20 text-pink-400 border-pink-500/30",
        };
      case "Sad":
      case "Flat/Depressed":
        return {
          glow: "rgba(99, 102, 241, 0.4)",
          gradient: "from-indigo-600 via-cyan-600 to-blue-600",
          border: "border-indigo-500/30",
          auraRing: "rgba(99, 102, 241, 0.25)",
          mouthHeight: isSpeaking ? 12 : 4,
          mouthCurve: 6, // Gentle soft downcurve
          eyeHeight: blink ? 2 : 8,
          badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        };
      case "Anxious":
      case "Stressed":
      case "Frustrated":
        return {
          glow: "rgba(236, 72, 153, 0.45)",
          gradient: "from-fuchsia-600 via-pink-600 to-rose-600",
          border: "border-pink-500/40",
          auraRing: "rgba(244, 114, 182, 0.3)",
          mouthHeight: isSpeaking ? 16 : 4,
          mouthCurve: 0, // Flat soft line
          eyeHeight: blink ? 2 : 13,
          badgeBg: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        };
      case "Calm":
      default:
        return {
          glow: "rgba(168, 85, 247, 0.35)",
          gradient: "from-indigo-600 via-purple-600 to-pink-500",
          border: "border-purple-500/30",
          auraRing: "rgba(168, 85, 247, 0.2)",
          mouthHeight: isSpeaking ? 14 : 5,
          mouthCurve: -8, // Gentle serene smile
          eyeHeight: blink ? 2 : 10,
          badgeBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        };
    }
  };

  const theme = getEmotionTheme();

  // Dynamic scale based on speaking/listening intensity
  const reactiveScale = isListening
    ? 1 + Math.min(Math.max((audioEnergy + 60) / 100, 0), 0.15)
    : isSpeaking
    ? 1.05 + Math.sin(Date.now() / 150) * 0.04
    : 1.0;

  return (
    <div id="katie-avatar-container" className="relative flex flex-col items-center justify-center select-none py-4">
      {/* Concentric Ambient Geometric Radar Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full border border-white/5 animate-spin-slow" />
        <div className="absolute w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] rounded-full border border-white/10" />
      </div>

      {/* Atmospheric Luminous Blur Halo */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700 blur-[80px]"
        style={{
          width: isSpeaking ? "260px" : isListening ? "280px" : "220px",
          height: isSpeaking ? "260px" : isListening ? "280px" : "220px",
          backgroundColor: theme.auraRing,
          transform: `scale(${reactiveScale * 1.2})`,
        }}
      />

      {/* Floating Dynamic Avatar Pod */}
      <div
        className="relative transition-transform duration-300 ease-out z-10"
        style={{
          transform: `translateY(${floatOffset}px) scale(${reactiveScale})`,
        }}
      >
        {/* Glowing Gradient Halo Ring */}
        <div
          className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br ${theme.gradient} p-[2px] transition-all duration-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]`}
        >
          {/* Inner Face Core */}
          <div className="w-full h-full rounded-full bg-[#0a0a0c] border-2 border-white/20 relative flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient Eye/Cheek Highlights */}
            <div className="absolute top-4 left-6 w-5 h-2 rounded-full bg-white/10 blur-xs rotate-[-20deg]" />
            <div className="absolute bottom-5 left-5 w-4 h-2.5 rounded-full bg-pink-500/20 blur-xs" />
            <div className="absolute bottom-5 right-5 w-4 h-2.5 rounded-full bg-pink-500/20 blur-xs" />

            {/* Eyes Container */}
            <div className="flex items-center gap-7 mt-1">
              {/* Left Eye */}
              <div
                className="relative bg-white rounded-full transition-all duration-150 flex items-center justify-center overflow-hidden shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                style={{
                  width: "18px",
                  height: `${theme.eyeHeight}px`,
                }}
              >
                {!blink && (
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-[#050508] transition-all"
                    style={{
                      transform: isSpeaking ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    <div className="w-1 h-1 rounded-full bg-white ml-0.5 mt-0.5" />
                  </div>
                )}
              </div>

              {/* Right Eye */}
              <div
                className="relative bg-white rounded-full transition-all duration-150 flex items-center justify-center overflow-hidden shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                style={{
                  width: "18px",
                  height: `${theme.eyeHeight}px`,
                }}
              >
                {!blink && (
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-[#050508] transition-all"
                    style={{
                      transform: isSpeaking ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    <div className="w-1 h-1 rounded-full bg-white ml-0.5 mt-0.5" />
                  </div>
                )}
              </div>
            </div>

            {/* Mouth SVG Expression */}
            <div className="mt-3 flex items-center justify-center h-6">
              <svg width="44" height="24" viewBox="0 0 44 24" className="transition-all duration-200">
                {isSpeaking ? (
                  <path
                    d={`M 10 12 Q 22 ${12 + (theme.mouthHeight || 12)} 34 12 Q 22 4 10 12`}
                    fill="#ec4899"
                    stroke="#fff"
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                ) : (
                  <path
                    d={`M 12 12 Q 22 ${12 - (theme.mouthCurve || -6)} 32 12`}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </div>

            {/* Soundwave Bars Equalizer */}
            {(isListening || isSpeaking) && (
              <div className="absolute bottom-3 flex items-end gap-[3px] h-6">
                {[8, 16, 10, 20, 14, 6, 18].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-pink-400 rounded-full animate-pulse"
                    style={{
                      height: `${h * 0.7}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: "0.5s",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pulse Antenna Orb */}
        <div
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full border border-white/40 shadow-[0_0_12px_rgba(236,72,153,0.5)] flex items-center justify-center text-[10px] font-bold bg-[#0a0a0c]"
        >
          {isListening ? (
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          ) : isSpeaking ? (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          )}
        </div>
      </div>

      {/* Live Emotional State Pill */}
      <div className="mt-4 flex items-center gap-2 z-10">
        <div
          id="katie-current-emotion-badge"
          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm transition-all flex items-center gap-1.5 ${theme.badgeBg}`}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          <span>Vibe: {emotion}</span>
        </div>

        {isListening && (
          <span className="text-[11px] font-semibold text-pink-400 flex items-center gap-1 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20 animate-pulse uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            Analyzing Prosody...
          </span>
        )}
        {isSpeaking && (
          <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Kat Speaking
          </span>
        )}
      </div>
    </div>
  );
};

