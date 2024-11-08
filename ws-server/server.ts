import { WebSocketServer, WebSocket } from 'ws';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const server = http.createServer();
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

const TELEGRAM_BOT_TOKEN = process.env.AGENTCHAD_TELEGRAM_BOT;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables');
}
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const message = {
    id: `telegram-${msg.message_id}`,
    text: msg.text,
    type: 'support',
    timestamp: msg.date * 1000,
    metadata: {
      telegramMessageId: msg.message_id,
      chatId: chatId
    },
    status: 'received'
  };

  console.log('📨 Received Telegram message:', message);

  // Broadcast to WebSocket clients
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
});

wss.on('connection', (ws: WebSocket) => {
  console.log('🟢 WebSocket Client Connected - Total clients:', clients.size + 1);
  clients.add(ws);

  ws.on('message', (message: Buffer) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      console.log('📨 Received message from client:', parsedMessage);

      // Optionally, send a message back to Telegram
      if (parsedMessage.type === 'user') {
        bot.sendMessage(parsedMessage.metadata.chatId, parsedMessage.text);
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔴 Client disconnected - Remaining clients:', clients.size - 1);
    clients.delete(ws);
  });
});

const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);
});