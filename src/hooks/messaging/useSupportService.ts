import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";
import { WebSocketMessage } from "@/types/messaging";
import { useCallback } from "react";

export const useSupportService = () => {
  const { message: messageActions } = useMessagingActions();
  const state = useMessagingStore(state => state.message);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    messageActions.appendMessage({
      id: message.id,
      text: message.text,
      type: 'support',
      timestamp: message.metadata.timestamp,
      status: 'received'
    });
  }, [messageActions]);

  return {
    type: "telegram" as const,
    channel: "default",
    messages: state.messages,
    isTyping: state.isTyping,
    isLoading: false,
    inputValue: state.inputValue,
    setInputValue: messageActions.setInputValue,
    sendMessage: messageActions.sendMessage,
    handleSubmit: async (e: React.FormEvent) => {
      e.preventDefault();
      const text = state.inputValue;
      if (!text.trim()) return;
      await messageActions.sendMessage(text);
    },
    handleWebSocketMessage,
    getUserId: () => state.userId || 'default-user'
  };
};