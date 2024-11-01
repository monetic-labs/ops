"use client";

import React from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { Bot, MessageCircle } from "lucide-react";

import { useChatMode } from "@/hooks/messaging/useChatMode";

export const ModeSwitcher: React.FC = () => {
  const { mode, setMode } = useChatMode();

  return (
    <Tabs
      aria-label="Chat modes"
      className="w-full"
      selectedKey={mode}
      onSelectionChange={(key) => setMode(key as "agent" | "support")}
    >
      <Tab
        key="agent"
        title={
          <div className="flex items-center gap-2">
            <Bot size={18} />
            <span>AI Agent</span>
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
  );
};
