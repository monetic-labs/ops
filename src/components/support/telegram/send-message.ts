import { Message } from '@/components/support/chat-interface/message-types';

export async function sendMessageToTelegram(text: string) {
  const response = await fetch('/api/support/message-send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message to Telegram');
  }

  const data = await response.json();
  return data;
}