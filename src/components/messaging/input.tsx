"use client";

import React, { useCallback, forwardRef } from "react";

import { useMessagingState, useMessagingActions, useMessagingStore } from "@/libs/messaging/store";
import { useAgentService } from "@/hooks/messaging/useAgentService";
import { useMentions } from "@/hooks/messaging/useMentions";
import { MentionOption } from "@/types/messaging";

import { MentionList } from "./mention-list";

export const MessageInput = forwardRef<HTMLInputElement>((_, ref) => {
  const { inputValue, mode } = useMessagingState();
  const {
    message: { setInputValue },
  } = useMessagingActions();
  const agentService = useAgentService();
  const { options: mentionOptions } = useMentions();

  // Move mentionState to global store instead of local state
  const {
    mention: { setMentionState },
  } = useMessagingActions();
  const mentionState = useMessagingStore((state) => state.mention);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim()) return;

      try {
        // Send message and clear input immediately
        const messageToSend = inputValue.trim();
        setInputValue("");
        // Close mentions if open
        setMentionState({ isOpen: false });
        
        // Send message after clearing input
        await agentService.sendMessage(messageToSend);
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [inputValue, agentService, setInputValue, setMentionState]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      setInputValue(newValue);

      // Handle @ mentions
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = newValue.slice(0, cursorPosition ?? 0);
      const words = textBeforeCursor.split(" ");
      const lastWord = words[words.length - 1];

      if (lastWord.startsWith("@")) {
        const searchTerm = lastWord.slice(1).toLowerCase();
        const rect = e.target.getBoundingClientRect();

        setMentionState({
          isOpen: true,
          searchText: searchTerm,
          selectedIndex: 0, // Reset index when search text changes
          position: {
            top: rect.top,
            left: rect.left,
          },
        });
      } else if (mentionState.isOpen) {
        setMentionState({
          isOpen: false,
          searchText: "",
          selectedIndex: 0,
        });
      }
    },
    [setInputValue, setMentionState, mentionState.isOpen]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!mentionState.isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setMentionState({
            selectedIndex: Math.min(mentionState.selectedIndex + 1, mentionOptions.length - 1),
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setMentionState({
            selectedIndex: Math.max(mentionState.selectedIndex - 1, 0),
          });
          break;
        case "Enter":
          e.preventDefault();
          const filteredOptions = mentionOptions.filter((option) =>
            option.value.toLowerCase().includes(mentionState.searchText)
          );

          if (filteredOptions[mentionState.selectedIndex]) {
            handleMentionSelect(filteredOptions[mentionState.selectedIndex]);
          }
          break;
        case "Escape":
          setMentionState({ isOpen: false });
          break;
      }
    },
    [mentionState.isOpen, mentionState.selectedIndex, mentionState.searchText, mentionOptions, setMentionState]
  );

  const handleMentionSelect = useCallback(
    (option: MentionOption) => {
      const words = inputValue.split(" ");

      words[words.length - 1] = `@${option.value}`;
      setInputValue(words.join(" ") + " ");
      setMentionState({ isOpen: false });
    },
    [inputValue, setInputValue, setMentionState]
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
          value={inputValue}
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
        disabled={!inputValue.trim()}
        type="submit"
      >
        Send
      </button>
    </form>
  );
});

MessageInput.displayName = "MessageInput";
