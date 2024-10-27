import { useEffect, useCallback } from 'react';

interface WebSocketMessage {
  id: string;
  text: string;
  type: 'telegram' | 'bot';
  metadata: {
    telegramMessageId?: number;
    timestamp: number;
  };
}

export function useWebSocket(onMessage: (message: WebSocketMessage) => void) {
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(`${window.location.origin.replace('http', 'ws')}/api/websocket`);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          onMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        // Attempt to reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
      }
    };
  }, [onMessage]);
}