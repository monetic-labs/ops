import { useChat } from "ai/react";

import { OPENAI_MODELS } from "@/knowledge-base/config";
import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";

export const useAgentService = () => {
  const { message: messageActions } = useMessagingActions();
  const state = useMessagingStore((state) => state.message);

  // Initialize the AI SDK chat
  const chatHelpers = useChat({
    api: "/api/messaging/agent/chat",
    id: state.userId || "default-user",
    onFinish: (message) => {
      messageActions.appendMessage({
        id: crypto.randomUUID(),
        text: message.content,
        type: "bot",
        timestamp: Date.now(),
        status: "received",
      });
    },
    onError: (error) => {
      console.error("Chat error:", error);
      messageActions.appendMessage({
        id: crypto.randomUUID(),
        text: "Sorry, I encountered an error processing your message.",
        type: "system",
        category: "error",
        timestamp: Date.now(),
        status: "error",
      });
    },
  });

  // Simplified message handling
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    try {
      // Send user message first
      await messageActions.sendMessage(text);
      
      // Use the proper methods from useChat
      await chatHelpers.setInput(text);
      await chatHelpers.handleSubmit(new Event('submit') as any);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      messageActions.appendMessage({
        id: crypto.randomUUID(),
        text: "Sorry, I encountered an error processing your message.",
        type: "system",
        category: "error",
        timestamp: Date.now(),
        status: "error",
      });
    }
  };

  return {
    type: "openai" as const,
    model: OPENAI_MODELS.chat.default,
    messages: state.messages,
    isLoading: chatHelpers?.isLoading || false,
    inputValue: state.inputValue,
    setInputValue: messageActions.setInputValue,
    sendMessage,
    getUserId: () => state.userId || "default-user",
  };
};
