import { test, expect } from '@playwright/test';
import { 
  getPaneState, 
  setupChatPane, 
  triggerShortcut, 
  verifyPaneState,
  waitForPaneTransition,
  resizeChatPane 
} from '../messaging/helpers/utils';

test.describe('Chat Pane Container', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render in initial closed state', async ({ page }) => {
    const pane = await setupChatPane(page);
    await verifyPaneState(page, 'closed');
  });

  test('should open via keyboard shortcut', async ({ page }) => {
    await triggerShortcut(page);
    await verifyPaneState(page, 'open');
  });

  test('should close via escape key', async ({ page }) => {
    await triggerShortcut(page);
    await page.keyboard.press('Escape');
    await verifyPaneState(page, 'closed');
  });

  test('should maintain resize state between opens', async ({ page }) => {
    await triggerShortcut(page);
    
    const { initialWidth, finalWidth } = await resizeChatPane(page, 100);
    expect(finalWidth).toBeGreaterThan(initialWidth);
    
    await page.keyboard.press('Escape');
    await triggerShortcut(page);
    
    const state = await getPaneState(page);
    expect(state.width).toBe(finalWidth);
  });

  test('should handle backdrop clicks', async ({ page }) => {
    await triggerShortcut(page);
    await page.click('[data-testid="chat-backdrop"]');
    await verifyPaneState(page, 'closed');
  });
});
