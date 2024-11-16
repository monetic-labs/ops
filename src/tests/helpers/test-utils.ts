import { AgentChatContext, Message } from "@/types/messaging";
import { Page, expect } from "@playwright/test";

interface AddMessageOptions {
  useContext?: boolean;
  waitForRender?: boolean;
  idPrefix?: 'message-' | 'chat-message-' | ''; // Allow different prefixes
  useRawId?: boolean; // Skip ID modification completely
  timeout?: number;
}

interface ChatSetupOptions {
  mode?: 'agent' | 'support';
  timeout?: number;
  waitForMount?: boolean;
}

export async function waitForChatInterface(page: Page, timeout = 5000) {
  // Wait for all required elements
  await Promise.all([
    page.waitForSelector('[data-testid="chat-body"]', { state: 'visible', timeout }),
    page.waitForSelector('[data-testid="chat-input"]', { state: 'visible', timeout }),
    page.waitForSelector('[data-testid="send-button"]', { state: 'visible', timeout })
  ]);

  // Verify single instance of each element
  const counts = await page.evaluate(() => ({
    inputs: document.querySelectorAll('[data-testid="chat-input"]').length,
    buttons: document.querySelectorAll('[data-testid="send-button"]').length,
    bodies: document.querySelectorAll('[data-testid="chat-body"]').length
  }));

  if (counts.inputs !== 1 || counts.buttons !== 1 || counts.bodies !== 1) {
    throw new Error(`Duplicate chat elements found: ${JSON.stringify(counts)}`);
  }
}

// Add a new helper to manage WebSocket setup
export async function setupMockWebSocket(page: Page) {
  await page.addInitScript(() => {
    let wsInstance: any = null;
    
    class MockWebSocket {
      private static instance: MockWebSocket | null = null;
      onopen: ((event: Event) => void) | null = null;
      onclose: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      private eventListeners: { [key: string]: Function[] } = {};
      private connected = false;

      constructor() {
        // Singleton pattern
        if (MockWebSocket.instance) {
          return MockWebSocket.instance;
        }
        MockWebSocket.instance = this;

        // Setup connection after small delay
        setTimeout(() => {
          if (!this.connected) {
            this.connected = true;
            if (this.onopen) {
              this.onopen(new Event('open'));
              
              // Send connection message only once
              if (this.onmessage) {
                this.onmessage(new MessageEvent('message', {
                  data: JSON.stringify({
                    type: 'system',
                    id: `sys-${Date.now()}`,
                    text: 'Connected to WebSocket server',
                    timestamp: Date.now(),
                    status: 'sent'
                  })
                }));
              }
            }
          }
        }, 100);
      }

      // ... rest of MockWebSocket implementation ...
    }

    // @ts-ignore
    window.WebSocket = MockWebSocket;
  });
}

/**
 * Sets up a complete chat environment for testing with improved reliability
 */
export async function setupChatEnvironment(page: Page, options: ChatSetupOptions = {}) {
  const { mode = 'agent', timeout = 10000, waitForMount = true } = options;

  // Setup WebSocket mock first
  await setupMockWebSocket(page);

  // Navigate and wait for initial load
  await page.goto(`/test/chat?mode=${mode}`, { 
    waitUntil: 'networkidle',
    timeout 
  });

  // Inject test utilities and setup context
  await injectTestUtils(page);
  await page.evaluate(() => {
    // Clear any existing context
    window.__MOCK_CHAT_CONTEXT__ = undefined;
    
    if (window.__TEST_UTILS__) {
      window.__MOCK_CHAT_CONTEXT__ = window.__TEST_UTILS__.createEmptyAgentContext();
    }
  });

  // Wait for WebSocket connection with improved check
  await page.waitForFunction(() => {
    const messages = document.querySelectorAll('[data-testid^="message-sys-"]');
    return Array.from(messages).some(msg => 
      msg.textContent?.includes('Connected to WebSocket server')
    );
  }, { timeout });

  // Force chat open
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('force-chat-state', {
      detail: { isOpen: true }
    }));
  });

  if (waitForMount) {
    await waitForChatInterface(page, timeout);
  }

  // Return chat interface elements
  return {
    chatBody: page.locator('[data-testid="chat-body"]'),
    input: page.locator('[data-testid="chat-input"]'),
    sendButton: page.locator('[data-testid="send-button"]')
  };
}

/**
 * Sends a message and waits for it to appear in the chat
 */
export async function sendAndVerifyMessage(page: Page, message: string, timeout = 5000) {
  const input = page.locator('[data-testid="chat-input"]');
  const sendButton = page.locator('[data-testid="send-button"]');

  // Type message
  await input.fill(message);
  await expect(input).toHaveValue(message, { timeout: 5000 });

  // Setup wait for message before clicking
  const messagePromise = page.waitForFunction(
    (text) => {
      const messages = Array.from(document.querySelectorAll('[data-testid^="message-"]'));
      return messages.some(msg => 
        msg.textContent?.includes(text) && 
        msg.classList.contains('message-user')
      );
    },
    message,
    { timeout }
  );

  // Send message
  await sendButton.click();

  // Wait for message to appear
  await messagePromise;

  // Return the message element
  return page
    .locator('[data-testid^="message-"]:not([data-testid^="message-sys-"])')
    .filter({ hasText: message })
    .first();
}

export async function sendMessage(page: Page, message: string) {
  //await page.getByTestId('chat-input').fill(message);
  //await page.getByTestId('send-button').click();
  // Wait for input to be ready
  await page.waitForSelector('[data-testid="chat-input"]', {
    state: 'visible',
    timeout: 5000
  });

  // Wait for send button to be ready
  await page.waitForSelector('[data-testid="send-button"]', {
    state: 'visible',
    timeout: 5000
  });

  // Type message
  await page.fill('[data-testid="chat-input"]', message);
  
  // Click send button
  await page.click('[data-testid="send-button"]');

  // Wait for message to appear
  await page.waitForSelector(`[data-testid^="message-"]:has-text("${message}")`, {
    state: 'visible',
    timeout: 5000
  });
}

export async function switchMode(page: Page, mode: 'agent' | 'support') {
  await page.getByRole('tab', { name: mode === 'agent' ? 'PACKS' : 'Support' }).click();
}

export async function waitForResponse(page: Page) {
  return await page.waitForResponse(response => 
    response.url().includes('/api/messaging') && 
    response.status() === 200
  );
}

export async function addTestMessage(page: Page, message: Message, options: AddMessageOptions = {}) {
  const {
    useContext = false,
    waitForRender = false,
    idPrefix = 'chat-message-', // Default to chat-body format
    useRawId = false
  } = options;

  // Handle ID formatting based on options
  const messageId = useRawId ? message.id : 
    message.id.startsWith(idPrefix) ? message.id : 
    `${idPrefix}${message.id.replace(/^msg-/, '')}`;
  
  if (useContext) {
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('update-chat-context', {
        detail: {
          messages: [msg],
          mode: 'agent',
          timestamp: Date.now()
        }
      }));
    }, { ...message, id: messageId });
  } else {
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('add-messages', { 
        detail: [msg]
      }));
    }, { ...message, id: messageId });
  }

  if (waitForRender) {
    await page.waitForSelector(`[data-testid="${messageId}"]`);
  }

  return {
    messageId,
    element: page.locator(`[data-testid="${messageId}"]`).first()
  };
}

// For integration/context-based tests (rename existing function)
export async function addTestMessageToContext(
  page: Page, 
  message: Message, 
  options: AddMessageOptions = {}
) {
  const {
    idPrefix = 'chat-message-',
    waitForRender = true,
    timeout = 5000
  } = options;

  const messageId = `${idPrefix}${message.id}`;
  
  // Add message to context
  await page.evaluate((msg) => {
    window.dispatchEvent(new CustomEvent('update-chat-context', {
      detail: {
        messages: [msg],
        mode: 'agent',
        timestamp: Date.now()
      }
    }));
  }, { ...message, id: messageId });

  // Wait for message to be rendered if requested
  if (waitForRender) {
    await page.waitForSelector(`[data-testid="${messageId}"]`, {
      state: 'visible',
      timeout
    });
  }

  return {
    messageId,
    element: page.locator(`[data-testid="${messageId}"]`).first()
  };
}

export async function addTestMessageToDOM(page: Page, message: Message) {
  await page.evaluate((msg) => {
      const chatBody = document.querySelector('[data-testid="chat-body"]');
      if (chatBody) {
          const messageDiv = document.createElement('div');
          messageDiv.setAttribute('data-testid', `message-${msg.id}`);
          messageDiv.className = `flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} message-${msg.type}`;
          
          const contentDiv = document.createElement('div');
          contentDiv.setAttribute('data-testid', `message-${msg.id}-content`);
          contentDiv.className = `max-w-[80%] rounded-lg p-3 ${
              msg.type === 'user' ? 'bg-ualert-500' : 'bg-charyo-400'
          } text-notpurple-500`;
          contentDiv.textContent = msg.text;
          
          messageDiv.appendChild(contentDiv);
          chatBody.appendChild(messageDiv);
      }
  }, message);

  return {
      messageId: `message-${message.id}`,
      element: page.locator(`[data-testid="message-${message.id}"]`).first()
  };
}

export async function addTestMessages(page: Page, messages: Message[], options: AddMessageOptions = {}) {
  if (options.useContext) {
    await page.evaluate((msgs) => {
      window.dispatchEvent(new CustomEvent('update-chat-context', {
        detail: {
          messages: msgs,
          mode: 'agent',
          timestamp: Date.now()
        }
      }));
    }, messages.map(msg => ({
      ...msg,
      id: options.useRawId ? msg.id :
        msg.id.startsWith(options.idPrefix || 'chat-message-') ? msg.id :
        `${options.idPrefix || 'chat-message-'}${msg.id.replace(/^msg-/, '')}`
    })));
  } else {
    for (const message of messages) {
      await addTestMessage(page, message, options);
    }
  }
}

// Add this to your existing test-utils.ts
export async function verifyComponentMount(page: Page, testId: string, timeout = 5000) {
  console.log(`Verifying mount for component: ${testId}`);
  
  try {
    await page.waitForSelector(`[data-testid="${testId}"]`, {
      state: 'attached',
      timeout
    });

    const componentState = await page.evaluate((id) => {
      const element = document.querySelector(`[data-testid="${id}"]`);
      if (!element) return { exists: false };

      // Get computed style
      const style = window.getComputedStyle(element);
      
      return {
        exists: true,
        visible: !(
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0'
        ),
        html: element.outerHTML,
        rect: element.getBoundingClientRect(),
        styles: {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity
        }
      };
    }, testId);

    console.log(`Component ${testId} state:`, componentState);
    return componentState;
  } catch (error) {
    const html = await page.evaluate(() => document.body.innerHTML);
    console.error(`Failed to verify ${testId} mount. Current DOM:`, html);
    throw error;
  }
}

export function createEmptyAgentContext(): AgentChatContext {
  return {
      messages: [],
      mode: 'agent',
      inputValue: '',
      setInputValue: () => {},
      sendMessage: async () => {},
      handleSubmit: async () => {},
      userId: 'test-user',
      service: {
          type: 'openai',
          messages: [],
          isLoading: false,
          model: 'gpt-3.5-turbo',
          inputValue: '',
          setInputValue: () => {},
          sendMessage: async () => {},
          handleSubmit: async () => {},
          getUserId: () => 'test-user'
      },
      chatHelpers: {
          messages: [],
          input: '',
          handleInputChange: () => {},
          handleSubmit: () => {},
          setInput: () => {},
          isLoading: false,
          append: async () => '',
          reload: async () => '',
          stop: () => {},
          setMessages: () => {},
          setData: () => {},
          error: undefined
      },
      isTyping: false
  };
}

// Make utilities available to the page context
export async function injectTestUtils(page: Page) {
  await page.evaluate(() => {
      window.__TEST_UTILS__ = {
          createEmptyAgentContext: () => ({
              messages: [],
              mode: 'agent',
              inputValue: '',
              setInputValue: () => {},
              sendMessage: async () => {},
              handleSubmit: async () => {},
              userId: 'test-user',
              service: {
                  type: 'openai',
                  messages: [],
                  isLoading: false,
                  model: 'gpt-3.5-turbo',
                  inputValue: '',
                  setInputValue: () => {},
                  sendMessage: async () => {},
                  handleSubmit: async () => {},
                  getUserId: () => 'test-user'
              },
              chatHelpers: {
                  messages: [],
                  input: '',
                  handleInputChange: () => {},
                  handleSubmit: () => {},
                  setInput: () => {},
                  isLoading: false,
                  append: async () => '',
                  reload: async () => '',
                  stop: () => {},
                  setMessages: () => {},
                  setData: () => {},
                  error: undefined
              },
              isTyping: false
          })
      };
  });
}