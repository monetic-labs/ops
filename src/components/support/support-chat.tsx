'use client';

import React, { useRef, useEffect } from 'react';
import { useChatStorage } from '@/hooks/chat/useChatStorage';
import { useRagChat } from '@/hooks/chat/useRagChat';

interface SupportChatProps {
  mode: 'bot' | 'support';
}

const SupportChat: React.FC<SupportChatProps> = ({ mode }) => {
  const [newMessage, setNewMessage] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use the chat storage hook with a unique ID for the chat
  const chatId = `${mode}-chat`; // Separate storage for bot and support chats
  const { messages: supportMessages, saveMessage } = useChatStorage(chatId, mode);
  const { messages: botMessages, sendMessage: sendBotMessage } = useRagChat();
  const messages = mode === 'bot' ? botMessages : supportMessages;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    // Add a small delay to ensure DOM has updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    
    const messageText = newMessage;
    setNewMessage(''); // Clear input immediately
    
    try {
      // Create a temporary message object for optimistic UI update
      const tempMessage = {
        id: Date.now().toString(),
        text: messageText, // Make sure this is set
        type: 'user' as const,
        status: 'sending' as const
      };
      
      // Add to messages immediately for optimistic UI
      await saveMessage(messageText);
      
      console.log('Message sent:', messageText); // Debug log
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user' 
                  ? 'bg-ualert-500 text-notpurple-500' 
                  : 'bg-charyo-500/50 text-notpurple-500'
              }`}
            >
              {/* Add the message text display */}
              <span className="break-words">{message.text}</span>

              {/* Status indicators */}
              {message.type === 'user' && (
                <span className="text-xs ml-2 opacity-75">
                  {message.status === 'sending' && '⏳'}
                  {message.status === 'sent' && '✓'}
                  {message.status === 'error' && '❌'}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-charyo-600 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type your message to ${mode === 'bot' ? 'AI Assistant' : 'Support'}...`}
            className="flex-1 p-2 bg-charyo-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ualert-500 text-notpurple-500 placeholder-charyo-300"
          />
          <button 
            onClick={handleSendMessage}
            className="px-4 py-2 bg-ualert-500 text-notpurple-500 rounded-lg hover:bg-ualert-600 focus:outline-none focus:ring-2 focus:ring-ualert-500 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportChat;