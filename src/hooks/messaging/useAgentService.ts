import { useChat } from "ai/react";

import { OPENAI_MODELS } from "@/knowledge-base/config";
import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";

/**
 * Custom hook that provides chat functionality with an AI agent.
 * Manages message state, handles message sending, and processes AI responses.
 *
 * @returns {Object} An object containing chat state and methods:
 *   - type: The AI provider type ('openai')
 *   - model: The OpenAI model being used
 *   - messages: Array of all messages in the conversation
 *   - isLoading: Boolean indicating if a response is being processed
 *   - inputValue: Current value of the input field
 *   - setInputValue: Function to update the input value
 *   - sendMessage: Function to send a message to the AI
 *   - getUserId: Function to get the current user ID
 */
export const useAgentService = () => {
  const { message: messageActions } = useMessagingActions();
  const state = useMessagingStore((state) => state.message);

  const chatHelpers = useChat({
    api: "/api/messaging/agent/chat",
    id: state.userId || "default-user",
    initialMessages: state.messages.bot
      .filter((msg) => msg.type === "user" || msg.type === "bot")
      .map((msg) => ({
        id: msg.id,
        role: msg.type === "bot" ? "assistant" : "user",
        content: msg.text,
      })),
    onFinish: (message) => {
      messageActions.appendMessage({
        id: message.id || crypto.randomUUID(),
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

  const setInputValue = async (value: string) => {
    await messageActions.setInputValue({ mode: "bot", value });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const messageId = crypto.randomUUID();
    const userMessage = {
      id: messageId,
      text,
      type: "user" as const,
      timestamp: Date.now(),
      status: "sending" as const,
    };

    try {
      messageActions.appendMessage(userMessage);
      await chatHelpers.append({
        id: messageId,
        content: text,
        role: "user",
      });
      messageActions.updateMessage(messageId, { status: "sent" });
      await setInputValue(""); // Clear input after sending
    } catch (error) {
      console.error("Failed to get AI response:", error);
      messageActions.updateMessage(messageId, { status: "error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = state.inputValues.bot;

    if (!text.trim()) return;
    await sendMessage(text.trim());
  };

  return {
    type: "openai" as const,
    model: OPENAI_MODELS.chat.default,
    messages: state.messages.bot,
    isLoading: chatHelpers?.isLoading || false,
    inputValue: state.inputValues.bot,
    setInputValue,
    sendMessage,
    handleSubmit,
    getUserId: () => state.userId || "default-user",
  };
};
