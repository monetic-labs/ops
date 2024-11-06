import { WebSocketMessage } from "@/types/messaging";
import { useEffect } from "react";



export function useWebSocket(onMessage: (message: WebSocketMessage) => void) {
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    const connect = () => {
      try {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error("Max reconnection attempts reached");
          return;
        }

        // const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        // const host = window.location.host;
        const wsUrl = process.env.NODE_ENV === 'development' 
          ? 'ws://localhost:3001'
          : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/websocket`;
        
        console.log(`Attempting WebSocket connection (attempt ${reconnectAttempts + 1}):`, wsUrl);
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WebSocket connection established");
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            onMessage(message);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onclose = (event) => {
          console.log("WebSocket closed:", event);
          reconnectAttempts++;
          reconnectTimer = setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Error creating WebSocket connection:", error);
        reconnectAttempts++;
        reconnectTimer = setTimeout(connect, 3000);
      }
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
