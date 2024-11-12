import { test, expect } from '@playwright/test';
import { mockConversations } from '@/tests/helpers/mock-data';

test.describe('Message Bubble Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/chat?mode=agent');
    await page.waitForSelector('[data-testid="chat-body"]');
  });

  test('renders user message correctly', async ({ page }) => {
    const userMessage = mockConversations.agent[0]; // First message is user
    const messageId = `chat-message-${userMessage.id}`;
    
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('add-messages', { detail: [msg] }));
    }, userMessage);

    const messageBubble = page.getByTestId(messageId);
    await expect(messageBubble).toBeVisible();
    await expect(messageBubble).toHaveClass(/message-user/);
    await expect(messageBubble).toHaveClass(/justify-end/);
    await expect(page.getByTestId(`${messageId}-content`)).toContainText(userMessage.text);
  });

  test('renders bot message correctly', async ({ page }) => {
    const botMessage = mockConversations.agent[1]; // Second message is bot
    const messageId = `chat-message-${botMessage.id}`;
    
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('add-messages', { detail: [msg] }));
    }, botMessage);

    const messageBubble = page.getByTestId(messageId);
    await expect(messageBubble).toBeVisible();
    await expect(messageBubble).toHaveClass(/message-bot/);
    await expect(messageBubble).toHaveClass(/justify-start/);
    await expect(page.getByTestId(`${messageId}-content`)).toContainText(botMessage.text);
  });

  test('renders system message correctly', async ({ page }) => {
    const systemMessage = mockConversations.mixed[0]; // First message is system
    const messageId = `chat-message-${systemMessage.id}`;
    
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('add-messages', { detail: [msg] }));
    }, systemMessage);

    const messageBubble = page.getByTestId(messageId);
    await expect(messageBubble).toBeVisible();
    await expect(messageBubble).toHaveClass(/message-system/);
    await expect(page.getByTestId(`${messageId}-content`)).toContainText(systemMessage.text);
  });

  test('shows status indicator for user messages', async ({ page }) => {
    const userMessage = mockConversations.agent[0];
    const messageId = `chat-message-${userMessage.id}`;
    
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('add-messages', { detail: [msg] }));
    }, userMessage);

    await expect(page.getByTestId(`${messageId}-status`)).toBeVisible();
    await expect(page.getByTestId(`${messageId}-status`)).toContainText('✓'); // sent status
  });
});