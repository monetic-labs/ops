// Message Types
export type MessageType = 'user' | 'bot' | 'support' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'error';
export type MessageService = 'telegram' | 'openai' | 'websocket';

// Base Message Interface
export interface BaseMessage {
  id: string;
  text: string;
  timestamp: number;
}

// User Message Interface
export interface UserMessage extends BaseMessage {
  type: 'user';
  status: MessageStatus;
}

// Bot Message Interface
export interface BotMessage extends BaseMessage {
  type: 'bot';
  source?: string;
}

// Support Message Interface
export interface SupportMessage extends BaseMessage {
  type: 'support';
  agentId?: string;
}

// System Message Interface
export interface SystemMessage extends BaseMessage {
  type: 'system';
  category: 'info' | 'warning' | 'error';
}

// Union type for all message types
export type Message = UserMessage | BotMessage | SupportMessage | SystemMessage;

// Chat Mode Types
export type ChatMode = 'bot' | 'support';

// Message Service Configuration
export interface MessageServiceConfig {
  type: MessageService;
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