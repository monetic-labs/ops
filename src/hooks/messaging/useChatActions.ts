import { useCallback } from "react";

import { UserMessage } from "@/types/messaging";

import { useChatMessages } from "./useChatMessages";
import { useChatContext } from "./useChatContext";
import { useChatMode } from "./useChatMode";

export const useChatActions = () => {
  const { addMessage, updateMessageStatus } = useChatMessages();
  const { service } = useChatContext();
  const { mode } = useChatMode();

  const sendMessage = useCallback(
    async (text: string) => {
      const messageId = Date.now().toString();

      if (mode === "agent") {
        try {
          await service.sendMessage(text);
        } catch (error) {
          console.error("Error sending message:", error);
        }
      } else {
        const message: UserMessage = {
          id: messageId,
          text,
          type: "user",
          status: "sending",
          timestamp: Date.now(),
        };

        addMessage(message);
        try {
          await service.sendMessage(text);
          updateMessageStatus(messageId, "sent");
        } catch (error) {
          console.error("Error sending message:", error);
          updateMessageStatus(messageId, "error");
        }
      }
    },
    [mode, service, addMessage, updateMessageStatus]
  );

  return { sendMessage };
};
