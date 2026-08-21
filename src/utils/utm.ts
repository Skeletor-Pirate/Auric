/**
 * utm.ts — UTM parameter capture + reporting.
 *
 * Reads UTM params from the URL on first load, persists them to localStorage,
 * and reports them to the backend's /api/track endpoint (fire-and-forget).
 */
import { useUIStore } from "../state/uiStore";

export interface UTMData {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  url: string;
  landedAt: number;
}

const UTM_KEY = "katie.utm";

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export function parseUTM(search: string = window.location.search): UTMData | null {
  const params = new URLSearchParams(search);
  const utm: Partial<UTMData> = { url: window.location.href, landedAt: Date.now() };

  let found = false;
  for (const key of UTM_PARAMS) {
    const value = params.get(key)?.trim();
    if (value) {
      utm[key.replace("utm_", "")] = value;
      found = true;
    }
  }
  return found ? (utm as UTMData) : null;
}

export function getUTM(): UTMData | null {
  const raw = localStorage.getItem(UTM_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UTMData;
  } catch {
    return null;
  }
}

export function storeUTM(): UTMData | null {
  const utm = parseUTM();
  if (!utm) return null;
  localStorage.setItem(UTM_KEY, JSON.stringify(utm));
  return utm;
}

/**
 * Report UTM data to the backend. Only fires when cookies were accepted,
 * respects the do-not-track-ish pattern of the cookie banner.
 */
export function reportUTM(): void {
  const consent = useUIStore.getState().cookieConsent;
  if (consent !== "accepted") return;

  const utm = getUTM();
  if (!utm) return;

  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(utm),
      keepalive: true,
    }).catch(() => {
      /* fire-and-forget */
    });
  } catch {
    /* ignore */
  }
}