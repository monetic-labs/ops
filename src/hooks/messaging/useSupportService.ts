import { useSupportStore } from "@/libs/messaging/support-service";
import { SupportMessageService } from "@/types/messaging";

export const useSupportService = (): SupportMessageService => {
  const store = useSupportStore();

  return {
    type: "telegram",
    channel: "default",
    messages: store.messages,
    isTyping: store.isTyping,
    isLoading: store.isLoading,
    inputValue: store.inputValue,
    setInputValue: store.setInputValue,
    sendMessage: store.sendMessage,
    handleSubmit: async (e) => {
      e.preventDefault();
      const text = store.inputValue;

      if (!text.trim()) return;
      await store.sendMessage(text);
    },
    handleWebSocketMessage: store.handleWebSocketMessage,
    getUserId: () => "default-user",
  };
};
