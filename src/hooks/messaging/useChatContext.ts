import { createContext, useContext } from "react";

import { Message, MessageService, ChatContextType } from "@/types/messaging";

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChatContext must be used within a ChatContextProvider");
  }

  return context;
}
