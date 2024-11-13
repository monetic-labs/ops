"use client";

import React, { useCallback, useEffect, useState } from "react";

import { useResizePanel } from "@/hooks/messaging/useResizePanel";

import { ChatHeader } from "./header";
import { ChatBody } from "./body";
import { ChatFooter } from "./footer";
import { useShortcuts } from "../generics/shortcuts-provider";

interface ChatPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({ isOpen, onClose }) => {
  const { width, isResizing, resizeHandleProps } = useResizePanel();
  const shortcuts = useShortcuts();
  const [mounted, setMounted] = useState(false);

  // Handle initial mount to prevent flash
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle test events
  useEffect(() => {
    const handleTestState = (event: CustomEvent) => {
      if (event.detail?.isOpen !== undefined) {
        console.log('Test state update:', event.detail);
        onClose(); // Call onClose to update parent state
      }
    };

    const handleContextUpdate = (event: CustomEvent) => {
      console.log('Pane received context update:', event.detail);
    };

    window.addEventListener('chat-pane-state' as any, handleTestState);
    window.addEventListener('update-chat-context' as any, handleContextUpdate);
    
    return () => {
      window.removeEventListener('chat-pane-state' as any, handleTestState);
      window.removeEventListener('update-chat-context' as any, handleContextUpdate);
    };
  }, [onClose]);

  // Sync prop state with context state
  useEffect(() => {
    if (isOpen !== shortcuts.isChatOpen) {
      if (isOpen) {
        shortcuts.openChat();
      } else {
        shortcuts.closeChat();
      }
    }
  }, [isOpen, shortcuts]);

  // Initialize WebSocket when chat pane opens
  useEffect(() => {
    if (!isOpen) return;

    console.log('Initializing WebSocket connection');
    
    const ws = new WebSocket(`ws://${window.location.hostname}:3001`);
    
    ws.onopen = () => console.log('WebSocket connected');
    ws.onclose = () => console.log('WebSocket disconnected');
    ws.onerror = (error) => console.error('WebSocket error:', error);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Forward all messages to chat context
        if (data.type === 'typing') {
          window.dispatchEvent(new CustomEvent('update-chat-context', {
            detail: {
              mode: 'support',
              isTyping: data.isTyping,
              messages: []
            }
          }));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    return () => {
      console.log('Closing WebSocket connection');
      ws.close();
    };
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        console.log('Escape pressed, closing pane');
        onClose();
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleClose = useCallback(() => {
    shortcuts.closeChat();
    onClose();
  }, [shortcuts, onClose]);

  return (
    <>
      {mounted && (
        <>
          {/* Backdrop with click handler */}
          <div
            data-testid="chat-backdrop"
            data-state={shortcuts.isChatOpen ? 'open' : 'closed'}
            className={`fixed inset-0 bg-black/50 transition-opacity
              ${shortcuts.isChatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={handleClose}
          />

      {/* Mobile overlay button */}
      {isOpen && (
        <button
          data-testid="chat-overlay-close"
          aria-label="Close chat overlay"
          className="fixed inset-0 transition-opacity lg:hidden bg-transparent border-0"
          type="button"
          onClick={handleClose}
        />
      )}

      {/* Chat Panel */}
      <div
        data-testid="chat-pane-container"
        data-state={shortcuts.isChatOpen ? 'open' : 'closed'}
        className={`fixed left-0 top-0 h-full bg-charyo-500/80 shadow-lg transform 
          transition-transform duration-300 z-50 flex flex-col
          ${shortcuts.isChatOpen ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal={shortcuts.isChatOpen}
        aria-label="Chat panel"
        style={{ 
          width: `${width}px`,
          transition: isResizing ? 'none' : 'transform 300ms' // Disable transition during resize
        }}
      >
        <ChatHeader onClose={handleClose} />
        <ChatBody />
        <ChatFooter />

        {/* Resize Handle */}
        <button
          {...resizeHandleProps}
          data-testid="resize-handle"
          aria-label="Resize chat panel"
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize 
            hover:bg-ualert-500/50 ${isResizing ? "bg-ualert-500" : "bg-charyo-500"}
            appearance-none border-0 p-0 m-0
            ${shortcuts.isChatOpen ? 'visible' : 'invisible'}`}  // Add visibility toggle
            type="button"
          >
            <div
              aria-hidden="true"
              className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 -mr-2 
              flex items-center justify-center"
            >
              <div className="w-1 h-4 bg-gray-300 rounded-full" />
            </div>
          </button>
          </div>
        </>
      )}
    </>
  );
};  