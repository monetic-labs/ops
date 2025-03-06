import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";

import { Message, SupportMessage } from "@/types/messaging";
import { useUser } from "@/contexts/UserContext";

const baseUrl = process.env.NEXT_PUBLIC_PYLON_BASE_URL;

interface TelegramMessage {
  text: string;
  messageId?: number;
  chatId?: string;
  timestamp?: number;
  userId?: string;
}

interface WebSocketOptions {
  handleMessage: (message: Message) => void;
}

export const useWebSocket = ({ handleMessage }: WebSocketOptions) => {
  const wsRef = useRef<Socket>();
  const { isAuthenticated } = useUser();

  useEffect(() => {
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null as any;
      }

      return;
    }

    wsRef.current = io(baseUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    wsRef.current.on("connect", () => {
      console.log("[WebSocket] Connected");
    });

    wsRef.current.on("connect_error", (error) => {
      console.error("[WebSocket] Connection error:", error);
    });

    wsRef.current.on("telegramMessage", (rawMessage: TelegramMessage) => {
      const message: SupportMessage = {
        id: crypto.randomUUID(),
        text: rawMessage.text,
        type: "support",
        timestamp: rawMessage.timestamp || Date.now(),
        status: "received",
        metadata: {
          telegramMessageId: rawMessage.messageId,
          chatId: rawMessage.chatId,
          timestamp: rawMessage.timestamp,
          userId: rawMessage.userId,
        },
      };

      handleMessage(message);
    });

    return () => {
      wsRef.current?.close();
      wsRef.current = null as any;
    };
  }, [handleMessage, isAuthenticated]);

  return {
    isConnected: () => wsRef.current?.connected || false,
  };
};
