"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useGlobalShortcuts } from '@/hooks/generics/useGlobalShortcuts';
import { ChatPane } from '@/components/messaging/pane';

interface ShortcutsContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

// Initialize with default values
const defaultContext: ShortcutsContextType = {
    isChatOpen: false,
    openChat: () => {},
    closeChat: () => {},
    toggleChat: () => {},
};

export const ShortcutsContext = createContext<ShortcutsContextType>(defaultContext);

// Add a custom hook for using the context
export function useShortcuts() {
    const context = useContext(ShortcutsContext);
    if (!context) {
      throw new Error('useShortcuts must be used within a ShortcutsProvider');
    }
    return context;
}

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Ensure initial closed state
    setIsChatOpen(false);
  }, []);

  const openChat = useCallback(() => setIsChatOpen(true), []);
  const closeChat = useCallback(() => setIsChatOpen(false), []);
  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => {
      const newState = !prev;
      
      // Update DOM immediately
      const pane = document.querySelector('[data-testid="chat-pane-container"]');
      if (pane) {
        pane.setAttribute('data-state', newState ? 'open' : 'closed');
        if (newState) {
          pane.classList.remove('-translate-x-full');
        } else {
          pane.classList.add('-translate-x-full');
        }
      }
      
      return newState;
    });
  }, []);

  // Handle global keyboard shortcut
  useGlobalShortcuts('k', toggleChat, {
    metaKey: true, // For Command+K
  });

  // Handle force-chat-state event
  useEffect(() => {
    const handleChatState = (event: CustomEvent<{ isOpen: boolean }>) => {
        console.log('ShortcutsProvider: Setting chat state:', event.detail);
        setIsChatOpen(event.detail.isOpen);
    };

    window.addEventListener('force-chat-state', handleChatState as EventListener);
    return () => {
        window.removeEventListener('force-chat-state', handleChatState as EventListener);
    };
  }, []);

  // Handle test events
  useEffect(() => {
    const handleTestState = (event: CustomEvent) => {
      if (event.detail?.isOpen !== undefined) {
        console.log('Test state update:', event.detail);
        setIsChatOpen(event.detail.isOpen);
      }
    };
    
    window.addEventListener('chat-pane-state' as any, handleTestState);
    return () => window.removeEventListener('chat-pane-state' as any, handleTestState);
  }, []);
  
  const handleForceState = useCallback((event: CustomEvent) => {
    if (event.detail?.isOpen !== undefined) {
      console.log('ShortcutsProvider: Forcing chat state:', event.detail.isOpen);
      setIsChatOpen(event.detail.isOpen);
      
      // Ensure DOM is updated synchronously
      const pane = document.querySelector('[data-testid="chat-pane-container"]');
      if (pane) {
        pane.setAttribute('data-state', event.detail.isOpen ? 'open' : 'closed');
        pane.setAttribute('aria-modal', event.detail.isOpen.toString());
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('force-chat-state', handleForceState as EventListener);
    return () => {
      window.removeEventListener('force-chat-state', handleForceState as EventListener);
    };
  }, [handleForceState]);

  const contextValue = useMemo(() => ({
    isChatOpen,
    openChat: () => setIsChatOpen(true),
    closeChat: () => setIsChatOpen(false),
    toggleChat
  }), [isChatOpen, toggleChat]);

  return (
    <ShortcutsContext.Provider value={contextValue}>
      {children}
      {mounted && (
        <ChatPane 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          data-testid="chat-pane"
        />
      )}
    </ShortcutsContext.Provider>
  );
}
