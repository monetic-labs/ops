import { useCallback } from 'react';
import { useChatMode } from './useChatMode';
import { useChatMessages } from './useChatMessages';
import { sendTelegramMessage } from '@/libs/telegram';

import { Message, UserMessage } from '@/types/messaging';

export const useChatActions = () => {
  const { mode } = useChatMode();
  const { addMessage, updateMessageStatus } = useChatMessages();

  const sendMessage = useCallback(async (text: string) => {
    // Create optimistic message
    const messageId = Date.now().toString();
    const message: UserMessage = {
      id: messageId,
      text,
      type: 'user',
      status: 'sending',
      timestamp: Date.now()
    };

    addMessage(message);

    try {
      if (mode === 'support') {
        const result = await sendTelegramMessage(text);
        if (!result.success) {
          throw new Error(result.error || 'Failed to send message');
        }
      } else {
        console.log('Weird spot to be in');
      }
      
      updateMessageStatus(messageId, 'sent');
    } catch (error) {
      console.error('Error sending message:', error);
      updateMessageStatus(messageId, 'error');
      
      // Add system message for error
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        text: 'Failed to send message. Please try again.',
        timestamp: Date.now(),
        category: 'error'
      };
      
      addMessage(errorMessage);
    }
  }, [mode, addMessage, updateMessageStatus]);
  return { sendMessage };
};