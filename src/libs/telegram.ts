// Instead of directly using Telegram's API, we'll route through our Next.js API
const API_BASE = "/api/messaging/support";

interface TelegramResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Send a message through Telegram
 * Routes through our Next.js API to avoid exposing tokens and CORS issues
 */
export async function sendTelegramMessage(text: string, userId: string): Promise<TelegramResponse> {
  try {
    const response = await fetch(`${API_BASE}/message-send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, userId }),
    });

    const data = await response.json();

    // Standardize error handling
    if (!response.ok || !data.success) {
      throw new Error(data.error || `Failed to send message: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("Telegram service error:", error);
    throw error;
  }
}

/**
 * Send a photo through Telegram
 * Routes through our Next.js API to avoid exposing tokens and CORS issues
 */
export async function sendTelegramPhoto(photo: string, caption?: string): Promise<TelegramResponse> {
  try {
    // Handle base64 images or file paths
    const photoData = photo.startsWith("data:image") ? { base64: photo } : { url: photo };

    const response = await fetch(`${API_BASE}/start-support-screenshot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...photoData,
        caption,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Failed to send photo: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("Error sending photo:", error);
    throw error;
  }
}

/**
 * Get updates from Telegram
 * This should also be routed through our API if needed
 */
export async function getTelegramUpdates(offset?: number): Promise<TelegramResponse> {
  try {
    const response = await fetch(`${API_BASE}/updates${offset ? `?offset=${offset}` : ""}`);

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Failed to get updates: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("Error getting updates:", error);
    throw error;
  }
}
