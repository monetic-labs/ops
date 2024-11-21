"use client";

import { useGlobalShortcuts } from "@/hooks/generics/useGlobalShortcuts";
import React, { createContext, useContext, useEffect, useMemo } from "react";
import { ChatPane } from "../messaging/pane";

interface ShortcutsContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
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
};

export function ShortcutsProvider({ 
  children, 
  disablePane = false,
  initialValue = {}
}: ShortcutsProviderProps) {
  const [state, setState] = React.useState({
    isChatOpen: initialValue.isChatOpen ?? DEFAULT_VALUES.isChatOpen
  });

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
    metaKey: true // This makes it Cmd+K on Mac and Ctrl+K on Windows
  });

  const contextValue = useMemo(() => ({
    ...DEFAULT_VALUES,
    ...initialValue,
    isChatOpen: state.isChatOpen,
    openChat: () => {
      if (disablePane) return;
      setState(prev => ({ ...prev, isChatOpen: true }));
    },
    closeChat: () => {
      if (disablePane) return;
      setState(prev => ({ ...prev, isChatOpen: false }));
    },
    toggleChat: () => {
      if (disablePane) return;
      setState(prev => ({ ...prev, isChatOpen: !prev.isChatOpen }));
    }
  }), [disablePane, state.isChatOpen, initialValue, toggleChat]);

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
}

export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error("useShortcuts must be used within a ShortcutsProvider");
  }
  return context;
}
