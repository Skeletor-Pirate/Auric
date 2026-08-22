/**
 * Privacy.tsx — Simple privacy page.
 *
 * Explains cookie usage and campaign tracking in plain language.
 */
import React from "react";
import { ArrowLeft, Cookie, BarChart3 } from "lucide-react";

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[var(--background)] text-[var(--foreground)] px-6 py-16">
      <div className="w-full max-w-2xl">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Auric
        </a>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Privacy
        </h1>
        <p className="text-sm text-[var(--muted)] mb-10">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="flex flex-col gap-6">
          <section className="p-5 rounded-2xl bg-[var(--panel)] backdrop-blur-xl border border-[var(--border)]">
            <div className="flex items-center gap-2.5 mb-2">
              <Cookie className="w-4 h-4 text-orange-400" />
              <h2 className="text-base font-bold">Cookies</h2>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Auric uses cookies to remember your preferences — like whether you use dark or light mode,
              and your room theme choice. These are stored locally in your browser and never leave your device.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-[var(--panel)] backdrop-blur-xl border border-[var(--border)]">
            <div className="flex items-center gap-2.5 mb-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold">Campaign Tracking</h2>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              When you arrive via a marketing link, we may capture UTM parameters (source, medium, campaign)
              so we can understand which campaigns work. This data is only sent when you accept cookies,
              and it never includes your voice recordings or conversation content.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-[var(--panel)] backdrop-blur-xl border border-[var(--border)]">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-4 h-4 rounded-full bg-pink-500/80" />
              <h2 className="text-base font-bold">Voice Data</h2>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Audio is streamed live to process your conversation and is not stored. You can end your call
              at any time with the red button, and all local audio buffers are cleared immediately.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
export default Privacy;