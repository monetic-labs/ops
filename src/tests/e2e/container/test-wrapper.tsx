import React, { useEffect } from "react";
import { ShortcutsProvider } from "@/components/generics/shortcuts-provider";
import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";

interface TestWrapperProps {
  children: React.ReactNode;
  mode?: "bot" | "support";
}

export function TestWrapper({ children, mode = "bot" }: TestWrapperProps) {
  const { ui: uiActions, message: messageActions } = useMessagingActions();

  useEffect(() => {
    // Handle external state changes
    const handleStateChange = (event: CustomEvent) => {
      if (event.detail?.isOpen !== undefined) {
        uiActions.togglePane();
      }
    };

    const handleSetTyping = (event: CustomEvent) => {
      messageActions.setTyping(event.detail);
    };

    const handleSetInput = (event: CustomEvent) => {
      messageActions.setInputValue(event.detail);
    };

    window.addEventListener("force-chat-state", handleStateChange as EventListener);
    window.addEventListener("set-typing", handleSetTyping as EventListener);
    window.addEventListener("set-input", handleSetInput as EventListener);

    return () => {
      window.removeEventListener("force-chat-state", handleStateChange as EventListener);
      window.removeEventListener("set-typing", handleSetTyping as EventListener);
      window.removeEventListener("set-input", handleSetInput as EventListener);
    };
  }, [uiActions, messageActions]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.userAgent.toLowerCase().includes("mac");
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      if (modifierKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        uiActions.togglePane();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [uiActions]);

  return (
    <ShortcutsProvider disablePane={true}>
      {children}
    </ShortcutsProvider>
  );
}
