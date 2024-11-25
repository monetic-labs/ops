import { waitForTestContext } from './fixtures/context.fixture';
import { test } from './fixtures/service.fixture';
import { expect } from '@playwright/test';


test.describe('Chat Pane Container', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/pane');
  });
  test.afterEach(async ({ page }) => {
    // Clean up any duplicate panes
    await page.evaluate(() => {
      const panes = document.querySelectorAll('[data-testid="chat-pane-container"]');
      console.log('Cleanup: found', panes.length, 'panes');
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
    // Open pane initially
    await pane.triggerShortcut();
    await pane.verifyState('open');
    
    // Resize the pane
    const { initialState, finalState } = await pane.resize(-100);
    expect(finalState.width).toBeLessThan(initialState.width);
    
    // Verify width is stored
    const storedWidth = await page.evaluate(() => localStorage.getItem('chat-pane-width'));
    expect(storedWidth).toBe(finalState.width.toString());
    
    // Close and reopen
    await pane.closeWithEscape();
    await pane.verifyState('closed');
    await pane.triggerShortcut();
    await pane.verifyState('open');
    
    // Verify width was maintained
    const reopenedState = await pane.getState();
    const widthDifference = Math.abs(reopenedState.width - finalState.width);
    expect(widthDifference).toBeLessThan(5);
  });

  test('should handle backdrop clicks', async ({ page }) => {
  });

});