// src/hooks/messaging/useSupportService.ts
import { useCallback } from "react";
import html2canvas from "html2canvas";

import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";
import { SupportMessageService } from "@/types/messaging";
import pylon from "@/libs/pylon-sdk";

const baseUrl = process.env.NEXT_PUBLIC_PYLON_BASE_URL;

export const useSupportScreenshot = () => {
  const captureScreenshot = useCallback(async () => {
    try {
      // Add a small delay to ensure all elements are rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capture the entire visible page
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        onclone: (document) => {
          // This function runs on the cloned document before rendering
          document.querySelectorAll("img, image").forEach((img) => {
            img.setAttribute("crossorigin", "anonymous");
          });
        },
      });
      const mimeType = "image/png";
      const key = "screenshot" + Date.now() + crypto.randomUUID() + ".png";

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const {
          data: {
            data: { uploadUrl, accessUrl },
          },
        } = await (
          await fetch(`${baseUrl}/v1/merchant/chat/file/upload`, {
            method: "POST",
            body: JSON.stringify({
              mimeType,
              fileName: key,
            }),
            headers: {
              "content-type": "application/json",
            },
            credentials: "include",
          })
        ).json();

        await fetch(uploadUrl, {
          method: "PUT",
          body: blob,
          headers: {
            "Content-Type": blob.type,
          },
        });

        await pylon.createTelegramMessage({
          text: "Support Screenshot",
          file: accessUrl,
        });
      }, mimeType);

      return true;
    } catch (error) {
      console.error("Error capturing screenshot:", error);

      return false;
    }
  }, []);

  return {
    captureScreenshot,
  };
};

export const useSupportService = (): SupportMessageService => {
  const { message: messageActions } = useMessagingActions();
  const state = useMessagingStore((state) => state.message);

  const setInputValue = useCallback(
    async (value: string) => {
      await messageActions.setInputValue({ mode: "support", value });
    },
    [messageActions]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        const messageId = crypto.randomUUID();

        messageActions.appendMessage({
          id: messageId,
          text,
          type: "user",
          timestamp: Date.now(),
          status: "sending",
        });

        // Send via Pylon SDK
        const success = await pylon.createTelegramMessage({ text });

        if (success) {
          messageActions.updateMessage(messageId, { status: "sent" });
          await setInputValue(""); // Clear input after sending
        } else {
          messageActions.updateMessage(messageId, { status: "error" });
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [messageActions, setInputValue]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = state.inputValues.support;

      if (!text.trim()) return;
      await sendMessage(text.trim());
    },
    [state.inputValues.support, sendMessage]
  );

  return {
    type: "telegram" as const,
    channel: "default",
    messages: state.messages.support,
    isTyping: state.isTyping,
    isLoading: false,
    inputValue: state.inputValues.support,
    setInputValue,
    sendMessage,
    handleSubmit,
    getUserId: () => state.userId || "default-user",
  };
};
