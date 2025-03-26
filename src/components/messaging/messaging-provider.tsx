"use client";

import { useEffect, useCallback } from "react";

import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";
import { useSSE } from "@/hooks/messaging/useSSE";
import { Message } from "@/types/messaging";
import { useUser, AuthStatus } from "@/contexts/UserContext";
import { LocalStorage } from "@/utils/localstorage";

interface MessagingProviderProps {
  children: React.ReactNode;
}

export const MessagingProvider = ({ children }: MessagingProviderProps) => {
  const { user, authStatus, isLoading } = useUser();
  const {
    message: { setUserId, appendMessage, clearUnreadCount },
    ui: { setWidth },
  } = useMessagingActions();
  const isOpen = useMessagingStore((state) => state.ui.isOpen);

  // Handle incoming messages
  const handleMessage = useCallback(
    (message: Message) => {
      appendMessage(message);
    },
    [appendMessage]
  );

  // Initialize SSE connection for chat events
  useSSE({ handleMessage });

  // Handle initial setup
  useEffect(() => {
    setWidth(400);
  }, [setWidth]);

  // Set userId when authenticated user changes
  useEffect(() => {
    // Skip if still loading authentication state
    if (isLoading) return;

    // Only proceed if fully authenticated
    if (authStatus === AuthStatus.AUTHENTICATED && user?.id) {
      setUserId(user.id);
    }
  }, [authStatus, isLoading, user, setUserId]);

  // Clear unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      clearUnreadCount();
    }
  }, [isOpen, clearUnreadCount]);

  return <>{children}</>;
};
