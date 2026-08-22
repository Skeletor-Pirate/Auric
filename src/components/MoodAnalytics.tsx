import React, { useState } from "react";
import { VoiceJournalEntry, VibeReport, EmotionCategory } from "../types";
import {
  TrendingUp,
  Sparkles,
  Calendar,
  Flame,
  Award,
  CheckCircle2,
  Volume2,
  BarChart3,
  RefreshCw,
  Clock,
} from "lucide-react";
import confetti from "canvas-confetti";

interface MoodAnalyticsProps {
  journalEntries: VoiceJournalEntry[];
  streakDays: number;
}

export const MoodAnalytics: React.FC<MoodAnalyticsProps> = ({
  journalEntries,
  streakDays,
}) => {
  const [reportLoading, setReportLoading] = useState(false);
  const [vibeReport, setVibeReport] = useState<VibeReport | null>({
    dominantVibe: "Grounded Dynamo",
    vibeSummary:
      "Your voice shows high emotional self-awareness. Even during high-stress check-ins, your pitch modulation stabilized quickly during deep breathing sessions.",
    acousticResilienceScore: 89,
    auricTip: "Honor those natural micro-pauses before responding to overwhelming tasks.",
    strengths: ["Fast vocal recovery", "Emotional self-honesty", "Consistent check-in streak"],
  });

  const handleGenerateVibeReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch("/api/vibe-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions: journalEntries }),
      });
      const data = await res.json();
      setVibeReport(data);
      confetti({ particleCount: 40, spread: 60 });
    } catch (err) {
      console.error("Vibe report error:", err);
    } finally {
      setReportLoading(false);
    }
  };

  // Emotion count breakdown
  const emotionCounts = journalEntries.reduce((acc, entry) => {
    acc[entry.detectedEmotion] = (acc[entry.detectedEmotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const emotionColor = (emo: EmotionCategory) => {
    switch (emo) {
      case "Happy":
      case "Excited":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "Sad":
      case "Flat/Depressed":
        return "bg-indigo-100 text-indigo-900 border-indigo-300";
      case "Anxious":
      case "Stressed":
        return "bg-pink-100 text-pink-900 border-pink-300";
      case "Calm":
      default:
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
    }
  };

  return (
    <div id="mood-analytics-vibe-reports" className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl flex flex-col gap-5 text-white">
      {/* Header & Streak Counter */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/90 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pink-400" />
            Mood Streaks & Acoustic Vibe Insights
          </h3>
          <p className="text-[10px] uppercase font-mono tracking-widest text-white/40 mt-0.5">
            Longitudinal vocal emotion patterns & resilience tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{streakDays} Day Vibe Streak</span>
          </div>

          <button
            onClick={handleGenerateVibeReport}
            disabled={reportLoading}
            className="px-4 py-1.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-[0_0_15px_rgba(236,72,153,0.35)] flex items-center gap-1.5 disabled:opacity-40 transition-all uppercase tracking-wider"
          >
            {reportLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Generate Vibe Report</span>
          </button>
        </div>
      </div>

      {/* AI Vibe Report Highlight */}
      {vibeReport && (
        <div className="bg-white/5 border border-pink-500/30 rounded-3xl p-5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                ✨
              </div>
              <div>
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block">
                  Current Vocal Archetype
                </span>
                <h4 className="text-base font-extrabold text-white">
                  {vibeReport.dominantVibe}
                </h4>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">
                Acoustic Resilience
              </span>
              <span className="text-lg font-black text-pink-400 font-mono">
                {vibeReport.acousticResilienceScore}/100
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm font-medium text-white/80 leading-relaxed bg-white/5 p-3.5 rounded-2xl border border-white/10 italic">
            "{vibeReport.vibeSummary}"
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <span className="font-bold text-pink-300 mb-1 text-[11px] uppercase tracking-wider">Kat's Weekly Coaching Tip:</span>
              <p className="text-white/70 font-medium text-[11px]">{vibeReport.auricTip}</p>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="font-bold text-cyan-300 mb-1 block text-[11px] uppercase tracking-wider">Key Vocal Strengths:</span>
              <div className="space-y-1">
                {vibeReport.strengths.map((str, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-white/80 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Journal History Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Recent Voice Journal Entries ({journalEntries.length})
          </h4>
          <span className="text-[10px] font-mono text-white/40">Stored privately in current session</span>
        </div>

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {journalEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${emotionColor(entry.detectedEmotion)}`}>
                    {entry.detectedEmotion}
                  </span>
                  <span className="text-[11px] font-mono text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.timestamp}
                  </span>
                </div>

                {entry.acousticMetrics && (
                  <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                    {entry.acousticMetrics.pitchAvgHz}Hz • {entry.acousticMetrics.speechRateWpm} WPM
                  </span>
                )}
              </div>

              <p className="text-xs font-semibold text-white/90">
                "{entry.transcript}"
              </p>

              {entry.moodMirror && (
                <div className="text-[11px] font-medium text-pink-300 italic bg-pink-500/10 p-2.5 rounded-xl border border-pink-500/20">
                  Kat: "{entry.moodMirror}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
