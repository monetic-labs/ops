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

// Redefine MockWebSocket to use Omit for the methods we want to override
// export interface MockWebSocket extends Omit<WebSocket, 'addEventListener' | 'send' | 'close'> {
//     readyState: number;
//     _messages: string[];
//     // Override these methods with our specific implementations
//     addEventListener: <K extends keyof WebSocketEventMap>(
//         type: K,
//         listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
//         options?: boolean | AddEventListenerOptions
//     ) => void;
    
//     send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
//     close: () => void;
//     getLastSentMessage: () => string;
//     getAllMessages: () => string[];
// }

export interface MockWebSocket {
  send: (data: string) => void;
  close: () => void;
  addEventListener: (event: string, handler: Function) => void;
  removeEventListener: (event: string, handler: Function) => void;
  readyState: number;
  onmessage?: (event: MessageEvent) => void;
  onclose?: () => void;
  onopen?: () => void;
  onerror?: (error: any) => void;
  getAllMessages: () => any[];
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