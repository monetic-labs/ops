import { UseChatHelpers } from "ai/react";

/** Core message types supported by the system */
export type MessageType = "user" | "bot" | "support" | "system" | "typing";
/** Possible states of a message */
export type MessageStatus = "sending" | "sent" | "error" | "received";
/** Available messaging service types */
export type MessageServiceType = "telegram";

/** Base interface for all message types */
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
  attachment?: {
    type: "image" | "screenshot";
    url?: string;
  };
}

/** Interface for typing indicator messages */
export interface TypingIndicator {
  type: "typing";
  chatId: string | number;
  isTyping: boolean;
  userId?: string;
}

/** User-sent message format */
export interface UserMessage extends BaseMessage {
  type: "user";
  status: MessageStatus;
}

/** Bot response message format */
export interface BotMessage extends BaseMessage {
  type: "bot";
  source?: string;
  status?: MessageStatus;
}

/** Support agent message format */
export interface SupportMessage extends BaseMessage {
  type: "support";
  agentId?: string;
  status?: MessageStatus;
}

/** System notification message format */
export interface SystemMessage extends BaseMessage {
  type: "system";
  category: "info" | "warning" | "error";
  status?: MessageStatus;
}

export type Message = UserMessage | BotMessage | SupportMessage | SystemMessage;
export type MessageMode = "support";

/** Interface for mention/autocomplete options */
export interface MentionOption {
  id: string;
  value: string;
  label: string;
  description?: string;
  icon?: string;
  category?: string;
}

/** Base interface for message services */
export interface MessageService {
  type: MessageServiceType;
  messages: Message[];
  isTyping?: boolean;
  isLoading: boolean;
  inputValue: string;
  setInputValue: (value: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  getUserId: () => string;
}

/** Support service specific interface */
export interface SupportMessageService extends MessageService {
  type: "telegram";
  channel: string;
  isTyping: boolean;
  metadata?: {
    agentId?: string;
    department?: string;
  };
}

/** Base messaging context shared between modes */
interface BaseMessagingContext {
  messages: Message[];
  inputValue: string;
  setInputValue: (value: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  userId: string;
}

/** Support-specific messaging context */
export interface SupportMessageContext extends BaseMessagingContext {
  mode: "support";
  service: SupportMessageService;
  isTyping: boolean;
}

/** Agent-specific messaging context */
export interface AgentMessageContext extends BaseMessagingContext {
  mode: "agent";
  type: "openai";
  model: string;
  isLoading: boolean;
}
