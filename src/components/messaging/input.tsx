"use client";

import React, { useState, useRef } from "react";
import { Input } from "@nextui-org/input";

import { useChatMode } from "@/hooks/messaging/useChatMode";
import { useMentions } from "@/hooks/messaging/useMentions";
import { MentionOption } from "@/types/messaging";
import { useChatContext } from "@/hooks/messaging/useChatContext";
import { useChatActions } from "@/hooks/messaging/useChatActions";

import { MentionList } from "./mention-list";

export const ChatInput: React.FC = () => {
  const { mode } = useChatMode();
  const { service, chatHelpers } = useChatContext();
  const { sendMessage } = useChatActions();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { options } = useMentions();

  const [mentionState, setMentionState] = useState({
    isActive: false,
    searchText: "",
    startPosition: 0,
  });

  const handleMentionSelect = (option: MentionOption) => {
    const beforeMention = inputValue.slice(0, mentionState.startPosition - 1);
    const afterMention = inputValue.slice(
      inputRef.current?.selectionStart || mentionState.startPosition + mentionState.searchText.length
    );

    const mentionText = `@${option.value} `;
    const newInput = `${beforeMention}${mentionText}${afterMention}`;

    setInputValue(newInput);
    setMentionState({ isActive: false, searchText: "", startPosition: 0 });

    // Focus input and move cursor after the mention
    inputRef.current?.focus();
    const newCursorPosition = beforeMention.length + mentionText.length;

    setTimeout(() => {
      inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleInputWithMentions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    setInputValue(newValue);

    // Only process mention logic if we're in an active mention state or just typed @
    if (mentionState.isActive || e.target.value[cursorPosition - 1] === "@") {
      const textBeforeCursor = e.target.value.slice(0, cursorPosition);
      const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

      if (lastAtSymbol !== -1) {
        const searchText = textBeforeCursor.slice(lastAtSymbol + 1);
        const textAfterMention = e.target.value.slice(lastAtSymbol + 1, cursorPosition);

        // Only show mention list if we're still in a valid mention context
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

    // If we reach here, we're not in a mention context
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
    if (!inputValue.trim()) return;

    try {
      await sendMessage(inputValue);
      setInputValue("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionState.isActive) {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setMentionState({ isActive: false, searchText: "", startPosition: 0 });
          break;
        case "Tab":
        case "Enter":
        case "ArrowUp":
        case "ArrowDown":
          e.preventDefault();
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
    <div className="relative flex gap-2">
      <Input
        ref={inputRef}
        aria-label="Chat input"
        className="flex-1"
        disabled={mode === "agent" ? chatHelpers.isLoading : service.isInputLoading()}
        placeholder={mode === "agent" ? "Ask me anything..." : "Type your message... Use @ to mention"}
        size="lg"
        type="text"
        value={inputValue}
        variant="bordered"
        onChange={handleInputWithMentions}
        onKeyDown={handleKeyDown}
      />
      <button
        className="px-4 py-2 bg-ualert-500 text-notpurple-500 rounded-lg 
          hover:bg-ualert-600 focus:outline-none focus:ring-2 focus:ring-ualert-500 
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={mode === "agent" ? chatHelpers.isLoading : service.isInputLoading()}
        onClick={handleSubmit}
      >
        {mode === "agent"
          ? chatHelpers.isLoading
            ? "Sending..."
            : "Send"
          : service.isInputLoading()
            ? "Sending..."
            : "Send"}
      </button>
      {mentionState.isActive && (
        <MentionList
          options={options}
          position={getMentionListPosition()}
          searchText={mentionState.searchText}
          visible={true}
          onSelect={handleMentionSelect}
        />
      )}
    </div>
  );
};
