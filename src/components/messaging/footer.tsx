'use client';

import React from 'react';
import { ChatInput } from './input';
import { ChatActions } from './actions';
import { ModeSwitcher } from './mode-switcher';

export const ChatFooter: React.FC = () => {
  return (
    <div className="border-t border-charyo-600 p-4 space-y-4">
      <ModeSwitcher />
      <ChatActions />
      <ChatInput />
    </div>
  );
};