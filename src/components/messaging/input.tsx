'use client';

import React, { useState, useRef } from 'react';
import { useChat } from 'ai/react';
import { useChatMode } from '@/hooks/messaging/useChatMode';
import { MentionList } from './mention-list';
import { useMentions } from '@/hooks/messaging/useMentions';
import { MentionOption } from '@/types/messaging';
import { useChatContext } from '@/hooks/messaging/useChatContext';

export const ChatInput: React.FC = () => {
  const { mode } = useChatMode();
  const { 
    input, 
    handleInputChange, 
    handleSubmit,
    isLoading 
  } = useChatContext();

  const [mentionState, setMentionState] = useState({
    isActive: false,
    searchText: '',
    startPosition: 0
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const { options } = useMentions();

  const handleMentionSelect = (option: MentionOption) => {
    const beforeMention = input.slice(0, mentionState.startPosition - 1);
    const afterMention = input.slice(
      inputRef.current?.selectionStart || mentionState.startPosition + mentionState.searchText.length
    );
    
    const mentionText = `@${option.value} `;
    const newInput = `${beforeMention}${mentionText}${afterMention}`;
    
    // Use handleInputChange from useChat to update input
    handleInputChange({
      target: { value: newInput }
    } as React.ChangeEvent<HTMLInputElement>);
    
    setMentionState({ isActive: false, searchText: '', startPosition: 0 });
    
    // Focus input and move cursor after the mention
    inputRef.current?.focus();
    const newCursorPosition = beforeMention.length + mentionText.length;
    setTimeout(() => {
      inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleInputWithMentions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart || 0;
    
    // Update input using useChat's handleInputChange
    handleInputChange(e);

    // Only process mention logic if we're in an active mention state or just typed @
    if (mentionState.isActive || e.target.value[cursorPosition - 1] === '@') {
      const textBeforeCursor = e.target.value.slice(0, cursorPosition);
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtSymbol !== -1) {
        const searchText = textBeforeCursor.slice(lastAtSymbol + 1);
        const textAfterMention = e.target.value.slice(lastAtSymbol + 1, cursorPosition);
        
        // Only show mention list if we're still in a valid mention context
        if (/^[\w\s-]*$/.test(textAfterMention)) {
          setMentionState({
            isActive: true,
            searchText,
            startPosition: lastAtSymbol + 1
          });
          return;
        }
      }
    }
    
    // If we reach here, we're not in a mention context
    if (mentionState.isActive) {
      setMentionState({ isActive: false, searchText: '', startPosition: 0 });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionState.isActive) {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setMentionState({ isActive: false, searchText: '', startPosition: 0 });
          break;
        case 'Tab':
        case 'Enter':
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          break;
        default:
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getMentionListPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0 };
    const inputRect = inputRef.current.getBoundingClientRect();
    const parentRect = inputRef.current.parentElement?.getBoundingClientRect();
    
    return {
      top: -(parentRect?.height || 0) - 10,
      left: 0
    };
  };

  return (
    <div className="relative flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleInputWithMentions}
        onKeyDown={handleKeyDown}
        placeholder={mode === 'agent' 
          ? "Ask me anything..." 
          : "Type your message... Use @ to mention"}
        className="flex-1 p-2 bg-charyo-500/20 rounded-lg focus:outline-none 
          focus:ring-2 focus:ring-ualert-500 text-notpurple-500 placeholder-notpurple-300"
        disabled={isLoading}
      />
      <button 
        onClick={(e) => handleSubmit(e as any)}
        className="px-4 py-2 bg-ualert-500 text-notpurple-500 rounded-lg 
          hover:bg-ualert-600 focus:outline-none focus:ring-2 focus:ring-ualert-500 
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
      {mentionState.isActive && (
        <MentionList
          options={options}
          searchText={mentionState.searchText}
          onSelect={handleMentionSelect}
          position={getMentionListPosition()}
          visible={true}
        />
      )}
    </div>
  );
};