import { WebSocket, WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function getWebSocketServer() {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true, clientTracking: true });
    console.log('WebSocket server created');
    
    wss.on('connection', (ws) => {
      console.log('WebSocket connection established');
      clients.add(ws);
      
      // Send a test message on connection
      ws.send(JSON.stringify({
        id: 'test',
        text: 'Connection established',
        type: 'bot',
        metadata: {
          timestamp: Date.now()
        }
      }));

      ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
      });
    });
  }
  
  return wss;
}

export function broadcastMessage(message: any) {
  console.log('Broadcasting message:', message);
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}