import { createContext, useContext } from 'react';
import { UseChatHelpers } from 'ai/react';

export const ChatContext = createContext<UseChatHelpers | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatContextProvider');
  }
  return context;
}