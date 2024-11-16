"use client";

import React from "react";
import DOMPurify from 'dompurify'; 
import { Message as AIMessage } from "ai";

import { Message as CustomMessage } from "@/types/messaging";


interface MessageBubbleProps {
  message: AIMessage | CustomMessage;
  contentTestId?: string;
  ['data-testid']?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, contentTestId, 'data-testid': testId }) => {
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

  const getMessageId = () => {
    if ("role" in message) {
      return message.id;
    }
    return message.id;
  };

  const getMessageType = () => {
    if ("role" in message) {
      return message.role;
    }
    return message.type;
  };

  const sanitizeContent = (content: string) => {
    // First use DOMPurify to remove any dangerous HTML/scripts
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [], // Allow no HTML tags
      ALLOWED_ATTR: [] // Allow no HTML attributes
    });
    
    // Then strip any remaining HTML-like content
    return sanitized.replace(/<[^>]*>/g, '');
  };

  const getMessageContent = () => {
    const content = "role" in message ? message.content : message.text;
    return sanitizeContent(content);
  };

  const messageId = getMessageId();
  const bubbleTestId = testId || `message-${messageId}`; // This is correct
  const contentBubbleTestId = `${bubbleTestId}-content`; // Update to match parent ID pattern
  const statusTestId = `${bubbleTestId}-status`; // Update status ID to match pattern

  return (
    <div 
      data-testid={bubbleTestId}
      className={`flex ${getAlignment()} message-${getMessageType()}`}
    >
      <div 
        data-testid={contentBubbleTestId}
        className={`max-w-[80%] rounded-lg p-3 ${getBubbleStyle()}`}
      >
        <span className="break-words">{getMessageContent()}</span>
        {"type" in message && message.type === "user" && "status" in message && (
          <span 
            data-testid={statusTestId}
            className="text-xs ml-2 opacity-75"
          >
            {message.status === "sending" && "⏳"}
            {message.status === "sent" && "✓"}
            {message.status === "error" && "❌"}
          </span>
        )}
      </div>
    </div>
  );
};
