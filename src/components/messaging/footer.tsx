"use client";

import React from "react";
import { Divider } from "@nextui-org/divider";

import { MessageInput } from "./input";
import { ChatActions } from "./actions";
import { ModeSwitcher } from "./mode-switcher";

interface ChatFooterProps {
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const ChatFooter = React.memo<ChatFooterProps>(({ inputRef }) => {
  return (
    <div className="w-full space-y-2" data-testid="pane-footer">
      <div className="px-2">
        <ModeSwitcher />
      </div>
      <Divider className="bg-charyo-400/20" />
      <div className="px-2">
        <ChatActions />
      </div>
      <MessageInput ref={inputRef} />
    </div>
  );
});

ChatFooter.displayName = "PaneFooter";
