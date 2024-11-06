import { WebSocket } from "ws";
import { WebSocketMessage } from "@/types/messaging";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

let wsInstance: WebSocket | null = null;
let reconnectInterval: NodeJS.Timeout | null = null;

export function getWebSocketInstance(): WebSocket | null {
  if (!wsInstance || wsInstance.readyState === WebSocket.CLOSED) {
    wsInstance = new WebSocket(WS_URL);

    wsInstance.onclose = () => {
      console.log('WebSocket closed');
      
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          reconnectInterval = null;
          getWebSocketInstance();
        }, 5000);
      }
    };
  }
  return wsInstance;
}

export async function broadcastMessage(message: WebSocketMessage) {
  console.log('📢 Broadcasting message:', message);
  
  return new Promise((resolve, reject) => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
      wsInstance = new WebSocket(WS_URL);
      
      wsInstance.on('open', () => {
        wsInstance?.send(JSON.stringify(message));
        resolve(true);
      });
      
      wsInstance.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      });
    } else {
      try {
        wsInstance?.send(JSON.stringify(message));
        resolve(true);
      } catch (error) {
        reject(error);
      }
    }
  });
}
