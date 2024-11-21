import { UseChatHelpers } from "ai/react";

// Message Types
export type MessageType = "user" | "bot" | "support" | "system" | "typing";
export type MessageStatus = "sending" | "sent" | "error" | "received";
export type MessageServiceType = "telegram" | "openai" | "websocket";

// Base Message Interface
export interface BaseMessage {
  id: string;
  text: string;
  timestamp: number;
  status?: MessageStatus;
  metadata?: {
    telegramMessageId?: number;
    chatId?: string;
    timestamp?: number;
    userId?: string;
  };
}

export interface TypingIndicator {
  type: "typing";
  chatId: string | number;
  isTyping: boolean;
  userId?: string;
}

// Add this interface for types of messages that can be sent via websocket
export interface WebSocketMessage extends BaseMessage {
  type: MessageType;
  id: string;
  text: string;
  status?: MessageStatus;
  metadata: {
    telegramMessageId?: number;
    chatId?: string;
    timestamp: number;
    userId?: string;
    isTyping?: boolean;
  };
}

// User Message Interface
export interface UserMessage extends BaseMessage {
  type: "user";
  status: MessageStatus;
}

// Bot Message Interface
export interface BotMessage extends BaseMessage {
  type: "bot";
  source?: string;
  status?: MessageStatus;
}

// Support Message Interface
export interface SupportMessage extends BaseMessage {
  type: "support";
  agentId?: string;
  status?: MessageStatus;
}

// System Message Interface
export interface SystemMessage extends BaseMessage {
  type: "system";
  category: "info" | "warning" | "error";
  status?: MessageStatus;
}

// Union type for all message types
export type Message = UserMessage | BotMessage | SupportMessage | SystemMessage;

// Chat Mode Types
export type ChatMode = "bot" | "support";

// Message Service Configuration
export interface MessageServiceConfig {
  service: MessageService;
  enabled: boolean;
  config?: Record<string, unknown>;
}

// Mention Option Interface
export interface MentionOption {
  id: string;
  value: string;
  label: string;
  description?: string;
  icon?: string;
  category?: string;
}

export interface MessageService {
  type: MessageServiceType;
  messages: Message[];
  isTyping?: boolean;
  isLoading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  sendMessage: (text: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleWebSocketMessage?: (message: WebSocketMessage) => void;
  getUserId: () => string;
}

export interface AgentMessageService extends MessageService {
  type: "openai";
  isLoading: boolean;
  model: string;
  context?: {
    systemPrompt?: string;
    temperature?: number;
  };
}

export interface SupportMessageService extends MessageService {
  type: "telegram" | "websocket";
  channel: string;
  isTyping: boolean;
  handleWebSocketMessage: (message: WebSocketMessage) => void;
  metadata?: {
    agentId?: string;
    department?: string;
  };
}

// Base context interface that both modes share
interface BaseChatContext {
  messages: Message[];
  inputValue: string;
  setInputValue: (value: string) => void;
  sendMessage: (text: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  userId: string;
}

// Agent-specific context
export interface AgentChatContext extends BaseChatContext {
  mode: "agent";
  service: AgentMessageService;
  chatHelpers: UseChatHelpers;
  isTyping: false; // Agent mode doesn't use typing indicators
}

// Support-specific context
export interface SupportChatContext extends BaseChatContext {
  mode: "support";
  service: SupportMessageService;
  chatHelpers?: never; // Support mode doesn't use chat helpers
  isTyping: boolean;
}

// Union type for the context
export type ChatContextType = AgentChatContext | SupportChatContext;

// Type guard functions
export function isAgentContext(context: ChatContextType): context is AgentChatContext {
  return context.mode === "agent";
}

export function isSupportContext(context: ChatContextType): context is SupportChatContext {
  return context.mode === "support";
}
