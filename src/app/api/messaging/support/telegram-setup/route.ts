import { rateLimit } from "@/libs/messaging/rate-limiter";
import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.AGENTCHAD_TELEGRAM_BOT;
const BASE_URL = process.env.NEXT_PUBLIC_NGROK_URL;

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000; // 1 second

export async function POST(request: Request) {
  try {
    await limiter.check(5, 'TELEGRAM_WEBHOOK_SETUP');
    
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Telegram bot token not configured" },
        { status: 500 }
      );
    }

    const webhookUrl = `${BASE_URL}/api/messaging/support/telegram-webhook`;
    console.log("Setting webhook URL:", webhookUrl);

    let retries = 0;
    let response;
    let data;

    while (retries < MAX_RETRIES) {
      response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ["message", "chat_action", "chat_member"],
            drop_pending_updates: true
          }),
        }
      );

      data = await response.json();

      if (response.ok) {
        return NextResponse.json({ success: true, data });
      }

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
        const delay = INITIAL_DELAY * Math.pow(2, retries);
        console.warn(`Rate limit hit, retrying after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        break;
      }
    }

    throw new Error(data.description || "Failed to set webhook");
  } catch (error) {
    console.error("Error setting webhook:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
