"use client";

import React, { useRef, useEffect } from "react";

import { useCurrentModeMessages } from "@/libs/messaging/store";

import { MessageBubble } from "./message-bubble";

export const ChatBody: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useCurrentModeMessages();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatBody = messagesEndRef.current.parentElement;

      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        const timeoutId = setTimeout(scrollToBottom, 100);

        return () => clearTimeout(timeoutId);
      });
    }
  }, [messages]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-content2 scrollbar-thumb-content3"
      data-testid="chat-body"
      style={{ maxHeight: "100%" }}
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} contentTestId={`message-item`} data-testid="message-item" message={message} />
      ))}

      <div ref={messagesEndRef} data-testid="messages-end" />
    </div>
  );
};
