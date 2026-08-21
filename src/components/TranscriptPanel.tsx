/**
 * TranscriptPanel.tsx — Live subtitles & logs overlay.
 * 
 * Displays transcripts from both user and Auric.
 */
import React, { useEffect, useRef } from "react";
import { useAvatarStore } from "../state/avatarStore";
import { Loader2, MessageSquareText } from "lucide-react";

export const TranscriptPanel: React.FC = () => {
  const userTranscript = useAvatarStore((s) => s.userTranscript);
  const katieTranscript = useAvatarStore((s) => s.katieTranscript);
  const isProcessing = useAvatarStore((s) => s.isProcessing);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new transcripts
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [userTranscript, katieTranscript]);

  if (!userTranscript && !katieTranscript) return null;

  return (
    <div className="absolute top-6 right-6 w-80 p-4 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl flex flex-col gap-3 shadow-2xl z-20 pointer-events-auto">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-100 pb-2">
        <MessageSquareText className="w-3.5 h-3.5" />
        Live Transcript
      </h3>
      
      <div 
        ref={panelRef}
        className="flex flex-col gap-4 max-h-[300px] overflow-y-auto scroll-smooth pr-2 pb-1"
      >
        {/* User block */}
        {userTranscript && (
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[9px] uppercase tracking-wider font-bold text-blue-500">You</span>
            <p className="text-xs text-gray-700 leading-relaxed font-medium bg-blue-50 p-2 rounded-xl border border-blue-100 text-right">
              {userTranscript}
            </p>
          </div>
        )}

        {/* Auric block */}
        {katieTranscript && (
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-500">Auric</span>
            <p className="text-xs text-gray-700 leading-relaxed font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-100">
              {katieTranscript}
            </p>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs font-medium text-blue-500 bg-blue-50/50 p-2 rounded-xl border border-blue-100 mt-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Processing Request...
          </div>
        )}
      </div>
    </div>
  );
};
