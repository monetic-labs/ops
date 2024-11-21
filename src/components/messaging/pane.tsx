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

  // Handle initial mount to prevent flash
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle test events
  useEffect(() => {
    const handleTestState = (event: CustomEvent) => {
      if (event.detail?.isOpen === undefined) return;

      // Prevent recursive updates
      if (event.detail.isOpen !== shortcuts.isChatOpen) {
        if (event.detail.isOpen) {
          shortcuts.openChat();
        } else {
          shortcuts.closeChat();
        }
      }
    };

    const handleContextUpdate = (event: CustomEvent) => {
      console.log("Pane received context update:", event.detail);
    };

    window.addEventListener("chat-pane-state" as any, handleTestState);
    window.addEventListener("update-chat-context" as any, handleContextUpdate);

    return () => {
      window.removeEventListener("chat-pane-state" as any, handleTestState);
      window.removeEventListener("update-chat-context" as any, handleContextUpdate);
    };
  }, [shortcuts]);

  // Sync prop state with context state - but prevent infinite loops
  useEffect(() => {
    const shouldUpdate = isOpen !== shortcuts.isChatOpen;

    if (shouldUpdate) {
      if (isOpen) {
        shortcuts.openChat();
      } else {
        shortcuts.closeChat();
      }
    }
  }, [isOpen, shortcuts.isChatOpen, shortcuts]);

  // Initialize WebSocket when chat pane opens
  useEffect(() => {
    if (!isOpen) return;

    console.log("Initializing WebSocket connection");

    const ws = new WebSocket(`ws://${window.location.hostname}:3001`);

    ws.onopen = () => {};
    ws.onclose = () => {};
    ws.onerror = (error) => {};

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        console.log("WebSocket message received:", data);

        // Forward all messages to chat context
        if (data.type === "typing") {
          window.dispatchEvent(
            new CustomEvent("update-chat-context", {
              detail: {
                mode: "support",
                isTyping: data.isTyping,
                messages: [],
              },
            })
          );
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    return () => {
      console.log("Closing WebSocket connection");
      ws.close();
    };
  }, [isOpen]);

  // Handle escape key
  const handleClose = useCallback(() => {
    console.log("Pane close requested");
    setIsClosing(true);
    // Wait for transition
    setTimeout(() => {
      onClose?.();
      shortcuts.closeChat();
      setIsClosing(false);
    }, 300); // Match transition duration
  }, [onClose, shortcuts]);

  // Update the escape key handler to be more reliable
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        console.log("Escape pressed, closing pane");
        // Dispatch a custom event before closing
        window.dispatchEvent(new CustomEvent("chat-escape-pressed"));
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle test state forcing
  useEffect(() => {
    const handleForceState = (event: CustomEvent) => {
      if (event.detail?.isOpen !== undefined) {
        if (event.detail.isOpen) {
          shortcuts.openChat();
        } else {
          shortcuts.closeChat();
        }
      }

      // Ensure DOM is updated
      requestAnimationFrame(() => {
        const pane = document.querySelector('[data-testid="chat-pane-container"]');

        if (pane) {
          pane.setAttribute("data-state", event.detail.isOpen ? "open" : "closed");
          if (event.detail.isOpen) {
            pane.classList.remove("-translate-x-full");
            pane.classList.add("translate-x-0");
          } else {
            pane.classList.add("-translate-x-full");
            pane.classList.remove("translate-x-0");
          }
        }
      });
    };

    window.addEventListener("force-chat-state" as any, handleForceState);

    return () => window.removeEventListener("force-chat-state" as any, handleForceState);
  }, [shortcuts]);

  // Sync with shortcuts state
  useEffect(() => {
    if (mounted && isOpen !== shortcuts.isChatOpen) {
      if (isOpen) {
        shortcuts.openChat();
      } else {
        shortcuts.closeChat();
      }
    }
  }, [isOpen, shortcuts, mounted]);

  if (!mounted) return null;

  return (
    <>
      {mounted && (
        <>
          {/* Backdrop with click handler */}
          <button
            aria-label="Close chat"
            className={`fixed inset-0 bg-black/50 transition-opacity
              ${shortcuts.isChatOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            data-state={shortcuts.isChatOpen ? "open" : "closed"}
            data-testid="chat-backdrop"
            type="button"
            onClick={handleClose}
            onKeyDown={(e) => e.key === "Escape" && handleClose()}
          />

          {/* Mobile overlay button */}
          {isOpen && (
            <button
              aria-label="Close chat overlay"
              className="fixed inset-0 transition-opacity lg:hidden bg-transparent border-0"
              data-testid="chat-overlay-close"
              type="button"
              onClick={handleClose}
            />
          )}

          {/* Chat Panel */}
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
              transition: isResizing ? "none" : "transform 300ms", // Disable transition during resize
            }}
          >
            <ChatHeader onClose={handleClose} />
            <ChatBody />
            <ChatFooter />

            {/* Resize Handle */}
            <button
              {...resizeHandleProps}
              aria-label="Resize chat panel"
              data-testid="chat-pane-resize-handle"
              className={`absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize 
            hover:bg-ualert-500/50 ${isResizing ? "bg-ualert-500" : "bg-charyo-500"}
            appearance-none border-0 p-0 m-0
            ${shortcuts.isChatOpen ? "visible" : "invisible"}`} // Add visibility toggle
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
