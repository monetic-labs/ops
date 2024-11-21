import { test, expect } from '@playwright/test';
import { setupChatPane } from '@/tests/messaging/helpers/utils';

test.describe('Chat Pane Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/pane');
  });

  test('handles complete message flow', async ({ page }) => {
    const pane = await setupChatPane(page);
    
    // Send message
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.click('[data-testid="chat-submit"]');
    
    // Verify message display
    await expect(page.getByTestId('message-outbound')).toBeVisible();
    
    // Switch modes
    await page.click('[data-testid="mode-support"]');
    
    // Verify mode switch affected message display
    await expect(page.getByTestId('chat-mode')).toHaveAttribute('data-mode', 'support');
  });
});