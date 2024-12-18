"use client";

import React, { useEffect, useCallback } from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { Bot, MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { useMessagingActions, useMessagingState } from "@/libs/messaging/store";
import { MessageMode } from "@/types/messaging";

export const ModeSwitcher: React.FC = () => {
  const { mode } = useMessagingState();
  const { setMode } = useMessagingActions().message;
  const searchParams = useSearchParams();

  // Handle mode changes
  const handleModeChange = useCallback(
    (newMode: string | number) => {
      const modeValue = newMode as "bot" | "support";

      setMode(modeValue as MessageMode);
    },
    [setMode, searchParams]
  );

  useEffect(() => {
    const urlMode = searchParams.get("mode") as MessageMode;

    if (urlMode && urlMode !== mode) {
      console.log("Syncing mode with URL:", urlMode);
      setMode(urlMode as MessageMode);
    }
  }, [searchParams, mode, setMode]);

  return (
    <div className="w-full" data-testid="mode-switcher">
      <div aria-label="Chat modes" className="flex flex-col w-full" role="tablist">
        <Tabs
          className="w-full"
          data-testid="mode-tabs"
          disableAnimation={true}
          selectedKey={mode}
          variant="solid"
          onSelectionChange={handleModeChange}
        >
          <Tab
            key="bot"
            data-testid="bot-tab"
            title={
              <div className="flex items-center gap-2" data-testid="bot-tab-content">
                <Bot size={18} />
                <span data-testid="bot-tab-text">PACKS</span>
              </div>
            }
          />
          <Tab
            key="support"
            data-testid="support-tab"
            title={
              <div className="flex items-center gap-2" data-testid="support-tab-content">
                <MessageCircle size={18} />
                <span data-testid="support-tab-text">Support</span>
              </div>
            }
          />
        </Tabs>
      </div>
    </div>
  );
};
