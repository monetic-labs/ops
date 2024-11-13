"use client";

import React from "react";
import { XIcon } from "lucide-react";
import { Kbd } from "@nextui-org/kbd";

interface ChatHeaderProps {
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => {
  return (
    <div className="p-4 border-b border-charyo-600">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">AI Chat</h2>
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
            <Kbd className="px-2 py-0.5" keys={["command"]}>k</Kbd>
            <span className="text-gray-400">(Global shortcut)</span>
          </div>
        </div>
        <button
          data-testid="chat-close-button"
          aria-label="Close chat"
          className="p-2 rounded-lg hover:bg-charyo-600 transition-colors"
          type="button"
          onClick={onClose}
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
