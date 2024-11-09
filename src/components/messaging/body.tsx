"use client";

import React, { useRef, useEffect } from "react";
import { useChatMode } from "@/hooks/messaging/useChatMode";
import { useChatContext } from "@/hooks/messaging/useChatContext";

import { MessageBubble } from "./message-bubble";


export const ChatBody: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isTyping } = useChatContext();
  const { mode } = useChatMode();

  useEffect(() => {
    console.log('🔵 Typing status changed:', isTyping);
  }, [isTyping]);
  
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

  useEffect(() => {
    console.log('Typing status changed:', isTyping);
  }, [isTyping]);

  if (!messages) {
    return null; // or a loading state
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
      
      {isTyping && (
        <div className="flex items-center space-x-2 text-sm text-gray-500 p-3 bg-gray-100 rounded-lg">
          <span>{mode === 'support' ? 'Support' : 'Agent'} is typing</span>
          <span className="animate-pulse">...</span>
        </div>
      )}
    </div>
  );
};
