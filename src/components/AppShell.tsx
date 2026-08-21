import React, { useEffect } from "react";
import { CallControls } from "./CallControls";
import { TranscriptPanel } from "./TranscriptPanel";
import { DebugOverlay } from "./DebugOverlay";
import { LoadingOverlay } from "./LoadingOverlay";
import { NotFound } from "./NotFound";
import { Privacy } from "./Privacy";
import { useAvatarStore } from "../state/avatarStore";
import { registerKeyboardShortcuts } from "../debug/KeyboardShortcuts";
import { audioManager } from "../audio/AudioManager";
import { ConversationProvider } from "./ConversationProvider";
import { SoundGlobe } from "./SoundGlobe";
import { TemperatureWidget, MemoryWidget, TasksWidget, SettingsWidget } from "./DashboardWidgets";

import { SettingsOverlay } from "./SettingsOverlay";

function useRoute(): "app" | "privacy" | "notfound" {
  const [path, setPath] = React.useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  if (path === "/") return "app";
  if (path === "/privacy") return "privacy";
  return "notfound";
}

export const AppShell: React.FC = () => {
  const isConnected = useAvatarStore((s) => s.isConnected);
  const isSpeaking = useAvatarStore((s) => s.isSpeaking);
  const darkMode = useAvatarStore((s) => s.darkMode);
  const route = useRoute();

  useEffect(() => {
    const unbind = registerKeyboardShortcuts();
    return () => {
      unbind();
      audioManager.close();
    };
  }, []);

  return (
    <ConversationProvider>
      {route === "notfound" ? (
        <NotFound />
      ) : route === "privacy" ? (
        <Privacy />
      ) : (
        <div 
          className={`w-screen h-screen relative overflow-hidden select-none p-6 md:p-10 font-sans flex flex-col transition-colors duration-500 bg-cover bg-center ${darkMode ? "text-gray-100" : "text-gray-900"}`}
          style={{ backgroundImage: `url(${useAvatarStore.getState().bgUrl})` }}
        >
          {/* Ambiance Overlay */}
          <div className={`absolute inset-0 z-0 transition-colors duration-500 pointer-events-none ${darkMode ? "bg-gray-950/80" : "bg-gray-50/70"}`} />
          
          <div className="relative z-10 w-full h-full flex flex-col">
          {/* Header */}
          <div className="w-full flex justify-between items-center mb-10 shrink-0">
            <h1 className={`text-xl font-light tracking-[0.2em] ${darkMode ? "text-gray-300" : "text-gray-800"}`}>AURIC OS</h1>
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} />
              <span className={`text-[10px] uppercase font-bold tracking-widest ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {isConnected ? "System Online" : "Offline"}
              </span>
              {isConnected && isSpeaking && (
                <div className={`ml-2 px-3 py-1 border rounded-full text-[10px] uppercase font-bold tracking-widest animate-pulse ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-200 border-gray-300 text-gray-600"}`}>
                  Transmitting
                </div>
              )}
            </div>
          </div>

          {/* Bento Box Layout */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6 min-h-0">
            
            {/* Top Left: Temperature */}
            <div className="md:col-span-1 md:row-span-1">
              <TemperatureWidget />
            </div>

            {/* Middle: Core Sound Globe */}
            <div className={`md:col-span-2 md:row-span-3 ${darkMode ? "bg-white/5 border-white/5" : "bg-white/40 border-gray-100"} backdrop-blur-xl rounded-3xl shadow-sm relative overflow-hidden flex items-center justify-center transition-colors duration-500`}>
              <SoundGlobe />
            </div>

            {/* Top Right: Memory */}
            <div className="md:col-span-1 md:row-span-1">
              <MemoryWidget />
            </div>

            {/* Bottom Left: Settings */}
            <div className="md:col-span-1 md:row-span-2">
              <SettingsWidget />
            </div>

            {/* Bottom Right: Tasks */}
            <div className="md:col-span-1 md:row-span-2">
              <TasksWidget />
            </div>

          </div>

          <TranscriptPanel />
          <DebugOverlay />
          <CallControls />
          <LoadingOverlay />
          <SettingsOverlay />
          
          </div>

        </div>
      )}
    </ConversationProvider>
  );
};
export default AppShell;
