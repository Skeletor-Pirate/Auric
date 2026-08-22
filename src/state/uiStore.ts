/**
 * uiStore.ts — Small Zustand store for chrome-level UI state.
 *
 * Holds theme (dark/light), hamburger menu visibility, and cookie consent.
 * All values are persisted to localStorage.
 */
import { create } from "zustand";

export type Theme = "dark" | "light";
export type CookieConsent = "accepted" | "declined" | null;

const THEME_KEY = "auric.theme";
const COOKIE_KEY = "auric.cookieConsent";

function readTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === "light" ? "light" : "dark";
}

export interface UIStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;

  cookieConsent: CookieConsent;
  acceptCookies: () => void;
  declineCookies: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: readTheme(),
  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => set((s) => {
    const next = s.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    return { theme: next };
  }),

  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),

  cookieConsent: (localStorage.getItem(COOKIE_KEY) as CookieConsent) || null,
  acceptCookies: () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    set({ cookieConsent: "accepted" });
  },
  declineCookies: () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    set({ cookieConsent: "declined" });
  },
}));

/** Apply the theme class to <html>. */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

// Apply persisted theme on module load (before first paint).
applyTheme(useUIStore.getState().theme);