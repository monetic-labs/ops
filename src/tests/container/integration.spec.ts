import { test, expect } from '@/tests/container/fixtures/context-messaging.fixture';
import { initMockWebSocket } from '@/tests/container/mock-services';
import { TEST_CONFIG } from '@/tests/container/test-env';
import { mockUserMessage, mockResponses } from '@/tests/container/mock-data';

test.describe('Full Messaging Integration', () => {
  test.beforeEach(async ({ page, pane }) => {
    await initMockWebSocket(page, { handleMessages: true });
    await page.goto(`${TEST_CONFIG.routes.pane}?mode=${TEST_CONFIG.modes.support}`);
    await pane.triggerShortcut();
    await pane.verifyState('open');

    await page.evaluate(() => {
      const store = window.__MESSAGING_STORE__;
      if (!store) throw new Error('Store not initialized');
      
      store.setState({
        message: {
          mode: 'support',
          messages: [],
          isTyping: false,
          inputValue: '',
          userId: 'test-user'
        }
      });
    });
  });

  test('completes full messaging flow', async ({ page }) => {
    // Verify initial mode
    const initialMode = await page.evaluate(() => {
      return window.__MESSAGING_STORE__?.getState().message.mode;
    });
    expect(initialMode).toBe('support');

    // Send message using mock data
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill(mockUserMessage.text);
    await page.click('[data-testid="chat-submit"]');

    // Wait for message to be added to store
    await page.waitForFunction(({ text }) => {
      const store = window.__MESSAGING_STORE__;
      return store?.getState().message.messages.some(
        msg => msg.text === text && msg.type === 'user'
      );
    }, { text: mockUserMessage.text });

    // Verify message in UI
    const userMessage = page.locator('[data-testid="message-item"]').filter({ 
      hasText: mockUserMessage.text 
    });
    await expect(userMessage).toBeVisible();

    // Simulate support response using mock data
    await page.evaluate(({ response }) => {
      const store = window.__MESSAGING_STORE__;
      store?.getState().actions.message.appendMessage({
        id: 'agent-msg-id',
        text: response,
        type: 'support',
        timestamp: Date.now(),
        status: 'received'
      });
    }, { response: mockResponses.support.help });

    // Wait for and verify support message
    const agentMessage = page.locator('[data-testid="message-item"]').filter({ 
      hasText: mockResponses.support.help 
    });
    await expect(agentMessage).toBeVisible();

    // Switch to bot mode
    const botTab = page.locator('[data-testid="bot-tab"]');
    await expect(botTab).toBeVisible();
    await botTab.click();

    // Wait for mode switch
    await page.waitForFunction(() => {
      const store = window.__MESSAGING_STORE__;
      return store?.getState().message.mode === 'bot';
    });

    // Send bot message
    await input.fill('Show me documentation');
    await page.click('[data-testid="chat-submit"]');

    // Wait for message to appear in store
    await page.waitForFunction(() => {
      const store = window.__MESSAGING_STORE__;
      return store?.getState().message.messages.some(
        msg => msg.text === 'Show me documentation' && msg.type === 'user'
      );
    });

    // Verify bot message
    const botMessage = page.locator('[data-testid="message-item"]').filter({ 
      hasText: 'Show me documentation' 
    });
    await expect(botMessage).toBeVisible();
  });
});