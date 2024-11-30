"use client";

import { useGlobalShortcuts } from "@/hooks/generics/useGlobalShortcuts";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ChatPane } from "../messaging/pane";

interface ShortcutsContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  shortcutKey: string;
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null);

interface ShortcutsProviderProps {
  children: React.ReactNode;
  disablePane?: boolean;
  initialValue?: Partial<ShortcutsContextType>;
}

const DEFAULT_VALUES: ShortcutsContextType = {
  isChatOpen: false,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  shortcutKey: 'k',
};

export const ShortcutsProvider: React.FC<ShortcutsProviderProps> = ({ 
  children, 
  disablePane, 
  initialValue 
}) => {
  const [state, setState] = useState({ isChatOpen: false });
  const [mounted, setMounted] = useState(false);
  const [shortcutDisplay, setShortcutDisplay] = useState('');

  // Handle hydration and OS detection
  useEffect(() => {
    setMounted(true);
    const isMac = typeof window !== 'undefined' && 
      window.navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setShortcutDisplay(isMac ? '⌘K' : 'Ctrl+K');
  }, []);

  // Emit state changes for testing
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("shortcuts-state-change", {
        detail: { isChatOpen: state.isChatOpen }
      })
    );
  }, [state.isChatOpen]);

  // Handle test events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleForceState = (event: CustomEvent) => {
      if (event.detail?.isOpen !== undefined) {
        setState(prev => ({ ...prev, isChatOpen: event.detail.isOpen }));
      }
    };

    window.addEventListener("force-chat-state" as any, handleForceState);
    return () => window.removeEventListener("force-chat-state" as any, handleForceState);
  }, []);

  const toggleChat = React.useCallback(() => {
    if (disablePane) return;
    setState(prev => ({ ...prev, isChatOpen: !prev.isChatOpen }));
  }, [disablePane]);

  // Register global shortcut
  useGlobalShortcuts("k", toggleChat, {
    isEnabled: !disablePane,
    metaKey: true
  });

  const contextValue = useMemo(() => ({
    ...DEFAULT_VALUES,
    ...initialValue,
    isChatOpen: state.isChatOpen,
    shortcutKey: shortcutDisplay, // Use the OS-specific display
    openChat: () => {
      if (disablePane) return;
      setState(prev => ({ ...prev, isChatOpen: true }));
    },
    closeChat: () => {
      if (disablePane) return;
      setState(prev => ({ ...prev, isChatOpen: false }));
    },
    toggleChat
  }), [disablePane, state.isChatOpen, initialValue, toggleChat, shortcutDisplay]);

  // Don't render until after hydration
  if (!mounted) {
    return null;
  }

  return (
    <ShortcutsContext.Provider value={contextValue}>
      {children}
      {!disablePane && state.isChatOpen && (
        <ChatPane 
          isOpen={state.isChatOpen} 
          onClose={() => setState(prev => ({ ...prev, isChatOpen: false }))} 
        />
      )}
    </ShortcutsContext.Provider>
  );
};

export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error("useShortcuts must be used within a ShortcutsProvider");
  }
  return context;
}