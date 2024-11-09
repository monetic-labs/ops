import { WebSocketServer, WebSocket } from 'ws';
import TelegramBot from 'node-telegram-bot-api';
import type { Message as TelegramMessage } from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import http from 'http';
import type { WebSocketMessage } from '../src/types/messaging';
import path, { dirname } from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface TelegramError extends Error {
  code?: string;
  response?: {
    statusCode: number;
    statusMessage: string;
    body: {
      ok: boolean;
      error_code: number;
      description: string;
    };
  };
}

const server = http.createServer();
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();
const clientIds = new Map<WebSocket, string>();

const TELEGRAM_BOT_TOKEN = process.env.AGENTCHAD_TELEGRAM_BOT;
const DEFAULT_CHAT_ID = process.env.TELEGRAM_SUPPORT_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables');
}

if (!DEFAULT_CHAT_ID) {
  throw new Error('TELEGRAM_DEFAULT_CHAT_ID is not defined in the environment variables');
}

// Initialize Telegram bot with webhooks instead of polling
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Store chat mappings
const userChatMap = new Map<string, string>();

wss.on('connection', async (ws: WebSocket) => {
  const clientId = Math.random().toString(36).substring(7);
  clientIds.set(ws, clientId);
  clients.add(ws);

  console.log(`🟢 WebSocket Client Connected - ID: ${clientId} - Total clients: ${clients.size}`);

    // Send immediate confirmation
  ws.send(JSON.stringify({ 
    type: 'system',
    id: `sys-${Date.now()}`,
    text: 'Connected to WebSocket server',
    timestamp: Date.now(),
    status: 'sent'
  }));

  ws.on('message', async (message: Buffer) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      console.log(`📨 Received message from client ${clientId}:`, parsedMessage);

      if (parsedMessage.type === 'user') {
        try {
          const userId = parsedMessage.metadata?.userId || 'default-user';
          const chatId = userChatMap.get(userId) || DEFAULT_CHAT_ID;

          console.log('📤 Sending message to Telegram chat:', chatId);
          
          try {
            await bot.sendMessage(chatId, parsedMessage.text);
            console.log('✅ Message sent to Telegram');

            // Send confirmation back to websocket client
            ws.send(JSON.stringify({
              type: 'system',
              id: `confirm-${Date.now()}`,
              text: 'Message sent successfully',
              timestamp: Date.now(),
              status: 'sent'
            }));
          } catch (telegramError: any) {
            console.error('❌ Telegram send error:', telegramError);
            throw new Error(`Failed to send to Telegram: ${telegramError.message}`);
          }
        } catch (error) {
          console.error('❌ Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'system',
            id: `error-${Date.now()}`,
            text: 'Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error'),
            timestamp: Date.now(),
            status: 'error'
          }));
        }
      }
    } catch (error) {
      console.error(`❌ Error handling message from client ${clientId}:`, error);
    }
  });

  ws.on('close', () => {
    const id = clientIds.get(ws);
    clients.delete(ws);
    clientIds.delete(ws);
    console.log(`🔴 Client ${id} disconnected - Remaining clients: ${clients.size}`);
  });

  ws.on('error', (error) => {
    const id = clientIds.get(ws);
    console.error(`❌ Error with client ${id}:`, error);
  });
  
});

// Helper function to send messages to Telegram
async function sendToTelegram(chatId: number | string, text: string): Promise<TelegramMessage> {
  try {
    return await bot.sendMessage(chatId, text);
  } catch (error) {
    const telegramError = error as TelegramError;
    console.error('❌ Error sending message to Telegram:', {
      code: telegramError.code,
      statusCode: telegramError.response?.statusCode,
      description: telegramError.response?.body?.description
    });
    throw telegramError;
  }
}

// Modified broadcast function to also send to Telegram if needed
export async function broadcastToClients(message: WebSocketMessage) {
  // If the message is from support/system, send to Telegram
  if (message.type === 'support' || message.type === 'system') {
    const chatId = message.metadata?.chatId;
    if (chatId) {
      await sendToTelegram(chatId, message.text);
    }
  }

  // Broadcast to all WebSocket clients
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Add a function to broadcast to all WebSocket clients
export function broadcastToWebSocketClients(message: WebSocketMessage) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Handle incoming Telegram webhook
export async function handleTelegramWebhook(update: TelegramMessage) {
  if (update.text) {
    const message: WebSocketMessage = {
      id: `msg-${update.message_id}`,
      text: update.text,
      type: 'support',
      timestamp: update.date * 1000, // Convert to milliseconds
      status: 'received',
      metadata: {
        telegramMessageId: update.message_id,
        chatId: update.chat.id.toString(),
        userId: update.from?.id.toString(),
        timestamp: Date.now()
      }
    };

    console.log('📢 Broadcasting Telegram message to WebSocket clients:', message);
    broadcastToWebSocketClients(message);
  }
}

const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);
});