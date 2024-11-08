import { MessageService, MessageServiceType, Message, UserMessage, WebSocketMessage } from "@/types/messaging";
import { sendTelegramMessage } from "@/libs/telegram";


export class TelegramService implements MessageService {
  private messageSubscribers: Set<(messages: Message[]) => void> = new Set();
  private userId: string;

  type: MessageServiceType = "telegram";
  private inputValue = "";
  private isLoading = false;
  private messages: Message[] = [];
  private isDestroyed = false;
  private intervalId: NodeJS.Timeout | undefined;
  private cleanup: (() => void)[] = [];


  constructor(
    userId: string,
    public setMessages: (messages: Message[]) => void
  ) {
    this.userId = userId;
    this.setMessages = setMessages;
  }

  updateMessages(messages: Message[]) {
    this.messages = messages;
  }

  // handleWebSocketMessage(message: WebSocketMessage) {
  //   console.log('📥 TelegramService received message:', message);
  //   if (this.isDestroyed) {
  //     console.log('❌ Service is destroyed, ignoring message');
  //     return;
  //   }
  
  //   if (message.type === "support" || message.type === "user" || message.type === "telegram") {
  //     const exists = this.messages.some(m => 
  //       m.id === message.id || 
  //       (m.text === message.text && Math.abs(m.timestamp - message.timestamp) < 1000)
  //     );
      
  //     console.log('🔍 Message exists?', exists);
      
  //     if (!exists) {
  //       const newMessage: Message = {
  //         id: message.id,
  //         text: message.text,
  //         type: message.type === "support" ? "user" : message.type,
  //         timestamp: message.timestamp,
  //         status: message.status || "sent",
  //         metadata: message.metadata
  //       };
        
  //       this.messages = [...this.messages, newMessage];
  //       //this.setMessages(this.messages);
  //       this.notifySubscribers();
  //       console.log('✅ Added new message:', newMessage);
  //       console.log('📊 Current messages count:', this.messages.length);
  //     }
  //   }
  // }

  handleWebSocketMessage(message: WebSocketMessage) {
    if (this.isDestroyed) return;

    // Add userId to the message metadata if it's missing
    const messageWithUserId = {
      ...message,
      metadata: {
        ...message.metadata,
        userId: message.metadata?.userId || this.userId
      }
    };

    const exists = this.messages.some(m => 
      m.id === messageWithUserId.id || 
      (m.text === messageWithUserId.text && 
       Math.abs(m.timestamp - messageWithUserId.timestamp) < 1000)
    );

    if (!exists) {
      this.messages = [...this.messages, messageWithUserId as Message];
      this.notifySubscribers();
    }
  }

  subscribeToMessages(callback: (messages: Message[]) => void) {
    this.messageSubscribers.add(callback);
    return () => {
      this.messageSubscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.messageSubscribers.forEach(callback => callback(this.messages));
  }

  async sendMessage(text: string): Promise<void> {
    if (this.isDestroyed) return;
  
    this.isLoading = true;
    try {
      const timestamp = Date.now();
      const message: UserMessage = {
        id: `msg-${timestamp}`, // Use timestamp as part of ID
        text,
        type: "user",
        status: "sending",
        timestamp,
        metadata: {
          telegramMessageId: undefined,
          chatId: undefined,
          userId: this.userId
        }
      };
  
      this.intervalId = undefined
      this.messages.push(message);
      await sendTelegramMessage(text);
      console.log("Sent telegram message:", text);
  
      const messageIndex = this.messages.findIndex((m) => m.id === message.id);
      if (messageIndex !== -1) {
        const updatedMessage: UserMessage = {
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

  destroy(): void {
    this.isDestroyed = true;
    this.cleanup.forEach(cleanup => cleanup());
    this.cleanup = [];
    //this.messages = [];
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

}
