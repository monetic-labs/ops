import { WebSocketMessage } from "@/types/messaging";
import { useEffect } from "react";

export function useWebSocket(onMessage: (message: WebSocketMessage) => void) {
  useEffect(() => {
    // Mock WebSocket messages if needed
    const interval = setInterval(() => {
      // Simulate incoming messages if needed
    }, 5000);

    return () => clearInterval(interval);
  }, [onMessage]);

  return null;
}
