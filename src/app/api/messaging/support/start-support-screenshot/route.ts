import { NextResponse } from 'next/server';
import { sendTelegramPhoto } from '@/libs/telegram';

const SUPPORT_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_CHAT_ID;

export async function POST(request: Request) {
  try {
    const { screenshot } = await request.json();

    if (!SUPPORT_CHAT_ID) {
      console.error('Support chat ID not configured');
      return NextResponse.json({ success: false, error: 'Support chat ID not configured' }, { status: 500 });
    }

    console.log('Attempting to send screenshot to Telegram');
    const data = await sendTelegramPhoto(SUPPORT_CHAT_ID, screenshot, 'New support request');
    console.log('Telegram API response:', data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in start-chat route:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send screenshot', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}