"use client";

import React, { useRef, useState, FormEvent } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { Send, Smile, MoreHorizontal } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import { useSupportService } from "@/hooks/messaging/useSupportService";
import { useTheme } from "@/hooks/generics/useTheme";
import { useScreenshot } from "@/hooks/messaging/useScreenshot";
import { useFileUpload } from "@/hooks/messaging/useFileUpload";

import { useDrawer } from "./pane";
import { AttachmentPreview } from "./attachment-preview";
import { FormattingToolbar } from "./formatting-toolbar";
import { AttachmentActions } from "./attachment-actions";

interface ChatFooterProps {
  inputRef: React.RefObject<HTMLInputElement>;
}

interface AttachmentState {
  type: "image" | "screenshot";
  name?: string;
  file?: File;
  previewUrl?: string;
  isLoading?: boolean;
}

export const ChatFooter: React.FC<ChatFooterProps> = ({ inputRef }) => {
  const { drawerRef } = useDrawer();
  const { inputValue, setInputValue, handleSubmit } = useSupportService();
  const { theme } = useTheme();
  const { takeScreenshot } = useScreenshot({ drawerRef });
  const { attachment, isUploading, uploadFile, clearAttachment, setAttachment } = useFileUpload();
  const [isFormatting, setIsFormatting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMessageSubmit = () => {
    if ((inputValue.trim() || attachment) && !isUploading && !attachment?.isLoading) {
      const event = new Event("submit") as unknown as FormEvent<Element>;

      handleSubmit(
        event,
        attachment && attachment.previewUrl
          ? {
              url: attachment.previewUrl,
              name: attachment.name || "Attachment",
            }
          : undefined
      );
      setInputValue("");
      clearAttachment();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleMessageSubmit();
    }
  };

  const handleFormat = (format: "bold" | "italic" | "code") => {
    const input = inputRef.current;

    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    const text = inputValue;

    let newText = text;
    let newCursorPos = start;

    switch (format) {
      case "bold":
        newText = `${text.slice(0, start)}**${text.slice(start, end)}**${text.slice(end)}`;
        newCursorPos = end + 4;
        break;
      case "italic":
        newText = `${text.slice(0, start)}_${text.slice(start, end)}_${text.slice(end)}`;
        newCursorPos = end + 2;
        break;
      case "code":
        newText = `${text.slice(0, start)}\`${text.slice(start, end)}\`${text.slice(end)}`;
        newCursorPos = end + 2;
        break;
    }

    setInputValue(newText);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      await uploadFile(file);
    }
  };

  const handleScreenshot = async () => {
    const accessUrl = await takeScreenshot();

    if (accessUrl) {
      setAttachment({
        type: "screenshot",
        name: "Screenshot",
        previewUrl: accessUrl,
        isLoading: false,
      });
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    const input = inputRef.current;

    if (!input) return;

    const start = input.selectionStart ?? inputValue.length;
    const end = input.selectionEnd ?? start;
    const newText = inputValue.slice(0, start) + emoji.native + inputValue.slice(end);

    setInputValue(newText);

    setTimeout(() => {
      input.focus();
      const newCursorPos = start + emoji.native.length;

      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="w-full space-y-2">
      {/* Message Preview */}
      {showPreview && inputValue.length > 100 && (
        <div className="px-3 py-2 bg-content3/20 rounded-lg text-sm text-foreground/80">
          {inputValue.slice(0, 100)}...
        </div>
      )}

      {/* Attachment Preview */}
      <AttachmentPreview attachment={attachment} onClear={clearAttachment} />

      {/* Formatting Toolbar */}
      {isFormatting && <FormattingToolbar onFormat={handleFormat} />}

      {/* Main Input Area */}
      <div className="flex items-center gap-2 px-2">
        <AttachmentActions
          isDisabled={!!attachment || isUploading}
          onScreenshotClick={handleScreenshot}
          onUploadClick={() => fileInputRef.current?.click()}
        />

        <Popover placement="top">
          <PopoverTrigger>
            <Button isIconOnly className="text-foreground/80" size="sm" variant="light">
              <Smile className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-0">
              <Picker
                data={data}
                previewPosition="none"
                skinTonePosition="none"
                theme={theme}
                onEmojiSelect={handleEmojiSelect}
              />
            </div>
          </PopoverContent>
        </Popover>

        <input ref={fileInputRef} accept="image/*" className="hidden" type="file" onChange={handleFileUpload} />

        <div className="flex-1">
          <Input
            ref={inputRef}
            classNames={{
              base: "h-10",
              input: ["bg-transparent", "text-foreground/90", "placeholder:text-foreground/50"].join(" "),
              innerWrapper: "bg-transparent",
              inputWrapper: [
                "h-10",
                "shadow-none",
                "bg-content3/20",
                "hover:bg-content3/40",
                "group-data-[focused=true]:bg-content3/40",
              ].join(" "),
            }}
            endContent={
              <div className="flex items-center gap-1 h-full">
                <Button
                  isIconOnly
                  className="text-foreground/80"
                  size="sm"
                  variant="light"
                  onPress={() => setIsFormatting(!isFormatting)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            }
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowPreview(e.target.value.length > 100);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <Button
          isIconOnly
          color="primary"
          isDisabled={isUploading || attachment?.isLoading}
          variant={inputValue.trim() || (attachment && !attachment.isLoading) ? "solid" : "flat"}
          onPress={handleMessageSubmit}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
