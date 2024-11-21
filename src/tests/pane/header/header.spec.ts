import { test, expect } from '@playwright/test';
import { triggerShortcut } from '@/tests/messaging/helpers/utils';

test.describe('Chat Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await triggerShortcut(page);
  });

  test('should render all components', async ({ page }) => {
    await expect(page.locator('[data-testid="chat-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-close"]')).toBeVisible();
  });

  test('should close pane when close button clicked', async ({ page }) => {
    await page.click('[data-testid="chat-close"]');
    await expect(page.locator('[data-testid="chat-pane-container"]'))
      .toHaveAttribute('data-state', 'closed');
  });

  test('displays correct keyboard shortcut', async ({ page }) => {
    const shortcutText = process.platform === 'darwin' ? '⌘K' : 'Ctrl+K';
    await expect(page.getByTestId('chat-shortcut')).toHaveText(shortcutText);
  });
});