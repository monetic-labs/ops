import { NextResponse } from "next/server";

import { broadcastMessage } from "@/libs/websocket";

interface TelegramMessage {
  message_id: number;
  chat: {
    id: string;
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
  const body: TelegramUpdate = await request.json();
  const { message } = body;

  if (!message?.text || !message?.chat?.id) {
    return NextResponse.json({ success: false, error: "Invalid message format" }, { status: 400 });
  }

  if (message && message.text) {
    const chatId = message.chat.id;
    const responseText = "Thank you for contacting support. An agent will be with you shortly.";

    try {
      // Broadcast the message to all connected clients
      broadcastMessage({
        id: `telegram-${message.message_id}`,
        text: message.text,
        type: "telegram",
        metadata: {
          telegramMessageId: message.message_id,
          timestamp: message.date * 1000,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error handling webhook:", error);

      return NextResponse.json({ success: false, error: "Failed to process message" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ success: false, error: "Invalid message format" }, { status: 400 });
  }
}
