import { UserMessage, BotMessage, SupportMessage, SystemMessage, Message } from "@/types/messaging";

export const mockMessages = {
  agent: [
    {
      id: 'agent-1',
      type: 'bot',
      text: 'How can I assist you today?',
      timestamp: Date.now(),
      status: 'sent',
      source: 'agent'
    } as BotMessage
  ] as Message[],
  support: [
    {
      id: 'support-1',
      type: 'support',
      text: 'Let me help you with that',
      timestamp: Date.now(),
      status: 'sent',
      agentId: 'support-agent-1'
    } as SupportMessage
  ] as Message[],
  system: [
    {
      id: 'system-1',
      type: 'system',
      text: 'Chat session started',
      timestamp: Date.now(),
      category: 'info'
    } as SystemMessage
  ] as Message[],
  user: [
    {
      id: 'user-1',
      type: 'user',
      text: 'Hello',
      timestamp: Date.now(),
      status: 'sent'
    } as UserMessage
  ] as Message[]
};
