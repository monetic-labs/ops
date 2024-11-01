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
    const { screenshot } = await request.json();

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json(
        {
          success: false,
          error: "Telegram configuration missing",
        },
        { status: 500 }
      );
    }

    // Clean up base64 data - remove data URL prefix if present
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");

    // Create form data for multipart/form-data request
    const formData = new FormData();

    formData.append("chat_id", TELEGRAM_CHAT_ID);

    // Convert base64 to blob
    const imageBlob = await fetch(`data:image/png;base64,${base64Data}`).then((res) => res.blob());

    formData.append("photo", imageBlob, "screenshot.png");
    formData.append("caption", "Support Screenshot");

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.description || "Telegram API error");
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error sending screenshot to Telegram:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
