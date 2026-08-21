import { create } from 'zustand';

interface GazeState {
  /** Normalized coordinates: -1 (left/top) to 1 (right/bottom) */
  x: number;
  y: number;
  setGaze: (x: number, y: number) => void;
}

export const useGazeStore = create<GazeState>((set) => ({
  x: 0,
  y: 0,
  setGaze: (x, y) => set({ x, y }),
}));
