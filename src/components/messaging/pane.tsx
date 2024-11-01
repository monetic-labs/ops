"use client";

import React from "react";

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

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <button
          aria-label="Close chat overlay"
          className="fixed inset-0 transition-opacity lg:hidden bg-transparent border-0"
          type="button"
          onClick={onClose}
        />
      )}

      {/* Chat Panel */}
      <div
        aria-hidden={!isOpen}
        className={`fixed left-0 top-0 h-full bg-charyo-500/80 shadow-lg transform 
          transition-transform duration-300 z-50 flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        style={{ width: `${width}px` }}
      >
        <ChatHeader onClose={onClose} />
        <ChatBody />
        <ChatFooter />

        {/* Resize Handle */}
        <button
          {...resizeHandleProps}
          aria-label="Resize chat panel"
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize 
            hover:bg-ualert-500/50 ${isResizing ? "bg-ualert-500" : "bg-charyo-500"}
            appearance-none border-0 p-0 m-0`}
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
