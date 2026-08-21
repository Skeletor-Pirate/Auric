/**
 * Menu.tsx — Hamburger menu overlay.
 *
 * Opens a floating dropdown with the dark/light theme toggle, navigation links,
 * settings/debug shortcuts, and a cookie-preference reset.
 */
import React, { useEffect, useRef } from "react";
import {
  Menu as MenuIcon,
  X,
  Sun,
  Moon,
  Settings,
  Terminal,
  ShieldAlert,
  Cookie,
  Home,
} from "lucide-react";
import { useUIStore } from "../state/uiStore";
import { useAvatarStore } from "../state/avatarStore";
import { motion, AnimatePresence } from "motion/react";

export const Menu: React.FC = () => {
  const menuOpen = useUIStore((s) => s.menuOpen);
  const toggleMenu = useUIStore((s) => s.toggleMenu);
  const setMenuOpen = useUIStore((s) => s.setMenuOpen);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  const toggleSettings = useAvatarStore((s) => s.toggleSettings);
  const toggleDebug = useAvatarStore((s) => s.toggleDebug);
  const debugMode = useAvatarStore((s) => s.debugMode);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen, setMenuOpen]);

  const resetCookies = () => {
    localStorage.removeItem("katie.cookieConsent");
    window.location.reload();
  };

  return (
    <div ref={menuRef} className="absolute top-6 right-6 z-40">
      {/* Hamburger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleMenu}
        className="p-3 rounded-2xl bg-[var(--panel-strong)] backdrop-blur-2xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors flex items-center justify-center shadow-lg shadow-black/10"
        title="Menu"
        aria-label="Open menu"
      >
        <AnimatePresence mode="wait">
          {menuOpen ? (
            <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.15 }}>
              <MenuIcon className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 mt-3 w-64 p-1.5 bg-[var(--panel-strong)] backdrop-blur-3xl border border-[var(--border)] rounded-2xl shadow-2xl shadow-black/20 flex flex-col gap-1 origin-top-right overflow-hidden"
          >
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors group"
            >
              <span className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg bg-[var(--border)]/30 group-hover:bg-[var(--border)] transition-colors">
                  {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                </span>
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
              <span className={`relative flex items-center w-10 h-5.5 rounded-full transition-colors duration-300 ${theme === "dark" ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-amber-400/20 border border-amber-400/30"}`}>
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`absolute w-4 h-4 rounded-full shadow-sm ${theme === "dark" ? "bg-indigo-400 left-1" : "bg-amber-500 left-[22px]"}`}
                />
              </span>
            </button>

            <div className="h-px w-full bg-[var(--border)]/50 my-1" />

            {/* Navigation */}
            <a
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors group"
            >
              <span className="p-1.5 rounded-lg bg-[var(--border)]/30 group-hover:bg-[var(--border)] transition-colors">
                <Home className="w-3.5 h-3.5 text-emerald-500" />
              </span>
              Home
            </a>

            <button
              onClick={() => {
                toggleSettings();
                setMenuOpen(false);
              }}
              className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors group"
            >
              <span className="p-1.5 rounded-lg bg-[var(--border)]/30 group-hover:bg-[var(--border)] transition-colors">
                <Settings className="w-3.5 h-3.5 text-sky-500" />
              </span>
              Settings
            </button>

            <button
              onClick={() => {
                toggleDebug();
                setMenuOpen(false);
              }}
              className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors group"
            >
              <span className="p-1.5 rounded-lg bg-[var(--border)]/30 group-hover:bg-[var(--border)] transition-colors">
                <Terminal className={`w-3.5 h-3.5 ${debugMode ? "text-rose-500" : "text-zinc-400"}`} />
              </span>
              Debug Overlay {debugMode ? "· On" : "· Off"}
            </button>

            <button
              onClick={resetCookies}
              className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors group"
            >
              <span className="p-1.5 rounded-lg bg-[var(--border)]/30 group-hover:bg-[var(--border)] transition-colors">
                <Cookie className="w-3.5 h-3.5 text-orange-500" />
              </span>
              Reset Cookie Choice
            </button>

            <a
              href="/privacy"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors group"
            >
              <span className="p-1.5 rounded-lg bg-[var(--border)]/30 group-hover:bg-[var(--border)] transition-colors">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              </span>
              Privacy
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Menu;