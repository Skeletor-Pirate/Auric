/**
 * avatarStore.ts — Zustand store for avatar state.
 * 
 * Holds reactive UI state derived from the state machine.
 * Per-frame animation values (morph weights, bone rotations) stay in refs/controllers,
 * NOT in this store, to avoid 60fps React re-renders.
 */
import { create } from "zustand";
import type { AvatarState } from "../avatar/AvatarStateMachine";

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
  auricTranscript: string;
  isUserSpeaking: boolean;
  setUserTranscript: (text: string) => void;
  setAuricTranscript: (text: string) => void;
  setUserSpeaking: (speaking: boolean) => void;

  // Turn tracking
  currentTurnId: string | null;
  setCurrentTurnId: (id: string | null) => void;

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

  bgUrl: localStorage.getItem("bgUrl") || "/room/4ed3764ec12cb31f2562c968d5ba5c73.png",
  setBgUrl: (bgUrl) => {
    localStorage.setItem("bgUrl", bgUrl);
    set({ bgUrl });
  },

  userTranscript: "",
  auricTranscript: "",
  isUserSpeaking: false,
  setUserTranscript: (userTranscript) => set({ userTranscript }),
  setAuricTranscript: (auricTranscript) => set({ auricTranscript }),
  setUserSpeaking: (isUserSpeaking) => set({ isUserSpeaking }),

  currentTurnId: null,
  setCurrentTurnId: (currentTurnId) => set({ currentTurnId }),

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
}));
