import { useState, useCallback } from 'react';
import { useOptimistic } from 'react';

interface RAGResponse {
  answer: string;
  sources?: string[];
}

interface Message {
  id: string;
  text: string;
  type: 'user' | 'bot';
  status: 'sending' | 'sent' | 'error';
}

export function useRagChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state: Message[], newMessage: Message) => [...state, newMessage]
  );

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'user',
      status: 'sending'
    };

    // Add optimistic message
    addOptimisticMessage(userMessage);

    try {
      const response = await fetch('/api/chat/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) throw new Error('Failed to get RAG response');

      const data: RAGResponse = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: data.answer,
          type: 'bot',
          status: 'sent',
          metadata: {
            sources: data.sources
          }
        }
      ]);
    } catch (error) {
      console.error('RAG chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: 'Sorry, I encountered an error processing your request.',
          type: 'bot',
          status: 'error'
        }
      ]);
    }
  }, [addOptimisticMessage]);

  return {
    messages: optimisticMessages,
    sendMessage
  };
}