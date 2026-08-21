/**
 * avatarStore.ts — Zustand store for avatar state.
 * 
 * Holds reactive UI state derived from the state machine.
 * Per-frame animation values (morph weights, bone rotations) stay in refs/controllers,
 * NOT in this store, to avoid 60fps React re-renders.
 */
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { AvatarState } from "../avatar/AvatarStateMachine";
import { avatarStateMachine } from "../avatar/AvatarStateMachine";

export interface Emotion {
  label: "neutral" | "amused" | "intrigued" | "shocked" | "bored" | "warm" | "skeptical" | "tired";
  intensity: number;
  valence: number;
  arousal: number;
  interest: number;
}

export const DEFAULT_EMOTION: Emotion = {
  label: "neutral",
  intensity: 0,
  valence: 0,
  arousal: 0,
  interest: 0.5,
};

export interface AvatarStore {
  // State machine
  avatarState: AvatarState;
  setAvatarState: (state: AvatarState) => void;

  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;

  // Audio
  isSpeaking: boolean;
  setSpeaking: (speaking: boolean) => void;
  audioLevel: number;
  setAudioLevel: (level: number) => void;

  // Emotion
  emotion: Emotion;
  setEmotion: (emotion: Partial<Emotion>) => void;

  // Background
  bgUrl: string;
  setBgUrl: (url: string) => void;

  // Transcript
  userTranscript: string;
  katieTranscript: string;
  isUserSpeaking: boolean;
  isProcessing: boolean;
  setUserTranscript: (text: string) => void;
  setKatieTranscript: (text: string) => void;
  setUserSpeaking: (speaking: boolean) => void;
  setProcessing: (processing: boolean) => void;

  // Turn tracking & Session
  currentTurnId: string | null;
  setCurrentTurnId: (id: string | null) => void;
  sessionId: string;
  setSessionId: (id: string) => void;

  // Debug
  debugMode: boolean;
  toggleDebug: () => void;
  lastError: string | null;
  setLastError: (error: string | null) => void;

  // Model loading
  modelLoaded: boolean;
  setModelLoaded: (loaded: boolean) => void;
  morphTargetCount: number;
  setMorphTargetCount: (count: number) => void;

  // Settings
  showSettings: boolean;
  toggleSettings: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAvatarStore = create<AvatarStore>((set) => ({
  avatarState: "loading",
  setAvatarState: (avatarState) => set({ avatarState }),

  isConnected: false,
  isConnecting: false,
  setConnected: (isConnected) => set({ isConnected }),
  setConnecting: (isConnecting) => set({ isConnecting }),

  isSpeaking: false,
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  audioLevel: 0,
  setAudioLevel: (audioLevel) => set({ audioLevel }),

  emotion: { ...DEFAULT_EMOTION },
  setEmotion: (partial) => set((s) => ({ emotion: { ...s.emotion, ...partial } })),

  bgUrl: localStorage.getItem("bgUrl") || "/room/cozy-room-b.jpg",
  setBgUrl: (bgUrl) => {
    localStorage.setItem("bgUrl", bgUrl);
    set({ bgUrl });
  },

  userTranscript: "",
  katieTranscript: "",
  isUserSpeaking: false,
  isProcessing: false,
  setUserTranscript: (userTranscript) => set({ userTranscript }),
  setKatieTranscript: (katieTranscript) => set({ katieTranscript }),
  setUserSpeaking: (isUserSpeaking) => set({ isUserSpeaking }),
  setProcessing: (isProcessing) => set({ isProcessing }),

  currentTurnId: null,
  setCurrentTurnId: (currentTurnId) => set({ currentTurnId }),

  sessionId: (() => {
    let sid = localStorage.getItem("sessionId");
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem("sessionId", sid);
    }
    return sid;
  })(),
  setSessionId: (sessionId) => {
    localStorage.setItem("sessionId", sessionId);
    set({ sessionId });
  },

  debugMode: false,
  toggleDebug: () => set((s) => ({ debugMode: !s.debugMode })),
  lastError: null,
  setLastError: (lastError) => set({ lastError }),

  modelLoaded: false,
  setModelLoaded: (modelLoaded) => set({ modelLoaded }),
  morphTargetCount: 0,
  setMorphTargetCount: (morphTargetCount) => set({ morphTargetCount }),

  showSettings: false,
  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  darkMode: localStorage.getItem("darkMode") === "true",
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    localStorage.setItem("darkMode", String(next));
    return { darkMode: next };
  }),
}));

// Keep the store's avatarState in sync with the authoritative state machine,
// so UI components (TranscriptPanel, DebugOverlay) reflect live transitions.
avatarStateMachine.subscribe((state) => {
  useAvatarStore.getState().setAvatarState(state);
});
