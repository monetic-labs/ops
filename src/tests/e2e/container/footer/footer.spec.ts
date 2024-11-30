import { test, expect } from '../fixtures/context-messaging.fixture';
import { initMockWebSocket } from '../mock-services';
import { TEST_CONFIG } from '../test-env';

test.describe('Footer Component', () => {
  test.beforeEach(async ({ page, pane }) => {
    // Initialize WebSocket and open pane
    await initMockWebSocket(page, { handleMessages: true });
    await page.goto(`${TEST_CONFIG.routes.pane}?mode=${TEST_CONFIG.modes.bot}`);
    await pane.triggerShortcut();
    await pane.verifyState('open');

    // Initialize store with test data
    await page.evaluate(() => {
      const store = window.__MESSAGING_STORE__;
      if (!store) throw new Error('Messaging store not initialized');
      
      store.setState({
        message: {
          mode: 'bot',
          messages: [],
          isTyping: false,
          inputValue: '',
          userId: 'test-user'
        }
      });
    });
  });

  test.describe('Input Handling', () => {
    test('accepts user input and updates store', async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill('Test message');
      await expect(input).toHaveValue('Test message');

      const inputValue = await page.evaluate(() => {
        return window.__MESSAGING_STORE__?.getState().message.inputValue;
      });
      expect(inputValue).toBe('Test message');
    });

    test('clears input after sending message', async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill('Test message');
      await page.click('[data-testid="chat-submit"]');
      
      await expect(input).toHaveValue('');
      const inputValue = await page.evaluate(() => {
        return window.__MESSAGING_STORE__?.getState().message.inputValue;
      });
      expect(inputValue).toBe('');
    });

    test('persists input value when pane is closed and reopened', async ({ page, pane }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill('Draft message');
      
      // Close pane
      await pane.closeWithEscape();
      await pane.verifyState('closed');
      
      // Reopen pane
      await pane.triggerShortcut();
      await pane.verifyState('open');
      
      // Verify input value persisted
      await expect(input).toHaveValue('Draft message');
      const inputValue = await page.evaluate(() => {
        return window.__MESSAGING_STORE__?.getState().message.inputValue;
      });
      expect(inputValue).toBe('Draft message');
    });
  });

  test.describe('Message Handling', () => {
    test('sends message and updates store on submit', async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill('Test message');
      await page.click('[data-testid="chat-submit"]');

      const messages = await page.evaluate(() => {
        return window.__MESSAGING_STORE__?.getState().message.messages;
      });
      
      expect(messages).toContainEqual(
        expect.objectContaining({ 
          text: 'Test message', 
          type: 'user',
          status: 'sent'
        })
      );
    });
  });

  test.describe('Mode Switching', () => {
    test('switches from bot to support mode', async ({ page }) => {
      // Verify initial bot mode
      const initialMode = await page.evaluate(() => {
        return window.__MESSAGING_STORE__?.getState().message.mode;
      });
      expect(initialMode).toBe('bot');

      // Switch to support mode
      const supportTab = page.locator('[data-testid="support-tab"]');
      await expect(supportTab).toBeVisible();
      await supportTab.click();
      
      // Verify mode change
      await page.waitForFunction(() => {
        const store = window.__MESSAGING_STORE__;
        return store?.getState().message.mode === 'support';
      }, { timeout: 5000 });

      const finalMode = await page.evaluate(() => {
        return window.__MESSAGING_STORE__?.getState().message.mode;
      });
      expect(finalMode).toBe('support');
    });
  });
});