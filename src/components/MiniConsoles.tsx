import React, { useState, useEffect, useRef } from "react";
import { soundEngine } from "../utils/soundEngine";
import { DefusionResult, RoastResult } from "../types";
import {
  Wind,
  Flame,
  Cloud,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

interface MiniConsolesProps {
  activeTab: "breathing" | "defusion" | "roast" | "somatic";
  onTabChange: (tab: "breathing" | "defusion" | "roast" | "somatic") => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export const MiniConsoles: React.FC<MiniConsolesProps> = ({
  activeTab,
  onTabChange,
  onSpeakingChange,
}) => {
  // Breathing Coach State
  const [breathingMode, setBreathingMode] = useState<"box" | "478">("box");
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale" | "hold2">("inhale");
  const [breathCountdown, setBreathCountdown] = useState(4);
  const [breathCyclesCompleted, setBreathCyclesCompleted] = useState(0);

  // Thought Defusion State
  const [defusionInput, setDefusionInput] = useState("");
  const [defusionLoading, setDefusionLoading] = useState(false);
  const [defusionResult, setDefusionResult] = useState<DefusionResult | null>(null);
  const [isThoughtDrifting, setIsThoughtDrifting] = useState(false);

  // Roast My Thought State
  const [roastInput, setRoastInput] = useState("");
  const [roastLoading, setRoastLoading] = useState(false);
  const [roastResult, setRoastResult] = useState<RoastResult | null>(null);

  // Somatic Grounding State
  const [groundingStep, setGroundingStep] = useState(0);
  const [groundingInputs, setGroundingInputs] = useState<string[]>(["", "", "", "", ""]);

  // Soundscape ambient toggle state
  const [ambientActive, setAmbientActive] = useState(false);

  // 1. Breathing Engine Loop
  useEffect(() => {
    let timer: any;
    if (breathingActive) {
      timer = setInterval(() => {
        setBreathCountdown((prev) => {
          if (prev <= 1) {
            // Transition phase
            if (breathingMode === "box") {
              // 4 in, 4 hold, 4 out, 4 hold
              if (breathPhase === "inhale") {
                setBreathPhase("hold");
                soundEngine.playBreathingBell("hold");
                return 4;
              } else if (breathPhase === "hold") {
                setBreathPhase("exhale");
                soundEngine.playBreathingBell("exhale");
                return 4;
              } else if (breathPhase === "exhale") {
                setBreathPhase("hold2");
                soundEngine.playBreathingBell("hold");
                return 4;
              } else {
                setBreathPhase("inhale");
                soundEngine.playBreathingBell("inhale");
                setBreathCyclesCompleted((c) => c + 1);
                return 4;
              }
            } else {
              // 4-7-8 breathing
              if (breathPhase === "inhale") {
                setBreathPhase("hold");
                soundEngine.playBreathingBell("hold");
                return 7;
              } else if (breathPhase === "hold") {
                setBreathPhase("exhale");
                soundEngine.playBreathingBell("exhale");
                return 8;
              } else {
                setBreathPhase("inhale");
                soundEngine.playBreathingBell("inhale");
                setBreathCyclesCompleted((c) => c + 1);
                return 4;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [breathingActive, breathPhase, breathingMode]);

  const handleToggleBreathing = () => {
    if (breathingActive) {
      setBreathingActive(false);
      setBreathPhase("inhale");
      setBreathCountdown(4);
    } else {
      setBreathingActive(true);
      setBreathPhase("inhale");
      setBreathCountdown(4);
      soundEngine.playBreathingBell("inhale");
    }
  };

  const handleToggleAmbient = () => {
    const active = soundEngine.toggleAmbientSoundscape("432hz");
    setAmbientActive(active);
  };

  // 2. Submit Thought Defusion
  const handleSubmitDefusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defusionInput.trim() || defusionLoading) return;
    setDefusionLoading(true);
    setDefusionResult(null);
    setIsThoughtDrifting(false);

    try {
      const res = await fetch("/api/thought-defusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thought: defusionInput }),
      });
      const data = await res.json();
      setDefusionResult(data);

      // Play voice script
      if (data.katieVoiceScript) {
        soundEngine.playWebSpeechFallback(data.katieVoiceScript, "Calm");
      }
    } catch (err) {
      console.error("Defusion error:", err);
    } finally {
      setDefusionLoading(false);
    }
  };

  const handleReleaseThought = () => {
    setIsThoughtDrifting(true);
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  // 3. Submit Roast Thought
  const handleSubmitRoast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roastInput.trim() || roastLoading) return;
    setRoastLoading(true);
    setRoastResult(null);

    try {
      const res = await fetch("/api/roast-thought", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thought: roastInput }),
      });
      const data = await res.json();
      setRoastResult(data);

      if (data.roast) {
        soundEngine.playWebSpeechFallback(data.roast, "Excited");
      }
    } catch (err) {
      console.error("Roast error:", err);
    } finally {
      setRoastLoading(false);
    }
  };

  // Somatic questions
  const somaticPrompts = [
    { count: 5, label: "5 things you can SEE around you", hint: "Look at textures, lighting, shadows, colors" },
    { count: 4, label: "4 things you can physically TOUCH", hint: "Your desk, cloth on your skin, the cool floor" },
    { count: 3, label: "3 things you can HEAR right now", hint: "Air hum, distant cars, your own breathing" },
    { count: 2, label: "2 things you can SMELL", hint: "Coffee, laundry, fresh air" },
    { count: 1, label: "1 thing you can TASTE", hint: "Mint, water, or just the stillness" },
  ];

  return (
    <div id="mini-consoles-container" className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl flex flex-col gap-5 text-white">
      {/* Console Tab Navigation Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3.5 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-full border border-white/10 overflow-x-auto">
          <button
            onClick={() => onTabChange("breathing")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "breathing"
                ? "bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] border border-cyan-500/40"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Breathing Coach</span>
          </button>

          <button
            onClick={() => onTabChange("defusion")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "defusion"
                ? "bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)] border border-purple-500/40"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Thought Defusion</span>
          </button>

          <button
            onClick={() => onTabChange("roast")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "roast"
                ? "bg-pink-500/20 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)] border border-pink-500/40"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Roast My Thought</span>
          </button>

          <button
            onClick={() => onTabChange("somatic")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "somatic"
                ? "bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] border border-amber-500/40"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>5-4-3-2-1 Reset</span>
          </button>
        </div>

        {/* 432Hz Ambient Soundscape Trigger */}
        <button
          onClick={handleToggleAmbient}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 transition-all ${
            ambientActive
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse"
              : "bg-white/5 hover:bg-white/10 text-white/60 border-white/10"
          }`}
        >
          {ambientActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{ambientActive ? "432Hz Ambient Active" : "Play 432Hz Synth"}</span>
        </button>
      </div>

      {/* 1. BREATHING COACH TAB */}
      {activeTab === "breathing" && (
        <div id="console-breathing-coach" className="flex flex-col items-center gap-6 py-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
            <button
              onClick={() => {
                setBreathingMode("box");
                setBreathCountdown(4);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                breathingMode === "box" ? "bg-white/15 text-white shadow-xs border border-white/20" : "text-white/40"
              }`}
            >
              Box Breathing (4-4-4-4)
            </button>
            <button
              onClick={() => {
                setBreathingMode("478");
                setBreathCountdown(4);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                breathingMode === "478" ? "bg-white/15 text-white shadow-xs border border-white/20" : "text-white/40"
              }`}
            >
              4-7-8 Deep Relaxation
            </button>
          </div>

          {/* Interactive Breathing Visualizer Orb */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* Outer expanding halo */}
            <div
              className="absolute rounded-full transition-all ease-in-out duration-1000"
              style={{
                width: breathPhase === "inhale" ? "220px" : breathPhase === "exhale" ? "120px" : "180px",
                height: breathPhase === "inhale" ? "220px" : breathPhase === "exhale" ? "120px" : "180px",
                background:
                  breathPhase === "inhale"
                    ? "radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(6,182,212,0.05) 70%)"
                    : breathPhase === "exhale"
                    ? "radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(236,72,153,0.05) 70%)"
                    : "radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0.05) 70%)",
                filter: "blur(20px)",
              }}
            />

            {/* Inner pulsating core */}
            <div
              className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex flex-col items-center justify-center text-white shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-1000 ease-in-out border border-white/40"
              style={{
                transform:
                  breathPhase === "inhale"
                    ? "scale(1.25)"
                    : breathPhase === "exhale"
                    ? "scale(0.85)"
                    : "scale(1.05)",
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-widest opacity-90">
                {breathPhase === "inhale"
                  ? "Inhale"
                  : breathPhase === "exhale"
                  ? "Exhale"
                  : "Hold Breath"}
              </span>
              <span className="text-3xl font-extrabold font-mono mt-0.5">
                {breathCountdown}s
              </span>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-white/50">
              Completed Cycles: <span className="text-white font-bold font-mono">{breathCyclesCompleted}</span>
            </p>
            <p className="text-xs text-white/40 max-w-sm">
              {breathPhase === "inhale"
                ? "Breathe in deeply through your nose, letting your belly expand."
                : breathPhase === "exhale"
                ? "Slowly release all tension through your mouth with a gentle whoosh."
                : "Hold still and rest in the calm pause."}
            </p>
          </div>

          <button
            onClick={handleToggleBreathing}
            className={`px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg transition-all ${
              breathingActive
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] font-extrabold"
            }`}
          >
            {breathingActive ? "Pause Breathing Session" : "Start 2-Minute Breathing"}
          </button>
        </div>
      )}

      {/* 2. THOUGHT DEFUSION TAB */}
      {activeTab === "defusion" && (
        <div id="console-thought-defusion" className="flex flex-col gap-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-purple-200">
            <Cloud className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-purple-300">CBT Thought Defusion</span>
              Thoughts are mental weather passing through. Type whatever heavy thought you're clinging to, and watch Kat help you detach and release it.
            </div>
          </div>

          <form onSubmit={handleSubmitDefusion} className="space-y-3">
            <textarea
              value={defusionInput}
              onChange={(e) => setDefusionInput(e.target.value)}
              placeholder="e.g. 'I feel like I'm falling behind everyone and everything is going to fall apart'..."
              rows={3}
              className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:border-purple-500/60 focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">
                Kat will generate a sensory defusion reframe
              </span>
              <button
                type="submit"
                disabled={!defusionInput.trim() || defusionLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.35)] disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {defusionLoading ? "Defusing thought..." : "Defuse This Thought"}
              </button>
            </div>
          </form>

          {/* Defusion Result Card & Floating Release */}
          {defusionResult && (
            <div className="mt-2 bg-white/5 border border-purple-500/30 rounded-3xl p-5 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">
                  ✨ Defusion Perspective
                </span>
                <span className="text-[10px] bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 text-purple-300 font-mono">
                  Cognitive Reframe
                </span>
              </div>

              {/* Floating Metaphor Canvas */}
              <div
                className={`p-4 bg-white/5 rounded-2xl border border-white/10 shadow-xs transition-all duration-1000 ${
                  isThoughtDrifting ? "opacity-20 scale-75 -translate-y-12 blur-xs" : ""
                }`}
              >
                <div className="text-xs font-semibold text-purple-400 mb-1">
                  Metaphor: {defusionResult.defusedMetaphor}
                </div>
                <p className="text-sm font-medium text-white/90 italic">
                  "{defusionResult.reframedThought}"
                </p>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs text-white/80 space-y-1">
                <span className="font-bold text-purple-300 block">10-Second Somatic Anchor:</span>
                <p>{defusionResult.microAction}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() =>
                    soundEngine.playWebSpeechFallback(defusionResult.katieVoiceScript, "Calm")
                  }
                  className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1.5 bg-purple-500/10 px-3.5 py-1.5 rounded-full border border-purple-500/30"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Replay Audio Guide
                </button>

                <button
                  onClick={handleReleaseThought}
                  disabled={isThoughtDrifting}
                  className="text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
                >
                  {isThoughtDrifting ? "Thought Released into Sky ☁️" : "Release Thought 🎈"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. ROAST MY THOUGHT TAB */}
      {activeTab === "roast" && (
        <div id="console-roast-thought" className="flex flex-col gap-4">
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-pink-200">
            <Flame className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-pink-300">Roast My Negative Thought</span>
              Give Kat your most catastrophic worry and get a loving, reality-check Gen Z roast.
            </div>
          </div>

          <form onSubmit={handleSubmitRoast} className="space-y-3">
            <textarea
              value={roastInput}
              onChange={(e) => setRoastInput(e.target.value)}
              placeholder="e.g. 'I sent one email with a typo and now my entire career is over'..."
              rows={3}
              className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:border-pink-500/60 focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">
                100% gentle CBT humor — never punching down
              </span>
              <button
                type="submit"
                disabled={!roastInput.trim() || roastLoading}
                className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-xs font-bold shadow-[0_0_15px_rgba(236,72,153,0.35)] disabled:opacity-40 transition-all flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Flame className="w-3.5 h-3.5" />
                {roastLoading ? "Cooking roast..." : "Roast This Thought 🔥"}
              </button>
            </div>
          </form>

          {roastResult && (
            <div className="bg-white/5 border border-pink-500/30 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">
                  🔥 Kat's Reality Roast
                </span>
                <span className="text-[10px] font-bold bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full border border-pink-500/30 font-mono">
                  Distortion: {roastResult.distortionIdentified}
                </span>
              </div>

              <p className="text-sm font-bold text-pink-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
                "{roastResult.roast}"
              </p>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs text-white/80">
                <span className="font-bold text-pink-300 block mb-0.5">The Grounded Reality:</span>
                <p className="text-white/70">{roastResult.realityCheck}</p>
              </div>

              <button
                onClick={() => soundEngine.playWebSpeechFallback(roastResult.roast, "Excited")}
                className="text-xs font-bold text-pink-300 hover:text-white flex items-center gap-1.5 bg-pink-500/10 px-3.5 py-1.5 rounded-full border border-pink-500/30"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Replay Roast Voice
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. 5-4-3-2-1 SOMATIC RESET TAB */}
      {activeTab === "somatic" && (
        <div id="console-somatic-grounding" className="flex flex-col gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
            <Layers className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-300">5-4-3-2-1 Somatic Sensory Grounding</span>
              When your brain is spiraling, your body brings you back to the present moment. Complete the 5 steps:
            </div>
          </div>

          <div className="space-y-3">
            {somaticPrompts.map((step, idx) => (
              <div
                key={step.count}
                className={`p-4 rounded-2xl border transition-all ${
                  groundingStep === idx
                    ? "bg-white/10 border-amber-400 ring-1 ring-amber-400/40 shadow-lg"
                    : groundingInputs[idx]
                    ? "bg-emerald-500/10 border-emerald-500/30 text-white/80"
                    : "bg-white/5 border-white/10 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold font-mono">
                      {step.count}
                    </span>
                    {step.label}
                  </span>
                  {groundingInputs[idx] && (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                </div>

                <p className="text-[11px] text-white/40 mb-2">{step.hint}</p>

                <input
                  type="text"
                  value={groundingInputs[idx]}
                  onChange={(e) => {
                    const next = [...groundingInputs];
                    next[idx] = e.target.value;
                    setGroundingInputs(next);
                  }}
                  onFocus={() => setGroundingStep(idx)}
                  placeholder="Notice and type here..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setGroundingInputs(["", "", "", "", ""]);
                setGroundingStep(0);
              }}
              className="text-xs font-semibold text-white/40 hover:text-white"
            >
              Reset Exercise
            </button>
            <button
              onClick={() => {
                confetti({ particleCount: 50, spread: 60 });
                soundEngine.playBreathingBell("complete");
              }}
              disabled={groundingInputs.filter(Boolean).length < 3}
              className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-black disabled:opacity-30 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            >
              I am Grounded & Present ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
