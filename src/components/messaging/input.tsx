// src/components/messaging/input.tsx
"use client";

import React, { useCallback, forwardRef, useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { Card } from "@nextui-org/card";
import { Smile, Send, X } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import { useMessagingState, useMessagingActions } from "@/libs/messaging/store";
import { useMentions } from "@/hooks/messaging/useMentions";
import { useSupportService } from "@/hooks/messaging/useSupportService";
import { MentionOption } from "@/types/messaging";
import { useTheme } from "@/hooks/useTheme";
import pylon from "@/libs/pylon-sdk";

import { MentionList } from "./mention-list";

export const MessageInput = forwardRef<HTMLInputElement>((_, ref) => {
  const { inputValue, pendingAttachment } = useMessagingState();
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { resolvedTheme } = useTheme();
  const {
    message: { setInputValue, setPendingAttachment, appendMessage },
  } = useMessagingActions();

  // Services
  const supportService = useSupportService();

  // Mentions
  const {
    options: mentionOptions,
    mentionState,
    setMentionState,
    handleKeyDown: handleMentionKeyDown,
    handleSelectMention,
    handleInputChange: handleMentionInputChange,
  } = useMentions();

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      setInputValue({ value: newValue });
      handleMentionInputChange(newValue, e.target.selectionStart || 0, e.target);
    },
    [setInputValue, handleMentionInputChange]
  );

  const handleMentionSelect = useCallback(
    async (option: MentionOption) => {
      const currentInput = inputValue;
      const cursorPos = (document.querySelector('[data-testid="chat-input"]') as HTMLInputElement)?.selectionStart || 0;
      const textBeforeCursor = currentInput.slice(0, cursorPos);
      const textAfterCursor = currentInput.slice(cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex === -1) return;

      const selectedMention = handleSelectMention(option);
      const newValue = textBeforeCursor.slice(0, lastAtIndex) + selectedMention.insertText + " " + textAfterCursor;

      setInputValue({ value: newValue });

      setTimeout(() => {
        const input = document.querySelector('[data-testid="chat-input"]') as HTMLInputElement;

        if (input) {
          const newCursorPos = lastAtIndex + selectedMention.insertText.length + 1;

          input.setSelectionRange(newCursorPos, newCursorPos);
          input.focus();
        }
      }, 0);
    },
    [inputValue, handleSelectMention, setInputValue]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (mentionState.isOpen) {
        const result = handleMentionKeyDown(e);

        if (result) {
          handleMentionSelect(result.option);
        }
      }
    },
    [mentionState.isOpen, handleMentionKeyDown, handleMentionSelect]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = inputValue;

      if (!text.trim() && !pendingAttachment) return;
      if (isSending) return; // Prevent duplicate submissions

      try {
        setIsSending(true);

        // Handle attachment
        if (pendingAttachment) {
          if (pendingAttachment.type === "image" && pendingAttachment.file) {
            // Get upload URL from Pylon
            const {
              data: {
                data: { uploadUrl, accessUrl },
              },
            } = await (
              await fetch(`${process.env.NEXT_PUBLIC_PYLON_BASE_URL}/v1/merchant/chat/file/upload`, {
                method: "POST",
                body: JSON.stringify({
                  mimeType: pendingAttachment.file.type,
                  fileName: pendingAttachment.file.name,
                }),
                headers: {
                  "content-type": "application/json",
                },
                credentials: "include",
              })
            ).json();

            // Upload file
            await fetch(uploadUrl, {
              method: "PUT",
              body: pendingAttachment.file,
              headers: {
                "Content-Type": pendingAttachment.file.type,
              },
            });

            // Send message with file and caption using Pylon directly
            await pylon.createTelegramMessage({
              text: text || "Image Attachment",
              file: accessUrl,
            });

            // Add to local chat logs using store action
            appendMessage({
              id: crypto.randomUUID(),
              text: text || "Image Attachment",
              type: "user",
              timestamp: Date.now(),
              status: "sent",
              attachment: {
                type: "image",
                url: pendingAttachment.preview || accessUrl,
              },
            });
          } else if (pendingAttachment.type === "screenshot") {
            // For screenshots, we already have the file uploaded
            await pylon.createTelegramMessage({
              text: text || "Screenshot",
              file: pendingAttachment.preview,
            });

            // Add to local chat logs using store action
            appendMessage({
              id: crypto.randomUUID(),
              text: text || "Screenshot",
              type: "user",
              timestamp: Date.now(),
              status: "sent",
              attachment: {
                type: "screenshot",
                url: pendingAttachment.preview,
              },
            });
          }
          // Clear attachment after sending
          setPendingAttachment(null);
        } else {
          // Regular text message
          await supportService.sendMessage(text.trim());
        }

        // Always clear input after successful send
        setInputValue({ value: "" });
      } catch (error) {
        console.error("Failed to send message:", error);
        // Add error message to chat
        appendMessage({
          id: crypto.randomUUID(),
          text: "Failed to send message. Please try again.",
          type: "system",
          timestamp: Date.now(),
          status: "error",
          category: "error",
        });
      } finally {
        setIsSending(false);
      }
    },
    [inputValue, pendingAttachment, supportService, appendMessage, setInputValue, setPendingAttachment, isSending]
  );

  const onEmojiSelect = useCallback(
    (emoji: any) => {
      const input = document.querySelector('[data-testid="chat-input"]') as HTMLInputElement;
      const cursorPos = input?.selectionStart || 0;
      const currentValue = inputValue;
      const textBeforeCursor = currentValue.slice(0, cursorPos);
      const textAfterCursor = currentValue.slice(cursorPos);
      const newValue = textBeforeCursor + emoji.native + textAfterCursor;

      setInputValue({ value: newValue });
      setShowEmoji(false);

      // Set cursor position after emoji
      setTimeout(() => {
        if (input) {
          const newCursorPos = cursorPos + emoji.native.length;

          input.setSelectionRange(newCursorPos, newCursorPos);
          input.focus();
        }
      }, 0);
    },
    [inputValue, setInputValue]
  );

  const handleClearAttachment = () => {
    setPendingAttachment(null);
  };

  return (
    <form className="flex flex-col gap-2 p-2" data-testid="chat-input-form" onSubmit={handleSubmit}>
      {pendingAttachment && (
        <Card className={`p-2 bg-content2/50 ${isSending ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {pendingAttachment.type === "image" && pendingAttachment.preview && (
                <img
                  alt="Attachment preview"
                  className="w-8 h-8 rounded object-cover"
                  src={pendingAttachment.preview}
                />
              )}
              <span className="text-sm text-foreground/80">
                {pendingAttachment.type === "screenshot" ? "Screenshot" : "Image"} attachment
                {isSending && " (sending...)"}
              </span>
            </div>
            <Button isIconOnly size="sm" variant="light" onPress={handleClearAttachment}>
              <X size={16} />
            </Button>
          </div>
        </Card>
      )}
      <div className="flex items-end gap-2">
        <Popover isOpen={showEmoji} placement="top" onOpenChange={setShowEmoji}>
          <PopoverTrigger>
            <Button isIconOnly className="mb-1" size="sm" variant="light" onPress={() => setShowEmoji(true)}>
              <Smile size={20} />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Picker data={data} previewPosition="none" theme={resolvedTheme} onEmojiSelect={onEmojiSelect} />
          </PopoverContent>
        </Popover>
        <div className="flex-1 relative">
          <Input
            ref={ref}
            className="w-full"
            classNames={{
              input: "text-sm",
            }}
            data-testid="chat-input"
            disabled={isSending}
            placeholder="Type a message..."
            size="sm"
            value={inputValue}
            variant="bordered"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          {mentionState.isOpen && mentionOptions.length > 0 && (
            <MentionList
              options={mentionOptions}
              position={mentionState.position}
              selectedIndex={mentionState.selectedIndex}
              onSelect={handleMentionSelect}
            />
          )}
        </div>
        <Button
          isIconOnly
          className="mb-1"
          color="primary"
          isDisabled={(!inputValue.trim() && !pendingAttachment) || isSending}
          size="sm"
          type="submit"
          variant="solid"
        >
          <Send size={18} />
        </Button>
      </div>
    </form>
  );
});

MessageInput.displayName = "MessageInput";
