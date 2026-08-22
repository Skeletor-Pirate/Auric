export type EmotionCategory =
  | "Happy"
  | "Sad"
  | "Anxious"
  | "Flat/Depressed"
  | "Excited"
  | "Stressed"
  | "Calm"
  | "Frustrated"
  | "Neutral";

export type PersonalityMode = "chill_friend" | "sarcastic_bestie" | "coach_mode" | "late_night";

export interface AcousticMetrics {
  pitchAvgHz: number;
  pitchVariance: number;
  energyDb: number;
  speechRateWpm: number;
  pauseDurationSec: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  vocalStrainScore: number;
}

export interface AcousticProsody {
  pitchState: string;
  energyState: string;
  paceState: string;
  pauseState: string;
  vocalTension: string;
  flatnessIndex: string;
}

export interface EmotionScores {
  happy: number;
  sad: number;
  anxious: number;
  flat_depressed: number;
  excited: number;
  calm: number;
  stressed: number;
  [key: string]: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "auric";
  text: string;
  timestamp: string;
  detectedEmotion?: EmotionCategory;
  emotionScores?: EmotionScores;
  acousticMetrics?: AcousticMetrics;
  acousticProsody?: AcousticProsody;
  moodMirror?: string;
  audioOutputBase64?: string | null;
  suggestedActivity?: string;
  isCrisis?: boolean;
}

export interface DefusionResult {
  defusedMetaphor: string;
  reframedThought: string;
  auricVoiceScript: string;
  microAction: string;
}

export interface RoastResult {
  roast: string;
  distortionIdentified: string;
  realityCheck: string;
}

export interface VibeReport {
  dominantVibe: string;
  vibeSummary: string;
  acousticResilienceScore: number;
  auricTip: string;
  strengths: string[];
}

export interface VoiceJournalEntry {
  id: string;
  timestamp: string;
  transcript: string;
  auricResponse: string;
  detectedEmotion: EmotionCategory;
  moodScore: number; // 1-10
  acousticMetrics?: AcousticMetrics;
  moodMirror?: string;
  audioBlobUrl?: string;
}
