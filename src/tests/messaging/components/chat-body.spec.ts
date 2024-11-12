import { injectMockContext, getMockContext } from '@/tests/helpers/mock-chat-context';
import { mockConversations } from '@/tests/helpers/mock-data';
import { test, expect } from '@playwright/test';
import { Message, SupportMessageService } from '@/types/messaging';
import { TestMessage, MessagePositions } from '../../helpers/test-types';

test.describe('Chat Body Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/chat?mode=agent');
    await injectMockContext(page, 'agent');
    await page.waitForSelector('[data-testid="chat-body"]');
  });

  test('renders empty chat body initially', async ({ page }) => {
    const chatBody = page.getByTestId('chat-body');
    await expect(chatBody).toBeVisible();
    
    // Verify no messages initially
    const context = await getMockContext(page);
    expect(context?.messages.length).toBe(0);
  });

  test('displays typing indicator when support is typing', async ({ page }) => {
    // Start in support mode directly
    await page.goto('/test/chat?mode=support');
    await injectMockContext(page, 'support');
    await page.waitForSelector('[data-testid="chat-body"]');
  
    // Update context with typing true using the same event pattern
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('update-chat-context', {
        detail: {
          mode: 'support',
          isTyping: true,
          messages: []
        }
      }));
    });
  
    // Verify typing indicator
    const typingIndicator = page.getByTestId('typing-indicator');
    await expect(typingIndicator).toBeVisible();
    await expect(typingIndicator).toContainText('Support is typing');
  });

  test('hides typing indicator when support stops typing', async ({ page }) => {
    // Start in support mode with typing true
    await page.goto('/test/chat?mode=support');
    await injectMockContext(page, 'support');
    await page.waitForSelector('[data-testid="chat-body"]');
  
    // First set typing to true
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('update-chat-context', {
        detail: {
          mode: 'support',
          isTyping: true,
          messages: []
        }
      }));
    });
  
    // Verify typing indicator is initially visible
    await expect(page.getByTestId('typing-indicator')).toBeVisible();
  
    // Set typing to false
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('update-chat-context', {
        detail: {
          mode: 'support',
          isTyping: false,
          messages: []
        }
      }));
    });
  
    // Verify typing indicator is hidden
    await expect(page.getByTestId('typing-indicator')).not.toBeVisible();
  });

  test('renders messages in correct order', async ({ page }) => {
    // Force cleanup before starting
    await page.evaluate(() => {
      // Clear any existing messages
      const existingMessages = document.querySelectorAll('[data-testid^="chat-message-"]');
      existingMessages.forEach(el => el.remove());
      
      // Clear any cached data
      window.__MOCK_CHAT_CONTEXT__ = undefined;
    });

    // First inject empty context
    await injectMockContext(page, 'agent');
    await page.waitForSelector('[data-testid="chat-body"]');

    // Verify we're starting clean
    const initialCount = await page.$$eval('[data-testid^="chat-message-"]', els => els.length);
    expect(initialCount).toBe(0);
  
    // Create test messages with specific timestamps
    const testMessages: TestMessage[] = [
      {
        id: 'msg-1',
        type: 'user',
        text: 'Hello, I need help',
        timestamp: Date.now(),
        status: 'sent'
      },
      {
        id: 'msg-2',
        type: 'bot',
        text: 'Hello! How can I help you today?',
        timestamp: Date.now() + 1000,
        status: 'sent',
        source: 'openai'
      }
    ];
  
  // Update messages using the same event approach that works in other tests
  await page.evaluate((messages) => {
    window.dispatchEvent(new CustomEvent('update-chat-context', {
      detail: {
        messages,
        mode: 'agent',
        timestamp: Date.now()
      }
    }));
  }, testMessages);
  
  // Wait for messages to render
  await page.waitForSelector('[data-testid="chat-message-msg-1"]');
  await page.waitForSelector('[data-testid="chat-message-msg-2"]');

  // Verify message order
  for (let index = 0; index < testMessages.length; index++) {
    const message = testMessages[index];
    const selector = `[data-testid="chat-message-${message.id}"]`;
    const contentSelector = `[data-testid="chat-message-${message.id}-content"]`;
    
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator(contentSelector)).toContainText(message.text);

    if (index > 0) {
      // Verify this message appears after the previous one in the DOM
      const prevSelector = `[data-testid="chat-message-${testMessages[index - 1].id}"]`;
      
      // Compare their positions
      const positions = await page.evaluate(
        ({ curr, prev }) => {
          const currEl = document.querySelector(curr);
          const prevEl = document.querySelector(prev);
          if (!currEl || !prevEl) return null;
          return {
            curr: currEl.getBoundingClientRect().top,
            prev: prevEl.getBoundingClientRect().top
          };
        }, 
        { curr: selector, prev: prevSelector }
      ) as MessagePositions | null;

      if (positions === null) {
        throw new Error('Failed to get element positions');
      }
      
      expect(positions.curr).toBeGreaterThan(positions.prev);
      }
    }
  });

  test('scrolls to bottom when new messages arrive', async ({ page }) => {
    // First inject empty context
    await injectMockContext(page, 'agent');
    await page.waitForSelector('[data-testid="chat-body"]');

    // Create initial messages (first 5)
    const initialMessages = Array.from({ length: 5 }, (_, i) => ({
      id: `test-${i + 1}`,
      type: i % 2 === 0 ? 'user' : 'bot',
      text: `Test Message ${i + 1}`,
      timestamp: Date.now() + i * 1000,
      status: 'sent'
    }));

    // Add initial messages through event
    await page.evaluate((messages) => {
      window.dispatchEvent(new CustomEvent('update-chat-context', {
        detail: {
          messages,
          mode: 'agent'
        }
      }));
    }, initialMessages);

    // Wait for initial messages to render
    await page.waitForSelector('[data-testid="chat-message-test-5"]', { state: 'visible' });
    await page.waitForTimeout(200);


    // Add more messages
    const allMessages = [
      ...initialMessages,
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `test-${i + 6}`,
        type: i % 2 === 0 ? 'user' : 'bot',
        text: `Test Message ${i + 6}`,
        timestamp: Date.now() + (i + 5) * 1000,
        status: 'sent'
      }))
    ];

    // Update with all messages
    await page.evaluate((messages) => {
      window.dispatchEvent(new CustomEvent('update-chat-context', {
        detail: {
          messages,
          mode: 'agent'
        }
      }));
    }, allMessages);

    // Wait for last message to be rendered
    await page.waitForSelector('[data-testid="chat-message-test-10"]', { state: 'visible' });
    await page.waitForTimeout(200); 

    // Check if messages-end element is in viewport with a more lenient check
    const isScrolledToBottom = await page.evaluate(() => {
      const chatBody = document.querySelector('[data-testid="chat-body"]');
      if (!chatBody) return false;

    // Get the scroll position
    const scrollTop = chatBody.scrollTop;
    const scrollHeight = chatBody.scrollHeight;
    const clientHeight = chatBody.clientHeight;

    // Check if we're at the bottom (with some tolerance)
    const tolerance = 10; // pixels
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    
    console.log('Scroll Debug:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      distanceFromBottom
    });

      return distanceFromBottom <= tolerance;
    });

    expect(isScrolledToBottom).toBe(true);
  });

  test('handles different message types correctly', async ({ page }) => {
    // First inject empty context
    await injectMockContext(page, 'agent');
    await page.waitForSelector('[data-testid="chat-body"]');

    // Now update the messages through the chat context
    await page.evaluate((messages) => {
      window.dispatchEvent(new CustomEvent('update-chat-context', {
        detail: {
          messages,
          mode: 'agent'
        }
      }));
    }, mockConversations.mixed);

    console.log('Test Debug - Waiting for messages to render');
    
    // Wait for any message to appear
    await page.waitForSelector('[data-testid^="chat-message-"]');

    // Get all rendered messages
    const messageElements = await page.$$('[data-testid^="chat-message-"]');
    console.log('Test Debug - Found message elements:', messageElements.length);

    // Verify each message
    for (const message of mockConversations.mixed) {
      const messageSelector = `[data-testid="chat-message-${message.id}"]`;
      const contentSelector = `[data-testid="chat-message-${message.id}-content"]`;
      
      console.log('Test Debug - Looking for message:', messageSelector);
      console.log('Test Debug - Looking for content:', contentSelector);
      
      await expect(page.locator(messageSelector)).toBeVisible();
      await expect(page.locator(contentSelector)).toContainText(message.text);
    }
  });
});