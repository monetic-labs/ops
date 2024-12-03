// fixtures/context-messaging.fixture.ts
import { test as base } from "@playwright/test";
import { PaneFixture } from "./msg-pane.fixture";
import { AgentMessageContext, SupportMessageContext } from "@/types/messaging";

type MessagingFixture = {
  pane: PaneFixture;
  initMessageHandling: () => Promise<void>;
  agentContext: AgentMessageContext;
  supportContext: SupportMessageContext;
  setActiveMode: (mode: "agent" | "support") => Promise<void>;
};

export const test = base.extend<MessagingFixture>({
  pane: async ({ page }, use) => {
    await use(new PaneFixture(page));
  },

  initMessageHandling: async ({ page }, use) => {
    await use(async () => {
      await page.evaluate(() => {
        const ws = window.__MOCK_WS__;
        if (!ws) throw new Error("WebSocket mock not initialized");

        ws.onmessage = (event: MessageEvent) => {
          console.log("Message received:", event.data);
        };
      });
    });
  },

  agentContext: async ({ page }, use) => {
    // Set up mock agent context
    await page.evaluate(() => {
      const initialMessage = {
        id: "test-msg-1",
        role: "assistant",
        type: "system" as const,
        text: "Hello from agent",
        timestamp: Date.now(),
        status: "sent" as const,
        category: "info" as const,
      };

      window.__MOCK_AGENT_CONTEXT__ = {
        mode: "agent",
        messages: [initialMessage],
        isTyping: false,
        inputValue: "",
        userId: "test-user",
        service: {
          type: "openai",
          isLoading: false,
          model: 'gpt-4-turbo',
          messages: [],
          inputValue: "",
          setInputValue: async () => Promise.resolve(),
          sendMessage: async () => Promise.resolve(),
          handleSubmit: async () => Promise.resolve(),
          getUserId: () => "test-user",
        },
        chatHelpers: {
          isLoading: false,
          messages: [],
          input: "",
          handleSubmit: async () => Promise.resolve(),
          handleInputChange: () => {},
          setInput: () => {},
          error: undefined,
          append: async () => "",
          reload: async () => "",
          stop: async () => "",
          setMessages: () => {},
          setData: () => {},
        },
        setInputValue: async () => Promise.resolve(),
        sendMessage: async () => Promise.resolve(),
        handleSubmit: async () => Promise.resolve(),
      };
      // Debug: Log the context after setting it
      console.log("Agent context set:", window.__MOCK_AGENT_CONTEXT__);
    });

    await use({} as AgentMessageContext); // The actual context is managed in the page
  },

  supportContext: async ({ page }, use) => {
    // Set up mock support context
    await page.evaluate(() => {
      window.__MOCK_SUPPORT_CONTEXT__ = {
        mode: "support",
        messages: [],
        isTyping: false,
        inputValue: "",
        userId: "test-user",
        service: {
          isTyping: false,
          type: "websocket",
          channel: "test",
          isLoading: false,
          messages: [],
          inputValue: "",
          setInputValue: async () => Promise.resolve(),
          sendMessage: async () => Promise.resolve(),
          handleSubmit: async () => Promise.resolve(),
          handleWebSocketMessage: () => {},
          getUserId: () => "test-user",
        },
        setInputValue: async () => Promise.resolve(),
        sendMessage: async () => Promise.resolve(),
        handleSubmit: async () => Promise.resolve(),
      };
    });

    await use({} as SupportMessageContext); // The actual context is managed in the page
  },

  setActiveMode: async ({ page }, use) => {
    await use(async (mode: "agent" | "support") => {
      await page.evaluate((activeMode) => {
        // Update the active mode in your app's state management
        window.__ACTIVE_MODE__ = activeMode;
      }, mode);
    });
  },
});

export { expect } from "@playwright/test";
