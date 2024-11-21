"use client";

import React, { useEffect, useCallback } from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { Bot, MessageCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

import { useChatMode } from "@/hooks/messaging/useChatMode";

export const ModeSwitcher: React.FC = () => {
  const { mode, setMode } = useChatMode();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle mode changes
  const handleModeChange = useCallback(
    (newMode: string | number) => {
      const modeValue = newMode as "agent" | "support";

      console.log("Mode change requested:", modeValue);

      // Update state
      setMode(modeValue);

      // Update URL without triggering a navigation
      const params = new URLSearchParams(searchParams.toString());

      params.set("mode", modeValue);
      router.replace(`/test/chat?${params.toString()}`, { scroll: false });
    },
    [setMode, searchParams, router]
  );

  useEffect(() => {
    const urlMode = searchParams.get("mode") as "agent" | "support";

    if (urlMode && urlMode !== mode) {
      console.log("Syncing mode with URL:", urlMode);
      setMode(urlMode);
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
            key="agent"
            data-testid="agent-tab"
            title={
              <div className="flex items-center gap-2" data-testid="agent-tab-content">
                <Bot size={18} />
                <span data-testid="agent-tab-text">PACKS</span>
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
