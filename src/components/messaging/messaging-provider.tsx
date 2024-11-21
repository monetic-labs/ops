"use client";

import { useMemo } from "react";
import { useChat } from "ai/react";

import { useChatMode } from "@/hooks/messaging/useChatMode";
import { ChatContext } from "@/hooks/messaging/useChatContext";
import { AgentMessageService, SupportMessageService, ChatContextType } from "@/types/messaging";
import { useSupportService } from "@/hooks/messaging/useSupportService";
import { useAgentService } from "@/hooks/messaging/useAgentService";

interface ChatProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const ChatProvider = ({ children, userId }: ChatProviderProps) => {
  console.log("👤 User ID:", userId);
  const { mode } = useChatMode();

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
    },
  });

  const supportService = useSupportService();
  const agentService = useAgentService(mode === "agent" ? chatHelpers : undefined);

  const service = mode === "support" ? supportService : agentService;

  const contextValue = useMemo(() => {
    if (mode === "agent") {
      return {
        messages: service.messages,
        inputValue: service.inputValue,
        setInputValue: service.setInputValue,
        sendMessage: service.sendMessage,
        handleSubmit: service.handleSubmit,
        userId,
        mode: "agent" as const,
        service: service as AgentMessageService,
        chatHelpers,
        isTyping: false,
      } satisfies ChatContextType;
    } else {
      return {
        messages: service.messages,
        inputValue: service.inputValue,
        setInputValue: service.setInputValue,
        sendMessage: service.sendMessage,
        handleSubmit: service.handleSubmit,
        userId,
        mode: "support" as const,
        service: service as SupportMessageService,
        isTyping: service.isTyping || false,
      } satisfies ChatContextType;
    }
  }, [mode, service, chatHelpers, userId]);

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};
