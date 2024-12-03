"use client";

import React, { useCallback, forwardRef, useState } from 'react';
import { useMessagingState, useMessagingActions } from '@/libs/messaging/store';
import { useAgentService } from '@/hooks/messaging/useAgentService';
import { useMentions } from '@/hooks/messaging/useMentions';
import { MentionOption } from '@/types/messaging';
import { MentionList } from './mention-list';

export const MessageInput = forwardRef<HTMLInputElement>((_, ref) => {
  const { inputValue, mode } = useMessagingState();
  const { message: { setInputValue, sendMessage } } = useMessagingActions();
  const agentService = useAgentService();
  const { options: mentionOptions } = useMentions();

  // Add state for mention handling
  const [mentionState, setMentionState] = useState({
    isOpen: false,
    searchText: '',
    selectedIndex: 0,
    position: { top: 0, left: 0 }
    });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      await agentService.sendMessage(inputValue.trim());
      setInputValue('');
      // Close mentions if open
      setMentionState(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [inputValue, agentService, setInputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Handle @ mentions
    const words = newValue.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@')) {
      const searchTerm = lastWord.slice(1).toLowerCase();
      setMentionState(prev => ({
        ...prev,
        isOpen: true,
        searchText: searchTerm,
      }));
    } else {
      setMentionState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!mentionState.isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setMentionState(prev => ({
          ...prev,
          selectedIndex: Math.min(
            prev.selectedIndex + 1,
            mentionOptions.length - 1
          )
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setMentionState(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, 0)
        }));
        break;
      case 'Tab': // Add Tab handler
        e.preventDefault();
        const filteredOptionsTab = mentionOptions.filter(option =>
          option.value.toLowerCase().includes(mentionState.searchText.toLowerCase())
        );
        if (filteredOptionsTab.length > 0) {
          // Select the currently highlighted option or the first match
          handleMentionSelect(filteredOptionsTab[mentionState.selectedIndex] || filteredOptionsTab[0]);
        }
        break;
      case 'Enter':
        e.preventDefault();
        const filteredOptions = mentionOptions.filter(option =>
          option.value.toLowerCase().includes(mentionState.searchText)
        );
        if (filteredOptions[mentionState.selectedIndex]) {
          handleMentionSelect(filteredOptions[mentionState.selectedIndex]);
        }
        break;
      case 'Escape':
        setMentionState(prev => ({ ...prev, isOpen: false }));
        break;
    }
  };

  const handleMentionSelect = (option: MentionOption) => {
    const words = inputValue.split(' ');
    words[words.length - 1] = `@${option.value}`;
    setInputValue(words.join(' ') + ' ');
    setMentionState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex items-center p-4 relative"
      data-testid="chat-input-form"
    >
      <div className="relative flex-1">
        <input
          ref={ref}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Type a message to ${mode === 'support' ? 'support' : 'agent'}...`}
          className="w-full p-2 border rounded-lg mr-2"
          data-testid="chat-input"
        />
        
        <MentionList
          options={mentionOptions}
          searchText={mentionState.searchText}
          onSelect={handleMentionSelect}
          position={mentionState.position}
          visible={mentionState.isOpen}
          selectedIndex={mentionState.selectedIndex}
          setSelectedIndex={(index) => 
            setMentionState(prev => ({ ...prev, selectedIndex: index }))
          }
        />
      </div>

      <button
        type="submit"
        disabled={!inputValue.trim()}
        className="px-4 py-2 bg-ualert-500 text-white rounded-lg disabled:opacity-50"
        data-testid="chat-submit"
      >
        Send
      </button>
    </form>
  );
});

MessageInput.displayName = 'MessageInput';