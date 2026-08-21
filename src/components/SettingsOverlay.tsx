import React from "react";
import { X, Moon, Sun, Monitor } from "lucide-react";
import { useAvatarStore } from "../state/avatarStore";

export const SettingsOverlay: React.FC = () => {
  const showSettings = useAvatarStore((s) => s.showSettings);
  const toggleSettings = useAvatarStore((s) => s.toggleSettings);
  const darkMode = useAvatarStore((s) => s.darkMode);
  const toggleDarkMode = useAvatarStore((s) => s.toggleDarkMode);
  const bgUrl = useAvatarStore((s) => s.bgUrl);
  const setBgUrl = useAvatarStore((s) => s.setBgUrl);

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} transition-colors duration-300`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Settings</h2>
          <button 
            onClick={toggleSettings}
            className={`p-2 rounded-full ${darkMode ? "hover:bg-white/10" : "hover:bg-black/5"} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Appearance
            </h3>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <span className="font-medium">Dark Mode</span>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? "bg-indigo-500" : "bg-gray-300"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${darkMode ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </div>

          {/* Environment */}
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Virtual Environment
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { url: "/room/cozy-room-b.jpg", label: "Cozy Room" },
                { url: "/room/cyberpunk-room.jpg", label: "Cyberpunk" },
                { url: "/room/minimal-office.jpg", label: "Minimalist" },
                { url: "/room/abstract-mesh.jpg", label: "Abstract" },
              ].map((bg) => (
                <button
                  key={bg.url}
                  onClick={() => setBgUrl(bg.url)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    bgUrl === bg.url 
                      ? (darkMode ? "border-indigo-500 bg-indigo-500/10 text-indigo-300" : "border-emerald-500 bg-emerald-500/10 text-emerald-700") 
                      : (darkMode ? "border-white/10 hover:border-white/30" : "border-black/10 hover:border-black/30")
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>

          {/* System */}
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              System Info
            </h3>
            <div className={`p-4 rounded-xl text-xs font-mono ${darkMode ? "bg-black/50 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-4 h-4" />
                <span>Auric OS v2.4.0</span>
              </div>
              <div className="opacity-70">
                Connected via Google Gemini Live API. 
                Routing enabled for Groq / OpenRouter.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
