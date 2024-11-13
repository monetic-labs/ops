'use client';

import { useEffect, useState } from 'react';
import { ChatBody } from '@/components/messaging/body';
import { TestWrapper } from '@/tests/helpers/test-wrapper';
import { useSearchParams } from 'next/navigation';
import { ChatContext } from '@/hooks/messaging/useChatContext';
import { Message } from '@/types/messaging';
import { createMockChatContext } from '@/tests/helpers/mock-chat-context';
import { ModeSwitcher } from '@/components/messaging/mode-switcher';
import { ChatPane } from '@/components/messaging/pane';

export default function TestPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') as 'agent' | 'support' || 'agent';
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isPaneOpen, setIsPaneOpen] = useState(true);

  const chatContextValue = createMockChatContext(mode, messages);

  useEffect(() => {
    const handleSetTyping = (e: CustomEvent) => {
      setIsTyping(e.detail);
    };

    const handleAddMessages = (e: CustomEvent) => {
      setMessages(e.detail);
    };

    const handlePaneState = (e: CustomEvent) => {
      setIsPaneOpen(e.detail.isOpen);
    };
    
    window.addEventListener('set-typing', handleSetTyping as EventListener);
    window.addEventListener('add-messages', handleAddMessages as EventListener);
    window.addEventListener('chat-pane-state', handlePaneState as EventListener);

    return () => {
      window.removeEventListener('set-typing', handleSetTyping as EventListener);
      window.removeEventListener('add-messages', handleAddMessages as EventListener);
      window.removeEventListener('chat-pane-state', handlePaneState as EventListener);
    };
  }, []);

  const handlePaneClose = () => {
    console.log('Pane close requested');
    setIsPaneOpen(false);
    
    // Dispatch event for test visibility
    window.dispatchEvent(new CustomEvent('chat-pane-state', {
      detail: { isOpen: false }
    }));
  };

  return (
    <TestWrapper mode={mode}>
      <ChatContext.Provider value={chatContextValue}>
        <div className="h-screen flex flex-col">
          <div data-testid="debug-mount">Test Page Mounted</div>
          <ModeSwitcher />
          <ChatBody />
          <ChatPane 
            isOpen={isPaneOpen}
            onClose={handlePaneClose}
          />
        </div>
      </ChatContext.Provider>
    </TestWrapper>
  );
}