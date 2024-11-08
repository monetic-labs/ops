import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.AGENTCHAD_TELEGRAM_BOT;
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not configured");
}

if (!TELEGRAM_CHAT_ID) {
  console.error("TELEGRAM_CHAT_ID is not configured");
}

export async function POST(request: Request) {
  try {
    const { text, userId } = await request.json();

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json(
        {
          success: false,
          error: "Telegram configuration missing",
        },
        { status: 500 }
      );
    }

    const formattedMessage = `Message from User ${userId}:\n${text}`;

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: formattedMessage,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.description || "Telegram API error");
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error sending message to Telegram:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
