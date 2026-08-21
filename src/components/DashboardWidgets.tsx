import React from "react";
import { useAvatarStore } from "../state/avatarStore";

export const TemperatureWidget: React.FC = () => {
  const darkMode = useAvatarStore((s) => s.darkMode);
  const bgClass = darkMode ? "bg-black/40 border-white/10" : "bg-white/40 border-white/50";
  const textPrimary = darkMode ? "text-gray-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-gray-400" : "text-gray-500";
  const trackClass = darkMode ? "bg-gray-800" : "bg-gray-200";
  const fillClass = darkMode ? "bg-indigo-400" : "bg-indigo-500";

  return (
    <div className={`flex flex-col h-full justify-between p-6 backdrop-blur-xl border rounded-3xl shadow-sm transition-colors duration-500 ${bgClass}`}>
      <div>
        <h3 className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${textSecondary}`}>Status</h3>
        <p className={`text-2xl font-light tracking-tight ${textPrimary}`}>Optimal</p>
      </div>
      <div>
        <h3 className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${textSecondary}`}>Temperature</h3>
        <p className={`text-3xl font-light tracking-tight ${textPrimary}`}>21.4°C</p>
      </div>
      <div className={`w-full h-1 rounded-full overflow-hidden mt-4 ${trackClass}`}>
        <div className={`w-1/3 h-full rounded-full ${fillClass}`}></div>
      </div>
    </div>
  );
};

export const MemoryWidget: React.FC = () => {
  const darkMode = useAvatarStore((s) => s.darkMode);
  const bgClass = darkMode ? "bg-black/40 border-white/10" : "bg-white/40 border-white/50";
  const textPrimary = darkMode ? "text-gray-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-gray-400" : "text-gray-500";
  const trackClass = darkMode ? "bg-gray-800" : "bg-gray-200";
  const fillClass1 = darkMode ? "bg-emerald-400" : "bg-emerald-500";
  const fillClass2 = darkMode ? "bg-sky-400" : "bg-sky-500";

  return (
    <div className={`flex flex-col h-full justify-between p-6 backdrop-blur-xl border rounded-3xl shadow-sm transition-colors duration-500 ${bgClass}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${textSecondary}`}>Cognitive Load</h3>
          <p className={`text-3xl font-light tracking-tight ${textPrimary}`}>14%</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
      </div>
      <div className="space-y-3 mt-4">
        <div>
          <div className={`flex justify-between text-[10px] uppercase tracking-widest font-bold mb-1 ${textSecondary}`}>
            <span>Context</span>
            <span>2.1 GB</span>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${trackClass}`}>
            <div className={`w-1/4 h-full rounded-full ${fillClass1}`}></div>
          </div>
        </div>
        <div>
          <div className={`flex justify-between text-[10px] uppercase tracking-widest font-bold mb-1 ${textSecondary}`}>
            <span>Working</span>
            <span>8.4 GB</span>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${trackClass}`}>
            <div className={`w-1/2 h-full rounded-full ${fillClass2}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TasksWidget: React.FC = () => {
  const darkMode = useAvatarStore((s) => s.darkMode);
  const bgClass = darkMode ? "bg-black/40 border-white/10" : "bg-white/40 border-white/50";
  const textPrimary = darkMode ? "text-gray-300" : "text-gray-700";
  const textSecondary = darkMode ? "text-gray-500" : "text-gray-400";
  const dotActive = darkMode ? "bg-emerald-400" : "bg-emerald-500";
  const dotInactive = darkMode ? "bg-gray-700" : "bg-gray-300";

  return (
    <div className={`flex flex-col h-full p-6 backdrop-blur-xl border rounded-3xl shadow-sm transition-colors duration-500 ${bgClass}`}>
      <h3 className={`text-[10px] uppercase tracking-widest font-bold mb-4 ${textSecondary}`}>Active Tasks</h3>
      <ul className="space-y-4 flex-1 overflow-y-auto">
        <li className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${dotActive} animate-pulse`}></div>
          <span className={`text-sm font-medium ${textPrimary}`}>Monitor local APIs</span>
        </li>
        <li className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${dotInactive}`}></div>
          <span className={`text-sm font-medium ${textSecondary}`}>Sync calendar</span>
        </li>
        <li className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${dotInactive}`}></div>
          <span className={`text-sm font-medium ${textSecondary}`}>Process user memory</span>
        </li>
      </ul>
    </div>
  );
};

export const SettingsWidget: React.FC = () => {
  const darkMode = useAvatarStore((s) => s.darkMode);
  const toggleSettings = useAvatarStore((s) => s.toggleSettings);
  const bgClass = darkMode ? "bg-black/40 border-white/10" : "bg-white/40 border-white/50";
  const textPrimary = darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900";
  const textSecondary = darkMode ? "text-gray-500" : "text-gray-400";

  return (
    <div className={`flex flex-col h-full justify-between p-6 backdrop-blur-xl border rounded-3xl shadow-sm transition-colors duration-500 ${bgClass}`}>
      <div>
        <h3 className={`text-[10px] uppercase tracking-widest font-bold mb-4 ${textSecondary}`}>System Controls</h3>
        <div className="space-y-2">
          <button onClick={toggleSettings} className={`w-full text-left text-sm font-medium transition-colors py-1 ${textPrimary}`}>Settings</button>
          <button className={`w-full text-left text-sm font-medium transition-colors py-1 ${textPrimary}`}>Privacy Policy</button>
          <button className={`w-full text-left text-sm font-medium transition-colors py-1 text-rose-500 hover:text-rose-400`}>Disconnect</button>
        </div>
      </div>
      <div className={`text-[9px] uppercase tracking-widest ${textSecondary}`}>
        v2.4.0-AURIC
      </div>
    </div>
  );
};
