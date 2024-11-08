import { createContext, Dispatch, SetStateAction, useContext } from "react";
import { UseChatHelpers } from "ai/react";
import { Message, MessageService } from "@/types/messaging";

export interface ChatContextType {
  service: MessageService;
  chatHelpers: UseChatHelpers;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChatContext must be used within a ChatContextProvider");
  }

  return context;
}
