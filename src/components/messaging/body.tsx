'use client';

import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './message-bubble';
import { useChatMessages } from '@/hooks/messaging/useChatMessages';
import { useChatMode } from '@/hooks/messaging/useChatMode';
import { useChat } from 'ai/react';
import { useChatContext } from '@/hooks/messaging/useChatContext';

export const ChatBody: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { mode } = useChatMode();
  const { messages: aiMessages } = useChatContext();
  const { messages: supportMessages } = useChatMessages();

  const messages = mode === 'agent' ? aiMessages : supportMessages;

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};