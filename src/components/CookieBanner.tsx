/**
 * CookieBanner.tsx — Simple cookie consent banner.
 *
 * Shown once until the user accepts or declines. Persists choice to localStorage.
 */
import React from "react";
import { Cookie } from "lucide-react";
import { useUIStore } from "../state/uiStore";
import { motion, AnimatePresence } from "motion/react";

export const CookieBanner: React.FC = () => {
  const cookieConsent = useUIStore((s) => s.cookieConsent);
  const acceptCookies = useUIStore((s) => s.acceptCookies);
  const declineCookies = useUIStore((s) => s.declineCookies);

  return (
    <AnimatePresence>
      {!cookieConsent && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25, mass: 0.5 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px]"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 px-5 py-4 bg-[var(--panel-strong)] backdrop-blur-2xl border border-[var(--border)] rounded-2xl shadow-2xl shadow-black/20">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[var(--foreground)] tracking-tight">We value your privacy</p>
                <p className="text-[12px] text-[var(--muted)] mt-0.5 leading-relaxed font-medium">
                  We use cookies to improve your experience and analyze traffic.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={declineCookies}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-[12px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)] bg-[var(--border)]/30 hover:bg-[var(--border)]/60 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={acceptCookies}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-[12px] font-semibold text-white bg-indigo-500 hover:bg-indigo-400 transition-colors shadow-sm shadow-indigo-500/20"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default CookieBanner;