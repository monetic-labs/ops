"use client";

import React, { useEffect } from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { Bot, MessageCircle } from "lucide-react";

import { useChatMode } from "@/hooks/messaging/useChatMode";
import { useSearchParams } from "next/navigation";

export const ModeSwitcher: React.FC = () => {
  const { mode, setMode } = useChatMode();
  const searchParams = useSearchParams();

  // Sync with URL parameters on mount
  useEffect(() => {
    const urlMode = searchParams.get('mode') as 'agent' | 'support';
    if (urlMode && urlMode !== mode) {
      setMode(urlMode);
    }
  }, [searchParams, mode, setMode]);

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
          <div className="flex items-center gap-2" data-testid="agent-tab">
            <Bot size={18} />
            <span>PACKS</span>
          </div>
        }
      />
      <Tab
        key="support"
        title={
          <div className="flex items-center gap-2" data-testid="support-tab">
            <MessageCircle size={18} />
            <span>Support</span>
          </div>
        }
      />
    </Tabs>
  );
};
