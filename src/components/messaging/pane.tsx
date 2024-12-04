"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useResizePanel } from "@/hooks/messaging/useResizePanel";

import { ChatHeader } from "./header";
import { ChatBody } from "./body";
import { ChatFooter } from "./footer";

interface ChatPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({ isOpen, onClose }) => {
  const { width, isResizing, resizeHandleProps } = useResizePanel();
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine mount and focus effects
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isResizing) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isResizing, onClose]);

  // const handleClose = useCallback(() => {
  //   if (isResizing) return;
  //   onClose();
  // }, [onClose, isResizing]);
  const handleClose = useCallback(() => {
    if (!isResizing) {
      onClose();
    }
  }, [isResizing, onClose]);

  if (!mounted) return null;

  return (
    <>
      <button
        aria-label="Close chat"
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        data-state={isOpen ? "open" : "closed"}
        data-testid="chat-backdrop"
        type="button"
        onClick={handleClose}
      />

      <div
        className={`fixed left-0 top-0 h-full bg-charyo-500/80 shadow-lg transform 
          transition-transform duration-300 z-50 flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        data-state={isOpen ? "open" : "closed"}
        data-testid="chat-pane-container"
        style={{ width: `${width}px` }}
      >
        <ChatHeader onClose={handleClose} />
        <ChatBody />
        <ChatFooter inputRef={inputRef} />

        {/* Resize Handle */}
        <div
          className={`absolute right-0 top-0 w-1 h-full cursor-ew-resize hover:bg-ualert-500/50
            ${isResizing ? 'bg-ualert-500/50' : 'bg-transparent'}`}
          {...resizeHandleProps}
          data-testid="chat-pane-resize-handle"
        />
      </div>
    </>
  );
};