'use client';

import { useChat } from 'ai/react';
import { ChatContext } from '@/hooks/messaging/useChatContext';
import { useChatMode } from '@/hooks/messaging/useChatMode';

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { mode } = useChatMode();
  const chatHelpers = useChat({
    api: mode === 'agent' ? '/api/messaging/agent/chat' : undefined,
  });

  return (
    <ChatContext.Provider value={chatHelpers}>
      {children}
    </ChatContext.Provider>
  );
};