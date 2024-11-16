"use client";

import React, { useRef, useEffect, useState } from "react";
import { useChatMode } from "@/hooks/messaging/useChatMode";
import { useChatContext } from "@/hooks/messaging/useChatContext";

import { MessageBubble } from "./message-bubble";
import { Message } from "@/types/messaging";


export const ChatBody: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const context = useChatContext();
  const { mode } = useChatMode();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [localMode, setMode] = useState(mode);

  // Defensive check for context
  if (!context) {
    console.error('Chat context is missing');
    return <div data-testid="chat-body-error">Error: Chat context is missing</div>;
  }

  // Clear messages when component unmounts
  useEffect(() => {
    return () => {
      setMessages([]);
    };
  }, []);

  // Update typing state when context changes
  useEffect(() => {
    if (context) {
      setIsTyping(context.isTyping);
    }
  }, [context?.isTyping]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatBody = messagesEndRef.current.parentElement;
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }
  };

  // Update messages and scroll when context changes
  useEffect(() => {
    if (context?.messages) {
      console.log('ChatBody: Updating messages from context:', context.messages);
      setMessages([...context.messages]); 
      // Use RAF to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        console.log('ChatBody: Messages updated, DOM');
        const timeoutId = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timeoutId);
      });
    }
  }, [context?.messages]);

  // Single unified event listener for context updates
  useEffect(() => {
    const handleContextUpdate = (event: CustomEvent) => {
      console.log('ChatBody: Received context update:', event.detail);
      
      if (event.detail?.messages) {
        setMessages([...event.detail.messages]);
      }
      if ('isTyping' in event.detail) {
        setIsTyping(event.detail.isTyping);
      }
      if ('mode' in event.detail) {
        setMode(event.detail.mode);
      }
    };
  
    window.addEventListener('update-chat-context', handleContextUpdate as EventListener);
    return () => {
      window.removeEventListener('update-chat-context', handleContextUpdate as EventListener);
    };
  }, []);

  // Debug log messages
  useEffect(() => {
    console.log("Current messages:", messages);
  }, [messages]);

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
          contentTestId={`chat-message-${message.id}-content`} 
        />
      ))}

      {isTyping && (
        <div 
          data-testid="typing-indicator" 
          className="flex items-center space-x-2 text-sm text-gray-500"
        >
          <span>{localMode === 'support' ? 'Support' : 'Agent'} is typing</span>
          <span className="animate-pulse">...</span>
        </div>
      )}
      <div ref={messagesEndRef} data-testid="messages-end" />
    </div>
  );
};
