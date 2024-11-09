import { WebSocketMessage } from "@/types/messaging";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

let wsInstance: globalThis.WebSocket | null = null;
let reconnectInterval: NodeJS.Timeout | null = null;

export function getWebSocketInstance(): globalThis.WebSocket | null {
  if (typeof window === 'undefined') return null;

  if (!wsInstance || wsInstance.readyState === WebSocket.CLOSED) {
    try {
      wsInstance = new window.WebSocket(WS_URL);

      wsInstance.onclose = () => {
        console.log('WebSocket closed');
        
        if (!reconnectInterval) {
          reconnectInterval = setInterval(() => {
            reconnectInterval = null;
            getWebSocketInstance();
          }, 5000);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket instance:', error);
      return null;
    }
  }
  return wsInstance;
}

export async function broadcastMessage(message: WebSocketMessage) {
  console.log('📢 Broadcasting message:', message);

  if (typeof window === 'undefined') return;
  
  return new Promise((resolve, reject) => {
    try {
      const ws = getWebSocketInstance();
      
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        const newWs = new window.WebSocket(WS_URL);
        
        newWs.onopen = () => {
          try {
            newWs.send(JSON.stringify(message));
            resolve(true);
          } catch (error) {
            reject(error);
          }
        };
        
        newWs.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };
      } else {
        ws.send(JSON.stringify(message));
        resolve(true);
      }
    } catch (error) {
      console.error('Failed to broadcast message:', error);
      reject(error);
    }
  });
}
