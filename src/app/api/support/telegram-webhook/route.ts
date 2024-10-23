import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/libs/telegram';

export async function POST(request: Request) {
  const body = await request.json();
  const { message } = body;

  if (message && message.text) {
    const chatId = message.chat.id;
    const responseText = 'Thank you for contacting support. An agent will be with you shortly.';

    try {
      await sendTelegramMessage(chatId, responseText);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error sending message:', error);
      return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ success: false, error: 'Invalid message format' }, { status: 400 });
  }
}