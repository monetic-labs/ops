"use client";

import React, { useRef, useEffect } from "react";
import { Message as AIMessage } from "ai/react";

import { useChatMessages } from "@/hooks/messaging/useChatMessages";
import { useChatMode } from "@/hooks/messaging/useChatMode";
import { useChatContext } from "@/hooks/messaging/useChatContext";
import { Message } from "@/types/messaging";

import { MessageBubble } from "./message-bubble";

export const ChatBody: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { mode } = useChatMode();
  const { service, chatHelpers } = useChatContext();
  const { messages: supportMessages } = useChatMessages();

  // Get messages from the appropriate service
  const messages: (Message | AIMessage)[] = mode === "agent" ? chatHelpers.messages : service.getMessages();

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  useEffect(() => {
    console.log("Current messages:", messages);
  }, [messages]);

  if (!messages) {
    return null; // or a loading state
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
