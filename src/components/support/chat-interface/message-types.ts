export type MessageType = 'user' | 'bot' | 'telegram' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'error';

interface BaseMetadata {
  isProcessing?: boolean;
}

interface TelegramMetadata extends BaseMetadata {
  telegramMessageId?: number;
  botContext?: string;
}

interface RAGMetadata extends BaseMetadata {
  sources?: string[];
}

export interface Message {
  id: string;
  text: string;
  type: MessageType;
  status: MessageStatus;
  metadata?: TelegramMetadata | RAGMetadata;
}

export interface ChatContextType {
  messages: Message[];
  mode: 'bot' | 'support';
  sendMessage: (text: string) => Promise<void>;
  switchMode: (mode: 'bot' | 'support') => void;
}

// Type Guards
export const isRAGMetadata = (metadata: unknown): metadata is RAGMetadata => {
  return typeof metadata === 'object' && 
         metadata !== null && 
         'sources' in metadata;
};