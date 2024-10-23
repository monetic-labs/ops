import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/libs/telegram';

const SUPPORT_CHAT_ID = process.env.SUPPORT_CHAT_ID;

export async function POST(request: Request) {
  const { text } = await request.json();

  if (!SUPPORT_CHAT_ID) {
    return NextResponse.json({ success: false, error: 'Support chat ID not configured' }, { status: 500 });
  }

  try {
    const data = await sendTelegramMessage(SUPPORT_CHAT_ID, text);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}