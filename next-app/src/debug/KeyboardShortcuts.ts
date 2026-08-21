/**
 * KeyboardShortcuts.ts — Keyboard controller for manual diagnostics.
 * 
 * Binds keys to trigger expressions, blinks, yawns, and resets
 * when debugMode is active.
 */
import { useAvatarStore } from "../state/avatarStore";
import { conversationManager } from "../conversation/ConversationManager";
import { avatarStateMachine } from "../avatar/AvatarStateMachine";

export function registerKeyboardShortcuts(): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    const store = useAvatarStore.getState();

    // D toggles debug panel globally
    if (e.key.toLowerCase() === "d") {
      store.toggleDebug();
      return;
    }

    // Keyboard shortcuts only active when debugMode is enabled
    if (!store.debugMode) return;

    switch (e.key.toLowerCase()) {
      case "b":
        console.log("[Shortcut] Force Blink");
        // Handled via event dispatch to AvatarModel
        window.dispatchEvent(new CustomEvent("debug-force-blink"));
        break;

      case "s":
        console.log("[Shortcut] Force Emotion: Shocked");
        store.setEmotion({ label: "shocked", intensity: 0.95 });
        break;

      case "i":
        console.log("[Shortcut] Force Emotion: Intrigued");
        store.setEmotion({ label: "intrigued", intensity: 0.8 });
        break;

      case "y":
        console.log("[Shortcut] Force Yawn");
        window.dispatchEvent(new CustomEvent("debug-force-yawn"));
        break;

      case "g":
        console.log("[Shortcut] Force Gesture");
        window.dispatchEvent(new CustomEvent("debug-force-gesture"));
        break;

      case "r":
        console.log("[Shortcut] Reset Avatar");
        store.setEmotion({ label: "neutral", intensity: 0 });
        avatarStateMachine.forceState("idle", "Manual reset shortcut");
        break;

      case " ":
        // Space bar: start/stop test voice connection
        e.preventDefault();
        if (store.isConnected) {
          conversationManager.endCall();
        } else {
          conversationManager.startCall();
        }
        break;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}
