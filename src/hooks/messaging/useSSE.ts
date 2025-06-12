import { useEffect, useCallback } from "react";

import { Message, SupportMessage } from "@/types/messaging";
import { useUser, AuthStatus } from "@/contexts/UserContext";
import pylon from "@/libs/monetic-sdk";
import { MerchantChatEvent, PaymentSSEEventType as SSEEvent } from "@monetic-labs/sdk";

interface SSEOptions {
  handleMessage: (message: Message) => void;
}

export const useSSE = ({ handleMessage }: SSEOptions) => {
  const { authStatus, isLoading } = useUser();

  const handleChatEvent = useCallback(
    (event: MerchantChatEvent) => {
      // Only process chat message events
      if (event.type !== SSEEvent.CHAT_MESSAGE) return;

      try {
        const from = event.data.from;
        const message: SupportMessage = {
          id: crypto.randomUUID(),
          text: event.data.text,
          type: "support",
          timestamp: new Date(event.data.timestamp).getTime(),
          status: "received",
          metadata: {
            telegramMessageId: event.data.messageId,
            chatId: from.id.toString(),
            timestamp: new Date(event.data.timestamp).getTime(),
            userId: from.id.toString(),
            from: {
              id: from.id,
              is_bot: from.is_bot,
              first_name: from.first_name,
              username: from.username,
            },
          },
        };

        handleMessage(message);
      } catch (error) {
        console.error("[SSE] Error parsing chat message data:", error);
      }
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
