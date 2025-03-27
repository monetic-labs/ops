import React, { useEffect } from "react";
import { Button } from "@heroui/button";
import { ModalFooter } from "@heroui/modal";
import { Switch } from "@heroui/switch";
import { Kbd } from "@heroui/kbd";
import { Tooltip } from "@heroui/tooltip";

import { useSupportScreenshot } from "@/hooks/messaging/useSupportService";

import { useShortcuts } from "./shortcuts-provider";

interface ActionButton {
  label: string;
  onClick: () => void;
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}

interface ModalFooterWithSupportProps {
  actions: ActionButton[];
  onSupportClick: () => void;
  isNewSender?: boolean;
  onNewSenderChange?: (value: boolean) => void;
}

export default function ModalFooterWithSupport({
  onSupportClick,
  onNewSenderChange,
  isNewSender,
  actions,
}: ModalFooterWithSupportProps) {
  const shortcuts = useShortcuts();
  const { captureScreenshot } = useSupportScreenshot();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        shortcuts.toggleChat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSupportClick = async () => {
    try {
      await captureScreenshot();
      shortcuts.openChat();
      onSupportClick();
    } catch (error) {
      console.error("Error in support flow:", error);
      shortcuts.openChat();
      onSupportClick();
    }
  };

  return (
    <ModalFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 max-h-[50vh] overflow-y-auto">
      <Tooltip content="When you hit support, a screenshot of the current page will be sent to the support team so we can get immediately into helping you.">
        <Button
          className="text-foreground w-2/3 sm:w-auto mx-auto sm:mx-0 order-2 sm:order-none"
          variant="light"
          onPress={handleSupportClick}
        >
          Support
          <div className="hidden sm:flex items-center gap-1 text-xs">
            <Kbd className="px-2 py-0.5" keys={["command"]}>
              K
            </Kbd>
          </div>
        </Button>
      </Tooltip>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-none">
        {onNewSenderChange && isNewSender !== undefined && (
          <div className="flex flex-row items-center gap-2 justify-between px-2">
            <span className="items-center text-xs text-default-400">New Sender</span>
            <Switch
              defaultSelected
              aria-label="New Customer"
              color="primary"
              data-testid="new-sender-toggle"
              isSelected={isNewSender}
              onValueChange={onNewSenderChange}
            />
          </div>
        )}
        {actions.map((action, index) => (
          <Button
            key={index}
            aria-label={action.label}
            className={`bg-primary text-primary-foreground w-full sm:w-auto ${action.className || ""}`}
            data-testid={`${action.label.toLowerCase()}-modal-button`}
            isDisabled={action.isDisabled}
            onPress={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </ModalFooter>
  );
}
