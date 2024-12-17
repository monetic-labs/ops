"use client";

import React from "react";

import { MessageInput } from "./input";
import { ChatActions } from "./actions";
import { ModeSwitcher } from "./mode-switcher";

interface ChatFooterProps {
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const ChatFooter = React.memo<ChatFooterProps>(({ inputRef }) => {
  return (
    <div className="border-t border-charyo-600 p-4 space-y-4" data-testid="pane-footer">
      <ModeSwitcher />
      <ChatActions />
      <MessageInput ref={inputRef} />
    </div>
  );
});

ChatFooter.displayName = "PaneFooter";
