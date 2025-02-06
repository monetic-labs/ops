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
import { useAgentService } from "@/hooks/messaging/useAgentService";
import { useMentions } from "@/hooks/messaging/useMentions";
import { useSupportService } from "@/hooks/messaging/useSupportService";
import { MentionOption } from "@/types/messaging";
import pylon from "@/libs/pylon-sdk";

import { MentionList } from "./mention-list";

export const MessageInput = forwardRef<HTMLInputElement>((_, ref) => {
  const state = useMessagingState();
  const { mode, inputValues, pendingAttachment } = state;
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const {
    message: { setInputValue, setPendingAttachment },
  } = useMessagingActions();

  // Services
  const agentService = useAgentService();
  const supportService = useSupportService();
  const activeService = mode === "support" ? supportService : agentService;

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
      setInputValue({ mode, value: newValue });
      handleMentionInputChange(newValue, e.target.selectionStart || 0, e.target);
    },
    [mode, setInputValue, handleMentionInputChange]
  );

  const handleMentionSelect = useCallback(
    async (option: MentionOption) => {
      const currentInput = inputValues[mode];
      const cursorPos = (document.querySelector('[data-testid="chat-input"]') as HTMLInputElement)?.selectionStart || 0;
      const textBeforeCursor = currentInput.slice(0, cursorPos);
      const textAfterCursor = currentInput.slice(cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex === -1) return;

      const selectedMention = handleSelectMention(option);
      const newValue = textBeforeCursor.slice(0, lastAtIndex) + selectedMention.insertText + " " + textAfterCursor;

      setInputValue({ mode, value: newValue });

      setTimeout(() => {
        const input = document.querySelector('[data-testid="chat-input"]') as HTMLInputElement;
        if (input) {
          const newCursorPos = lastAtIndex + selectedMention.insertText.length + 1;
          input.setSelectionRange(newCursorPos, newCursorPos);
          input.focus();
        }
      }, 0);
    },
    [mode, inputValues, handleSelectMention, setInputValue]
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
      const text = inputValues[mode];

      if (!text.trim() && !pendingAttachment) return;
      if (isSending) return; // Prevent duplicate submissions

      try {
        setIsSending(true);
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

            // Send message with file and caption
            await pylon.createTelegramMessage({
              text: text || "Image Attachment",
              file: accessUrl,
            });
          } else if (pendingAttachment.type === "screenshot") {
            // For screenshots, we already have the file uploaded, just send the message
            await pylon.createTelegramMessage({
              text: text || "Screenshot",
              file: pendingAttachment.preview,
            });
          }
          // Clear the attachment after sending
          setPendingAttachment(null);
        } else {
          // Regular text message
          await activeService.sendMessage(text.trim());
        }

        setInputValue({ mode, value: "" });
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsSending(false);
      }
    },
    [mode, inputValues, pendingAttachment, activeService, setInputValue, setPendingAttachment, isSending]
  );

  const onEmojiSelect = useCallback(
    (emoji: any) => {
      const input = document.querySelector('[data-testid="chat-input"]') as HTMLInputElement;
      const cursorPos = input?.selectionStart || 0;
      const currentValue = inputValues[mode];
      const textBeforeCursor = currentValue.slice(0, cursorPos);
      const textAfterCursor = currentValue.slice(cursorPos);
      const newValue = textBeforeCursor + emoji.native + textAfterCursor;

      setInputValue({ mode, value: newValue });
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
    [mode, inputValues, setInputValue]
  );

  const handleClearAttachment = () => {
    setPendingAttachment(null);
  };

  return (
    <form className="flex flex-col gap-2 p-2" data-testid="chat-input-form" onSubmit={handleSubmit}>
      {pendingAttachment && (
        <Card className="p-2 bg-charyo-600/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {pendingAttachment.type === "image" && pendingAttachment.preview && (
                <img
                  alt="Attachment preview"
                  className="w-8 h-8 rounded object-cover"
                  src={pendingAttachment.preview}
                />
              )}
              <span className="text-sm text-white/80">
                {pendingAttachment.type === "screenshot" ? "Screenshot" : "Image"} attachment
              </span>
            </div>
            <Button
              isIconOnly
              className="bg-transparent text-white/60 hover:text-white"
              size="sm"
              variant="light"
              onPress={handleClearAttachment}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      <div className="relative flex items-end gap-2">
        <Input
          ref={ref}
          classNames={{
            base: "max-w-full",
            mainWrapper: "max-w-full",
            input: "text-sm",
            inputWrapper: "bg-charyo-600/50 hover:bg-charyo-600/70 transition-colors",
          }}
          data-testid="chat-input"
          disabled={isSending}
          placeholder={`Type a message to ${mode === "support" ? "support" : "agent"}...`}
          radius="lg"
          size="sm"
          type="text"
          value={inputValues[mode]}
          variant="bordered"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          endContent={
            <Popover placement="top" isOpen={showEmoji} onOpenChange={setShowEmoji}>
              <PopoverTrigger>
                <Button
                  isIconOnly
                  className="bg-transparent text-default-400 hover:text-default-500"
                  disabled={isSending}
                  radius="full"
                  size="sm"
                  variant="light"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Picker data={data} onEmojiSelect={onEmojiSelect} />
              </PopoverContent>
            </Popover>
          }
        />

        <Button
          isIconOnly
          className="bg-ualert-500 text-notpurple-500"
          data-testid="chat-submit"
          isDisabled={(!inputValues[mode].trim() && !pendingAttachment) || isSending}
          isLoading={isSending}
          radius="full"
          type="submit"
        >
          <Send className="w-4 h-4" />
        </Button>

        <MentionList
          options={mentionOptions}
          position={mentionState.position}
          searchText={mentionState.searchText}
          selectedIndex={mentionState.selectedIndex}
          setSelectedIndex={(index) => setMentionState({ selectedIndex: index })}
          visible={mentionState.isOpen}
          onSelect={handleMentionSelect}
        />
      </div>
    </form>
  );
});

MessageInput.displayName = "MessageInput";
