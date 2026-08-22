/**
 * NotFound.tsx — Custom 404 page.
 *
 * Rendered for any unknown route (client-side path detection in AppShell)
 * and served by the server for unmatched paths.
 */
import React from "react";
import { Home, Mic } from "lucide-react";
import { motion } from "motion/react";

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        {/* Ghost-like avatar silhouette */}
        <div className="relative mb-8">
          <motion.span
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-24 h-24 rounded-3xl bg-indigo-500 opacity-30 blur-2xl"
          />
          <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
            <span className="text-white font-black text-4xl">4</span>
            <motion.span
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-6 h-6 rounded-full bg-white/90 mx-1 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            />
            <span className="text-white font-black text-4xl">4</span>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--foreground)]">
          Lost in the void
        </h1>
        <p className="mt-4 max-w-sm text-[14px] text-[var(--muted)] leading-relaxed font-medium">
          Looks like you wandered into a room that doesn't exist — even Auric doesn't know this one.
          Let's get you back.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-[13px] font-semibold transition-colors shadow-lg"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[13px] font-semibold text-[var(--foreground)] hover:bg-[var(--border)]/50 transition-colors"
          >
            <Mic className="w-4 h-4 text-indigo-400" />
            Start a Call
          </motion.a>
        </div>

        <p className="mt-12 text-[11px] font-medium tracking-widest text-[var(--muted)] uppercase">
          Error 404 · Auric Voice AI
        </p>
      </motion.div>
    </div>
  );
};
export default NotFound;