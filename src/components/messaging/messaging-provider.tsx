"use client";

import { useEffect, useCallback } from "react";

import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";
import { useWebSocket } from "@/hooks/messaging/useWebSocket";

interface MessagingProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const MessagingProvider = ({ children, userId }: MessagingProviderProps) => {
  const {
    message: { setUserId, appendMessage, clearUnreadCount },
    ui: { setWidth },
  } = useMessagingActions();
  const isOpen = useMessagingStore((state) => state.ui.isOpen);

  // Handle incoming messages
  const handleWebSocketMessage = useCallback(
    (message: any) => {
      console.log("Received WebSocket message:", message);
      appendMessage({
        id: crypto.randomUUID(),
        text: message.text || message,
        type: "support",
        timestamp: Date.now(),
        status: "received",
      });
    },
    [appendMessage]
  );

  // Initialize WebSocket connection - always keep it open for background messages
  useWebSocket({ handleMessage: handleWebSocketMessage });

  // Handle initial setup
  useEffect(() => {
    setUserId(userId);
    setWidth(400);
  }, [setWidth, setUserId, userId]);

  // Clear unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      clearUnreadCount();
    }
  }, [isOpen, clearUnreadCount]);

  return <>{children}</>;
};
