"use client";

import { useCallback, useMemo } from "react";
import { useChat } from "ai/react";
import { useChatMode } from "@/hooks/messaging/useChatMode";
import { ChatContext } from "@/hooks/messaging/useChatContext";
import { useWebSocket } from "@/hooks/generics/useWebSocket";
import { AgentMessageService, SupportMessageService, WebSocketMessage, ChatContextType } from "@/types/messaging";

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
  const agentService = useAgentService(mode === 'agent' ? chatHelpers : undefined);

  const service = mode === 'support' ? supportService : agentService;

  useWebSocket((message: WebSocketMessage) => {
    console.log('🔌 ChatProvider received WebSocket message:', message);
    if (mode === 'support') {
      const supportService = service as SupportMessageService;
      if (supportService.handleWebSocketMessage) {
        supportService.handleWebSocketMessage(message);
      }
    }
  });

  console.group("🔄 ChatProvider Render");
  console.log("Current Mode:", mode);
  console.log("Chat Helpers State:", {
    messages: chatHelpers.messages.length,
    isLoading: chatHelpers.isLoading,
    hasInput: !!chatHelpers.input,
  });
  console.groupEnd();

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('📥 Received WebSocket message:', message);
    
    if (mode === 'support') {
      if ('handleWebSocketMessage' in service) {
        (service as SupportMessageService).handleWebSocketMessage(message);
      }
    }
  }, [mode, service]);

  useWebSocket(handleWebSocketMessage);

  const contextValue = useMemo<ChatContextType>(() => {
    const baseContext = {
      messages: service.messages,
      inputValue: service.inputValue,
      setInputValue: service.setInputValue,
      sendMessage: service.sendMessage,
      handleSubmit: service.handleSubmit,
      userId,
    };

    if (mode === 'agent') {
      return {
        ...baseContext,
        mode: 'agent',
        service: service as AgentMessageService,
        chatHelpers,
        isTyping: false,
      };
    }

    return {
      ...baseContext,
      mode: 'support',
      service: service as SupportMessageService,
      isTyping: service.isTyping || false,
    };
  }, [mode, service, chatHelpers, userId]);

  return (
    <ChatContext.Provider value={contextValue as ChatContextType}>
      {children}
    </ChatContext.Provider>
  );
};
