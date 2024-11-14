import { useCallback, useRef } from "react";

import React, { useEffect, useMemo, useState } from 'react';
import { ChatContext } from '@/hooks/messaging/useChatContext';
import { AgentChatContext, SupportChatContext, ChatContextType, Message, SupportMessageService, AgentMessageService } from '@/types/messaging';
import { ShortcutsProvider } from '@/components/generics/shortcuts-provider';

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
  // State management remains the same
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const stateRef = useRef(isChatOpen);
  const isTransitioning = useRef(false);

  // Update syncDOMState to match ShortcutsProvider implementation
  const syncDOMState = useCallback((newState: boolean) => {
    if (stateRef.current === newState) {
      return;
    }

    requestAnimationFrame(() => {
      const pane = document.querySelector('[data-testid="chat-pane-container"]');
      if (pane) {
        const state = newState ? 'open' : 'closed';
        pane.setAttribute('data-state', state);
        pane.setAttribute('aria-modal', String(newState));
        
        if (newState) {
          pane.classList.remove('-translate-x-full');
          pane.classList.add('translate-x-0');
        } else {
          pane.classList.add('-translate-x-full');
          pane.classList.remove('translate-x-0');
        }
      }
    });
  }, []);

  // Centralized state update function
  const updateChatState = useCallback(async (newState: boolean) => {
    if (isTransitioning.current) return;
    if (stateRef.current === newState) return;

    isTransitioning.current = true;
    try {
      console.log(`${newState ? 'Opening' : 'Closing'} chat from TestWrapper`);
      stateRef.current = newState;
      setIsChatOpen(newState);
      
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const pane = document.querySelector('[data-testid="chat-pane-container"]');
          if (pane) {
            pane.setAttribute('data-state', newState ? 'open' : 'closed');
            pane.setAttribute('aria-modal', String(newState));
            
            if (newState) {
              pane.classList.remove('-translate-x-full');
              pane.classList.add('translate-x-0');
            } else {
              pane.classList.add('-translate-x-full');
              pane.classList.remove('translate-x-0');
            }
          }
          setTimeout(resolve, 100); // Allow time for transitions
        });
      });
    } finally {
      isTransitioning.current = false;
    }
  }, []);
  
  // Update state handlers to be async
  const shortcutsValue = useMemo(() => ({
    isChatOpen,
    openChat: () => updateChatState(true),
    closeChat: () => updateChatState(false),
    toggleChat: () => updateChatState(!stateRef.current)
  }), [isChatOpen, updateChatState]);

  // Handle external state changes
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      if (event.detail?.isOpen !== undefined) {
        updateChatState(event.detail.isOpen);
      }
    };

    window.addEventListener('force-chat-state', handleStateChange as EventListener);
    return () => {
      window.removeEventListener('force-chat-state', handleStateChange as EventListener);
    };
  }, [updateChatState]);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.userAgent.toLowerCase().includes('mac');
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
          
      if (modifierKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        event.stopPropagation();
        console.log('TestWrapper: Keyboard shortcut detected');
        updateChatState(!stateRef.current);
      }
    };
    
    // Add the event listener
    document.addEventListener('keydown', handleKeyDown);
    console.log('TestWrapper: Keyboard shortcut handler registered');
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      console.log('TestWrapper: Keyboard shortcut handler removed');
    };
  }, [updateChatState]);

  // Add handlers for other events
  useEffect(() => {
    const handleSetTyping = (event: CustomEvent) => {
      setIsTyping(event.detail);
    };

    const handleAddMessages = (event: CustomEvent) => {
      setMessages(prev => [...prev, ...event.detail]);
    };

    const handleSetInput = (event: CustomEvent) => {
      setInputValue(event.detail);
    };

    const handleStateChange = (event: CustomEvent) => {
      const newState = event.detail?.isOpen;
      if (newState !== undefined && stateRef.current !== newState) {
        console.log('TestWrapper: Setting chat state:', event.detail);
        stateRef.current = newState;
        setIsChatOpen(newState);
        syncDOMState(newState);
      }
    };

    window.addEventListener('set-typing', handleSetTyping as EventListener);
    window.addEventListener('add-messages', handleAddMessages as EventListener);
    window.addEventListener('set-input', handleSetInput as EventListener);
    window.addEventListener('force-chat-state', handleStateChange as EventListener);

    console.log('TestWrapper mounted with mode:', mode);

    return () => {
      window.removeEventListener('set-typing', handleSetTyping as EventListener);
      window.removeEventListener('add-messages', handleAddMessages as EventListener);
      window.removeEventListener('set-input', handleSetInput as EventListener);
      window.removeEventListener('force-chat-state', handleStateChange as EventListener);
    };
  }, [mode, syncDOMState]);

  // Mock context setup remains the same
  useEffect(() => {
    window.__MOCK_SHORTCUTS_CONTEXT__ = shortcutsValue;
    return () => {
      delete window.__MOCK_SHORTCUTS_CONTEXT__;
    };
  }, [shortcutsValue]);

  // Update context value creation
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
    <ShortcutsProvider value={shortcutsValue} disablePane={true}>
      <ChatContext.Provider value={contextValue}>
        {children}
      </ChatContext.Provider>
    </ShortcutsProvider>
  );
}