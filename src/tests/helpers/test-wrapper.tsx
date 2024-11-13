import React, { useEffect, useMemo, useState } from 'react';
import { ChatContext } from '@/hooks/messaging/useChatContext';
import { AgentChatContext, SupportChatContext, ChatContextType, Message, SupportMessageService, AgentMessageService } from '@/types/messaging';
import { ShortcutsContext } from '@/components/generics/shortcuts-provider';

const agentContext: AgentChatContext = {
  mode: 'agent',
  messages: [],
  inputValue: '',
  setInputValue: () => {},
  sendMessage: async () => {},
  handleSubmit: async () => {},
  userId: 'test-user',
  service: {
    type: 'openai',
    isLoading: false,
    model: 'gpt-4',
    messages: [],
    inputValue: '',
    setInputValue: () => {},
    sendMessage: async () => {},
    handleSubmit: async () => {},
    getUserId: () => 'test-user'
  },
  chatHelpers: {
    isLoading: false,
    messages: [],
    input: '',
    handleSubmit: async () => {},
    handleInputChange: () => {},
    setInput: () => {},
    error: undefined,
    append: async () => '',
    reload: async () => '',
    stop: async () => '',
    setMessages: () => {},
    setData: () => {},
  },
  isTyping: false
};

const supportContext: SupportChatContext = {
  mode: 'support',
  messages: [],
  inputValue: '',
  setInputValue: () => {},
  sendMessage: async () => {},
  handleSubmit: async () => {},
  userId: 'test-user',
  service: {
    type: 'telegram',
    channel: 'default',
    isTyping: false,
    isLoading: false,
    messages: [],
    inputValue: '',
    setInputValue: () => {},
    sendMessage: async () => {},
    handleSubmit: async () => {},
    handleWebSocketMessage: () => {},
    getUserId: () => 'test-user'
  },
  isTyping: false
};

interface TestWrapperProps {
  children: React.ReactNode;
  mode?: 'agent' | 'support';
}

export function TestWrapper({ children, mode = 'agent' }: TestWrapperProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleSetTyping = (e: CustomEvent<boolean>) => {
      console.log('Setting typing state:', e.detail);
      setIsTyping(e.detail);
      
      // Debug the state change
      console.log('Typing state updated:', {
        previous: isTyping,
        new: e.detail,
        mode
      });
    };

    const handleAddMessages = (e: CustomEvent<Message[]>) => {
      console.log('Adding messages:', e.detail);
      setMessages(e.detail);
    };

    const handleSetInput = (e: CustomEvent<string>) => {
      console.log('Setting input value:', e.detail);
      setInputValue(e.detail);
    };

    const handleChatState = (event: CustomEvent<{ isOpen: boolean }>) => {
      console.log('TestWrapper: Setting chat state:', event.detail);
      setIsChatOpen(event.detail.isOpen);
    };

    // Add event listeners
    window.addEventListener('set-typing', handleSetTyping as EventListener);
    window.addEventListener('add-messages', handleAddMessages as EventListener);
    window.addEventListener('set-input', handleSetInput as EventListener);
    window.addEventListener('force-chat-state', handleChatState as EventListener);
    // Debug mount
    console.log('TestWrapper mounted with mode:', mode);

    // Set initial closed state
    setIsChatOpen(false);

    // Cleanup
    return () => {
      window.removeEventListener('set-typing', handleSetTyping as EventListener);
      window.removeEventListener('add-messages', handleAddMessages as EventListener);
      window.removeEventListener('set-input', handleSetInput as EventListener);
      window.removeEventListener('force-chat-state', handleChatState as EventListener);
    };
  }, []);

  // Create shortcuts context value
  const shortcutsValue = useMemo(() => ({
    isChatOpen,
    openChat: () => setIsChatOpen(true),
    closeChat: () => setIsChatOpen(false),
    toggleChat: () => setIsChatOpen(prev => !prev)
  }), [isChatOpen]);

  // Create context value
  const contextValue = useMemo(() => {
    const baseContext = mode === 'agent' ? agentContext : supportContext;
    return {
      ...baseContext,
      messages,
      isTyping: mode === 'agent' ? false : isTyping,
      inputValue,
      setInputValue: (value: string) => {
        setInputValue(value);
        window.dispatchEvent(new CustomEvent('set-input', { detail: value }));
      },
      service: mode === 'agent' 
        ? {
            ...agentContext.service,
            messages,
            inputValue,
          } as AgentMessageService
        : {
            ...supportContext.service,
            isTyping,
            messages,
            inputValue,
            channel: 'default',
          } as SupportMessageService
    } as ChatContextType;
  }, [mode, messages, isTyping, inputValue]);

  return (
    <ShortcutsContext.Provider value={shortcutsValue}>
      <ChatContext.Provider value={contextValue}>
        {children}
      </ChatContext.Provider>
    </ShortcutsContext.Provider>
  );
}