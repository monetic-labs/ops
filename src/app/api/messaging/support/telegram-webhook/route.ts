import { NextResponse } from "next/server";
import { broadcastMessage } from "@/libs/websocket";
import { WebSocketMessage } from "@/types/messaging";

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
  };
  chat: {
    id: number | string;
    title?: string;
    type: string;
  };
  text: string;
  date: number;
}

interface TelegramUpdate {
  update_id: number;
  message: TelegramMessage;
}

export async function POST(request: Request) {
  console.log('📥 Telegram webhook received request');
  
  try {
    const body: TelegramUpdate = await request.json();

    const userId = body.message.from?.id?.toString();
    console.log('📦 Webhook body:', JSON.stringify(body, null, 2));
    console.log('📦 User ID:', userId);
    
    const { message } = body;

    // Validate message structure
    if (!message?.text || !message?.chat?.id) {
      console.error('❌ Invalid message format:', message);
      return NextResponse.json({ 
        success: false, 
        error: "Invalid message format" 
      }, { status: 400 });
    }

    const chatId = message.chat.id;
    const responseText = "Thank you for contacting support. An agent will be with you shortly.";

    // Prepare message for WebSocket broadcast
    const timestamp = message.date * 1000;
    const messageToSend = {
      id: `telegram-${message.message_id}`,
      text: message.text,
      type: "support",
      timestamp,
      metadata: {
        telegramMessageId: message.message_id,
        chatId: message.chat.id,
        userId: userId
      },
      status: "received"
    };

    // Broadcast to WebSocket clients
    console.log('📢 Broadcasting message to WebSocket:', messageToSend);
    await broadcastMessage(messageToSend as WebSocketMessage);

    // Send auto-reply to Telegram
    console.log('📤 Sending auto-reply to Telegram chat:', chatId);
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${process.env.AGENTCHAD_TELEGRAM_BOT}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText,
        }),
      }
    );

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error('❌ Failed to send Telegram auto-reply:', errorData);
      throw new Error('Failed to send Telegram auto-reply');
    }

    console.log('✅ Successfully processed webhook request');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Error in webhook handler:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process message" 
    }, { status: 500 });
  }

  
}