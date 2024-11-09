"use client";

import React from "react";
import { Message as AIMessage } from "ai";
import { Message as CustomMessage } from "@/types/messaging";

interface MessageBubbleProps {
  message: AIMessage | CustomMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const getBubbleStyle = () => {
    if ("role" in message) {
      return message.role === "user"
        ? "bg-ualert-500 text-notpurple-500"
        : "bg-charyo-500/50 text-notpurple-500";
    }

    return message.type === "user"
      ? "bg-ualert-500 text-notpurple-500"
      : "bg-charyo-400 text-notpurple-500";
  };

  const getAlignment = () => {
    if ("role" in message) {
      return message.role === "user" ? "justify-end" : "justify-start";
    }

    return message.type === "user" ? "justify-end" : "justify-start";
  };

  const getMessageContent = () => {
    if ("role" in message) {
      return message.content;
    }
    return message.text;
  };

  return (
    <div className={`flex ${getAlignment()}`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${getBubbleStyle()}`}>
        <span className="break-words">{getMessageContent()}</span>
        {"type" in message && message.type === "user" && "status" in message && (
          <span className="text-xs ml-2 opacity-75">
            {message.status === "sending" && "⏳"}
            {message.status === "sent" && "✓"}
            {message.status === "error" && "❌"}
          </span>
        )}
      </div>
    </div>
  );
};
