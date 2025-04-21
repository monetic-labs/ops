import { useEffect, useCallback } from "react";

import { Message, SupportMessage } from "@/types/messaging";
import { useUser, AuthStatus } from "@/contexts/UserContext";
import pylon from "@/libs/monetic-sdk";

// Use the types already defined in the Pylon SDK
// This is just for reference, we'll use the SDK's actual types
interface ChatMessageEvent {
  type: "chat_message";
  data: {
    messageId: number;
    text: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    timestamp: string;
  };
}

interface MerchantChatConnectionEvent {
  type: "chat_connection";
  connectionId: string;
  merchantId: string;
}

type MerchantChatEvent = ChatMessageEvent | MerchantChatConnectionEvent;

interface SSEOptions {
  handleMessage: (message: Message) => void;
}

export const useSSE = ({ handleMessage }: SSEOptions) => {
  const { authStatus, isLoading } = useUser();

  const handleChatEvent = useCallback(
    (event: any) => {
      // Only process chat message events
      if (event.type !== "chat_message") return;

      const { data } = event;

      const message: SupportMessage = {
        id: crypto.randomUUID(),
        text: data.text,
        type: "support",
        timestamp: new Date(data.timestamp).getTime(),
        status: "received",
        metadata: {
          telegramMessageId: data.messageId,
          chatId: data.from.id.toString(),
          timestamp: new Date(data.timestamp).getTime(),
          userId: data.from.id.toString(),
          from: {
            id: data.from.id,
            is_bot: data.from.is_bot,
            first_name: data.from.first_name,
            username: data.from.username,
          },
        },
      };

      handleMessage(message);
    },
    [handleMessage]
  );

  useEffect(() => {
    if (isLoading) return;

    if (authStatus !== AuthStatus.AUTHENTICATED) {
      return;
    }

    let cleanupFn: (() => void) | undefined;

    const setupSSE = async () => {
      try {
        cleanupFn = await pylon.getChatEvents(handleChatEvent);
        console.log("[SSE] Connected to chat events");
      } catch (error) {
        console.error("[SSE] Connection error:", error);
      }
    };

    setupSSE();

    return () => {
      if (cleanupFn) {
        cleanupFn();
        console.log("[SSE] Disconnected from chat events");
      }
    };
  }, [handleChatEvent, authStatus, isLoading]);

  return {
    // Nothing to return as connection status is handled internally by Pylon SDK
  };
};
