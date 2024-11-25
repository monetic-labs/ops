import { Graph } from "@/prompts/v0/functions/graph";
import { SpeedOverCostPreference } from "@/prompts/v0/types";
import { UsagePattern } from "@/prompts/v0/usage";
import { ShortcutsContextType } from "@/tests/helpers/test-types";
import type { AgentChatContext, SupportChatContext, MessagingContextType, SupportMessageService, AgentMessageService, Message } from "@/types/messaging";
import { Page } from "@playwright/test";
import { UseChatHelpers } from "ai/react/dist";

// Base test context interface
export interface BaseTestContext {
  mode: "agent" | "support";
  isOpen: boolean;
  width: number;
  wsReady: boolean;
  initialized: boolean;
}

// Integration context types
export interface BaseIntegrationContext extends BaseTestContext {
  messages: Message[];
  inputValue: string;
  setInputValue: (value: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  userId: string;
}

export interface AgentIntegrationContext extends BaseIntegrationContext {
  mode: "agent";
  supportContext: SupportChatContext;
  service: AgentMessageService;
  chatHelpers: UseChatHelpers;
}

export interface SupportIntegrationContext extends BaseIntegrationContext {
  mode: "support";
  agentContext: AgentChatContext;
  service: SupportMessageService;
  isTyping: boolean;
}

export type IntegrationContextType = AgentIntegrationContext | SupportIntegrationContext;

// Fixture types
export interface TestContextFixtures {
  containerContext: BaseTestContext;
  messagingContext: (AgentChatContext | SupportChatContext) & BaseTestContext;
  integrationContext: IntegrationContextType;
  minimalWebSocket: MockWebSocket;
  messagingWebSocket: MockWebSocket;
  integrationWebSocket: MockWebSocket;
}

export interface WebSocketDependencies {
    page: Page;
    integrationContext?: IntegrationContextType;
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