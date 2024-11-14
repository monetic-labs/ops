"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useGlobalShortcuts } from '@/hooks/generics/useGlobalShortcuts';
import { ChatPane } from '@/components/messaging/pane';
import { ShortcutsContextType } from '@/tests/helpers/test-types';

const defaultContext: ShortcutsContextType = {
    isChatOpen: false,
    openChat: () => {},
    closeChat: () => {},
    toggleChat: () => {}
};

export const ShortcutsContext = createContext<ShortcutsContextType>(defaultContext);

export function useShortcuts() {
    const context = useContext(ShortcutsContext);
    if (!context) {
      throw new Error('useShortcuts must be used within a ShortcutsProvider');
    }
    return context;
}

export function ShortcutsProvider({ 
    children, 
    disablePane = false, 
    value 
}: { 
    children: React.ReactNode, 
    disablePane?: boolean, 
    value?: ShortcutsContextType 
}) {
  // Remove internal state management
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use value or default context based on environment
  const contextValue = useMemo(() => {
    if (process.env.NODE_ENV === 'production' && !value) {
      throw new Error('ShortcutsProvider requires a value prop in production');
    }
    return value || defaultContext;
  }, [value]);

  // Remove event listeners from ShortcutsProvider
  useGlobalShortcuts('k', value?.toggleChat || (() => {}), {
    metaKey: true,
  });

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check for platform-specific modifier key
      const isMac = navigator.userAgent.toLowerCase().includes('mac');
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;
      
      if (modifierKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        event.stopPropagation();
        console.log('Keyboard shortcut detected:', event.key, 'modifier:', modifierKey);
        contextValue.toggleChat();
      }
    };
  
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [contextValue.toggleChat]);

  return (
    <ShortcutsContext.Provider value={contextValue}>
      {children}
      {mounted && !disablePane && (
        <ChatPane 
          isOpen={contextValue.isChatOpen} 
          onClose={contextValue.closeChat}
          data-testid="provider-chat-pane"
        />
      )}
    </ShortcutsContext.Provider>
  );
}