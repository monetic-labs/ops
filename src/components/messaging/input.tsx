"use client";

import React, { useState, useRef } from "react";
import { Input } from "@nextui-org/input";

import { useMentions } from "@/hooks/messaging/useMentions";
import { isAgentContext, MentionOption } from "@/types/messaging";
import { useChatContext } from "@/hooks/messaging/useChatContext";
import { useChatActions } from "@/hooks/messaging/useChatActions";

import { MentionList } from "./mention-list";

export const ChatInput: React.FC = () => {
  const context = useChatContext();
  const { mode, service } = context;
  const { sendMessage } = useChatActions();
  const [localInputValue, setLocalInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { options } = useMentions();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [mentionState, setMentionState] = useState({
    isActive: false,
    searchText: "",
    startPosition: 0,
  });

  const isDisabled = isAgentContext(context) ? context.chatHelpers.isLoading : service.isLoading;

  const loadingText = isAgentContext(context)
    ? context.chatHelpers.isLoading
      ? "Sending..."
      : "Send"
    : service.isLoading
      ? "Sending..."
      : "Send";

  const handleMentionSelect = (option: MentionOption) => {
    const beforeMention = localInputValue.slice(0, mentionState.startPosition - 1);
    const afterMention = localInputValue.slice(
      inputRef.current?.selectionStart || mentionState.startPosition + mentionState.searchText.length
    );

    const mentionText = `@${option.value} `;
    const newInput = `${beforeMention}${mentionText}${afterMention}`;

    setLocalInputValue(newInput);
    setMentionState({ isActive: false, searchText: "", startPosition: 0 });

    inputRef.current?.focus();
    const newCursorPosition = beforeMention.length + mentionText.length;

    setTimeout(() => {
      inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleInputWithMentions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    setLocalInputValue(newValue);
    service.setInputValue(newValue);

    if (mentionState.isActive || e.target.value[cursorPosition - 1] === "@") {
      const textBeforeCursor = e.target.value.slice(0, cursorPosition);
      const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

      if (lastAtSymbol !== -1) {
        const searchText = textBeforeCursor.slice(lastAtSymbol + 1);
        const textAfterMention = e.target.value.slice(lastAtSymbol + 1, cursorPosition);

        if (/^[\w\s-]*$/.test(textAfterMention)) {
          setMentionState({
            isActive: true,
            searchText,
            startPosition: lastAtSymbol + 1,
          });

          return;
        }
      }
    }

    if (mentionState.isActive) {
      setMentionState({ isActive: false, searchText: "", startPosition: 0 });
    }
  };

  const getMentionListPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0 };
    const inputRect = inputRef.current.getBoundingClientRect();
    const parentRect = inputRef.current.parentElement?.getBoundingClientRect();

    return {
      top: -(parentRect?.height || 0) - 10,
      left: 0,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInputValue.trim()) return;

    try {
      await sendMessage(localInputValue);
      setLocalInputValue("");
      service.setInputValue("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionState.isActive) {
      const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(mentionState.searchText.toLowerCase())
      );

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setMentionState({ isActive: false, searchText: "", startPosition: 0 });
          break;
        case "Tab":
        case "Enter":
          e.preventDefault();
          if (filteredOptions.length > 0) {
            handleMentionSelect(filteredOptions[selectedIndex]);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 < 0 ? filteredOptions.length - 1 : prev - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
          break;
        default:
          break;
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative flex gap-2" data-testid="chat-input-container">
      <Input
        ref={inputRef}
        aria-label="Chat input"
        className="flex-1"
        data-testid="chat-input"
        disabled={isDisabled}
        placeholder={isAgentContext(context) ? "Ask me anything..." : "Type your message... Use @ to mention"}
        size="lg"
        type="text"
        value={localInputValue}
        variant="bordered"
        onChange={handleInputWithMentions}
        onKeyDown={handleKeyDown}
      />
      <button
        className="px-4 py-2 bg-ualert-500 text-notpurple-500 rounded-lg 
          hover:bg-ualert-600 focus:outline-none focus:ring-2 focus:ring-ualert-500 
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="chat-submit-button"
        disabled={isDisabled}
        onClick={handleSubmit}
      >
        {loadingText}
      </button>
      {mentionState.isActive && (
        <MentionList
          data-testid="mention-list"
          options={options}
          position={getMentionListPosition()}
          searchText={mentionState.searchText}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          visible={true}
          onSelect={handleMentionSelect}
        />
      )}
    </div>
  );
};
