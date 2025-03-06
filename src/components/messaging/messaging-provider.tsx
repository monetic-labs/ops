"use client";

import { useEffect, useCallback } from "react";
import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";
import { useWebSocket } from "@/hooks/messaging/useWebSocket";
import { Message } from "@/types/messaging";

interface MessagingProviderProps {
  children: React.ReactNode;
}

export const MessagingProvider = ({ children }: MessagingProviderProps) => {
  const {
    message: { setUserId, appendMessage, clearUnreadCount },
    ui: { setWidth },
  } = useMessagingActions();
  const isOpen = useMessagingStore((state) => state.ui.isOpen);

  // Handle incoming messages
  const handleWebSocketMessage = useCallback(
    (message: Message) => {
      appendMessage(message);
    },
    [appendMessage]
  );

  // Initialize WebSocket connection
  useWebSocket({ handleMessage: handleWebSocketMessage });

  // Handle initial setup
  useEffect(() => {
    setWidth(400);
  }, [setWidth]);

  // Clear unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      clearUnreadCount();
    }
  }, [isOpen, clearUnreadCount]);

  return <>{children}</>;
};
