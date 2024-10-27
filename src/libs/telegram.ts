const TELEGRAM_BOT_TOKEN = process.env.AGENTCHAD_TELEGRAM_BOT;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(chatId: string, text: string) {
  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });

  console.log("telegram bot", TELEGRAM_API_URL);
  console.log(JSON.stringify(response));

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function sendTelegramPhoto(chatId: string, photo: string, caption?: string) {
    console.log(`Attempting to send photo to chat ID: ${chatId}`);
    console.log(`API URL: ${TELEGRAM_API_URL}/sendPhoto`);
  
    const formData = new FormData();
    formData.append('chat_id', chatId);
    if (caption) formData.append('caption', caption);
  
    if (photo.startsWith('data:image')) {
        console.log('Sending photo as base64 data');
        const base64Data = photo.split(',')[1];
        const blob = new Blob([Buffer.from(base64Data, 'base64')], { type: 'image/png' });
        formData.append('photo', blob, 'screenshot.png');
      } else {
        console.log('Sending photo as URL or file_id');
        formData.append('photo', photo);
    }
  
    try {
        const response = await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
          method: 'POST',
          body: formData,
        });
    
        const responseData = await response.json();
        console.log('Telegram API response:', JSON.stringify(responseData, null, 2));
    
        if (!response.ok) {
          throw new Error(`Telegram API error: ${response.status} ${response.statusText}, ${JSON.stringify(responseData)}`);
        }
    
        return responseData;
      } catch (error) {
        console.error('Error in sendTelegramPhoto:', error);
        throw error;
      }
}

export async function getTelegramUpdates(offset?: number) {
  const params = new URLSearchParams({
    ...(offset && { offset: offset.toString() }),
    timeout: '30',
  });

  const response = await fetch(`${TELEGRAM_API_URL}/getUpdates?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to get Telegram updates');
  }

  return response.json();
}