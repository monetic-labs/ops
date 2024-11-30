import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";
import { Message as AIMessage } from 'ai';
import { UseChatHelpers } from "ai/react";
import { useEffect } from "react";

interface ChatHelperUpdate {
  messages: AIMessage[];
  input?: string;
  isLoading?: boolean;
}

export const useAgentService = (chatHelpers?: UseChatHelpers) => {
  const { message: messageActions } = useMessagingActions();
  const state = useMessagingStore(state => state.message);

  useEffect(() => {
    if (chatHelpers) {
      // Watch for changes in chatHelpers messages
      const handleUpdate = () => {
        const lastMessage = chatHelpers.messages[chatHelpers.messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          messageActions.appendMessage({
            id: crypto.randomUUID(),
            text: lastMessage.content,
            type: 'bot',
            timestamp: Date.now(),
            status: 'received'
          });
        }
      };

      // Set up message monitoring
      const messageObserver = new MutationObserver(handleUpdate);
      const target = document.querySelector('[data-chat-messages]');
      if (target) {
        messageObserver.observe(target, { 
          childList: true, 
          subtree: true 
        });
      }

      return () => messageObserver.disconnect();
    }
  }, [chatHelpers, messageActions]);

  return {
    type: "openai" as const,
    model: "gpt-4",
    messages: state.messages,
    isLoading: chatHelpers?.isLoading || false,
    inputValue: state.inputValue,
    setInputValue: messageActions.setInputValue,
    sendMessage: messageActions.sendMessage,
    handleSubmit: async (e: React.FormEvent) => {
      e.preventDefault();
      const text = state.inputValue;
      if (!text.trim()) return;
      await messageActions.sendMessage(text);
      
      // If we have chatHelpers, also send through AI SDK
      if (chatHelpers) {
        await chatHelpers.handleSubmit(e);
      }
    },
    getUserId: () => state.userId || 'default-user'
  };
};