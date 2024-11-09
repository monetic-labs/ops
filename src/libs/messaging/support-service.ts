import { create } from 'zustand';
import { broadcastMessage } from '../websocket';
import type { Message, UserMessage, WebSocketMessage } from '@/types/messaging';

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
  messages: [],
  isLoading: false,
  isTyping: false,
  inputValue: '',

  setIsTyping: (value) => set({ isTyping: value }),

  addMessage: (message) => {
    const messages = get().messages;
    const exists = messages.some(m => 
      m.id === message.id || 
      (m.text === message.text && 
       Math.abs(m.timestamp - message.timestamp) < 1000)
    );

    if (!exists) {
      set({ messages: [...messages, message] });
    }
  },

  setInputValue: (value) => set({ inputValue: value }),

  sendMessage: async (text) => {
    set({ isLoading: true });
    try {
      const timestamp = Date.now();
      const message: Message = {
        id: `msg-${timestamp}`,
        text,
        type: "user",
        status: "sending",
        timestamp,
        metadata: {
          telegramMessageId: undefined,
          chatId: undefined,
          userId: 'default-user'
        }
      };

      // Add message to local state
      get().addMessage(message);

      // Send via WebSocket
      await broadcastMessage(message as WebSocketMessage);

      // Update message status
      const messages = get().messages;
      const messageIndex = messages.findIndex(m => m.id === message.id);
      if (messageIndex !== -1) {
        const updatedMessages = [...messages];
        updatedMessages[messageIndex] = {
          ...message,
          status: "sent",
        };
        set({ messages: updatedMessages });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  handleWebSocketMessage: (message) => {
    console.log('📨 Handling WebSocket message:', message);

    if (message.type === 'typing') {
      set({ isTyping: true });
      setTimeout(() => set({ isTyping: false }), 3000);
      return;
    }

  // Handle both user and support messages
    if (message.type === 'support' || message.type === 'user') {
      const newMessage: Message = {
        id: message.id,
        text: message.text,
        type: message.type,
        timestamp: message.timestamp,
        status: message.status,
        metadata: message.metadata
      };

      get().addMessage(newMessage);
    } 
  },
}));
