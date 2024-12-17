import { create } from "zustand";
import { devtools } from "zustand/middleware";

import {
  MessageMode,
  Message,
  UserMessage,
  BotMessage,
  SystemMessage,
  SupportMessage,
  MessageStatus,
  MessageServiceType,
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

// Core message state
interface MessageState {
  mode: MessageMode;
  messages: {
    bot: Message[];    // Messages for OpenAI bot service
    support: Message[]; // Messages for Telegram support service
  };
  inputValues: {
    bot: string;
    support: string;
  };
  isTyping: boolean;
  userId: string | null;
  merchantId?: string | null;
  activeService: MessageServiceType;
  pendingMessage: Message | null;
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
  setMode: (mode: MessageMode) => void;
  setActiveService: (service: MessageServiceType) => void;
  setUserId: (userId: string) => void;
  setMerchantId: (merchantId: string) => void;
  appendMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Omit<Message, "type">>) => void;
  updateMessageStatus: (id: string, status: MessageStatus) => void;
  setTyping: (isTyping: boolean) => void;
  setInputValue: (payload: { mode: MessageMode; value: string }) => void;
  setPendingMessage: (message: Message | null) => void;
  clearMessages: () => void;
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

// Create the store
export const useMessagingStore = create<MessagingStore>()(
  devtools(
    (set, get) => ({
      ui: {
        isOpen: false,
        width: 400,
        isResizing: false,
      },
      message: {
        mode: "bot",
        messages: {
          bot: [],
          support: [],
        },
        inputValues: {
          bot: "",
          support: "",
        },
        isTyping: false,
        userId: null,
        activeService: "openai",
        pendingMessage: null,
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
      actions: {
        ui: {
          togglePane: () => set((state) => ({
            ui: { ...state.ui, isOpen: !state.ui.isOpen },
          })),
          setWidth: (width) => set((state) => ({
            ui: { ...state.ui, width },
          })),
          setResizing: (isResizing) => set((state) => ({
            ui: { ...state.ui, isResizing },
          })),
        },
        message: {
          setMode: (mode: MessageMode) =>
            set((state) => ({
              message: {
                ...state.message,
                mode,
                activeService: mode === "bot" ? "openai" : "telegram",
              },
            })),
          setMerchantId: (merchantId: string) =>
            set((state) => ({
              message: { ...state.message, merchantId },
            })),
          setUserId: (userId: string) =>
            set((state) => ({
              message: { ...state.message, userId },
            })),
          setActiveService: (service: MessageServiceType) =>
            set((state) => ({
              message: { ...state.message, activeService: service },
            })),
          appendMessage: (message: Message) =>
            set((state) => ({
              message: {
                ...state.message,
                messages: {
                  ...state.message.messages,
                  [state.message.mode]: [...state.message.messages[state.message.mode], message],
                },
              },
            })),
          updateMessage: (id: string, updates: Partial<Omit<Message, "type">>) =>
            set((state) => ({
              message: {
                ...state.message,
                messages: {
                  ...state.message.messages,
                  [state.message.mode]: state.message.messages[state.message.mode].map((msg) =>
                    msg.id === id ? { ...msg, ...updates } : msg
                  ),
                },
              },
            })),
          updateMessageStatus: (id: string, status: MessageStatus) =>
            set((state) => ({
              message: {
                ...state.message,
                messages: {
                  ...state.message.messages,
                  [state.message.mode]: state.message.messages[state.message.mode].map((msg) =>
                    msg.id === id ? { ...msg, status } : msg
                  ),
                },
              },
            })),
          setTyping: (isTyping: boolean) =>
            set((state) => ({
              message: { ...state.message, isTyping },
            })),
          setInputValue: ({ mode, value }: { mode: MessageMode; value: string }) =>
            set((state) => ({
              message: {
                ...state.message,
                inputValues: {
                  ...state.message.inputValues,
                  [mode]: value
                }
              },
            })),
          setPendingMessage: (message: Message | null) =>
            set((state) => ({
              message: { ...state.message, pendingMessage: message },
            })),
          clearMessages: () =>
            set((state) => ({
              message: {
                ...state.message,
                messages: {
                  ...state.message.messages,
                  [state.message.mode]: [],
                },
              },
            })),
        },
        mention: {
          setMentionState: (updates) => set((state) => ({
            mention: { ...state.mention, ...updates },
          })),
          resetMentionState: () => set((state) => ({
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
          setError: (error) => set((state) => ({
            connection: { ...state.connection, error },
          })),
        },
      },
      initialized: false,
    }),
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
      mode: "bot",
      messages: {
        bot: [],
        support: [],
      },
      inputValues: {
        bot: "",
        support: "",
      },
      isTyping: false,
      userId: null,
      activeService: "openai",
      pendingMessage: null,
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
  return messages[mode];
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
