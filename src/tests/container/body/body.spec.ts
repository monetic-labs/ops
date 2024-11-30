import { test, expect } from '@/tests/container/fixtures/context-messaging.fixture';
import { initMockWebSocket } from '@/tests/container/mock-services';
import { mockBotMessage, mockSupportMessage, mockSystemMessage } from '../mock-data';
import { initializeStore } from '../utils';

test.describe('Body Component', () => {
  test.beforeEach(async ({ page, pane }) => {
    await initMockWebSocket(page, { handleMessages: true });
    await page.goto('/test/pane?mode=bot');
    await pane.triggerShortcut();
    await pane.verifyState('open');
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      const store = window.__MESSAGING_STORE__;
      if (store) {
        store.setState({
          message: {
            mode: 'bot',
            messages: [],
            isTyping: false,
            inputValue: '',
            userId: null
          }
        });
      }
    });
  });

  test.describe('Message Rendering', () => {
    test('renders messages in bot mode', async ({ page }) => {
      await initializeStore(page, {
        mode: 'bot',
        messages: [mockBotMessage]
      });

      const messageItem = page.locator('[data-testid="message-item"]');
      await expect(messageItem).toBeVisible();
      await expect(messageItem).toHaveText(mockBotMessage.text);
    });

    test('renders messages in support mode', async ({ page }) => {
      await page.goto('/test/pane?mode=support');
      
      await initializeStore(page, {
        mode: 'support',
        messages: [mockSupportMessage],
        userId: 'test-user'
      });

      const messageItem = page.locator('[data-testid="message-item"]');
      await expect(messageItem).toBeVisible();
      await expect(messageItem).toHaveText(mockSupportMessage.text);
    });
  });

  test.describe('WebSocket Handling', () => {
    test('handles incoming websocket messages', async ({ page }) => {
      await page.evaluate(({ systemMessage }) => {
        const store = window.__MESSAGING_STORE__;
        if (!store) throw new Error('Store not initialized');
        
        store.getState().actions.message.appendMessage({
          id: systemMessage.id,
          text: systemMessage.text,
          type: 'system',
          timestamp: systemMessage.timestamp,
          status: 'received',
          category: 'info'
        });
      }, { systemMessage: mockSystemMessage });

      const systemMessageEl = page.locator('[data-testid="message-item"]').last();
      await expect(systemMessageEl).toBeVisible();
      await expect(systemMessageEl).toHaveText(mockSystemMessage.text);
    });
  });

  test.describe('UI States', () => {
    test('displays typing indicator in support mode', async ({ page }) => {
      await initializeStore(page, {
        mode: 'support',
        isTyping: true
      });

      const typingIndicator = page.locator('[data-testid="typing-indicator"]');
      await expect(typingIndicator).toBeVisible();
    });
  });
});