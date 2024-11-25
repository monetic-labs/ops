import { SupportChatContext, SupportMessageService } from "@/types/messaging";
import { mockMessages } from "./message.fixture";

export const mockSupportContext: SupportChatContext = {
  mode: "support",
  messages: mockMessages.support,
  inputValue: "",
  setInputValue: async (value: string) => Promise.resolve(),
  sendMessage: async (text: string) => Promise.resolve(),
  handleSubmit: async (e: any) => Promise.resolve(),
  userId: "test-user",
  service: {
    type: "telegram",
    channel: "default",
    isTyping: false,
    isLoading: false,
    messages: mockMessages.support,
    inputValue: "",
    setInputValue: async (value: string) => Promise.resolve(),
    sendMessage: async (text: string) => Promise.resolve(),
    handleSubmit: async (e: any) => Promise.resolve(),
    handleWebSocketMessage: (message: any) => {},
    getUserId: () => "test-user"
  } as SupportMessageService,
  isTyping: false
};