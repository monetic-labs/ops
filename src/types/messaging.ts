// Message Types
export type MessageType = "user" | "bot" | "support" | "system";
export type MessageStatus = "sending" | "sent" | "error";
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

// Add this interface
export interface WebSocketMessage extends BaseMessage {
  type: "support" | "user";
  metadata: {
    telegramMessageId?: number;
    chatId?: string;
    timestamp: number;
    userId?: string;
  };
  status?: MessageStatus;
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
  getMessages: () => Message[];
  sendMessage: (text: string) => Promise<void>;
  getInputValue: () => string;
  setInputValue: (value: string) => void;
  isInputLoading: () => boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  destroy?: () => void;
  setMessages: (messages: Message[]) => void;
}

export interface AgentMessageService extends MessageService {
  type: "openai";
  model: string;
  context?: {
    systemPrompt?: string;
    temperature?: number;
  };
}

export interface SupportMessageService extends MessageService {
  type: "telegram" | "websocket";
  channel: string;
  metadata?: {
    agentId?: string;
    department?: string;
  };
}
