// src/components/messaging/input.tsx
"use client";

import React, { useCallback, forwardRef } from "react";

import { useMessagingState, useMessagingActions } from "@/libs/messaging/store";
import { useAgentService } from "@/hooks/messaging/useAgentService";
import { useMentions } from "@/hooks/messaging/useMentions";
import { useSupportService } from "@/hooks/messaging/useSupportService";
import { MentionOption } from "@/types/messaging";

import { MentionList } from "./mention-list";

export const MessageInput = forwardRef<HTMLInputElement>((_, ref) => {
  const { mode } = useMessagingState();
  const {
    message: { setInputValue },
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

      await activeService.setInputValue(newValue);

      // Handle mentions
      handleMentionInputChange(newValue, e.target.selectionStart || 0, e.target);
    },
    [activeService, handleMentionInputChange]
  );

  const handleMentionSelect = useCallback(
    async (option: MentionOption) => {
      const currentInput = activeService.inputValue;
      const cursorPos = (document.querySelector('[data-testid="chat-input"]') as HTMLInputElement)?.selectionStart || 0;
      const textBeforeCursor = currentInput.slice(0, cursorPos);
      const textAfterCursor = currentInput.slice(cursorPos);

      // Find the last @ symbol before cursor
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex === -1) return;

      const selectedMention = handleSelectMention(option);

      // Replace the text between @ and cursor with the mention
      const newValue = textBeforeCursor.slice(0, lastAtIndex) + selectedMention.insertText + " " + textAfterCursor;

      await activeService.setInputValue(newValue);

      // Set cursor position after the inserted mention
      setTimeout(() => {
        const input = document.querySelector('[data-testid="chat-input"]') as HTMLInputElement;

        if (input) {
          const newCursorPos = lastAtIndex + selectedMention.insertText.length + 1;

          input.setSelectionRange(newCursorPos, newCursorPos);
          input.focus();
        }
      }, 0);
    },
    [activeService, handleSelectMention]
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
      await activeService.handleSubmit(e);
    },
    [activeService]
  );

  return (
    <form className="flex items-center p-4 relative" data-testid="chat-input-form" onSubmit={handleSubmit}>
      <div className="relative flex-1">
        <input
          ref={ref}
          className="w-full p-2 border rounded-lg mr-2"
          data-testid="chat-input"
          placeholder={`Type a message to ${mode === "support" ? "support" : "agent"}...`}
          type="text"
          value={activeService.inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />

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

      <button
        className="px-4 py-2 bg-ualert-500 text-white rounded-lg disabled:opacity-50"
        data-testid="chat-submit"
        disabled={!activeService.inputValue.trim()}
        type="submit"
      >
        Send
      </button>
    </form>
  );
});

MessageInput.displayName = "MessageInput";
