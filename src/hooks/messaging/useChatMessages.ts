import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Message, MessageStatus } from "@/types/messaging";

interface ChatMessagesStore {
  messages: Message[];
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  clearMessages: () => void;
}

export const useChatMessages = create<ChatMessagesStore>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      updateMessageStatus: (messageId, status) =>
        set((state) => ({
          messages: state.messages.map((msg) => (msg.id === messageId ? { ...msg, status } : msg)),
        })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "chat-messages-storage",
    }
  )
);
