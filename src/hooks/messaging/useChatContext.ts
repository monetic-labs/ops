import { createContext, useContext } from "react";
import { Message, UseChatHelpers } from "ai/react";

import { MessageService } from "@/types/messaging";

interface ChatContextType {
  service: MessageService;
  chatHelpers: UseChatHelpers;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChatContext must be used within a ChatContextProvider");
  }

  return context;
}
