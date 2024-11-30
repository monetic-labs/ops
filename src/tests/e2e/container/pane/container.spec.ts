import { test } from '@/tests/e2e/container/fixtures/context-websocket.fixture';
import { expect } from '@playwright/test';
import { initMockWebSocket } from '../mock-services';


test.describe('Chat Pane Container', () => {
  test.beforeEach(async ({ page }) => {
    await initMockWebSocket(page);
    await page.goto('/test/pane?mode=support');
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      const panes = document.querySelectorAll('[data-testid="chat-pane-container"]');
      Array.from(panes).forEach(pane => pane.remove());
    });
  });

  test('should render in initial closed state', async ({ pane }) => {
    await pane.verifyState('closed');
  });

  test('should open via keyboard shortcut', async ({ pane }) => {
    await pane.verifyState('closed');
    await pane.triggerShortcut();
    await pane.verifyState('open');
  });

  test('should close via escape key', async ({ pane }) => {
    await pane.triggerShortcut();
    await pane.verifyState('open');
    await pane.closeWithEscape();
    await pane.verifyState('closed');
  });

  test('should maintain resize state between opens', async ({ page, pane }) => {
    // Initial setup
    await pane.triggerShortcut();
    await pane.verifyState('open');
    
    // Verify resize handle
    const resizeHandle = page.locator('[data-testid="chat-pane-resize-handle"]');
    await expect(resizeHandle).toBeVisible();
    
    // Perform resize and verify
    const { initialState, finalState } = await pane.resize(-100);
    expect(finalState.width).toBeLessThan(initialState.width);
    
    // Verify persistence
    const storedWidth = await page.evaluate(() => localStorage.getItem('chat-pane-width'));
    expect(storedWidth).toBeTruthy();
    
    // Verify state maintained after reopen
    await pane.closeWithEscape();
    await pane.verifyState('closed');
    await pane.triggerShortcut();
    await pane.verifyState('open');
    
    const reopenedState = await pane.getState();
    expect(Math.abs(reopenedState.width - finalState.width)).toBeLessThan(5);
  });

  test('should handle backdrop clicks', async ({ page }) => {
  });

});