/**
 * ErrorBoundary.tsx — Catches React and WebGL crashes.
 * 
 * Prevents black screens if Three.js or canvas initialization fails.
 * Displays a recovery button to reset states.
 */
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { useAvatarStore } from "../state/avatarStore";
import { avatarStateMachine } from "../avatar/AvatarStateMachine";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught avatar rendering crash:", error, errorInfo);
    
    // Log details to store
    useAvatarStore.getState().setLastError(error.message || "WebGL Render Crash");
    avatarStateMachine.forceState("error", `Render Crash: ${error.message}`);
  }

  private handleReset = () => {
    useAvatarStore.getState().setLastError(null);
    avatarStateMachine.forceState("idle", "Recovery from ErrorBoundary");
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#08080c] text-white p-6 z-50 select-text">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-3xl flex flex-col items-center max-w-md shadow-2xl">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3 animate-pulse" />
            <h2 className="text-sm font-black tracking-widest text-red-400 uppercase mb-2">
              WebGL Context / Render Error
            </h2>
            <p className="text-xs text-white/70 leading-relaxed text-center mb-5 font-mono bg-black/30 p-3 rounded-xl border border-white/5 w-full break-all">
              {this.state.error?.message || "Unknown rendering exception occurred."}
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all text-xs font-bold rounded-full shadow-lg shadow-rose-600/30 text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-initialize Scene
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
