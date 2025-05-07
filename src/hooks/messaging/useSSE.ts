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

    // This effect instance is for an authenticated user and not loading.
    console.log("[SSE] Attempting to connect: user authenticated and not loading.");
    let effectScopedCleanupFn: (() => void) | undefined;
    let isEffectCancelled = false;

    const setupSSEConnection = async () => {
      try {
        const returnedPylonCleanupFn = await pylon.getChatEvents(handleChatEvent);

        if (isEffectCancelled) {
          // This effect instance was cancelled (e.g., authStatus changed, component unmounted)
          // while pylon.getChatEvents was in progress.
          if (returnedPylonCleanupFn) {
            console.log("[SSE] Connection attempt completed for a cancelled effect. Cleaning up immediately.");
            returnedPylonCleanupFn();
          }
          return;
        }

        // Effect is still active, store the cleanup function.
        effectScopedCleanupFn = returnedPylonCleanupFn;
        if (typeof effectScopedCleanupFn === "function") {
          console.log("[SSE] Connected to chat events successfully.");
        } else {
          // This case might occur if pylon.getChatEvents can resolve with undefined/null
          // without throwing an error, indicating a non-critical failure to connect.
          console.warn(
            "[SSE] Attempted to connect, but Pylon SDK did not return a cleanup function, assuming no connection was made."
          );
        }
      } catch (error) {
        if (isEffectCancelled) {
          // Error occurred, but the effect was already cancelled.
          console.log("[SSE] Connection error occurred for an already cancelled effect:", error);
        } else {
          // Error occurred for an active effect.
          console.error("[SSE] Connection error during setup:", error);
        }
        // effectScopedCleanupFn remains undefined, so the main cleanup will do nothing for this failed attempt.
      }
    };

    setupSSEConnection();

    return () => {
      // This cleanup function runs when the component unmounts or dependencies change,
      // signalling that this specific effect instance is no longer active.
      isEffectCancelled = true;
      if (effectScopedCleanupFn) {
        console.log("[SSE] Disconnecting from chat events (due to unmount or dependency change).");
        effectScopedCleanupFn();
      } else {
        console.log(
          "[SSE] Cleanup triggered, but no active connection/cleanup function was registered for this effect instance."
        );
      }
    };
  }, [handleChatEvent, authStatus, isLoading]); // Dependencies

  return {
    // Nothing to return as connection status is handled internally by Pylon SDK
  };
};
