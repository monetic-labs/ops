import { NextResponse } from 'next/server';
import { getTelegramUpdates } from '@/libs/telegram';

export async function GET() {
  try {
    const updates = await getTelegramUpdates();
    return NextResponse.json({ success: true, messages: updates });
  } catch (error) {
    console.error('Error checking messages:', error);
    return NextResponse.json({ success: false, error: 'Failed to check messages' }, { status: 500 });
  }
}