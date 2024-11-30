"use client";

import React, { useCallback, forwardRef } from 'react';
import { useMessagingState, useMessagingActions } from '@/libs/messaging/store';

export const MessageInput = forwardRef<HTMLInputElement>((_, ref) => {
  const { inputValue, mode } = useMessagingState();
  const { message: { setInputValue, sendMessage } } = useMessagingActions();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      await sendMessage(inputValue.trim());
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [inputValue, sendMessage, setInputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex items-center p-4"
      data-testid="chat-input-form"
    >
      <input
        ref={ref}
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={`Type a message to ${mode === 'support' ? 'support' : 'agent'}...`}
        className="flex-1 p-2 border rounded-lg mr-2"
        data-testid="chat-input"
      />
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