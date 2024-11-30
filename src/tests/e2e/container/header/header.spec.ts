import { test, expect } from '@playwright/test';
import { PaneFixture } from '@/tests/e2e/container/fixtures/msg-pane.fixture';

test.describe('Chat Header', () => {
  let pane: PaneFixture;

  test.beforeEach(async ({ page }) => {
    pane = new PaneFixture(page);
    await page.goto('/');
    await pane.triggerShortcut();
    await pane.verifyState('open');
  });

  test('should render all components correctly', async ({ page }) => {
    // Check visibility and content of all components
    await expect(page.getByTestId('chat-header')).toBeVisible();
    await expect(page.getByTestId('chat-title')).toBeVisible();
    await expect(page.getByTestId('chat-title')).toHaveText('Atlas');
    await expect(page.getByTestId('chat-close')).toBeVisible();
    await expect(page.getByTestId('chat-shortcut')).toBeVisible();
  });

  test('should close pane when close button clicked', async ({ page }) => {
    const closeButton = page.getByTestId('chat-close');
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await pane.verifyState('closed');
  });

  test('should display platform-specific keyboard shortcut', async ({ page }) => {
    const shortcut = page.getByTestId('chat-shortcut');
    const platform = await shortcut.getAttribute('data-platform');
    const expectedText = platform === 'mac' ? '⌘K' : 'Ctrl+K';
    
    await expect(shortcut).toBeVisible();
    await expect(shortcut).toHaveText(expectedText);
  });

  test('should maintain responsive layout', async ({ page }) => {
    const header = page.getByTestId('chat-header');
    const layouts = [
      { width: 1024, height: 768, name: 'desktop' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const layout of layouts) {
      await page.setViewportSize(layout);
      await expect(header).toBeVisible();
      await expect(header).toHaveClass(/flex items-center justify-between/);
    }
  });
});