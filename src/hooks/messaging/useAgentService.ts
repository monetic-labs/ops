import { UseChatHelpers } from "ai/react";
import { useEffect, useRef } from "react";

import { useAgentStore } from "@/libs/messaging/agent-service";
import { AgentMessageService } from "@/types/messaging";

export const useAgentService = (chatHelpers?: UseChatHelpers): AgentMessageService => {
  const store = useAgentStore();
  const helpersRef = useRef(chatHelpers);

  useEffect(() => {
    // Skip the initial mount if chatHelpers is undefined
    if (typeof chatHelpers === "undefined") return;

    // Only update if the helpers have meaningfully changed
    if (chatHelpers !== helpersRef.current) {
      helpersRef.current = chatHelpers;
      store.setChatHelpers(chatHelpers);
    }

    // Clean up only if we actually set helpers
    return () => {
      if (helpersRef.current) {
        helpersRef.current = undefined;
        // Don't set to null during cleanup if we're just updating
        if (!chatHelpers) {
          store.setChatHelpers(null as unknown as UseChatHelpers);
        }
      }
    };
  }, [chatHelpers]);

  return {
    type: "openai",
    model: "gpt-4o",
    messages: store.messages,
    isLoading: store.isLoading,
    inputValue: store.inputValue,
    setInputValue: store.setInputValue,
    sendMessage: store.sendMessage,
    handleSubmit: store.handleSubmit,
    getUserId: store.getUserId,
  };
};

export function useAgent(chatHelpers: UseChatHelpers) {
  return useAgentService(chatHelpers);
}
