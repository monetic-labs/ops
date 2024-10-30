'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatActions } from '@/hooks/messaging/useChatActions';
import { MentionList } from './mention-list';
import { useMentions } from '@/hooks/messaging/useMentions';
import { MentionOption } from '@/types/messaging';

export const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [mentionState, setMentionState] = useState({
    isActive: false,
    searchText: '',
    startPosition: 0
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChatActions();
  const { options } = useMentions();

  const handleMentionSelect = (option: MentionOption) => {
    const beforeMention = message.slice(0, mentionState.startPosition - 1);
    const afterMention = message.slice(
      inputRef.current?.selectionStart || mentionState.startPosition + mentionState.searchText.length
    );
    
    const mentionText = `@${option.value} `;
    const newMessage = `${beforeMention}${mentionText}${afterMention}`;
    
    setMessage(newMessage);
    setMentionState({ isActive: false, searchText: '', startPosition: 0 });
    
    // Focus input and move cursor after the mention
    inputRef.current?.focus();
    const newCursorPosition = beforeMention.length + mentionText.length;
    setTimeout(() => {
      inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    setMessage(newValue);

    // Only process mention logic if we're in an active mention state or just typed @
    if (mentionState.isActive || newValue[cursorPosition - 1] === '@') {
      const textBeforeCursor = newValue.slice(0, cursorPosition);
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtSymbol !== -1) {
        const searchText = textBeforeCursor.slice(lastAtSymbol + 1);
        const textAfterMention = newValue.slice(lastAtSymbol + 1, cursorPosition);
        
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

  useEffect(() => {
    console.log('Mention state:', mentionState);
  }, [mentionState]);

  const handleSend = async () => {
    if (message.trim() === '') return;
    await sendMessage(message);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      handleSend();
    }
  };

  const getMentionListPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0 };
    const inputRect = inputRef.current.getBoundingClientRect();
    const parentRect = inputRef.current.parentElement?.getBoundingClientRect();
    
    return {
      top: -(parentRect?.height || 0) - 10, // Position above the input
      left: 0 // Align with input's left edge
    };
  };

  return (
    <div className="relative flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... Use @ to mention"
        className="flex-1 p-2 bg-charyo-500/20 rounded-lg focus:outline-none 
          focus:ring-2 focus:ring-ualert-500 text-notpurple-500 placeholder-notpurple-300"
      />
      <button 
        onClick={handleSend}
        className="px-4 py-2 bg-ualert-500 text-notpurple-500 rounded-lg 
          hover:bg-ualert-600 focus:outline-none focus:ring-2 focus:ring-ualert-500 
          transition-colors"
      >
        Send
      </button>
      <MentionList
        options={options}
        searchText={mentionState.searchText}
        onSelect={handleMentionSelect}
        position={getMentionListPosition()}
        visible={mentionState.isActive}
      />
    </div>
  );
};