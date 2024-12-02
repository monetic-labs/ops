import { NextResponse } from "next/server";
import { useWebSocket } from "@/libs/websocket";
import { MessageStatus, WebSocketMessage, SupportMessage, Message } from "@/types/messaging";

// Service-specific interface lives only in the route handler
interface TelegramWebhookMessage {
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
  message: TelegramWebhookMessage;
}

// Convert external service message to our internal SupportMessage type
function convertToSupportMessage(telegramMsg: TelegramWebhookMessage): SupportMessage {
  return {
    id: `msg-${telegramMsg.message_id || Date.now()}`,
    type: "support",
    text: telegramMsg.text || "",
    timestamp: (telegramMsg.date || Math.floor(Date.now() / 1000)) * 1000,
    status: "received",
    metadata: {
      telegramMessageId: telegramMsg.message_id,
      chatId: telegramMsg.chat.id.toString(),
      userId: telegramMsg.from?.id?.toString(),
      timestamp: Date.now(),
    },
  };
}

export async function POST(request: Request) {
  console.log("📥 Telegram webhook received request");
  const wsStore = useWebSocket.getState();

  try {
    const body: TelegramUpdate = await request.json();
    console.log("📦 Webhook body:", JSON.stringify(body, null, 2));

    if (!body.message) {
      console.log("⚠️ No message in webhook body");
      return NextResponse.json({ success: false, error: "No message found" }, { status: 400 });
    }

    const { message } = body;

    // Handle typing indicators
    if (message.chat_action === "typing") {
      console.log("🔵 Received typing indicator");
      const wsMessage: WebSocketMessage = {
        id: `typing-${Date.now()}`,
        type: "typing",
        text: "",
        timestamp: Date.now(),
        metadata: {
          chatId: message.chat.id.toString(),
          timestamp: Date.now(),
          isTyping: true,
          userId: message.from?.id?.toString(),
        },
      };

      await wsStore.send(wsMessage as Message);
      return NextResponse.json({ success: true });
    }

    // Handle text messages
    if (message.text) {
      console.log("📝 Received text message");
      const supportMessage = convertToSupportMessage(message);

      await wsStore.send(supportMessage);

      // Only send auto-reply for new conversations
      if (message.text.toLowerCase() === "/start") {
        const chatId = message.chat.id;
        const responseText = "Thank you for contacting support. An agent will be with you shortly.";

        console.log("📤 Sending auto-reply to Telegram chat:", chatId);
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
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
          console.error("❌ Failed to send Telegram auto-reply:", await telegramResponse.json());
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error in webhook handler:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to process message" },
      { status: 500 }
    );
  }
}
