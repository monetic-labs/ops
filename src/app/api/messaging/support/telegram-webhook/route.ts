import { NextResponse } from "next/server";
import { broadcastMessage } from "@/libs/websocket";
import { MessageStatus, WebSocketMessage } from "@/types/messaging";

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number | string;
    title?: string;
    type: string;
  };
  text?: string;
  date: number;
  chat_action?: string;
}

interface TelegramUpdate {
  update_id: number;
  message: TelegramMessage;
}

export async function POST(request: Request) {
  console.log('📥 Telegram webhook received request');
  
  try {
    const body: TelegramUpdate = await request.json();
    console.log('📦 Webhook body:', JSON.stringify(body, null, 2));

    // Early return if no message
    if (!body.message) {
      console.log('⚠️ No message in webhook body');
      return NextResponse.json({ success: false, error: "No message found" }, { status: 400 });
    }

    const { message } = body;

    // Handle typing indicators
    if (message.chat_action === 'typing') {

      console.log('🔵 Received typing indicator');
      const typingMessage: WebSocketMessage = {
        id: `typing-${Date.now()}`,
        type: 'typing',
        text: '',
        timestamp: Date.now(),
        metadata: {
          chatId: message.chat.id.toString(),
          timestamp: Date.now(),
          isTyping: true,
          userId: message.from?.id?.toString()
        }
      };

      await broadcastMessage(typingMessage);
      return NextResponse.json({ success: true });
    }

    // Handle text messages
    if (message.text) {

      console.log('📝 Received text message');
      const messageToSend: WebSocketMessage = {
        id: `msg-${message.message_id || Date.now()}`,
        text: message.text || '',
        type: "support",
        timestamp: (message.date || Math.floor(Date.now() / 1000)) * 1000,
        metadata: {
          telegramMessageId: message.message_id,
          chatId: message.chat.id.toString(),
          userId: message.from?.id?.toString(),
          timestamp: Date.now()
        },
        status: "received" as MessageStatus
      };

      console.log('📢 Broadcasting message:', messageToSend);
      await broadcastMessage(messageToSend);
      
      // Only send auto-reply for new conversations or specific triggers
      if (message.text.toLowerCase() === '/start') {
        const chatId = message.chat.id;
        const responseText = "Thank you for contacting support. An agent will be with you shortly.";
        
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
          console.error('❌ Failed to send Telegram auto-reply:', await telegramResponse.json());
        }
      }
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