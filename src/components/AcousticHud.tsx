import React from "react";
import {
  AcousticMetrics,
  AcousticProsody,
  EmotionCategory,
  EmotionScores,
} from "../types";
import { Activity, Zap, Volume2, Clock, Heart, Waves, Gauge } from "lucide-react";

interface AcousticHudProps {
  metrics: AcousticMetrics | null;
  prosody: AcousticProsody | null;
  emotion: EmotionCategory;
  emotionScores?: EmotionScores;
  moodMirror?: string;
  isRecording: boolean;
}

export const AcousticHud: React.FC<AcousticHudProps> = ({
  metrics,
  prosody,
  emotion,
  emotionScores,
  moodMirror,
  isRecording,
}) => {
  // Default values when idle
  const currentPitch = metrics?.pitchAvgHz || 185;
  const currentEnergy = metrics?.energyDb ?? -26;
  const currentWpm = metrics?.speechRateWpm || 135;
  const currentStrain = metrics?.vocalStrainScore || 20;

  // Pitch octave classification
  const getPitchLabel = (hz: number) => {
    if (hz < 130) return "Low Baritone";
    if (hz < 180) return "Mid-Low Conversational";
    if (hz < 250) return "Mid Expressive";
    if (hz < 320) return "High Elevated";
    return "Very High";
  };

  // Emotion color mapping
  const emotionColorMap: Record<string, { bar: string; text: string }> = {
    happy: { bar: "bg-amber-400", text: "text-amber-400" },
    sad: { bar: "bg-indigo-400", text: "text-indigo-300" },
    anxious: { bar: "bg-pink-400", text: "text-pink-400" },
    flat_depressed: { bar: "bg-blue-400", text: "text-blue-300" },
    excited: { bar: "bg-yellow-400", text: "text-yellow-300" },
    calm: { bar: "bg-cyan-400", text: "text-cyan-300" },
    stressed: { bar: "bg-rose-400", text: "text-rose-400" },
  };

  return (
    <div
      id="acoustic-bio-radar-panel"
      className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl flex flex-col gap-4 text-white"
    >
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-400 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">
              Acoustic Bio-Radar
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Live SER Acoustic Prosody
            </p>
          </div>
        </div>

        {isRecording ? (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-pink-400 bg-pink-500/20 border border-pink-500/40 px-3 py-1 rounded-full animate-pulse uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            LIVE FEED
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            Standby
          </span>
        )}
      </div>

      {/* Mood Mirror Observation Highlight */}
      {moodMirror && (
        <div
          id="katie-mood-mirror-card"
          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-[0_0_10px_rgba(236,72,153,0.3)] font-bold">
            K
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block">
              Kat's Mood Mirror
            </span>
            <p className="text-xs sm:text-sm font-medium text-white/80 mt-1 leading-relaxed italic">
              "{moodMirror}"
            </p>
          </div>
        </div>
      )}

      {/* Tension Level Progress Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/70 font-medium">Tension Level</span>
          <span className="text-white font-mono font-bold">{currentStrain}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(Math.max(currentStrain, 5), 100)}%` }}
          />
        </div>
      </div>

      {/* 4 Core Acoustic Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Pitch Card */}
        <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider">Pitch (f₀)</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white font-mono">
              {currentPitch} <span className="text-xs font-normal text-white/40">Hz</span>
            </div>
            <div className="text-[10px] text-white/40 truncate mt-0.5" title={getPitchLabel(currentPitch)}>
              {getPitchLabel(currentPitch)}
            </div>
          </div>
        </div>

        {/* Vocal Energy Card */}
        <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider">Energy</span>
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white font-mono">
              {currentEnergy} <span className="text-xs font-normal text-white/40">dB</span>
            </div>
            <div className="text-[10px] text-white/40 truncate mt-0.5">
              {currentEnergy > -15 ? "High Dynamic" : currentEnergy < -35 ? "Whisper" : "Moderate Power"}
            </div>
          </div>
        </div>

        {/* Speech Pace Cadence */}
        <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider">Pacing</span>
            <Clock className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white font-mono">
              {currentWpm} <span className="text-xs font-normal text-white/40">WPM</span>
            </div>
            <div className="text-[10px] text-white/40 truncate mt-0.5">
              {currentWpm > 165 ? "Accelerated" : currentWpm < 110 ? "Slow / Pausing" : "Steady Flow"}
            </div>
          </div>
        </div>

        {/* Vocal Tension / Strain */}
        <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider">Tension</span>
            <Heart className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white font-mono">
              {currentStrain}%
            </div>
            <div className="text-[10px] text-white/40 truncate mt-0.5">
              {currentStrain > 60 ? "Constricted" : currentStrain < 30 ? "Relaxed" : "Mild Tension"}
            </div>
          </div>
        </div>
      </div>

      {/* Multimodal Emotion Distribution Bar */}
      {emotionScores && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
              Multimodal Emotion Spectrum
            </span>
            <span className="text-[10px] font-mono text-pink-400 bg-pink-500/20 px-2.5 py-0.5 rounded-full border border-pink-500/30 font-bold">
              Dominant: {emotion}
            </span>
          </div>

          <div className="space-y-2">
            {Object.entries(emotionScores).map(([key, val]) => {
              const formattedName = key.replace("_", " ").toUpperCase();
              const numVal = typeof val === "number" ? val : Number(val) || 0;
              const pct = Math.round(numVal * 100);
              const colorInfo = emotionColorMap[key] || {
                bar: "bg-slate-400",
                text: "text-slate-300",
              };
              return (
                <div key={key} className="flex items-center gap-3 text-xs">
                  <span className="w-24 text-white/60 font-mono text-[11px] truncate capitalize">
                    {key.replace("_", " ")}
                  </span>
                  <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorInfo.bar}`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <span className={`w-8 text-right font-mono font-bold text-[11px] ${colorInfo.text}`}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prosodic Acoustic Qualities Tag List */}
      {prosody && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="font-bold text-pink-400 block text-[10px] uppercase tracking-widest">
              Pitch Cadence:
            </span>
            <p className="text-[11px] text-white/70 mt-1">{prosody.pitchState}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="font-bold text-cyan-400 block text-[10px] uppercase tracking-widest">
              Vocal Affect:
            </span>
            <p className="text-[11px] text-white/70 mt-1">{prosody.flatnessIndex}</p>
          </div>
        </div>
      )}
    </div>
  );
};
