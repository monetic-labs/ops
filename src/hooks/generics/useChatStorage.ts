import { useState, useCallback, useEffect, useTransition } from 'react';
import { useOptimistic } from 'react';
import { sendMessageToTelegram } from '@/components/support/telegram/send-message';

interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'bot' | 'telegram' | 'system';
  status: 'sending' | 'sent' | 'error';
  metadata: {
    telegramMessageId?: number;
    timestamp: number;
  };
}

export function useChatStorage(chatId: string, mode: 'bot' | 'support') {
  // Initialize with empty array but check localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(`chat:${chatId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [isPending, startTransition] = useTransition();
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<
    ChatMessage[],
    ChatMessage
  >(messages, (state, newMessage) => [...state, newMessage]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat:${chatId}`, JSON.stringify(messages));
    }
  }, [messages, chatId]);

  const saveMessage = useCallback(async (text: string) => {
    const timestamp = Date.now();
    const messageId = `${timestamp}-${Math.random()}`;
    
    const newMessage: ChatMessage = {
      id: messageId,
      text,
      type: 'user',
      status: 'sending',
      metadata: {
        timestamp
      }
    };

    startTransition(() => {
      addOptimisticMessage(newMessage);
    });

    try {
        if (mode === 'support') {
          const result = await sendMessageToTelegram(text);
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to send message');
          }
  
          startTransition(() => {
            setMessages(prev => [
              ...prev,
              {
                ...newMessage,
                status: 'sent',
                metadata: {
                  ...newMessage.metadata,
                  telegramMessageId: result.data?.message_id
                }
              }
            ]);
          });
        } else if (mode === 'bot') {
          startTransition(() => {
            setMessages(prev => [
              ...prev,
              {
                ...newMessage,
                status: 'sent'
              }
            ]);
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        
        startTransition(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, status: 'error' }
                : msg
            )
          );
        });
      }
    }, [mode, chatId, addOptimisticMessage]);

 

  return {
    messages: optimisticMessages, // Return optimistic messages for display
    saveMessage,
    isPending
  };
}