import React from "react";
import { ShieldAlert, Heart, Phone, MessageSquare, ExternalLink, X } from "lucide-react";

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0e0e14] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.25)] border border-rose-500/30 flex flex-col gap-5 text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
            <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-wide">
              You Are Not Alone & You Matter
            </h3>
            <p className="text-xs text-rose-300 font-mono">
              Immediate, confidential, 24/7 human support
            </p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-rose-200/90 leading-relaxed bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
          Kat is an AI companion for emotional reflection and day-to-day mindfulness, but right now, talking to a real human who cares can make all the difference. Please reach out to these free, confidential resources:
        </div>

        {/* Resources list */}
        <div className="space-y-3">
          {/* 988 Lifeline */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  988 Suicide & Crisis Lifeline (US/Canada)
                </h4>
                <p className="text-xs text-white/40">Free, confidential 24/7 call or text</p>
              </div>
            </div>
            <a
              href="tel:988"
              className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0 uppercase tracking-wider"
            >
              Call 988
            </a>
          </div>

          {/* Crisis Text Line */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Crisis Text Line
                </h4>
                <p className="text-xs text-white/40">Text "HOME" to 741741 (US & UK)</p>
              </div>
            </div>
            <a
              href="sms:741741?body=HOME"
              className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0 uppercase tracking-wider"
            >
              Text Now
            </a>
          </div>

          {/* International */}
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs flex items-center justify-between">
            <span className="text-white/50 font-medium">International crisis directory:</span>
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noreferrer"
              className="text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1"
            >
              findahelpline.com
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer close */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
          >
            I Understand & I Am Safe
          </button>
        </div>
      </div>
    </div>
  );
};
