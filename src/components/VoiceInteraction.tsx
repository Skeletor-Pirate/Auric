import React, { useState, useRef, useEffect } from "react";
import {
  ChatMessage,
  EmotionCategory,
  PersonalityMode,
  AcousticMetrics,
} from "../types";
import { LiveAudioAnalyzer } from "../utils/audioAnalyzer";
import { soundEngine } from "../utils/soundEngine";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

interface VoiceInteractionProps {
  personality: PersonalityMode;
  onPersonalityChange: (mode: PersonalityMode) => void;
  onSessionComplete: (message: ChatMessage) => void;
  onLiveMetrics: (metrics: AcousticMetrics | null) => void;
  onLiveRecordingChange: (isRecording: boolean) => void;
  onSpeakingChange: (isSpeaking: boolean) => void;
  onSelectConsole: (consoleType: "breathing" | "defusion" | "roast" | "somatic") => void;
}

export const VoiceInteraction: React.FC<VoiceInteractionProps> = ({
  personality,
  onPersonalityChange,
  onSessionComplete,
  onLiveMetrics,
  onLiveRecordingChange,
  onSpeakingChange,
  onSelectConsole,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-katie-welcome",
      role: "katie",
      text: "Hey! I'm KATIE. I don't just listen to your words—I listen to HOW you say them. Your tone, rhythm, and pitch tell me how you're truly feeling. Tap the mic and just speak freely!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      detectedEmotion: "Calm",
      moodMirror: "Warm, open, and ready to listen.",
    },
  ]);

  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<AcousticMetrics | null>(null);

  // References
  const analyzerRef = useRef<LiveAudioAnalyzer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformDataRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Waveform visualization loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isRecording && waveformDataRef.current) {
        const data = waveformDataRef.current;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#8b5cf6"; // Violet neon
        ctx.beginPath();

        const sliceWidth = canvas.width / data.length;
        let x = 0;

        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      } else {
        // Idle gentle breathing line
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(139, 92, 246, 0.25)";
        ctx.beginPath();
        const t = performance.now() / 600;
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + Math.sin(x * 0.05 + t) * 4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  // Start voice recording with live acoustic analyzer
  const handleStartRecording = async () => {
    soundEngine.stopSpeech();
    setActivePlayingId(null);
    onSpeakingChange(false);

    analyzerRef.current = new LiveAudioAnalyzer();
    const success = await analyzerRef.current.startMicrophone((metrics, rawWaveform) => {
      waveformDataRef.current = rawWaveform;
      setCurrentMetrics(metrics);
      onLiveMetrics(metrics);
    });

    if (success) {
      setIsRecording(true);
      onLiveRecordingChange(true);
    } else {
      alert("Microphone permission was denied or not supported in this browser. You can still test with preset vibes or typed messages!");
    }
  };

  // Stop recording and send audio to backend
  const handleStopRecording = async () => {
    if (!analyzerRef.current || !isRecording) return;
    setIsRecording(false);
    onLiveRecordingChange(false);
    setIsLoading(true);

    try {
      const { audioBase64, mimeType } = await analyzerRef.current.stopMicrophone();

      // Submit to backend
      await sendVoicePayload({
        audioBase64,
        audioMimeType: mimeType,
        clientMetrics: currentMetrics || undefined,
      });
    } catch (err) {
      console.error("Recording stop error:", err);
      setIsLoading(false);
    }
  };

  // Preset demo vibe triggers
  const handlePresetVibe = async (presetPrompt: string, assumedEmotion: EmotionCategory) => {
    soundEngine.stopSpeech();
    setIsLoading(true);

    // Mock client metrics for preset
    const presetMetrics: AcousticMetrics = {
      pitchAvgHz: assumedEmotion === "Excited" || assumedEmotion === "Happy" ? 245 : assumedEmotion === "Sad" ? 140 : 190,
      pitchVariance: assumedEmotion === "Excited" ? 45 : 12,
      energyDb: assumedEmotion === "Excited" ? -14 : assumedEmotion === "Sad" ? -38 : -24,
      speechRateWpm: assumedEmotion === "Anxious" ? 175 : assumedEmotion === "Sad" ? 95 : 135,
      pauseDurationSec: assumedEmotion === "Sad" ? 1.8 : 0.3,
      zeroCrossingRate: 0.08,
      spectralCentroid: 1600,
      vocalStrainScore: assumedEmotion === "Anxious" ? 65 : 20,
    };

    setCurrentMetrics(presetMetrics);
    onLiveMetrics(presetMetrics);

    await sendVoicePayload({
      textPrompt: presetPrompt,
      clientMetrics: presetMetrics,
    });
  };

  // Send request to /api/chat-voice
  const sendVoicePayload = async (payload: {
    audioBase64?: string;
    audioMimeType?: string;
    textPrompt?: string;
    clientMetrics?: AcousticMetrics;
  }) => {
    try {
      const res = await fetch("/api/chat-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          personalityMode: personality,
          history: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.text,
            emotion: m.detectedEmotion,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to process conversation");
      }

      const data = await res.json();

      // Add user message if typed or transcribed
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: data.transcript || payload.textPrompt || "Spoken voice message",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        detectedEmotion: data.detectedEmotion,
        emotionScores: data.emotionScores,
        acousticMetrics: payload.clientMetrics,
        acousticProsody: data.acousticAnalysis,
      };

      // Add Katie response message
      const katieMessage: ChatMessage = {
        id: `katie-${Date.now()}`,
        role: "katie",
        text: data.katieResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        detectedEmotion: data.detectedEmotion,
        emotionScores: data.emotionScores,
        moodMirror: data.moodMirror,
        audioOutputBase64: data.audioOutputBase64,
        suggestedActivity: data.suggestedActivity,
        isCrisis: data.isCrisis,
        acousticProsody: data.acousticAnalysis,
      };

      setMessages((prev) => [...prev, userMessage, katieMessage]);
      onSessionComplete(katieMessage);

      // Trigger celebratory confetti if Happy/Excited
      if (data.detectedEmotion === "Happy" || data.detectedEmotion === "Excited") {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

      // Play Katie's voice
      playResponseAudio(katieMessage);
    } catch (err: any) {
      console.error("Conversation error:", err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "katie",
        text: "I heard you, but my neural voice connection had a brief hiccup. Let's take a deep breath together!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        detectedEmotion: "Calm",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio for a message
  const playResponseAudio = async (msg: ChatMessage) => {
    setActivePlayingId(msg.id);
    onSpeakingChange(true);

    const fullSpokenText = msg.moodMirror ? `${msg.moodMirror} ${msg.text}` : msg.text;

    if (msg.audioOutputBase64) {
      const played = await soundEngine.playGeminiTTS(msg.audioOutputBase64, 24000, () => {
        setActivePlayingId(null);
        onSpeakingChange(false);
      });
      if (!played) {
        soundEngine.playWebSpeechFallback(fullSpokenText, msg.detectedEmotion, () => {
          setActivePlayingId(null);
          onSpeakingChange(false);
        });
      }
    } else {
      soundEngine.playWebSpeechFallback(fullSpokenText, msg.detectedEmotion, () => {
        setActivePlayingId(null);
        onSpeakingChange(false);
      });
    }
  };

  const handleStopAudio = () => {
    soundEngine.stopSpeech();
    setActivePlayingId(null);
    onSpeakingChange(false);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;
    const prompt = textInput.trim();
    setTextInput("");
    setIsLoading(true);
    sendVoicePayload({ textPrompt: prompt });
  };

  return (
    <div id="voice-interaction-engine" className="flex flex-col h-full gap-4">
      {/* Personality Mode Selector Banner */}
      <div className="bg-white/5 p-1.5 rounded-full flex items-center justify-between gap-1 overflow-x-auto border border-white/10">
        {[
          { id: "chill_friend", label: "Chill Friend", emoji: "☕", hint: "Warm & validating" },
          { id: "sarcastic_bestie", label: "Sarcastic Bestie", emoji: "💅", hint: "Witty & playful" },
          { id: "coach_mode", label: "Coach Kat", emoji: "⚡", hint: "Hyped & motivating" },
          { id: "late_night", label: "Late Night", emoji: "🌙", hint: "Cozy & soft-spoken" },
        ].map((item) => (
          <button
            key={item.id}
            id={`personality-mode-${item.id}`}
            onClick={() => onPersonalityChange(item.id as PersonalityMode)}
            className={`flex-1 min-w-[100px] sm:min-w-[120px] py-1.5 px-3 rounded-full text-xs font-semibold tracking-wide transition-all flex flex-col items-center justify-center gap-0.5 ${
              personality === item.id
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.35)]"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </span>
            <span className="text-[9px] font-normal text-white/40 hidden sm:inline">
              {item.hint}
            </span>
          </button>
        ))}
      </div>

      {/* Conversation Chat Stream */}
      <div
        id="voice-chat-transcript-stream"
        className="flex-1 min-h-[220px] max-h-[360px] overflow-y-auto pr-1 space-y-3.5"
      >
        {messages.map((msg) => {
          const isKatie = msg.role === "katie";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isKatie ? "items-start" : "items-end"} gap-1`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed transition-all ${
                  isKatie
                    ? "bg-white/5 text-white/90 shadow-2xl border border-white/10 rounded-tl-xs backdrop-blur-xl"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] rounded-tr-xs"
                }`}
              >
                {/* Header with emotion tag & playback button */}
                <div className="flex items-center justify-between gap-2 mb-2 border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs tracking-wider uppercase">
                      {isKatie ? "KATIE" : "You"}
                    </span>
                    {msg.detectedEmotion && (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isKatie
                            ? "bg-pink-500/20 text-pink-400 border-pink-500/30"
                            : "bg-white/20 text-white border-white/30"
                        }`}
                      >
                        {msg.detectedEmotion}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/40 font-mono">{msg.timestamp}</span>
                    {isKatie && (
                      <button
                        onClick={() =>
                          activePlayingId === msg.id
                            ? handleStopAudio()
                            : playResponseAudio(msg)
                        }
                        className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        title={activePlayingId === msg.id ? "Stop voice" : "Replay voice"}
                      >
                        {activePlayingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Mood Mirror Quote (if Katie) */}
                {msg.moodMirror && (
                  <div className="text-xs font-medium italic text-pink-300 bg-pink-500/10 rounded-2xl p-2.5 mb-2.5 border border-pink-500/20">
                    "{msg.moodMirror}"
                  </div>
                )}

                {/* Message Body */}
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Suggested Micro-Activity Quick Action Button */}
                {msg.suggestedActivity &&
                  msg.suggestedActivity !== "General Conversation" &&
                  msg.suggestedActivity !== "None" && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                        Suggested Reset:
                      </span>
                      <button
                        onClick={() => {
                          if (msg.suggestedActivity?.includes("Breathing"))
                            onSelectConsole("breathing");
                          else if (msg.suggestedActivity?.includes("Defusion"))
                            onSelectConsole("defusion");
                          else if (msg.suggestedActivity?.includes("Roast"))
                            onSelectConsole("roast");
                          else onSelectConsole("somatic");
                        }}
                        className="text-xs font-bold text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 px-3 py-1.5 rounded-full border border-pink-500/30 flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(236,72,153,0.2)]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Try {msg.suggestedActivity}
                      </button>
                    </div>
                  )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2.5 p-3.5 bg-white/5 rounded-2xl border border-white/10 w-fit text-xs text-white/70 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
            <span className="font-mono">Kat is fusing vocal prosody and analyzing emotion...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Vibe Quick-Testing Buttons */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40 font-bold px-1">
          <span>⚡ Instant Voice Samples</span>
          <span>Click to test</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() =>
              handlePresetVibe(
                "I have 3 exams tomorrow, my apartment is a mess, and I'm totally freaking out.",
                "Anxious"
              )}
            className="p-2.5 rounded-2xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-left transition-all group"
          >
            <div className="text-xs font-bold text-yellow-400 flex items-center gap-1">
              <span>🌪️ Overwhelmed</span>
            </div>
            <div className="text-[10px] text-yellow-300/70 truncate mt-0.5 font-mono">
              High strain / fast pace
            </div>
          </button>

          <button
            onClick={() =>
              handlePresetVibe(
                "I just signed my dream job offer and I'm literally jumping up and down right now!!",
                "Excited"
              )}
            className="p-2.5 rounded-2xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-left transition-all group"
          >
            <div className="text-xs font-bold text-pink-400 flex items-center gap-1">
              <span>🔥 Ecstatic Win</span>
            </div>
            <div className="text-[10px] text-pink-300/70 truncate mt-0.5 font-mono">
              High pitch / power
            </div>
          </button>

          <button
            onClick={() =>
              handlePresetVibe(
                "Honestly I feel so tired and empty. Like I'm just going through the motions today.",
                "Sad"
              )}
            className="p-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-left transition-all group"
          >
            <div className="text-xs font-bold text-indigo-300 flex items-center gap-1">
              <span>🌧️ Flat & Heavy</span>
            </div>
            <div className="text-[10px] text-indigo-300/70 truncate mt-0.5 font-mono">
              Monotone / pauses
            </div>
          </button>

          <button
            onClick={() =>
              handlePresetVibe(
                "I keep thinking everyone is doing way better in life than me and I'm a complete imposter.",
                "Anxious"
              )}
            className="p-2.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-left transition-all group"
          >
            <div className="text-xs font-bold text-purple-300 flex items-center gap-1">
              <span>💭 Imposter Spiral</span>
            </div>
            <div className="text-[10px] text-purple-300/70 truncate mt-0.5 font-mono">
              Cognitive distortion
            </div>
          </button>
        </div>
      </div>

      {/* Main Interactive Mic Control & Live Waveform Bar */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center gap-4">
        {/* Waveform Canvas */}
        <div className="flex-1 w-full flex flex-col justify-center h-14 bg-[#0a0a0c] rounded-2xl px-3 border border-white/10 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={50}
            className="w-full h-full block"
          />
          <div className="absolute right-3 top-2 text-[9px] font-mono tracking-widest uppercase text-white/30">
            {isRecording ? "MIC REC • 16-BIT 44.1kHz" : "STANDBY"}
          </div>
        </div>

        {/* Tactile Big Glowing Mic Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            id="katie-voice-record-toggle-btn"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isLoading}
            className={`relative flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm transition-all shadow-md active:scale-95 ${
              isRecording
                ? "bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse"
                : "bg-pink-500 hover:bg-pink-600 text-white shadow-[0_0_25px_rgba(236,72,153,0.45)] uppercase tracking-wider"
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5 animate-bounce" />
                <span>End Recording</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Talk to Katie</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alternative Keyboard Input Bar */}
      <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
        <input
          id="katie-text-input-field"
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Or type what's on your mind..."
          className="flex-1 px-4 py-3 rounded-full border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/40 text-white placeholder-white/30 shadow-inner"
        />
        <button
          type="submit"
          disabled={!textInput.trim() || isLoading}
          className="p-3 rounded-full bg-white/10 hover:bg-pink-500 text-white disabled:opacity-30 transition-all border border-white/10 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
