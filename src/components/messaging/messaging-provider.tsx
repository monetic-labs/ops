"use client";

import { useEffect } from "react";
import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";
import { MessageMode } from "@/types/messaging";

interface MessagingProviderProps {
  children: React.ReactNode;
  userId: string;
  initialMode?: MessageMode;
}

export const MessagingProvider = ({ children, userId, initialMode = 'bot' }: MessagingProviderProps) => {
  
  const { 
    message: { setMode }, 
    connection: { connect },
    ui: { setWidth },
  } = useMessagingActions();


  useEffect(() => {
    // Set initial values
    setMode(initialMode);
    setWidth(400); // Default width
    
    // Initialize websocket connection
    connect().catch(error => {
      console.error('Failed to establish WebSocket connection:', error);
    });

    // Cleanup on unmount
    return () => {
      const { disconnect } = useMessagingStore.getState().actions.connection;
      disconnect();
    };
  }, [connect, setMode, setWidth, initialMode]);

  useEffect(() => {
    const unsubscribe = useMessagingStore.subscribe(
      (state) => state.connection.status
    );
    const connectionStatus = useMessagingStore.getState().connection.status;
    console.log('Connection status:', connectionStatus );
    return () => unsubscribe();
  }, []);

  return <>{children}</>;
};