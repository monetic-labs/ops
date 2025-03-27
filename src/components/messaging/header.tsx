"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { XIcon, MessageCircle } from "lucide-react";

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
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2" data-testid="chat-title">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span>Support Chat</span>
        </h2>
        <Chip
          className="border-divider bg-content2/50 text-foreground/80 text-tiny"
          radius="sm"
          size="sm"
          variant="bordered"
        >
          {shortcutText}
        </Chip>
      </div>
      <Button
        isIconOnly
        className="bg-transparent text-foreground/50 hover:text-foreground hover:bg-content2/50"
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
