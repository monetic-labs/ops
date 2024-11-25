"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useResizePanel } from "@/hooks/messaging/useResizePanel";
import { useShortcuts } from "../generics/shortcuts-provider";

import { ChatHeader } from "./header";
import { ChatBody } from "./body";
import { ChatFooter } from "./footer";

interface ChatPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({ isOpen, onClose }) => {
  const { width, isResizing, resizeHandleProps } = useResizePanel();
  const shortcuts = useShortcuts();
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle initial mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle test events
  useEffect(() => {
    const handleTestState = (event: CustomEvent) => {
      if (event.detail?.isOpen === undefined) return;
      if (event.detail.isOpen === shortcuts.isChatOpen) return;
      event.detail.isOpen ? shortcuts.openChat() : shortcuts.closeChat();
    };

    window.addEventListener("chat-pane-state" as any, handleTestState);
    return () => window.removeEventListener("chat-pane-state" as any, handleTestState);
  }, [shortcuts]);

  // Sync prop state with shortcuts
  useEffect(() => {
    if (!mounted || isOpen === shortcuts.isChatOpen) return;
    isOpen ? shortcuts.openChat() : shortcuts.closeChat();
  }, [isOpen, shortcuts, mounted]);

  // Handle close with transition
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    onClose?.();
    shortcuts.closeChat();
    setTimeout(() => setIsClosing(false), 300);
  }, [onClose, shortcuts, isClosing]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shortcuts.isChatOpen && !isResizing) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [shortcuts.isChatOpen, handleClose, isResizing]);

  if (!mounted) return null;

  return (
    <>
      <button
        aria-label="Close chat"
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300
          ${shortcuts.isChatOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        data-state={shortcuts.isChatOpen ? "open" : "closed"}
        data-testid="chat-backdrop"
        type="button"
        onClick={handleClose}
      />

      <div
        aria-label="Chat panel"
        aria-modal={shortcuts.isChatOpen}
        className={`fixed left-0 top-0 h-full bg-charyo-500/80 shadow-lg transform 
          transition-transform duration-300 z-50 flex flex-col
          ${shortcuts.isChatOpen ? "translate-x-0" : "-translate-x-full"}`}
        data-state={shortcuts.isChatOpen ? "open" : "closed"}
        data-testid="chat-pane-container"
        role="dialog"
        style={{
          width: `${width}px`,
          transition: isResizing ? "none" : "transform 300ms ease-in-out",
        }}
      >
        <ChatHeader onClose={handleClose} />
        <ChatBody />
        <ChatFooter />

        <button
          {...resizeHandleProps}
          aria-label="Resize chat panel"
          data-testid="chat-pane-resize-handle"
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize 
            hover:bg-ualert-500/50 ${isResizing ? "bg-ualert-500" : "bg-charyo-500"}
            appearance-none border-0 p-0 m-0
            ${shortcuts.isChatOpen ? "visible" : "invisible"}`}
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
  );
};
