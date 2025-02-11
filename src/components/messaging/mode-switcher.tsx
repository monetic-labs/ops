"use client";

import React from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { MessageCircle } from "lucide-react";

import { useMessagingState } from "@/libs/messaging/store";

export const ModeSwitcher: React.FC = () => {
  const { mode } = useMessagingState();

  return (
    <div className="w-full" data-testid="mode-switcher">
      <div aria-label="Chat modes" className="flex flex-col w-full" role="tablist">
        <Tabs className="w-full" data-testid="mode-tabs" disableAnimation={true} selectedKey={mode} variant="solid">
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
