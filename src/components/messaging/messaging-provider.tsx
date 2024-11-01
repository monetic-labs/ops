"use client";

import { useCallback, useRef } from "react";
import { useChat } from "ai/react";

import { useChatMode } from "@/hooks/messaging/useChatMode";
import { AIAgentService } from "@/libs/messaging/agent-service";
import { TelegramService } from "@/libs/messaging/support-service";
import { ChatContext } from "@/hooks/messaging/useChatContext";

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { mode } = useChatMode();

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
    // Add this to ensure proper message handling
    onResponse: (response) => {
      console.log("Chat Helper: Got Response", response);
    }
  });

  console.log("Chat Helpers State:", {
    messages: chatHelpers.messages.length,
    isLoading: chatHelpers.isLoading,
    hasInput: !!chatHelpers.input,
  });

  // Keep service instances stable across renders
  const serviceInstances = useRef({
    agent: null as AIAgentService | null,
    support: new TelegramService(),
  });

  const getService = useCallback(() => {
    if (mode === "agent") {
      if (!serviceInstances.current.agent) {
        serviceInstances.current.agent = new AIAgentService(chatHelpers);
      }
      return serviceInstances.current.agent;
    }
    return serviceInstances.current.support;
  }, [mode, chatHelpers]);

  const currentService = getService();

  if (!currentService) {
    throw new Error("No message service available");
  }
  console.groupEnd();

    return (
    <ChatContext.Provider value={{ 
      service: currentService, 
      chatHelpers,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
