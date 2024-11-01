import { MessageService, MessageServiceType, Message, UserMessage } from "@/types/messaging";
import { sendTelegramMessage } from "@/libs/telegram";

export class TelegramService implements MessageService {
  type: MessageServiceType = "telegram";
  private inputValue = "";
  private isLoading = false;
  private messages: Message[] = [];
  private isDestroyed = false;

  constructor() {
    if (this.isDestroyed) {
      return;
    }
  }

  async sendMessage(text: string): Promise<void> {
    if (this.isDestroyed) return;

    this.isLoading = true;
    try {
      const message: UserMessage = {
        // Explicitly type as UserMessage
        id: Date.now().toString(),
        text,
        type: "user",
        status: "sending",
        timestamp: Date.now(),
      };

      this.messages.push(message);

      await sendTelegramMessage(text);

      const messageIndex = this.messages.findIndex((m) => m.id === message.id);

      if (messageIndex !== -1) {
        const updatedMessage: UserMessage = {
          // Explicitly type as UserMessage
          ...message,
          status: "sent",
        };

        this.messages[messageIndex] = updatedMessage;
      }
    } catch (error) {
      console.error("Failed to send telegram message:", error);
      const messageIndex = this.messages.findIndex((m) => m.text === text);

      if (messageIndex !== -1) {
        const errorMessage: UserMessage = {
          // Explicitly type as UserMessage
          ...(this.messages[messageIndex] as UserMessage),
          status: "error",
        };

        this.messages[messageIndex] = errorMessage;
      }
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getInputValue(): string {
    return this.inputValue;
  }

  setInputValue(value: string): void {
    this.inputValue = value;
  }

  isInputLoading(): boolean {
    return this.isLoading;
  }

  async handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!this.inputValue.trim() || this.isDestroyed) return;

    this.isLoading = true;
    try {
      await this.sendMessage(this.inputValue);
      this.inputValue = "";
    } finally {
      this.isLoading = false;
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.messages = [];
  }
}
