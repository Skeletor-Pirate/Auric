/**
 * ConversationProvider.tsx — Conversation Context Wrapper.
 * 
 * Provides connection triggers, microphone state, and key callbacks.
 */
import React, { createContext, useContext, ReactNode } from "react";
import { conversationManager } from "../conversation/ConversationManager";
import { useAvatarStore } from "../state/avatarStore";

interface ConversationContextType {
  isConnected: boolean;
  isConnecting: boolean;
  startCall: () => Promise<void>;
  endCall: () => void;
  sendTextMessage: (text: string) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isConnected = useAvatarStore((s) => s.isConnected);
  const isConnecting = useAvatarStore((s) => s.isConnecting);

  const startCall = async () => {
    await conversationManager.startCall();
  };

  const endCall = () => {
    conversationManager.endCall();
  };

  const sendTextMessage = (text: string) => {
    conversationManager.sendTextMessage(text);
  };

  return (
    <ConversationContext.Provider
      value={{
        isConnected,
        isConnecting,
        startCall,
        endCall,
        sendTextMessage,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error("useConversation must be used within a ConversationProvider");
  return ctx;
};
