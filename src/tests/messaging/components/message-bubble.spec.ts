import { test, expect, Page } from '@playwright/test';
import { mockConversations } from '@/tests/helpers/mock-data';
import { Message } from '@/types/messaging';

test.describe('Message Bubble Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/chat?mode=agent');
    await page.waitForSelector('[data-testid="chat-body"]');
  });

  // Helper function to reduce repetition
  async function addMessageAndGetBubble(page: Page, message: Message) {
    const messageId = `chat-message-${message.id}`;
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('add-messages', { detail: [msg] }));
    }, message);
    return { messageId, bubble: page.getByTestId(messageId) };
  }

  test('renders user message correctly', async ({ page }) => {
    const userMessage = mockConversations.agent[0];
    const { messageId, bubble } = await addMessageAndGetBubble(page, userMessage);

    // Group related expectations
    await expect(bubble).toBeVisible();
    await expect(bubble).toHaveClass(/message-user/);
    await expect(bubble).toHaveClass(/justify-end/);
    await expect(page.getByTestId(`${messageId}-content`)).toContainText(userMessage.text);
  });

  test('renders bot message correctly', async ({ page }) => {
    const botMessage = mockConversations.agent[1];
    const { messageId, bubble } = await addMessageAndGetBubble(page, botMessage);

    await expect(bubble).toBeVisible();
    await expect(bubble).toHaveClass(/message-bot/);
    await expect(bubble).toHaveClass(/justify-start/);
    await expect(page.getByTestId(`${messageId}-content`)).toContainText(botMessage.text);
  });

  test('renders system message correctly', async ({ page }) => {
    const systemMessage = mockConversations.mixed[0];
    const { messageId, bubble } = await addMessageAndGetBubble(page, systemMessage);

    await expect(bubble).toBeVisible();
    await expect(bubble).toHaveClass(/message-system/);
    await expect(page.getByTestId(`${messageId}-content`)).toContainText(systemMessage.text);
  });

  test('shows status indicator for user messages', async ({ page }) => {
    const userMessage = mockConversations.agent[0];
    const { messageId } = await addMessageAndGetBubble(page, userMessage);
    const statusIndicator = page.getByTestId(`${messageId}-status`);

    await expect(statusIndicator).toBeVisible();
    await expect(statusIndicator).toContainText('✓'); // sent status
  });

  // New test to verify message ordering
  test('maintains correct message order', async ({ page }) => {
    const messages = mockConversations.agent.slice(0, 2);
    
    // Add messages and wait for them to be rendered
    await page.evaluate((msgs) => {
      window.dispatchEvent(new CustomEvent('add-messages', { detail: msgs }));
    }, messages);
  
    // Wait for messages to be rendered
    await page.waitForSelector(`[data-testid="chat-message-${messages[0].id}"]`);
    await page.waitForSelector(`[data-testid="chat-message-${messages[1].id}"]`);
  
    // Get only the main message containers by using a more specific selector
    const messageElements = await page.$$('[data-testid^="chat-message-"]:not([data-testid$="-content"]):not([data-testid$="-status"])');
  
    // Verify count
    expect(messageElements.length).toBe(messages.length);
  
    // Verify order
    for (let i = 0; i < messages.length; i++) {
      const messageId = `chat-message-${messages[i].id}`;
      const element = await messageElements[i].getAttribute('data-testid');
      expect(element).toBe(messageId);
    }
  });

  // New test to verify message content sanitization
  test('sanitizes message content correctly', async ({ page }) => {
    const messageWithHtml = {
      ...mockConversations.agent[0],
      text: '<script>alert("xss")</script>Hello <b>world</b>'
    };
    
    const { messageId } = await addMessageAndGetBubble(page, messageWithHtml);
    const content = page.getByTestId(`${messageId}-content`);
    
    // Wait for content to be rendered
    await content.waitFor({ state: 'visible' });
  
    // Get the actual rendered text content
    const renderedText = await content.evaluate(element => {
      // Get the span element that contains the text
      const textSpan = element.querySelector('span');
      return textSpan?.textContent || '';
    });
  
    // Verify the sanitized content
    expect(renderedText.trim()).toBe('Hello world');
  });
});