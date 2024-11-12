import { test, expect } from '@playwright/test';
import { sendMessage } from '../../helpers/test-utils';

test.describe('Message Sending', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
  });

  test('sends message and displays in chat', async ({ page }) => {
    const message = 'Test message';
    await sendMessage(page, message);
    await expect(page.getByText(message)).toBeVisible();
  });
});