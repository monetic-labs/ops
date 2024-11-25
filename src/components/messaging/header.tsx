"use client";

import React from "react";
import { XIcon } from "lucide-react";
import { Kbd } from "@nextui-org/kbd";

interface ChatHeaderProps {
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => {
  const shortcutText = process.platform === 'darwin' ? '⌘K' : 'Ctrl+K';

  return (
    <header 
      className="flex items-center justify-between p-4 border-b border-charyo-400"
      data-testid="chat-header"
    >
      <div className="flex items-center gap-2">
        <h2 
          className="text-lg font-semibold text-white"
          data-testid="chat-title"
        >
          Atlas
        </h2>
        <kbd 
          className="text-sm text-gray-400 px-2 py-1 rounded border border-gray-600"
          data-testid="chat-shortcut"
        >
          {shortcutText}
        </kbd>
      </div>

      <button
        aria-label="Close chat"
        className="p-2 text-gray-400 hover:text-white transition-colors rounded-full
          hover:bg-charyo-400/20"
        data-testid="chat-close"
        onClick={onClose}
        type="button"
      >
        <XIcon className="w-5 h-5" />
      </button>
    </header>
  );
};
