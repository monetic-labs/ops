import React, { useEffect, useState, useCallback } from 'react';
import SupportChat from './support-chat';
import { XIcon, Bot, MessageCircle } from 'lucide-react'; // Make sure to install @heroicons/react
import { Kbd } from '@nextui-org/kbd';
import { Tab, Tabs } from '@nextui-org/tabs';

interface LeftPaneChatProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatMode = 'bot' | 'support';

const MIN_WIDTH = 320; // Minimum width in pixels
const MAX_WIDTH = 800; // Maximum width in pixels

const LeftPaneChat: React.FC<LeftPaneChatProps> = ({ isOpen, onClose }) => {
  const [width, setWidth] = useState(400); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const [mode, setMode] = useState<ChatMode>('bot');

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    }
  }, [isResizing]);

  // Add event listeners when resizing starts
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

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
        className={`fixed left-0 top-0 h-full bg-charyo-500/80 shadow-lg transform transition-transform duration-300 z-50 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-charyo-600">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">AI Chat</h2>
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                <Kbd keys={["command"]} className="px-2 py-0.5">k</Kbd>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-charyo-600 transition-colors"
              aria-label="Close chat"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Mode Switcher */}
          <Tabs 
            aria-label="Chat modes" 
            selectedKey={mode}
            onSelectionChange={(key) => setMode(key as ChatMode)}
            className="w-full"
          >
            <Tab
              key="bot"
              title={
                <div className="flex items-center gap-2">
                  <Bot size={18} />
                  <span>AI Assistant</span>
                </div>
              }
            />
            <Tab
              key="support"
              title={
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} />
                  <span>Support</span>
                </div>
              }
            />
          </Tabs>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden bg-charyo-400/20">
          <SupportChat mode={mode} />
        </div>

        {/* Resize Handle */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-ualert-500/50
            ${isResizing ? 'bg-ualert-500' : 'bg-charyo-500'}`}
          onMouseDown={startResizing}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 -mr-2 flex items-center justify-center">
            <div className="w-1 h-4 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>
    </>
  );
};

export default LeftPaneChat;
