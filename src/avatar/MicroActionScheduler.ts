/**
 * MicroActionScheduler.ts — Local micro-action queue and scheduler.
 * 
 * Manages minor actions (blinking, double blinks, deep breath, sighs, yawns, fidgets).
 * Enforces priority and cooldown rules (e.g. no yawn during speech).
 */
import type { AvatarState } from "./AvatarStateMachine";

export interface ScheduledAction {
  name: string;
  priority: number; // 1 = highest, 10 = lowest
  duration: number; // seconds
  cooldown: number; // seconds
  allowedStates: AvatarState[];
  onTrigger: () => void;
}

export class MicroActionScheduler {
  private activeAction: string | null = null;
  private actionCooldowns: Map<string, number> = new Map();
  private actionDurationTimer = 0;
  
  // Randomized scheduler targets
  private nextYawnTimer = 660 + Math.random() * 540; // 11 to 20 minutes
  private nextFidgetTimer = 5.0 + Math.random() * 15.0; // 5 to 20 seconds
  private nextDoubleBlinkTimer = 10.0 + Math.random() * 20.0;
  private nextSighTimer = 180 + Math.random() * 300; // 3 to 8 minutes

  // Callback hooks for the avatar runtime
  private triggers = {
    onBlink: () => {},
    onYawn: (duration: number) => {},
    onSigh: (duration: number) => {},
    onGesture: (name: string) => {},
    onPostureShift: () => {},
  };

  registerCallbacks(callbacks: typeof this.triggers): void {
    this.triggers = callbacks;
  }

  /** Run every frame to update action states and process tickers */
  update(delta: number, avatarState: AvatarState): void {
    // 1. Tick down cooldowns
    for (const [name, cd] of this.actionCooldowns.entries()) {
      if (cd > 0) {
        this.actionCooldowns.set(name, cd - delta);
      } else {
        this.actionCooldowns.delete(name);
      }
    }

    // 2. Tick active action timer
    if (this.activeAction) {
      this.actionDurationTimer -= delta;
      if (this.actionDurationTimer <= 0) {
        console.log(`[MicroAction] Completed action: ${this.activeAction}`);
        this.activeAction = null;
      }
      return; // Block execution of new micro-actions while one is active
    }

    // 3. Process biological scheduling ticks
    const isSpeaking = avatarState === "speaking";
    const isInterrupted = avatarState === "interrupted";

    // --- YAWN TICKER ---
    this.nextYawnTimer -= delta;
    if (this.nextYawnTimer <= 0) {
      if (!isSpeaking && !isInterrupted && avatarState !== "processing") {
        this.triggerAction("yawn", 1, 3.5, 300, () => {
          this.triggers.onYawn(3.5);
        });
        this.nextYawnTimer = 660 + Math.random() * 540;
      } else {
        // Postpone yawn
        this.nextYawnTimer = 15.0;
      }
    }

    // --- FIDGET TICKER ---
    this.nextFidgetTimer -= delta;
    if (this.nextFidgetTimer <= 0) {
      const poses: ("point" | "hair" | "table" | "fidget")[] = isSpeaking 
        ? ["point", "hair", "fidget", "table"] 
        : ["fidget", "table", "table"];
      const targetPose = poses[Math.floor(Math.random() * poses.length)];
      
      this.triggerAction(`gesture_${targetPose}`, 5, 4.0, 5.0, () => {
        this.triggers.onGesture(targetPose);
      });
      this.nextFidgetTimer = 10.0 + Math.random() * 20.0;
    }

    // --- SIGH TICKER ---
    this.nextSighTimer -= delta;
    if (this.nextSighTimer <= 0) {
      if (!isSpeaking) {
        this.triggerAction("sigh", 4, 2.5, 120, () => {
          this.triggers.onSigh(2.5);
        });
        this.nextSighTimer = 180 + Math.random() * 300;
      } else {
        this.nextSighTimer = 30.0; // postpone
      }
    }

    // --- DOUBLE BLINK TICKER ---
    this.nextDoubleBlinkTimer -= delta;
    if (this.nextDoubleBlinkTimer <= 0) {
      this.triggerAction("double_blink", 7, 0.4, 8.0, () => {
        this.triggers.onBlink();
        setTimeout(() => this.triggers.onBlink(), 180);
      });
      this.nextDoubleBlinkTimer = 15.0 + Math.random() * 30.0;
    }
  }

  /** Trigger a micro-action with duration and cooldown enforcement */
  private triggerAction(
    name: string,
    priority: number,
    duration: number,
    cooldown: number,
    onTrigger: () => void
  ): boolean {
    if (this.actionCooldowns.has(name)) return false;
    
    // Register action
    this.activeAction = name;
    this.actionDurationTimer = duration;
    this.actionCooldowns.set(name, cooldown);

    console.log(`[MicroAction] Triggered action: ${name} (duration: ${duration}s, cd: ${cooldown}s)`);
    onTrigger();
    return true;
  }

  getCurrentAction(): string | null {
    return this.activeAction;
  }

  dispose(): void {
    this.actionCooldowns.clear();
    this.activeAction = null;
  }
}
