import { test, expect } from '@playwright/test';
import { injectMockContext, getMockContext } from '@/tests/helpers/mock-chat-context';

test.describe('Mode Switcher Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/chat?mode=agent');
    await injectMockContext(page, 'agent');
    await page.waitForSelector('[data-testid="chat-body"]');
  });

  test('renders both mode tabs', async ({ page }) => {
    await expect(page.getByTestId('agent-tab')).toBeVisible();
    await expect(page.getByTestId('support-tab')).toBeVisible();
  });

  test('starts in agent mode by default', async ({ page }) => {
    const context = await getMockContext(page);
    expect(context?.mode).toBe('agent');
    
    // Verify agent tab is selected
    await expect(page.getByTestId('agent-tab')).toHaveAttribute('aria-selected', 'true');
  });

  test('switches to support mode when support tab is clicked', async ({ page }) => {
    // Click support tab
    await page.getByTestId('support-tab').click();
    
    // Wait for mode to change
    await page.waitForFunction(() => {
      return window.__MOCK_CHAT_CONTEXT__?.mode === 'support';
    });

    // Verify support tab is selected
    await expect(page.getByTestId('support-tab')).toHaveAttribute('aria-selected', 'true');
    
    // Verify context was updated
    const context = await getMockContext(page);
    expect(context?.mode).toBe('support');
  });

  test('syncs with URL parameters', async ({ page }) => {
    // Navigate with support mode in URL
    await page.goto('/test/chat?mode=support');
    await injectMockContext(page, 'support');
    
    // Verify support mode is active
    const context = await getMockContext(page);
    expect(context?.mode).toBe('support');
    await expect(page.getByTestId('support-tab')).toHaveAttribute('aria-selected', 'true');
  });
});