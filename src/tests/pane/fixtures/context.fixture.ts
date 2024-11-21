import { test as base, Page, TestInfo } from '@playwright/test';
import type {
  AgentChatContext,
  SupportChatContext,
  ChatContextType,
  AgentMessageService,
  Message,
} from "@/types/messaging";
import { mockAgentContext } from './agent-context.fixture';
import { mockSupportContext } from './support-context.fixture';

type IntegrationContextType = {
    mode: "agent";
    isOpen: boolean;
    width: number;
    messages: Message[];
    inputValue: string;
    setInputValue: (value: string) => Promise<void>;
    sendMessage: (message: string) => Promise<void>;
    handleSubmit: (event: any) => Promise<void>;
    userId: string;
    service: AgentMessageService;
    chatHelpers: {
      isLoading: boolean;
      messages: Message[];
      input: string;
      handleSubmit: (event: any) => Promise<void>;
      handleInputChange: (event: any) => Promise<void>;
      setInput: (value: string) => Promise<void>;
      error: undefined;
      append: (message: string) => Promise<string>;
      reload: () => Promise<string>;
      stop: () => Promise<string>;
      setMessages: (messages: Message[]) => Promise<void>;
      setData: (data: any) => Promise<void>;
    };
    supportContext: ChatContextType;
};
  
// Update the TestContextFixtures type
type TestContextFixtures = {
    containerContext: typeof baseContext;
    messagingContext: ChatContextType;
    integrationContext: IntegrationContextType;
};

// Base context for minimal container/header tests
const baseContext = {
  mode: "agent" as const,
  isOpen: false,
  width: 400,
};

// Messaging context for bubbles/footer tests
const createMessagingContext = (mode: "agent" | "support" = "agent"): ChatContextType => {
    return mode === "agent" ? mockAgentContext : mockSupportContext;
};

const test = base.extend<TestContextFixtures>({
    containerContext: async ({ page }, use) => {
      await page.addInitScript(`
        window.__TEST_CONTEXT__ = ${JSON.stringify(baseContext)};
        window.dispatchEvent(new CustomEvent('test-context-ready'));
      `);
      await use(baseContext);
    },
  
    messagingContext: async ({ page }, use, testInfo) => {
      const mode = testInfo.project.name.includes('support') ? 'support' : 'agent';
      const context = createMessagingContext(mode);
      
      await page.addInitScript(`
        window.__TEST_CONTEXT__ = ${JSON.stringify(context)};
        window.dispatchEvent(new CustomEvent('test-context-ready'));
      `);
      
      await use(context);
    },
  
    integrationContext: async ({ page }, use) => {
      const agentContext = createMessagingContext('agent') as AgentChatContext;
      const context: IntegrationContextType = {
          mode: "agent",
          isOpen: baseContext.isOpen,
          width: baseContext.width,
          messages: agentContext.messages,
          inputValue: agentContext.inputValue,
          setInputValue: async (value: string) => Promise.resolve(),
          sendMessage: async (message: string) => Promise.resolve(),
          handleSubmit: async (event: any) => Promise.resolve(),
          userId: agentContext.userId,
          service: agentContext.service,
          chatHelpers: {
              isLoading: agentContext.chatHelpers.isLoading,
              messages: agentContext.messages,
              input: agentContext.chatHelpers.input,
              handleSubmit: async (event: any) => Promise.resolve(),
              handleInputChange: async (event: any) => Promise.resolve(),
              setInput: async (value: string) => Promise.resolve(),
              error: undefined,
              append: async (message: string) => Promise.resolve("message-id"),
              reload: async () => Promise.resolve(""),
              stop: async () => Promise.resolve(""),
              setMessages: async (messages: Message[]) => Promise.resolve(),
              setData: async (data: any) => Promise.resolve()
          },
          supportContext: createMessagingContext('support') as SupportChatContext
      };
      
      await page.addInitScript(`
          window.__TEST_CONTEXT__ = ${JSON.stringify(context)};
          window.dispatchEvent(new CustomEvent('test-context-ready'));
      `);
      
      await use(context);
  }
});

// Helper to wait for context initialization
async function waitForTestContext(page: Page) {
  await page.waitForEvent('console', {
    predicate: msg => msg.text().includes('test-context-ready')
  });
}

// Export for direct usage in tests
export { baseContext, createMessagingContext, test, waitForTestContext };