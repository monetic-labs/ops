import { SpeedOverCostPreference } from "@/prompts/v0/types";
import { UsagePattern } from "@/prompts/v0/usage";
import { AgentChatContext, MessagingContextType } from "@/types/messaging";

import { Graph } from "@/prompts/v0/functions/graph";
import { IntegrationContextType } from "./pane/types";

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
  type: "user" | "bot";
  text: string;
  timestamp: number;
  status: "sent" | "sending" | "error";
  source?: string;
}

// Define the positions return type
export interface MessagePositions {
  curr: number;
  prev: number;
}

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
    __MOCK_CHAT_CONTEXT__?: MessagingContextType;
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
    __TEST_GRAPH__?: Graph;
    __TEST_PREFERENCE__?: SpeedOverCostPreference;
    __TEST_USAGE__?: UsagePattern;
    __CONTEXT_LOADED__?: boolean;

    __TEST_WS_READY__?: boolean;
    __TEST_CONTEXT__?: {
      wsReady?: boolean;
      initialized?: boolean;
      width?: number;
      messages?: {};
    } & Partial<IntegrationContextType>;
  }
  namespace PlaywrightTest {
    interface Matchers<R> {
      toBeGreaterThan(expected: number): R;
      toBe(expected: any): R;
      toBeVisible(): Promise<void>;
    }
  }
}

// // Add custom matcher types for Playwright
// declare global {
//   namespace PlaywrightTest {
//     interface Matchers<R> {
//       toBeGreaterThan(expected: number): R;
//       toBe(expected: any): R;
//       toBeVisible(): Promise<void>;
//     }
//   }
// }
