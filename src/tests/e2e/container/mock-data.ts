import { UserMessage, BotMessage, SupportMessage, SystemMessage } from "@/types/messaging";

// Mock messages for different types
export const mockUserMessage: UserMessage = {
  id: "1",
  type: "user",
  text: "Hello, I need help",
  timestamp: Date.now() - 60000,
  status: "sent",
};

export const mockBotMessage: BotMessage = {
  id: "2",
  type: "bot",
  text: "Hello! How can I help you today?",
  timestamp: Date.now() - 50000,
  status: "sent",
  source: "openai",
};

export const mockSupportMessage: SupportMessage = {
  id: "3",
  type: "support",
  text: "Hi there! I'm here to assist you.",
  timestamp: Date.now() - 40000,
  status: "sent",
  agentId: "agent-1",
};

export const mockSystemMessage: SystemMessage = {
  id: "4",
  type: "system",
  text: "Chat session started",
  timestamp: Date.now() - 30000,
  category: "info",
};

// Mock conversation sequences
export const mockConversations = {
  agent: [mockUserMessage, mockBotMessage],
  support: [mockUserMessage, mockSupportMessage],
  mixed: [mockSystemMessage, mockUserMessage, mockBotMessage, mockSupportMessage],
};

// Mock responses for different modes
export const mockResponses = {
  agent: {
    greeting: "Hello! I'm your AI assistant.",
    help: "I can help you with various tasks.",
    error: "I apologize, but I encountered an error.",
  },
  support: {
    greeting: "Hi! I'm your support agent.",
    help: "How can I assist you today?",
    busy: "All our agents are currently busy.",
  },
};

// Mock metadata
export const mockMetadata = {
  userId: "test-user-123",
  agentId: "agent-456",
  chatId: "chat-789",
  timestamp: Date.now(),
};
