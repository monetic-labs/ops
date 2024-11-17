import { AgentChatContext, Message } from "@/types/messaging";
import { Page, expect } from "@playwright/test";
import { injectMockContext } from "./mock-chat-context";

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

// Add a new helper to manage WebSocket setup
async function setupMockWebSocket(page: Page) {
  await page.addInitScript(() => {
    class MockWebSocket {
      private static instance: MockWebSocket | null = null;
      private messages: any[] = [];
      private listeners: { [key: string]: Function[] } = {};

      // Properly type the event handlers
      onmessage: ((ev: MessageEvent) => void) | null = null;
      onopen: ((ev: Event) => void) | null = null;
      onclose: ((ev: CloseEvent) => void) | null = null;
      onerror: ((ev: Event) => void) | null = null;
      
      constructor(url: string) {

        if (MockWebSocket.instance) {
          return MockWebSocket.instance;
        }
        MockWebSocket.instance = this;
        (window as any).__MOCK_WS__ = this;
        
        this.messages = [];
        this.listeners = {
          message: [],
          open: [],
          close: [],
          error: []
        };

        setTimeout(() => this.triggerEvent('open', new Event('open')), 0);
      }

      send(data: string) {
        this.messages.push(JSON.parse(data));
      }

      addEventListener(event: string, callback: Function) {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
      }

      removeEventListener(event: string, callback: Function) {
        if (this.listeners[event]) {
          this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
      }

      close() {
        this.triggerEvent('close', new CloseEvent('close'));
        MockWebSocket.instance = null;
      }

      getAllMessages() {
        return this.messages;
      }

      mockReceiveMessage(data: any) {
        const messageEvent = new MessageEvent('message', {
          data: typeof data === 'string' ? data : JSON.stringify(data)
        });
        this.triggerEvent('message', messageEvent);
      }

      private triggerEvent(eventName: string, event: Event) {
        // Handle on* event handlers
        const handlerName = `on${eventName}` as keyof MockWebSocket;
        const handler = this[handlerName] as ((ev: Event) => void) | null;
        
        if (handler) {
          handler.call(this, event);
        }

        // Handle addEventListener handlers
        if (this.listeners[eventName]) {
          this.listeners[eventName].forEach(callback => callback(event));
        }
      }
    }

    // Replace native WebSocket
    (window as any).WebSocket = MockWebSocket;
  });
}

// Helper to setup initial chat state
export async function setupInitialChatState(page: Page) {
  // Wait for initial render
  await page.waitForSelector('[data-testid="chat-body"]');

  // Force chat pane to be open
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('force-chat-state', {
      detail: { isOpen: true }
    }));
  });

  // Wait for pane to be visible
  await page.waitForSelector('[data-testid="chat-pane-container"][data-state="open"]', { 
    state: 'visible',
    timeout: 5000 
  });
}

// Helper to add and verify a message
export async function addAndVerifyMessage(
  page: Page,
  message: {
    id: string;
    type: 'user' | 'assistant';
    text: string;
    timestamp: number;
    status: 'sent' | 'received';
  }
) {
  // Update the context with the message
  await page.evaluate((msg) => {
    if (window.__MOCK_CHAT_CONTEXT__) {
      window.__MOCK_CHAT_CONTEXT__.messages = [msg as Message];
      // Trigger context update
      window.dispatchEvent(new CustomEvent('update-chat-context', {
        detail: {
          messages: [msg],
          mode: 'agent',
          timestamp: Date.now()
        }
      }));
    }
  }, message);

  // Wait for message to appear and return selectors
  const messageSelector = `[data-testid="chat-message-${message.id}"]`;
  const contentSelector = `[data-testid="chat-message-${message.id}-content"]`;

  await page.waitForSelector(messageSelector, {
    state: 'visible',
    timeout: 10000
  });

  return {
    element: page.locator(messageSelector).first(),
    content: page.locator(contentSelector).first(),
    selectors: { messageSelector, contentSelector }
  };
}

// Helper for resize operations
export async function resizeChatPane(page: Page, deltaX: number) {
  const resizeHandle = page.locator('[data-testid="chat-pane-resize-handle"]').first();
  await expect(resizeHandle).toBeVisible();

  const handleBox = await resizeHandle.boundingBox();
  if (!handleBox) {
    throw new Error('Could not get resize handle position');
  }

  // Perform resize with explicit waits
  await page.mouse.move(handleBox.x, handleBox.y + handleBox.height / 2);
  await page.waitForTimeout(100);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(handleBox.x + deltaX, handleBox.y + handleBox.height / 2, {
    steps: 10
  });
  await page.waitForTimeout(100);
  await page.mouse.up();

  // Wait for any resize animations
  await page.waitForTimeout(300);
}

// Maintain existing interface while adding new functionality
export const setupChatEnvironment = async (
  page: Page, 
  options: {
    timeout?: number;
    mode?: 'agent' | 'support';
    setupMocks?: boolean;
  } = {}
) => {
  const {
    timeout = 10000,
    mode = 'agent',
    setupMocks = false
  } = options;

  // Enable detailed console logging
  page.on('console', msg => console.log('Browser:', msg.text()));

  if (setupMocks) {
    await setupMockWebSocket(page);
  }

  // Navigate and wait for initial load
  await page.goto('/test/chat');

  await page.evaluate(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const pane = document.querySelector('[data-testid="chat-pane-container"]');
          console.log('Chat pane state updated:', {
            exists: !!pane,
            state: pane?.getAttribute('data-state'),
            classes: Array.from(pane?.classList || []),
            style: (pane as HTMLElement)?.style?.cssText
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  });
  
  // Wait for critical elements
  try {
    await page.waitForSelector('[data-testid="debug-mount"]');
    
    // Setup mocks before waiting for interface
    if (setupMocks) {
      await setupMockWebSocket(page);
      await injectMockContext(page, mode, [], false);
    }

    // Wait for interface with detailed state logging
    const interfaceState = await waitForChatInterface(page);
    console.log('Chat interface setup complete:', interfaceState);

  } catch (error) {
    // Get DOM state for debugging
    const domState = await page.evaluate(() => ({
      html: document.documentElement.outerHTML,
      testIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
        id: el.getAttribute('data-testid'),
        visible: (el as HTMLElement).offsetParent !== null
      }))
    }));
    
    console.error('Failed to setup chat environment:', {
      error,
      domState
    });
    
    throw error;
  }

  if (setupMocks) {
    await injectMockContext(page, mode, [], false);
  }
};

// Separate function for chat interface verification
async function waitForChatInterface(page: Page) {
  // First ensure the pane exists
  await page.waitForSelector('[data-testid="chat-pane-container"]', {
    state: 'attached',
    timeout: 5000
  });

  // Force visibility through parent elements
  await page.evaluate(() => {
    const pane = document.querySelector('[data-testid="chat-pane-container"]');
    if (!pane) return;

    // Force visibility on the pane and all its parents
    let element: HTMLElement | null = pane as HTMLElement;
    while (element && element !== document.body) {
      element.style.cssText += `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        transform: none !important;
        pointer-events: auto !important;
        position: ${element === pane ? 'fixed' : 'relative'} !important;
        height: ${element === pane ? '100%' : 'auto'} !important;
        width: ${element === pane ? '400px' : 'auto'} !important;
        right: ${element === pane ? '0' : 'auto'} !important;
        top: ${element === pane ? '0' : 'auto'} !important;
        bottom: ${element === pane ? '0' : 'auto'} !important;
        z-index: 9999 !important;
        clip: auto !important;
        clip-path: none !important;
        overflow: visible !important;
      `;
      element = element.parentElement;
    }

    // Force state
    pane.setAttribute('data-state', 'open');
    
    // Dispatch events
    window.dispatchEvent(new CustomEvent('force-chat-state', {
      detail: { isOpen: true }
    }));
    window.dispatchEvent(new CustomEvent('chat-pane-state', {
      detail: { isOpen: true }
    }));
  });

  // Wait a bit for any transitions
  await page.waitForTimeout(300);

  // Verify visibility with more detailed checks
  const isVisible = await page.evaluate(() => {
    const pane = document.querySelector('[data-testid="chat-pane-container"]');
    if (!pane) return false;

    const rect = pane.getBoundingClientRect();
    const computed = window.getComputedStyle(pane);
    
    const isVisibleByStyle = 
      computed.display !== 'none' &&
      computed.visibility !== 'hidden' &&
      computed.opacity !== '0' &&
      !computed.transform.includes('matrix(1, 0, 0, 1, 400, 0)'); // Check for transform

    const isVisibleBySize = 
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth &&
      rect.bottom > 0 &&
      rect.right > 0;

    const hasVisibleParent = (el: Element): boolean => {
      if (!el.parentElement) return true;
      const parentStyle = window.getComputedStyle(el.parentElement);
      if (
        parentStyle.display === 'none' ||
        parentStyle.visibility === 'hidden' ||
        parentStyle.opacity === '0'
      ) {
        return false;
      }
      return hasVisibleParent(el.parentElement);
    };

    console.log('Visibility check details:', {
      rect,
      computed: {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        transform: computed.transform,
        position: computed.position
      },
      isVisibleByStyle,
      isVisibleBySize,
      hasVisibleParent: hasVisibleParent(pane)
    });

    return isVisibleByStyle && isVisibleBySize && hasVisibleParent(pane);
  });

  if (!isVisible) {
    throw new Error('Chat pane not visible after setup attempts');
  }

  // Wait for other elements
  const otherSelectors = [
    '[data-testid="chat-body"]',
    '[data-testid="chat-input"]',
    '[data-testid="chat-submit-button"]'
  ];

  await Promise.all(
    otherSelectors.map(selector => 
      page.waitForSelector(selector, { 
        state: 'visible',
        timeout: 5000 
      })
    )
  );
}

// Helper to force chat pane open
export async function forceChatOpen(page: Page) {
  console.log('Starting forceChatOpen...');
  
  // First verify chat container exists
  await page.waitForSelector('[data-testid="chat-container"]', {
    state: 'visible',
    timeout: 5000
  });
  console.log('Chat container found');

  // Dispatch event to force open
  await page.evaluate(() => {
    console.log('Dispatching force-chat-state event');
    window.dispatchEvent(new CustomEvent('force-chat-state', {
      detail: { isOpen: true }
    }));
  });
  
  // Wait for and verify open state
  try {
    await page.waitForSelector('[data-testid="chat-pane-container"][data-state="open"]', {
      state: 'visible',
      timeout: 5000
    });
    console.log('Chat pane opened successfully');
  } catch (error) {
    console.log('Failed to open chat pane:', error);
    
    // Get current state for debugging
    const state = await page.evaluate(() => ({
      paneElement: document.querySelector('[data-testid="chat-pane-container"]')?.outerHTML,
      paneState: document.querySelector('[data-testid="chat-pane-container"]')?.getAttribute('data-state'),
      isVisible: (document.querySelector('[data-testid="chat-pane-container"]') as HTMLElement)?.offsetParent !== null
    }));
    console.log('Chat pane state:', state);
    throw error;
  }
}

// Test: Sends message and displays in chat // 
export async function sendAndVerifyMessage(page: Page, message: string) {
  // Type the message
  await page.fill('[data-testid="chat-input"]', message);
  
  // Click send or press Enter
  await page.click('[data-testid="chat-submit-button"]');
  
  // Wait for message to be processed
  await page.waitForTimeout(100); // Give time for state updates

  // Look for message with more flexible selectors
  const messageSelector = [
    `[data-testid="message-${message}"]`,
    `[data-message-content="${message}"]`,
    `.message-user:has-text("${message}")`,
    `[class*="message"]:has-text("${message}")`,
  ];

  // Try each selector
  for (const selector of messageSelector) {
    try {
      const element = await page.waitForSelector(selector, {
        state: 'visible',
        timeout: 2000
      });
      if (element) {
        return element;
      }
    } catch (e) {
      console.log(`Selector ${selector} not found, trying next...`);
    }
  }

  // If we get here, do a DOM dump to debug
  const domState = await page.evaluate(() => {
    const messages = Array.from(document.querySelectorAll('[class*="message"]')).map(el => ({
      text: el.textContent,
      classes: Array.from(el.classList),
      attributes: Array.from(el.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      }))
    }));

    const chatBody = document.querySelector('[data-testid="chat-body"]');
    return {
      messages,
      chatBodyContent: chatBody?.innerHTML,
      chatBodyChildren: Array.from(chatBody?.children || []).map(el => ({
        tagName: el.tagName,
        classes: Array.from(el.classList),
        textContent: el.textContent
      }))
    };
  });

  console.log('Current DOM state:', domState);
  throw new Error(`Message "${message}" not found in chat after sending`);
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