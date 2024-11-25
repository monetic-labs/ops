import { test as base, Page } from '@playwright/test';
import type {
  AgentChatContext,
  AgentMessageService,
  MessagingContextType,
  SupportChatContext,
} from "@/types/messaging";
import { mockAgentContext } from './agent-context.fixture';
import { mockSupportContext } from './support-context.fixture';

import { AgentIntegrationContext, IntegrationContextType } from '@/tests/helpers/pane/types';
import { BaseTestContext, TestContextFixtures } from './fixture-types';
import { UseChatHelpers } from 'ai/react/dist';
import { mockMessages } from './message.fixture';

// Base context for minimal container/header tests
const baseContext = {
  mode: "agent" as const,
  isOpen: false,
  width: 400,
  wsReady: false,
  initialized: false,
};

const test = base.extend<TestContextFixtures>({
  containerContext: async ({ page }, use) => {
    console.log('Setting up container context');
    
    // Create minimal agent service
    const minimalAgentService: AgentMessageService = {
      type: "openai",
      model: "gpt-4o",
      messages: [],
      isLoading: false,
      inputValue: "",
      setInputValue: async (value: string) => Promise.resolve(),
      sendMessage: async (text: string) => Promise.resolve(),
      handleSubmit: async (e: React.FormEvent) => Promise.resolve(),
      getUserId: () => "test-agent"
    };
  
    // Create minimal chat helpers
    const minimalChatHelpers: UseChatHelpers = {
      messages: [],
      input: "",
      handleInputChange: (e: any) => {},
      handleSubmit: (e: any) => {},
      setInput: () => {},
      append: async () => Promise.resolve(null),
      reload: async () => Promise.resolve(null),
      stop: () => {},
      isLoading: false,
      error: undefined,
      setMessages: () => {},
      setData: () => {}
    };
  
    // Create minimal agent context
    const context: BaseTestContext & AgentChatContext = {
      // Base test context properties
      mode: "agent" as const,
      isOpen: baseContext.isOpen,
      width: baseContext.width,
      wsReady: true,
      initialized: false,
      
      // Agent chat context properties
      service: minimalAgentService,
      chatHelpers: minimalChatHelpers,
      isTyping: false,
      messages: [],
      inputValue: "",
      setInputValue: async (value: string) => Promise.resolve(),
      sendMessage: async (text: string) => Promise.resolve(),
      handleSubmit: async (e: React.FormEvent) => Promise.resolve(),
      userId: "test-agent"
    };
  
    await page.addInitScript(() => {
      window.addEventListener('test-context-ready', () => {
        if (window.__TEST_CONTEXT__) {
          window.__TEST_CONTEXT__.initialized = true;
          window.dispatchEvent(new CustomEvent('context-initialized'));
        }
      });
    });
  
    // Initialize context
    try {
      await initializeContext(page, context);
      console.log('Container context initialized successfully');
    } catch (error) {
      console.error('Container context initialization failed:', error);
      throw error;
    }
  
    await use(context);
  },

  messagingContext: async ({ page }, use, testInfo) => {
    const mode = testInfo.project.name.includes('support') ? 'support' : 'agent';
    console.log('Setting up messaging context for mode:', mode);
    
    const baseMessagingContext = createMessagingContext(mode);
    
    const context = {
      mode,
      isOpen: true,
      width: baseContext.width,
      wsReady: true,
      initialized: false,
      messages: mockMessages[mode],
      inputValue: baseMessagingContext.inputValue || '',
      userId: baseMessagingContext.userId || 'test-user'
    };
  
    try {
      await initializeContext(page, context as BaseTestContext & MessagingContextType);
      
      // Wait for both the element and its state
      await Promise.all([
        page.waitForSelector('[data-testid="chat-pane-container"]', { state: 'attached' }),
        page.waitForSelector('[data-testid="chat-pane-container"][data-state="open"]', { state: 'attached' })
      ]);
      
      const updatedContext = {
        ...baseMessagingContext,
        isOpen: true,
        initialized: true,
        wsReady: true
      };
      
      await use(updatedContext as BaseTestContext & MessagingContextType);
    } catch (error) {
      console.error('Messaging context setup failed:', error);
      throw error;
    }
  },

  integrationContext: async ({ page }, use) => {
    const agentContext = createMessagingContext('agent') as AgentChatContext;
    const supportContext = createMessagingContext('support') as SupportChatContext;
    
    const context: IntegrationContextType = {
      ...agentContext,
      mode: "agent",
      isOpen: baseContext.isOpen,
      width: baseContext.width,
      wsReady: true,
      initialized: false,
      supportContext,
      service: {
        ...agentContext.service,
        setInputValue: async (value: string) => {
          await agentContext.service.setInputValue(value);
          return Promise.resolve();
        },
        sendMessage: async (text: string) => {
          return agentContext.service.sendMessage(text);
        },
        handleSubmit: async (e: React.FormEvent) => {
          return agentContext.service.handleSubmit(e);
        }
      },
      setInputValue: async (value: string) => {
        await agentContext.setInputValue(value);
        return Promise.resolve();
      },
      sendMessage: async (text: string) => {
        return agentContext.sendMessage(text);
      },
      handleSubmit: async (e: React.FormEvent) => {
        return agentContext.handleSubmit(e);
      }
    } as AgentIntegrationContext;

    await page.addInitScript(`
      window.__TEST_CONTEXT__ = ${JSON.stringify(context)};
      window.dispatchEvent(new CustomEvent('test-context-ready'));
    `);

    await Promise.all([
      page.waitForEvent('console', {
        predicate: msg => msg.text().includes('test-context-ready')
      }),
      page.waitForFunction(() => 
        window.__TEST_CONTEXT__?.wsReady === true && 
        window.__TEST_CONTEXT__?.initialized === true
      )
    ]);

    await use(context as AgentIntegrationContext);
  }
});

// Messaging context for bubbles/footer tests
const createMessagingContext = (mode: "agent" | "support" = "agent"): MessagingContextType => {
    return mode === "agent" ? mockAgentContext : mockSupportContext;
};

async function waitForTestContext(page: Page): Promise<void> {
  try {
    await page.waitForFunction(() => {
      return window.__TEST_CONTEXT__?.initialized === true 
        && window.__CONTEXT_LOADED__ === true;
    }, { timeout: 5000 });
    
    // Log the state after waiting
    const contextState = await page.evaluate(() => ({
      hasContext: typeof window.__TEST_CONTEXT__ !== 'undefined',
      isInitialized: window.__TEST_CONTEXT__?.initialized === true,
      isLoaded: window.__CONTEXT_LOADED__ === true,
      mode: window.__TEST_CONTEXT__?.mode
    }));
    
    console.log('Context state after waiting:', contextState);

  } catch (error) {
    console.error('Wait for test context failed:', error);
    throw error;
  }
}

export async function initializeContext(page: Page, context: BaseTestContext & MessagingContextType) {
  console.log('Starting context initialization with mode:', context.mode);
  
  // Route setup to inject context
  await page.route('**/*', async route => {
    const response = await route.fetch();
    const html = await response.text();
    const modifiedHtml = html.replace(
      '</head>',
      `<script>
        window.__TEST_CONTEXT__ = ${JSON.stringify({
          mode: context.mode,
          isOpen: true,
          width: context.width,
          wsReady: true,
          initialized: true,
          messages: context.messages,
          inputValue: context.inputValue || '',
          userId: context.userId || 'test-user'
        })};
        window.__CONTEXT_LOADED__ = true;
        
        // Force pane state after DOM load
        document.addEventListener('DOMContentLoaded', () => {
          const paneContainer = document.querySelector('[data-testid="chat-pane-container"]');
          if (paneContainer) {
            paneContainer.setAttribute('data-state', 'open');
            paneContainer.style.display = 'block';
          }
        });
      </script></head>`
    );
    await route.fulfill({ body: modifiedHtml });
  });

  // Navigate and wait for context
  await page.goto('/test/pane');
  await waitForTestContext(page);

  // Verify context state
  const contextState = await page.evaluate(() => ({
    exists: typeof window.__TEST_CONTEXT__ !== 'undefined',
    initialized: window.__TEST_CONTEXT__?.initialized === true,
    mode: window.__TEST_CONTEXT__?.mode,
    hasMessages: Array.isArray(window.__TEST_CONTEXT__?.messages),
    paneState: document.querySelector('[data-testid="chat-pane-container"]')?.getAttribute('data-state')
  }));

  console.log('Context state after initialization:', contextState);

  if (!contextState.exists || !contextState.initialized) {
    throw new Error('Context failed to initialize properly');
  }
}

export { baseContext, createMessagingContext, test, waitForTestContext };