import { create } from "zustand";
import { devtools } from "zustand/middleware";

//import { useWebSocket } from '@/libs/websocket';
import {
  MessageMode,
  Message,
  UserMessage,
  BotMessage,
  SystemMessage,
  SupportMessage,
  MessageStatus,
  MessageServiceType,
} from "@/types/messaging";

// Add to MessagingStore interface
interface MentionState {
  isOpen: boolean;
  searchText: string;
  selectedIndex: number;
  position: { top: number; left: number };
}

interface MentionActions {
  setMentionState: (state: Partial<MentionState>) => void;
  resetMentionState: () => void;
}

// Separate UI state from core messaging state
interface UIState {
  isOpen: boolean;
  width: number;
  isResizing: boolean;
}

interface UIActions {
  togglePane: () => void;
  setWidth: (width: number) => void;
  setResizing: (isResizing: boolean) => void;
}

interface MessageState {
  mode: MessageMode;
  messages: Message[];
  inputValue: string;
  isTyping: boolean;
  userId: string | null;
  activeService: MessageServiceType; // Add this to track current service
  pendingMessage: Message | null;
}

interface ConnectionState {
  status: "disconnected" | "connecting" | "connected";
  error: Error | null;
}

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

interface MessageActions {
  setMode: (mode: MessageMode) => void;
  setActiveService: (service: MessageServiceType) => void;
  appendMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setTyping: (isTyping: boolean) => void;
  setInputValue: (value: string) => void;
  setPendingMessage: (message: Message | null) => void;
}

interface ConnectionActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  setError: (error: Error | null) => void;
}

// Create a new message helper
const createMessage = (content: string, type: Message["type"], status: MessageStatus = "sending"): Message => {
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
      } as BotMessage;
    case "support":
      return {
        ...baseMessage,
        type: "support",
      } as SupportMessage;
    case "system":
      return {
        ...baseMessage,
        type: "system",
        category: "info",
      } as SystemMessage;
    default:
      throw new Error(`Invalid message type: ${type}`);
  }
};

// Create the messaging store
export const useMessagingStore = create<MessagingStore>()(
  devtools(
    (set, get) => {
      //const webSocket = useWebSocket.getState();

      return {
        ui: {
          isOpen: false,
          width: 400,
          isResizing: false,
        },
        message: {
          mode: "bot" as MessageMode, // Explicitly type as ChatMode
          messages: [] as Message[],
          inputValue: "",
          isTyping: false,
          userId: null,
          activeService: "openai" as MessageServiceType, // Add this
          pendingMessage: null,
        },
        mention: {
          isOpen: false,
          searchText: "",
          selectedIndex: 0,
          position: { top: 0, left: 0 },
        },
        connection: {
          status: "disconnected", // Align with WebSocket status
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
            setMode: (mode: MessageMode) =>
              set((state) => ({
                message: { ...state.message, mode },
              })),
            setActiveService: (service: MessageServiceType) =>
              set((state) => ({
                message: { ...state.message, activeService: service },
              })),
            setPendingMessage: (message: Message | null) =>
              set((state) => ({
                message: { ...state.message, pendingMessage: message },
              })),
            sendMessage: async (content: string) => {
              const message = createMessage(content, "user", "sending");

              set((state) => ({
                message: {
                  ...state.message,
                  messages: [...state.message.messages, message],
                },
              }));

              try {
                //await webSocket.send(message);
                get().actions.message.updateMessage(message.id, { status: "sent" });
              } catch (error) {
                get().actions.message.updateMessage(message.id, { status: "error" });
                get().actions.connection.setError(error as Error);
              }
            },
            appendMessage: (message: Message) =>
              set((state) => ({
                message: {
                  ...state.message,
                  messages: [...state.message.messages, message],
                },
              })),
            updateMessage: (id: string, updates: Partial<Message>) =>
              set((state) => ({
                message: {
                  ...state.message,
                  messages: state.message.messages.map((msg) =>
                    msg.id === id ? ({ ...msg, ...updates } as Message) : msg
                  ),
                },
              })),
            setInputValue: (value: string) =>
              set((state) => ({
                message: { ...state.message, inputValue: value },
              })),
            setTyping: (isTyping: boolean) =>
              set((state) => ({
                message: { ...state.message, isTyping },
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
                //await webSocket.connect();
                set((state) => ({
                  connection: {
                    ...state.connection,
                    status: "connected",
                    error: null,
                  },
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
              //webSocket.disconnect();
            },
            setError: (error) =>
              set((state) => ({
                connection: { ...state.connection, error },
              })),
          },
        },
        initialized: false,
      };
    },
    { name: "messaging-store" }
  )
);

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
      messages: [],
      inputValue: "",
      isTyping: false,
      userId: null,
      activeService: "agent" as MessageServiceType,
      pendingMessage: null,
    },
    connection: {
      status: "disconnected",
      error: null,
    },
  });
};

// Typed selectors for specific state slices
export const useMessagingUI = () => useMessagingStore((state) => state.ui);
export const useMessagingState = () => useMessagingStore((state) => state.message);
export const useMessagingConnection = () => useMessagingStore((state) => state.connection);
export const useMessagingActions = () => useMessagingStore((state) => state.actions);

if (typeof window !== "undefined") {
  window.__MESSAGING_STORE__ = useMessagingStore;
}
