"use client";

import React, { useRef, useState, useCallback } from "react";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";
import { Camera, Image } from "lucide-react";

import { useMessagingState, useMessagingActions } from "@/libs/messaging/store";
import { useSupportScreenshot } from "@/hooks/messaging/useSupportService";

export const ChatActions: React.FC = () => {
  const { mode, pendingAttachment } = useMessagingState();
  const { captureScreenshot } = useSupportScreenshot();
  const { message: messageActions } = useMessagingActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastScreenshotTime, setLastScreenshotTime] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const SCREENSHOT_COOLDOWN = 5000; // 5 seconds cooldown between screenshots

  const handleScreenshot = async () => {
    // Check rate limit
    const now = Date.now();
    if (now - lastScreenshotTime < SCREENSHOT_COOLDOWN) {
      console.log("Please wait before taking another screenshot");
      return;
    }

    setIsCapturing(true);

    // Find all elements that might have backdrop blur
    const drawer = document.querySelector('[role="dialog"]');
    const nextUIBackdrops = document.querySelectorAll(".nextui-backdrop");
    const blurElements = document.querySelectorAll('[class*="backdrop-blur"]');

    // Store original styles
    const originalStyles = new Map();

    try {
      // Hide drawer and its components
      if (drawer) {
        originalStyles.set(drawer, drawer.getAttribute("style"));
        drawer.setAttribute("style", "display: none !important");
      }

      // Remove backdrop blur from NextUI elements
      nextUIBackdrops.forEach((el) => {
        originalStyles.set(el, el.getAttribute("style"));
        el.setAttribute("style", "display: none !important");
      });

      // Remove backdrop-blur classes temporarily
      blurElements.forEach((el) => {
        originalStyles.set(el, el.getAttribute("class"));
        el.setAttribute("class", el.getAttribute("class")?.replace(/backdrop-blur\S*/g, "") || "");
      });

      // Take screenshot
      const success = await captureScreenshot();

      if (success) {
        setLastScreenshotTime(now);
        // Set pending attachment in the store with the actual screenshot URL
        messageActions.setPendingAttachment({
          type: "screenshot",
          file: null,
          preview: success === true ? "Screenshot ready to send" : success,
        });
      }
    } finally {
      setIsCapturing(false);
      // Restore all original styles
      originalStyles.forEach((style, element) => {
        if (style) {
          element.setAttribute(style.type === "class" ? "class" : "style", style);
        } else {
          element.removeAttribute(style.type === "class" ? "class" : "style");
        }
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      // Set pending attachment in the store without sending
      messageActions.setPendingAttachment({
        type: "image",
        file,
        preview: previewUrl,
      });
    } catch (error) {
      console.error("Failed to prepare image:", error);
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Only show in support mode
  if (mode !== "support") return null;

  const isDisabled = Boolean(pendingAttachment) || isCapturing;

  return (
    <div className="flex items-center gap-1" data-testid="chat-actions">
      <Tooltip content="Take Screenshot" placement="top">
        <Button
          isIconOnly
          className="bg-transparent text-default-500 hover:text-white"
          isDisabled={isDisabled}
          isLoading={isCapturing}
          radius="full"
          size="sm"
          variant="light"
          onPress={handleScreenshot}
        >
          <Camera className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Attach Image" placement="top">
        <Button
          isIconOnly
          className="bg-transparent text-default-500 hover:text-white"
          isDisabled={isDisabled}
          radius="full"
          size="sm"
          variant="light"
          onPress={() => fileInputRef.current?.click()}
        >
          {/* eslint-disable-next-line */}
          <Image className="w-4 h-4" />
        </Button>
      </Tooltip>

      <input
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        disabled={isDisabled}
        type="file"
        onChange={handleImageUpload}
      />
    </div>
  );
};
