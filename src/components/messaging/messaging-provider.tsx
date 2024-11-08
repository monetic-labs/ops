"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "ai/react";

import { useChatMode } from "@/hooks/messaging/useChatMode";
import { AIAgentService } from "@/libs/messaging/agent-service";
import { TelegramService } from "@/libs/messaging/support-service";
import { ChatContext, ChatContextType } from "@/hooks/messaging/useChatContext";
import { useWebSocket } from "@/hooks/generics/useWebSocket";
import { Message, WebSocketMessage } from "@/types/messaging";
import { convertAIMessageToCustom } from "@/types/messageDTO";

export const ChatProvider = ({ 
  children, 
  userId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'default-user' 

}: { 
  children: React.ReactNode, 
  userId?: string 
}) => {
  const { mode } = useChatMode();
  const [messages, setMessages] = useState<Message[]>([]);

  const serviceInstances = useRef({
    agent: null as AIAgentService | null,
    support: new TelegramService(userId, setMessages),
  });

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (mode === "support") {
      const service = serviceInstances.current.support;
      service.handleWebSocketMessage(message);
    }
  }, [mode]);

  useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    return () => {
      if (mode === "support") {
        const service = serviceInstances.current.support;
        service.destroy?.();
      }
    };
  }, [mode]);

  console.group("🔄 ChatProvider Render");
  console.log("Current Mode:", mode);

  const chatHelpers = useChat({
    api: mode === "agent" ? "/api/messaging/agent/chat" : undefined,
    initialMessages: [],
    id: "agent-chat",
    onError: (error) => {
      console.error("Chat Helper Error:", error);
    },
    onFinish: () => {
      console.log("Chat Helper: Message Stream Finished");
    },
    onResponse: (response) => {
      console.log("Chat Helper: Got Response", response);
    }
  });

  console.log("Chat Helpers State:", {
    messages: chatHelpers.messages.length,
    isLoading: chatHelpers.isLoading,
    hasInput: !!chatHelpers.input,
  });

  useEffect(() => {
    if (mode === "support") {
      const service = serviceInstances.current.support;
      const unsubscribe = service.subscribeToMessages((messages) => {
        console.log("Received messages update:", messages);
        setMessages(messages);
      });
  
      return () => {
        unsubscribe();
      };
    }
  }, [mode]);

  const getService = useCallback(() => {
    if (mode === "agent") {
      if (!serviceInstances.current.agent) {
        serviceInstances.current.agent = new AIAgentService(chatHelpers, setMessages);
      }
      return serviceInstances.current.agent;
    }
    return serviceInstances.current.support;
  }, [mode, chatHelpers, setMessages]);

  const currentService = getService();

  if (!currentService) {
    throw new Error("No message service available");
  }

  const contextValue = useMemo(() => ({
    service: currentService,
    chatHelpers,
    messages: mode === 'agent' 
      ? chatHelpers.messages.map(convertAIMessageToCustom)
      : messages,
    setMessages,
  } as ChatContextType), [currentService, chatHelpers, messages, mode]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};
