import { injectMockContext, getMockContext } from '@/tests/helpers/mock-chat-context';
import { mockConversations } from '@/tests/helpers/mock-data';
import { test, expect, Page } from '@playwright/test';
import { TestMessage, MessagePositions } from '../../helpers/test-types';
import { addTestMessages, addTestMessageToDOM } from '@/tests/helpers/test-utils';

test.describe('Chat Body Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/chat?mode=agent');
    await injectMockContext(page, 'agent');
    await page.waitForSelector('[data-testid="chat-body"]');
  });

  test('renders empty chat body initially', async ({ page }) => {
    const chatBody = page.locator('[data-testid="chat-body"]').first();
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

    // These selectors are correct as they match body.tsx
    await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
  
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
    const typingIndicator = page.locator('[data-testid="typing-indicator"]').first();
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
    await expect(page.locator('[data-testid="typing-indicator"]').first()).toBeVisible();
  
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
    await expect(page.locator('[data-testid="typing-indicator"]').first()).not.toBeVisible();
  });


  test('renders messages in correct order', async ({ page }) => {
    // Initial cleanup and setup
    await page.evaluate(() => {
        document.querySelectorAll('[data-testid^="chat-message-"]').forEach(el => el.remove());
        window.__MOCK_CHAT_CONTEXT__ = undefined;

        // Remove any duplicate chat bodies from previous tests
        const chatBodies = document.querySelectorAll('[data-testid="chat-body"]');
        if (chatBodies.length > 1) {
            Array.from(chatBodies).slice(1).forEach(el => el.remove());
        }
    });

    // Inject empty context and verify clean state
    await injectMockContext(page, 'agent');
    
    // Wait for single chat body
    const chatBody = page.locator('[data-testid="chat-body"]').first();
    await expect(chatBody).toHaveCount(1);
    await expect(chatBody).toBeVisible();

    // Verify we're starting clean
    const initialMessages = await chatBody.locator('[data-testid^="message-"]').all();
    expect(initialMessages.length).toBe(0);

    // Create test messages
    const testMessages: TestMessage[] = [
        {
            id: '1',
            type: 'user',
            text: 'Hello, I need help',
            timestamp: Date.now(),
            status: 'sent'
        },
        {
            id: '2',
            type: 'bot',
            text: 'Hello! How can I help you today?',
            timestamp: Date.now() + 1000,
            status: 'sent',
            source: 'openai'
        }
    ];

    // Add messages and collect their elements
    const messageElements = [];
    for (const message of testMessages) {
        const { messageId, element } = await addTestMessageToDOM(page, message);
        messageElements.push({ messageId, element });
    }

    // Verify each message's content and styling
    for (const { messageId, element } of messageElements) {
        const messageContent = page.locator(`[data-testid="${messageId}-content"]`);

        // Verify visibility and content
        await expect(element).toBeVisible();
        await expect(messageContent).toBeVisible();
        await expect(messageContent).toContainText(
            testMessages.find(m => `message-${m.id}` === messageId)?.text || ''
        );

        // Verify styling
        const containerClasses = await element.getAttribute('class');
        const messageType = testMessages.find(m => `message-${m.id}` === messageId)?.type;
        expect(containerClasses).toContain(
            messageType === 'user' ? 'message-user' : 'message-bot'
        );
    }

    // Verify message count and order
    const renderedMessages = await chatBody
        .locator('[data-testid^="message-"]:not([data-testid$="-content"]):not([data-testid$="-status"])')
        .all();
    expect(renderedMessages.length).toBe(testMessages.length);
    
    // Verify order matches test messages
    for (let i = 0; i < renderedMessages.length; i++) {
        const elementId = await renderedMessages[i].getAttribute('data-testid');
        expect(elementId).toBe(`message-${testMessages[i].id}`);
    }

  });

  test('scrolls to bottom when new messages arrive', async ({ page }) => {
    // Initial cleanup and setup
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid^="chat-message-"]').forEach(el => el.remove());
      window.__MOCK_CHAT_CONTEXT__ = undefined;
      
      // Remove any duplicate chat bodies
      const chatBodies = document.querySelectorAll('[data-testid="chat-body"]');
      if (chatBodies.length > 1) {
        Array.from(chatBodies).slice(1).forEach(el => el.remove());
      }
    });
  
    // Setup and verify initial state
    await injectMockContext(page, 'agent');
    const chatBody = page.locator('[data-testid="chat-body"]').first();
    await expect(chatBody).toHaveCount(1);
    await expect(chatBody).toBeVisible();
  
    // Create initial batch of messages
    const timestamp = Date.now();
    const initialMessages = Array.from({ length: 5 }, (_, i) => ({
      id: `test-${i + 1}`,
      type: i % 2 === 0 ? 'user' as const : 'bot' as const,
      text: `Test Message ${i + 1}`,
      timestamp: timestamp + i * 1000,
      status: 'sent' as const
    }));
  
    // Add initial messages and wait for render
    await addTestMessages(page, initialMessages, { 
      useContext: true, 
      waitForRender: true,
      idPrefix: 'chat-message-'
    });
  
    // Allow time for any scroll animations
    await page.waitForTimeout(200);
  
    // Create additional messages
    const newMessages = Array.from({ length: 5 }, (_, i) => ({
      id: `test-${i + 6}`,
      type: i % 2 === 0 ? 'user' as const : 'bot' as const,
      text: `Test Message ${i + 6}`,
      timestamp: timestamp + (i + 5) * 1000,
      status: 'sent' as const
    }));
  
    // Add new messages
    await addTestMessages(page, [...initialMessages, ...newMessages], { 
      useContext: true, 
      waitForRender: true,
      idPrefix: 'chat-message-'
    });
  
    // Allow time for scroll animation
    await page.waitForTimeout(200);
  
    // Verify scroll position
    const isScrolledToBottom = await page.evaluate(() => {
      const chatBody = document.querySelector('[data-testid="chat-body"]');
      if (!chatBody) return false;
  
      const scrollTop = chatBody.scrollTop;
      const scrollHeight = chatBody.scrollHeight;
      const clientHeight = chatBody.clientHeight;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      
      console.log('Scroll Debug:', {
        scrollTop,
        scrollHeight,
        clientHeight,
        distanceFromBottom
      });
  
      // Increased tolerance for different viewport sizes
      const tolerance = 50; // pixels
      return distanceFromBottom <= tolerance;
    });
  
    expect(isScrolledToBottom).toBe(true);
  });

  test('handles different message types correctly', async ({ page }) => {
    // Initial cleanup and setup
    await page.evaluate(() => {
        document.querySelectorAll('[data-testid^="chat-message-"]').forEach(el => el.remove());
        window.__MOCK_CHAT_CONTEXT__ = undefined;
        
        // Remove any duplicate chat bodies
        const chatBodies = document.querySelectorAll('[data-testid="chat-body"]');
        if (chatBodies.length > 1) {
            Array.from(chatBodies).slice(1).forEach(el => el.remove());
        }
    });

    // Setup and verify initial state
    await injectMockContext(page, 'agent');
    const chatBody = page.locator('[data-testid="chat-body"]').first();
    await expect(chatBody).toHaveCount(1);
    await expect(chatBody).toBeVisible();

    // Add messages one by one using our new helper
    for (const message of mockConversations.mixed) {
        const { messageId } = await addTestMessageToDOM(page, {
            ...message,
            // Ensure ID format matches what the component expects
            id: message.id.startsWith('msg1-') ? message.id.replace('msg1-', '') : message.id
        });

        // Verify message immediately after adding
        const messageContainer = chatBody.locator(`[data-testid="${messageId}"]`);
        const messageContent = chatBody.locator(`[data-testid="${messageId}-content"]`);

        // Verify message visibility and content
        await expect(messageContainer).toBeVisible();
        await expect(messageContent).toBeVisible();
        await expect(messageContent).toContainText(message.text);

        // Verify correct styling based on message type
        const containerClasses = await messageContainer.getAttribute('class');
        switch (message.type) {
            case 'user':
                expect(containerClasses).toContain('message-user');
                expect(containerClasses).toContain('justify-end');
                break;
            case 'bot':
                expect(containerClasses).toContain('message-bot');
                expect(containerClasses).toContain('justify-start');
                break;
            case 'system':
                expect(containerClasses).toContain('message-system');
                expect(containerClasses).toContain('justify-start');
                break;
        }
    }

    // Verify total message count
    const messageElements = await chatBody
        .locator('[data-testid^="message-"]:not([data-testid$="-content"]):not([data-testid$="-status"])')
        .all();
    expect(messageElements.length).toBe(mockConversations.mixed.length);
  });
});