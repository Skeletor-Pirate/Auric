/**
 * avatar.test.ts — Unit tests for the Avatar state machine, morph mappings,
 * and audio clock state transitions.
 * 
 * Run: npx vitest run avatar.test.ts
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AvatarStateMachine } from "./AvatarStateMachine";
import { setMorphTarget, getMorphTarget } from "./morphTargetMap";
import { AudioPlaybackClock } from "../audio/AudioPlaybackClock";

describe("Avatar State Machine", () => {
  let fsm: AvatarStateMachine;

  beforeEach(() => {
    fsm = new AvatarStateMachine();
  });

  it("should initialize in loading state", () => {
    expect(fsm.state).toBe("loading");
  });

  it("should allow valid transitions", () => {
    expect(fsm.transition("idle", "Loaded")).toBe(true);
    expect(fsm.state).toBe("idle");
    expect(fsm.transition("listening", "Started talking")).toBe(true);
    expect(fsm.state).toBe("listening");
  });

  it("should block invalid transitions", () => {
    expect(fsm.transition("speaking", "Illegal jump")).toBe(false);
    expect(fsm.state).toBe("loading"); // remains unchanged
  });

  it("should record transition history", () => {
    fsm.transition("idle", "test1");
    fsm.transition("listening", "test2");
    expect(fsm.history).toHaveLength(2);
    expect(fsm.history[0].to).toBe("idle");
    expect(fsm.history[1].to).toBe("listening");
  });
});

describe("Morph Target Accessors", () => {
  it("should safely write and read target influences", () => {
    const dict = { eyeBlinkLeft: 0, mouthSmileLeft: 1 };
    const influences = [0, 0];

    const success = setMorphTarget(dict, influences, "mouthSmileLeft", 0.75);
    expect(success).toBe(true);
    expect(influences[1]).toBe(0.75);

    const val = getMorphTarget(dict, influences, "mouthSmileLeft");
    expect(val).toBe(0.75);
  });

  it("should fail gracefully on missing morph targets", () => {
    const dict = { eyeBlinkLeft: 0 };
    const influences = [0];

    const success = setMorphTarget(dict, influences, "missingTarget", 0.5);
    expect(success).toBe(false);
    
    const val = getMorphTarget(dict, influences, "missingTarget");
    expect(val).toBe(0);
  });
});

describe("Audio Playback Clock", () => {
  let clock: AudioPlaybackClock;

  beforeEach(() => {
    clock = new AudioPlaybackClock();
  });

  it("should initialize in silent state", () => {
    expect(clock.isAudioPlaying()).toBe(false);
    expect(clock.getCurrentTurnId()).toBeNull();
  });

  it("should track playback state and turn ID", () => {
    clock.start("turn-123", 10.0, 3.5);
    expect(clock.isAudioPlaying()).toBe(true);
    expect(clock.getCurrentTurnId()).toBe("turn-123");
  });

  it("should calculate correct offsets", () => {
    clock.start("turn-123", 10.0, 3.5);
    expect(clock.getCurrentPlaybackTime(12.5)).toBeCloseTo(2.5);
  });

  it("should reset on stop", () => {
    clock.start("turn-123", 10.0, 3.5);
    clock.stop();
    expect(clock.isAudioPlaying()).toBe(false);
    expect(clock.getCurrentTurnId()).toBeNull();
  });
});
