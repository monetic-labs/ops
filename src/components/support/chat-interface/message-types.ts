export type MessageType = 'user' | 'bot' | 'telegram' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface Message {
  id: string;
  text: string;
  type: MessageType;
  status: MessageStatus;
  metadata?: {
    botContext?: string;
    telegramMessageId?: number;
    isProcessing?: boolean;
  };
}

export interface ChatContextType {
  messages: Message[];
  mode: 'bot' | 'support';
  sendMessage: (text: string) => Promise<void>;
  switchMode: (mode: 'bot' | 'support') => void;
}