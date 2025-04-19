import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { persist } from "zustand/middleware";

import {
  Message,
  UserMessage,
  BotMessage,
  SystemMessage,
  SupportMessage,
  MessageStatus,
  MessageType,
} from "@/types/messaging";

// Mention state interface
interface MentionState {
  isOpen: boolean;
  searchText: string;
  selectedIndex: number;
  position: { top: number; left: number };
}

// UI state interface
interface UIState {
  isOpen: boolean;
  width: number;
  isResizing: boolean;
}

interface PendingAttachment {
  type: "image" | "screenshot";
  file: File | null;
  preview: string;
}

// Core message state
interface MessageState {
  mode: "support"; // Only support mode is available
  messages: Message[]; // Single array for messages
  inputValue: string; // Single input value
  isTyping: boolean;
  userId: string | null;
  merchantId?: string | null;
  activeService: "telegram"; // Only telegram service is available
  pendingMessage: Message | null;
  pendingAttachment: PendingAttachment | null;
  unreadCount: number; // Add unread count
}

// Connection state
interface ConnectionState {
  status: "disconnected" | "connecting" | "connected";
  error: Error | null;
}

// Action interfaces
interface UIActions {
  togglePane: () => void;
  setWidth: (width: number) => void;
  setResizing: (isResizing: boolean) => void;
}

interface MessageActions {
  setMode: () => void;
  setActiveService: () => void;
  setUserId: (userId: string) => void;
  setMerchantId: (merchantId: string) => void;
  appendMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Omit<Message, "type">>) => void;
  updateMessageStatus: (id: string, status: MessageStatus) => void;
  setTyping: (isTyping: boolean) => void;
  setInputValue: (params: { value: string }) => void;
  setPendingMessage: (message: Message | null) => void;
  setPendingAttachment: (attachment: PendingAttachment | null) => void;
  clearMessages: () => void;
  clearUnreadCount: () => void;
}

interface MentionActions {
  setMentionState: (state: Partial<MentionState>) => void;
  resetMentionState: () => void;
}

interface ConnectionActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  setError: (error: Error | null) => void;
}

// Main store interface
export interface MessagingStore {
  ui: UIState;
  message: MessageState;
  mention: MentionState;
  connection: ConnectionState;
  actions: {
    ui: UIActions;
    message: MessageActions;
    mention: MentionActions;
    connection: ConnectionActions;
  };
  initialized: boolean;
}

// Constants for storage
const MAX_MESSAGES_PER_MODE = 100;
const STORAGE_KEY = "@monetic/ops:support";

// Default state values
const DEFAULT_STATE = {
  messages: [] as Message[],
  inputValue: "",
  userId: null,
  merchantId: null,
  unreadCount: 0,
};

// Helper to migrate old format to new format
const migrateOldState = (oldState: any): Message[] | undefined => {
  if (!oldState?.message?.messages) return undefined;

  // Check if we have the old format with bot/support arrays
  if (oldState.message.messages?.bot || oldState.message.messages?.support) {
    return [...(oldState.message.messages.support || []), ...(oldState.message.messages.bot || [])].sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  return undefined;
};

// Helper to clean up messages
const cleanupMessages = (messages: Message[]) => {
  return messages.slice(-MAX_MESSAGES_PER_MODE);
};

// Helper function to create messages with proper typing
export const createMessage = (content: string, type: MessageType, status: MessageStatus = "sending"): Message => {
  const baseMessage = {
    id: crypto.randomUUID(),
    text: content,
    timestamp: Date.now(),
    status,
  };

  switch (type) {
    case "user":
      return {
        ...baseMessage,
        type: "user",
        status,
      } as UserMessage;
    case "bot":
      return {
        ...baseMessage,
        type: "bot",
        status,
      } as BotMessage;
    case "support":
      return {
        ...baseMessage,
        type: "support",
        status,
      } as SupportMessage;
    case "system":
      return {
        ...baseMessage,
        type: "system",
        category: "info",
        status,
      } as SystemMessage;
    default:
      throw new Error(`Invalid message type: ${type}`);
  }
};

// Create the store with persistence
export const useMessagingStore = create<MessagingStore>()(
  devtools(
    persist(
      (set, get) => ({
        ui: {
          isOpen: false,
          width: 400,
          isResizing: false,
        },
        message: {
          mode: "support" as const,
          messages: [],
          inputValue: "",
          isTyping: false,
          userId: null,
          merchantId: null,
          activeService: "telegram" as const,
          pendingMessage: null,
          pendingAttachment: null,
          unreadCount: 0,
        },
        mention: {
          isOpen: false,
          searchText: "",
          selectedIndex: 0,
          position: { top: 0, left: 0 },
        },
        connection: {
          status: "disconnected" as const,
          error: null,
        },
        actions: {
          ui: {
            togglePane: () =>
              set((state) => ({
                ui: { ...state.ui, isOpen: !state.ui.isOpen },
              })),
            setWidth: (width) =>
              set((state) => ({
                ui: { ...state.ui, width },
              })),
            setResizing: (isResizing) =>
              set((state) => ({
                ui: { ...state.ui, isResizing },
              })),
          },
          message: {
            setMode: () => {}, // No-op
            setActiveService: () => {}, // No-op
            setUserId: (userId: string) =>
              set((state) => ({
                message: { ...state.message, userId },
              })),
            setMerchantId: (merchantId: string) =>
              set((state) => ({
                message: { ...state.message, merchantId },
              })),
            appendMessage: (message: Message) =>
              set((state) => {
                const updatedMessages = [...state.message.messages, message];
                const cleanedMessages = cleanupMessages(updatedMessages);
                const isIncoming = message.type === "support";
                const shouldIncrementUnread = isIncoming && !state.ui.isOpen;
                const shouldClearUnread = message.type === "user" || state.ui.isOpen;

                return {
                  message: {
                    ...state.message,
                    messages: cleanedMessages,
                    unreadCount: shouldClearUnread
                      ? 0
                      : shouldIncrementUnread
                        ? state.message.unreadCount + 1
                        : state.message.unreadCount,
                  },
                };
              }),
            updateMessage: (id: string, updates: Partial<Omit<Message, "type">>) =>
              set((state) => ({
                message: {
                  ...state.message,
                  messages: state.message.messages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
                },
              })),
            updateMessageStatus: (id: string, status: MessageStatus) =>
              set((state) => ({
                message: {
                  ...state.message,
                  messages: state.message.messages.map((msg) => (msg.id === id ? { ...msg, status } : msg)),
                },
              })),
            setTyping: (isTyping: boolean) =>
              set((state) => ({
                message: { ...state.message, isTyping },
              })),
            setInputValue: (params: { value: string }) =>
              set((state) => ({
                message: {
                  ...state.message,
                  inputValue: params.value,
                },
              })),
            setPendingMessage: (message: Message | null) =>
              set((state) => ({
                message: { ...state.message, pendingMessage: message },
              })),
            setPendingAttachment: (attachment: PendingAttachment | null) =>
              set((state) => ({
                message: {
                  ...state.message,
                  pendingAttachment: attachment,
                },
              })),
            clearMessages: () =>
              set((state) => ({
                message: {
                  ...state.message,
                  messages: [],
                },
              })),
            clearUnreadCount: () =>
              set((state) => ({
                message: {
                  ...state.message,
                  unreadCount: 0,
                },
              })),
          },
          mention: {
            setMentionState: (updates) =>
              set((state) => ({
                mention: { ...state.mention, ...updates },
              })),
            resetMentionState: () =>
              set((state) => ({
                mention: {
                  isOpen: false,
                  searchText: "",
                  selectedIndex: 0,
                  position: { top: 0, left: 0 },
                },
              })),
          },
          connection: {
            connect: async () => {
              set((state) => ({
                connection: { ...state.connection, status: "connecting" },
              }));
              try {
                // Connection logic here
                set((state) => ({
                  connection: { ...state.connection, status: "connected", error: null },
                }));
              } catch (error) {
                set((state) => ({
                  connection: {
                    ...state.connection,
                    status: "disconnected",
                    error: error as Error,
                  },
                }));
              }
            },
            disconnect: () => {
              // Disconnect logic here
              set((state) => ({
                connection: { ...state.connection, status: "disconnected" },
              }));
            },
            setError: (error) =>
              set((state) => ({
                connection: { ...state.connection, error },
              })),
          },
        },
        initialized: false,
      }),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          message: {
            messages: state.message.messages,
            inputValue: state.message.inputValue,
            userId: state.message.userId,
            merchantId: state.message.merchantId,
            unreadCount: state.message.unreadCount,
          },
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Handle migration from old format
            const migratedMessages = migrateOldState(state);

            state.message = {
              mode: "support",
              messages: migratedMessages || state.message?.messages || DEFAULT_STATE.messages,
              inputValue: state.message?.inputValue || DEFAULT_STATE.inputValue,
              userId: state.message?.userId || DEFAULT_STATE.userId,
              merchantId: state.message?.merchantId || DEFAULT_STATE.merchantId,
              activeService: "telegram",
              isTyping: false,
              pendingMessage: null,
              pendingAttachment: null,
              unreadCount: 0,
            };
          }
        },
      }
    ),
    { name: "messaging-store" }
  )
);

// Reset function
export const resetMessagingStore = () => {
  useMessagingStore.setState({
    initialized: false,
    ui: {
      isOpen: false,
      width: 400,
      isResizing: false,
    },
    message: {
      mode: "support",
      messages: DEFAULT_STATE.messages,
      inputValue: DEFAULT_STATE.inputValue,
      isTyping: false,
      userId: DEFAULT_STATE.userId,
      merchantId: DEFAULT_STATE.merchantId,
      activeService: "telegram",
      pendingMessage: null,
      pendingAttachment: null,
      unreadCount: 0,
    },
    mention: {
      isOpen: false,
      searchText: "",
      selectedIndex: 0,
      position: { top: 0, left: 0 },
    },
    connection: {
      status: "disconnected",
      error: null,
    },
  });
};

// Add a selector to get current mode's messages
export const useCurrentModeMessages = () => {
  const { mode, messages } = useMessagingStore((state) => state.message);

  return messages;
};

// Typed selectors
export const useMessagingUI = () => useMessagingStore((state) => state.ui);
export const useMessagingState = () => useMessagingStore((state) => state.message);
export const useMessagingConnection = () => useMessagingStore((state) => state.connection);
export const useMessagingActions = () => useMessagingStore((state) => state.actions);

// Dev tools
if (typeof window !== "undefined") {
  window.__MESSAGING_STORE__ = useMessagingStore;
}
