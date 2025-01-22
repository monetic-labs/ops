"use client";

import { useEffect } from "react";

import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";
import { MessageMode } from "@/types/messaging";

interface MessagingProviderProps {
  children: React.ReactNode;
  userId: string;
  initialMode?: MessageMode;
}

export const MessagingProvider = ({ children, userId, initialMode = "bot" }: MessagingProviderProps) => {
  const {
    message: { setMode, setActiveService },
    connection: { connect },
    ui: { setWidth },
  } = useMessagingActions();

  useEffect(() => {
    // Set initial values
    setMode(initialMode);
    // Map the mode to the correct service type
    setActiveService(initialMode === "bot" ? "openai" : "telegram");
    setWidth(400);

    // Initialize connection if needed
    connect().catch((error) => {
      console.error("Failed to establish connection:", error);
    });

    return () => {
      const { disconnect } = useMessagingStore.getState().actions.connection;

      disconnect();
    };
  }, [connect, setMode, setWidth, setActiveService, initialMode]);

  return <>{children}</>;
};
