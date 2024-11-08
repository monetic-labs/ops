import { UseChatHelpers } from "ai/react";

import { MessageService, MessageServiceType, Message } from "@/types/messaging";

export class AIAgentService implements MessageService {
  type: MessageServiceType = "openai";

  constructor(
    private chatHelpers: UseChatHelpers,
    public setMessages: (messages: Message[]) => void
  ) {}

  private mapAIMessages(): Message[] {
    return this.chatHelpers.messages.map((msg) => ({
      id: msg.id,
      text: msg.content,
      type: msg.role === 'user' ? 'user' : 'bot',
      status: 'sent',
      timestamp: Date.now(),
      source: msg.role === 'assistant' ? 'openai' : undefined
    }));
  }

  async sendMessage(text: string): Promise<void> {
    await this.chatHelpers.append({
      id: Date.now().toString(),
      content: text,
      role: 'user'
    });
  }

  getMessages(): Message[] {
    return this.chatHelpers.messages.map((msg) => ({
      id: msg.id,
      text: msg.content,
      type: msg.role === 'user' ? 'user' : 'bot',
      status: 'sent',
      timestamp: Date.now(),
      source: msg.role === 'assistant' ? 'openai' : undefined
    }));
  }

  isInputLoading(): boolean {
    return this.chatHelpers.isLoading;
  }

  getInputValue(): string {
    return this.chatHelpers.input;
  }

  setInputValue(value: string): void {
    this.chatHelpers.setInput(value);
  }

  async handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const text = this.getInputValue();
    if (!text.trim()) return;
    await this.sendMessage(text);
  }
}
