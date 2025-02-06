"use client";

import React from "react";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { XIcon, Bot, MessageCircle } from "lucide-react";

import { useMessagingState } from "@/libs/messaging/store";

interface ChatHeaderProps {
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => {
  const { mode } = useMessagingState();
  const shortcutText = process.platform === "darwin" ? "⌘K" : "Ctrl+K";

  return (
    <header className="flex items-center justify-between w-full" data-testid="chat-header">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2" data-testid="chat-title">
          {mode === "bot" ? (
            <>
              <Bot className="w-5 h-5 text-ualert-500" />
              <span>Atlas Assistant</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5 text-ualert-500" />
              <span>Support Chat</span>
            </>
          )}
        </h2>
        <Chip className="border-charyo-400/30 bg-charyo-400/10 text-tiny" radius="sm" size="sm" variant="bordered">
          {shortcutText}
        </Chip>
      </div>
      <Button
        isIconOnly
        className="bg-transparent text-default-500 hover:text-white hover:bg-charyo-400/20 ml-auto"
        radius="full"
        size="sm"
        variant="light"
        onPress={onClose}
      >
        <XIcon className="w-4 h-4" />
      </Button>
    </header>
  );
};
