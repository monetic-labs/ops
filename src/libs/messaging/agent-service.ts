import { create } from "zustand";
import { UseChatHelpers } from "ai/react";

import { BotMessage, Message, MessageServiceType, UserMessage } from "@/types/messaging";

interface AgentState {
  type: MessageServiceType;
  chatHelpers: UseChatHelpers | null;
  messages: Message[];
  isLoading: boolean;
  inputValue: string;
  setChatHelpers: (helpers: UseChatHelpers) => void;
  sendMessage: (text: string) => Promise<void>;
  setInputValue: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  getUserId: () => string;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  type: "telegram", // TODO: change to openai
  chatHelpers: null,
  messages: [],
  isLoading: false,
  inputValue: "",

  setChatHelpers: (helpers) => {
    const current = get().chatHelpers;

    if ((!helpers && !current) || helpers === current) return;

    if (helpers) {
      // Only update if messages have actually changed
      const newMessages = helpers.messages.map((msg): Message => {
        if (msg.role === "user") {
          return {
            id: msg.id,
            text: msg.content,
            type: "user",
            status: "sent",
            timestamp: Date.now(),
          } as UserMessage;
        } else {
          return {
            id: msg.id,
            text: msg.content,
            type: "bot",
            status: "sent",
            timestamp: Date.now(),
            source: "openai",
          } as BotMessage;
        }
      });

      const currentMessages = get().messages;

      if (JSON.stringify(newMessages) === JSON.stringify(currentMessages)) {
        return;
      }

      set({
        chatHelpers: helpers,
        messages: newMessages,
        isLoading: helpers.isLoading,
        inputValue: helpers.input || "",
      });
    } else {
      set({
        chatHelpers: null,
        messages: [],
        isLoading: false,
        inputValue: "",
      });
    }
  },

  mapAIMessages: () => {
    const helpers = get().chatHelpers;

    if (!helpers) return [];

    return helpers.messages.map((msg) => ({
      id: msg.id,
      text: msg.content,
      type: msg.role === "user" ? "user" : "bot",
      status: "sent",
      timestamp: Date.now(),
      source: msg.role === "assistant" ? "openai" : undefined,
    }));
  },

  sendMessage: async (text: string) => {
    const helpers = get().chatHelpers;

    if (!helpers) return;

    try {
      await helpers.append({
        id: Date.now().toString(),
        content: text,
        role: "user",
      });
      set({ inputValue: "" });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  },

  getMessages: () => {
    const helpers = get().chatHelpers;

    if (!helpers) return [];

    return helpers.messages.map((msg) => ({
      id: msg.id,
      text: msg.content,
      type: msg.role === "user" ? "user" : "bot",
      status: "sent",
      timestamp: Date.now(),
      source: msg.role === "assistant" ? "openai" : undefined,
    }));
  },

  isInputLoading: () => {
    return get().chatHelpers?.isLoading || false;
  },

  getInputValue: () => {
    return get().chatHelpers?.input || "";
  },

  setInputValue: async (value: string) => {
    const helpers = get().chatHelpers;

    if (helpers) {
      helpers.setInput(value);
    }
    set({ inputValue: value });

    return Promise.resolve();
  },

  handleSubmit: async (e: React.FormEvent) => {
    e.preventDefault();
    const { inputValue } = get();

    if (!inputValue.trim()) return;
    await get().sendMessage(inputValue);
    set({ inputValue: "" }); // Clear input after sending
  },

  getUserId: () => "ai-agent",
}));
