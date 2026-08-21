/**
 * SettingsPanel.tsx — Settings panel.
 * 
 * Allows users to choose presets and swap background theme templates.
 */
import React from "react";
import { RotateCcw } from "lucide-react";
import { useAvatarStore } from "../state/avatarStore";

export const SettingsPanel: React.FC = () => {
  const showSettings = useAvatarStore((s) => s.showSettings);
  const emotion = useAvatarStore((s) => s.emotion);
  const setEmotion = useAvatarStore((s) => s.setEmotion);
  const bgUrl = useAvatarStore((s) => s.bgUrl);

  const setBgUrl = (url: string) => {
    useAvatarStore.setState({ bgUrl: url });
    localStorage.setItem("bgUrl", url);
  };

  if (!showSettings) return null;

  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[360px] p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col gap-3.5 text-left shadow-2xl z-30 pointer-events-auto animate-in fade-in slide-in-from-bottom-4">
      <div>
        <label className="text-[10px] text-white/50 uppercase tracking-widest font-black block mb-2">Vibe / Expression</label>
        <div className="grid grid-cols-3 gap-2">
          {["neutral", "amused", "intrigued", "shocked", "bored", "warm", "skeptical", "tired"].map((emo) => (
            <button
              key={emo}
              onClick={() => setEmotion({ label: emo as any, intensity: 0.8 })}
              className={`py-1.5 rounded-xl text-[10px] font-bold transition-all capitalize ${
                emotion.label === emo 
                  ? "bg-white text-black shadow-md" 
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {emo}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] text-white/50 uppercase tracking-widest font-black block mb-2">Change Room Theme</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Room Theme A", path: "/room/4ed3764ec12cb31f2562c968d5ba5c73.png" },
            { label: "Room Theme B", path: "/room/4fc7c05c5d6c30fa1cbe0a70ed3d7bc8.jpg" }
          ].map((room) => (
            <button
              key={room.path}
              onClick={() => setBgUrl(room.path)}
              className={`py-1.5 rounded-xl text-xs font-bold truncate transition-all px-2 ${
                bgUrl === room.path 
                  ? "bg-white text-black" 
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {room.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/10">
        <span className="text-[9px] text-white/40 font-mono">Gemini Live Active</span>
        <button 
          onClick={() => {
            const defaultBg = "/room/4ed3764ec12cb31f2562c968d5ba5c73.png";
            setBgUrl(defaultBg);
          }}
          className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
        >
          <RotateCcw className="w-2.5 h-2.5" /> Reset Background
        </button>
      </div>
    </div>
  );
};
