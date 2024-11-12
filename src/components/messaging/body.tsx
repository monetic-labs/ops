"use client";

import React, { useRef, useEffect, useState, ReactNode } from "react";
import { useChatMode } from "@/hooks/messaging/useChatMode";
import { useChatContext } from "@/hooks/messaging/useChatContext";

import { MessageBubble } from "./message-bubble";
import { Message } from "@/types/messaging";


export const ChatBody: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const context = useChatContext();
  const { mode } = useChatMode();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageElements, setMessageElements] = useState<ReactNode[]>([]);

  // Defensive check for context
  if (!context) {
    console.error('Chat context is missing');
    return <div data-testid="chat-body-error">Error: Chat context is missing</div>;
  }

  // Clear messages when component unmounts
  useEffect(() => {
    return () => {
      setMessages([]);
      setMessageElements([]);
    };
  }, []);

  // Update messages and scroll when context changes
  useEffect(() => {
    if (context?.messages) {
      console.log('ChatBody: Updating messages from context:', context.messages);
      setMessages(context.messages);
    }
  }, [context?.messages]);

  useEffect(() => {
    console.log("Current messages:", messages);
    const elements = messages.map((message) => (
      <MessageBubble
        key={`${message.id}-${message.timestamp || Date.now()}`}
        message={message}
        data-testid={`chat-message-msg-${message.id}`}
      />
    ));
    setMessageElements(elements);
  }, [messages]);

  useEffect(() => {
    if (messageElements.length > 0) {
      requestAnimationFrame(() => {
        const timeoutId = setTimeout(() => {
          if (messagesEndRef.current) {
            const chatBody = messagesEndRef.current.parentElement;
            if (chatBody) {
              chatBody.scrollTop = chatBody.scrollHeight;
            }
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      });
    }
  }, [messageElements]);

  // Listen for test events
  useEffect(() => {
    const handleContextUpdate = (event: CustomEvent) => {
      console.log('ChatBody: Received context update:', event.detail);
      if (event.detail?.messages) {
        setMessages([...event.detail.messages]);
      }
    };

    window.addEventListener('update-chat-context', handleContextUpdate as EventListener);
    return () => {
      window.removeEventListener('update-chat-context', handleContextUpdate as EventListener);
    };
  }, []);

  return (
    <div 
      data-testid="chat-body" 
      className="flex-1 overflow-y-auto p-4 space-y-4" 
      style={{ maxHeight: '100%' }}
    >
      {/* Debug elements - Always render these */}
      <div className="hidden">
        <div data-testid="debug-mode">{mode}</div>
        <div data-testid="debug-messages-count">{messages.length}</div>
      </div>
      <div data-testid="debug-messages" className="hidden">
        {JSON.stringify(messages)}
      </div>
      {messages.map((message) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          data-testid={`chat-message-${message.id}`} 
        />
      ))}
      <div ref={messagesEndRef} data-testid="messages-end" />
    </div>
  );
};
