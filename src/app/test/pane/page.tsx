"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TestWrapper } from "@/tests/container/test-wrapper";
import { ChatPane } from "@/components/messaging/pane";
import { useMessagingStore, useMessagingActions, resetMessagingStore } from "@/libs/messaging/store";
import { MessageMode } from "@/types/messaging";

export default function TestPage() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as MessageMode) || "agent";
  const { message: messageActions } = useMessagingActions();

  useEffect(() => {
    // Reset store on mount
    resetMessagingStore();

    // Initialize store with test values
    messageActions.setMode(mode);
    
    // Handle message updates from test events
    const handleAddMessages = (e: CustomEvent) => {
      if (Array.isArray(e.detail)) {
        e.detail.forEach(message => {
          messageActions.appendMessage(message);
        });
      }
    };

    window.addEventListener("add-messages", handleAddMessages as EventListener);
    window.addEventListener("update-chat-context", handleAddMessages as EventListener);

    return () => {
      window.removeEventListener("add-messages", handleAddMessages as EventListener);
      window.removeEventListener("update-chat-context", handleAddMessages as EventListener);
      resetMessagingStore();
    };
  }, [mode, messageActions]);

  // Debug: Log store state changes
  useEffect(() => {
    const unsubscribe = useMessagingStore.subscribe(
      state => state.message.messages,
    );
    console.log(useMessagingStore.getState().message.messages);

    return () => unsubscribe();
  }, []);

  return (
    <TestWrapper mode={mode}>
      <div className="h-screen flex flex-col">
        <div data-testid="debug-mount">Test Page Mounted</div>
        <ChatPane 
          isOpen={useMessagingStore.getState().ui.isOpen} 
          onClose={() => useMessagingStore.getState().actions.ui.togglePane()} 
        />
        {/* Debug elements */}
        <div data-testid="debug-messages" style={{ display: 'none' }}>
          {JSON.stringify(useMessagingStore.getState().message.messages)}
        </div>
        <div data-testid="debug-mode" style={{ display: 'none' }}>
          {useMessagingStore.getState().message.mode}
        </div>
      </div>
    </TestWrapper>
  );
}
