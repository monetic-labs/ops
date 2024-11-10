import { create } from 'zustand';
import type { Message, WebSocketMessage } from '@/types/messaging';

// Mock initial messages
const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hello! How can I help you today?',
    type: 'support',
    timestamp: Date.now() - 50000,
    status: 'sent',
    metadata: {
      userId: 'support-1'
    }
  },
  // Add more mock messages as needed
];

interface SupportState {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  inputValue: string;
  setIsTyping: (value: boolean) => void;
  addMessage: (message: Message) => void;
  setInputValue: (value: string) => void;
  sendMessage: (text: string) => Promise<void>;
  handleWebSocketMessage: (message: WebSocketMessage) => void;
}

export const useSupportStore = create<SupportState>((set, get) => ({
  messages: MOCK_MESSAGES,
  isLoading: false,
  isTyping: false,
  inputValue: '',

  setIsTyping: (value) => set({ isTyping: value }),

  addMessage: (message) => {
    const messages = get().messages;
    set({ messages: [...messages, message] });
  },

  setInputValue: (value) => set({ inputValue: value }),

  sendMessage: async (text) => {
    set({ isLoading: true });
    try {
      const message: Message = {
        id: `msg-${Date.now()}`,
        text,
        type: "user",
        status: "sent", // Auto-set to sent for mock
        timestamp: Date.now(),
        metadata: {
          userId: 'mock-user'
        }
      };

      get().addMessage(message);

      // Simulate support response
      setTimeout(() => {
        const responseMessage: Message = {
          id: `msg-${Date.now()}`,
          text: `Mock response to: ${text}`,
          type: "support",
          status: "sent",
          timestamp: Date.now(),
          metadata: {
            userId: 'support-1'
          }
        };
        get().addMessage(responseMessage);
      }, 1000);

    } finally {
      set({ isLoading: false });
    }
  },

  handleWebSocketMessage: (message) => {
    // No-op for mock implementation
    console.log('Mock WebSocket message received:', message);
  },
}));
