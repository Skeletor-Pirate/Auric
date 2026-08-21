/**
 * AvatarStateMachine.ts — Authoritative state machine for the avatar.
 * 
 * All UI, animation, and audio decisions derive from this single state.
 * Do not use scattered booleans. Query this machine.
 */

export type AvatarState =
  | "loading"
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "interrupted"
  | "error"
  | "disconnected";

export interface StateTransition {
  from: AvatarState;
  to: AvatarState;
  timestamp: number;
  reason: string;
  turnId: string | null;
}

const VALID_TRANSITIONS: Record<AvatarState, AvatarState[]> = {
  loading: ["idle", "error", "disconnected"],
  idle: ["listening", "error", "disconnected"],
  listening: ["processing", "idle", "error", "disconnected"],
  processing: ["speaking", "listening", "error", "disconnected"],
  speaking: ["listening", "interrupted", "idle", "error", "disconnected"],
  interrupted: ["listening", "idle", "error", "disconnected"],
  error: ["idle", "disconnected"],
  disconnected: ["loading", "idle"],
};

export class AvatarStateMachine {
  private _state: AvatarState = "loading";
  private _history: StateTransition[] = [];
  private _listeners: Set<(state: AvatarState, transition: StateTransition) => void> = new Set();

  get state(): AvatarState {
    return this._state;
  }

  get history(): readonly StateTransition[] {
    return this._history;
  }

  get lastTransition(): StateTransition | null {
    return this._history.length > 0 ? this._history[this._history.length - 1] : null;
  }

  /** Returns true if transition succeeded */
  transition(to: AvatarState, reason: string, turnId: string | null = null): boolean {
    const from = this._state;
    const allowed = VALID_TRANSITIONS[from];

    if (!allowed.includes(to)) {
      console.warn(`[StateMachine] Invalid transition: ${from} → ${to} (reason: ${reason})`);
      return false;
    }

    const entry: StateTransition = {
      from,
      to,
      timestamp: Date.now(),
      reason,
      turnId,
    };

    this._state = to;
    this._history.push(entry);

    // Keep history bounded
    if (this._history.length > 200) {
      this._history = this._history.slice(-100);
    }

    console.log(`[StateMachine] ${from} → ${to} | ${reason}${turnId ? ` | turn:${turnId}` : ""}`);

    for (const listener of this._listeners) {
      try {
        listener(to, entry);
      } catch (e) {
        console.error("[StateMachine] Listener error:", e);
      }
    }

    return true;
  }

  /** Force state (for error recovery) */
  forceState(to: AvatarState, reason: string): void {
    const from = this._state;
    const entry: StateTransition = { from, to, timestamp: Date.now(), reason: `FORCED: ${reason}`, turnId: null };
    this._state = to;
    this._history.push(entry);
    console.warn(`[StateMachine] FORCED: ${from} → ${to} | ${reason}`);
    for (const listener of this._listeners) {
      try { listener(to, entry); } catch (e) { /* ignore */ }
    }
  }

  subscribe(listener: (state: AvatarState, transition: StateTransition) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Derived convenience getters */
  get isActive(): boolean {
    return ["listening", "processing", "speaking"].includes(this._state);
  }

  get isSpeaking(): boolean {
    return this._state === "speaking";
  }

  get isListening(): boolean {
    return this._state === "listening";
  }

  get isIdle(): boolean {
    return this._state === "idle";
  }

  get isError(): boolean {
    return this._state === "error";
  }
}

/** Singleton instance */
export const avatarStateMachine = new AvatarStateMachine();
