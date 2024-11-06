import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import http from 'http';
import type { WebSocketMessage } from '../src/types/messaging';

dotenv.config();

const server = http.createServer();
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('🟢 WebSocket Client Connected - Total clients:', clients.size + 1);
  clients.add(ws);

  ws.on('message', (message: Buffer) => {
    try {
      const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;
      console.log('📨 Received message:', parsedMessage);
      console.log('📢 Broadcasting to', clients.size, 'clients');
      
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parsedMessage));
        }
      });
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