'use client';

import React, { useState, useCallback } from 'react';
import { ChatHeader } from './header';
import { ChatBody } from './body';
import { ChatFooter } from './footer';
import { useResizePanel } from '@/hooks/messaging/useResizePanel';

interface ChatPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({ isOpen, onClose }) => {
  const { width, isResizing, resizeHandleProps } = useResizePanel();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 transition-opacity lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Chat Panel */}
      <div 
        style={{ width: `${width}px` }}
        className={`fixed left-0 top-0 h-full bg-charyo-500/80 shadow-lg transform 
          transition-transform duration-300 z-50 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <ChatHeader onClose={onClose} />
        <ChatBody />
        <ChatFooter />

        {/* Resize Handle */}
        <div
          {...resizeHandleProps}
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize 
            hover:bg-ualert-500/50 ${isResizing ? 'bg-ualert-500' : 'bg-charyo-500'}`}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 -mr-2 
            flex items-center justify-center">
            <div className="w-1 h-4 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>
    </>
  );
};