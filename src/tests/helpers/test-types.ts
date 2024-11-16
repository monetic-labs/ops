import { AgentChatContext, ChatContextType } from "@/types/messaging";

// Add ShortcutsContextType to the types
export interface ShortcutsContextType {
    isChatOpen: boolean;
    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
  }

// Define the Message type for tests
export interface TestMessage {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: number;
  status: 'sent' | 'sending' | 'error';
  source?: string;
}

// Define the positions return type
export interface MessagePositions {
  curr: number;
  prev: number;
}

// Define MockWebSocket type
export interface MockWebSocket extends WebSocket {
    readyState: number;
    close: () => void;
}

declare global {
  interface Window {
    __MOCK_CHAT_CONTEXT__?: ChatContextType;
    __MOCK_SHORTCUTS_CONTEXT__?: ShortcutsContextType; 
    __MOCK_WS__?: MockWebSocket;
    _initialWidth?: number;
    _widthChanged?: boolean;
    openChat?: () => void;
    closeChat?: () => void;
    toggleChat?: () => void;
    __TEST_UTILS__?: {
      createEmptyAgentContext: () => AgentChatContext;
    };
  }
}

// Add custom matcher types for Playwright
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toBeGreaterThan(expected: number): R;
      toBe(expected: any): R;
      toBeVisible(): Promise<void>;
    }
  }
}