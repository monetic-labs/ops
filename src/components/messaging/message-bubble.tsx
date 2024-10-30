'use client';

import React from 'react';
import { Message } from '@/types/messaging';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const getBubbleStyle = () => {
        switch (message.type) {
          case 'user':
            return 'bg-ualert-500 text-notpurple-500';
          case 'bot':
            return 'bg-charyo-500/50 text-notpurple-500';
          case 'support':
            return 'bg-charyo-500/50 text-notpurple-500';
          case 'system':
            return 'bg-gray-500/50 text-notpurple-500';
        }
    };
    
    const getAlignment = () => {
        return message.type === 'user' ? 'justify-end' : 'justify-start';
    };

   return (
    <div className={`flex ${getAlignment()}`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${getBubbleStyle()}`}>
        <span className="break-words">{message.text}</span>
        {message.type === 'user' && (
          <span className="text-xs ml-2 opacity-75">
            {message.status === 'sending' && '⏳'}
            {message.status === 'sent' && '✓'}
            {message.status === 'error' && '❌'}
          </span>
        )}
      </div>
    </div>
  );
};