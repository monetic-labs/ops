import { ChatContextType } from "@/types/messaging";

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

declare global {
  interface Window {
    __MOCK_CHAT_CONTEXT__?: ChatContextType;
    _initialWidth?: number;
    _widthChanged?: boolean;
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