import { test, expect } from '@playwright/test';
import { injectMockContext, getMockContext } from '@/tests/helpers/mock-chat-context';

test.describe('Mode Switcher Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/chat?mode=agent');
    
    // Wait for the test page to mount first
    await page.waitForSelector('[data-testid="debug-mount"]');
    
    await injectMockContext(page, 'agent');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Debug: Log component mounting
    console.log('Debug - Waiting for ModeSwitcher to mount');
    
    // Wait for the ModeSwitcher to be present
    await page.waitForSelector('[data-testid="mode-switcher"]', { timeout: 5000 });
  });

  test('renders both mode tabs', async ({ page }) => {
    console.log('Test Debug - Starting tab verification');
    
    // First verify the component exists
    await expect(page.locator('[data-testid="mode-switcher"]')).toBeVisible();
    
    // Debug the tab structure
    const tabsStructure = await page.evaluate(() => {
      const wrapper = document.querySelector('[data-testid="mode-switcher"]');
      const agentText = wrapper?.querySelector('[data-testid="agent-tab-text"]')?.textContent;
      const supportText = wrapper?.querySelector('[data-testid="support-tab-text"]')?.textContent;
      return {
        agentText,
        supportText,
        html: wrapper?.innerHTML
      };
    });
    console.log('Debug - Tab structure:', tabsStructure);
  
    // Verify the tabs container
    await expect(page.locator('[data-testid="mode-tabs"]')).toBeVisible();
    
    // Verify individual tabs
    await expect(page.locator('[data-testid="agent-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="support-tab"]')).toBeVisible();
    
    // Verify tab content using test IDs
    await expect(page.locator('[data-testid="agent-tab-text"]')).toHaveText('PACKS');
    await expect(page.locator('[data-testid="support-tab-text"]')).toHaveText('Support');
  });

  test('starts in agent mode by default', async ({ page }) => {
    const context = await getMockContext(page);
    expect(context?.mode).toBe('agent');
    
    await expect(page.getByTestId('agent-tab')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('support-tab')).toHaveAttribute('aria-selected', 'false');
  });

  test('switches to support mode when support tab is clicked', async ({ page }) => {
    // Wait for initial mount
    await page.waitForSelector('[data-testid="mode-switcher"]');
    
    // Click the support tab
    const supportTab = page.getByTestId('support-tab');
    await supportTab.click();
  
    // Wait for URL to update
    await expect(page).toHaveURL(/mode=support/);
  
    // Wait for the new context to be established after navigation
    await page.waitForFunction(() => {
      const tab = document.querySelector('[data-testid="support-tab"]');
      return tab?.getAttribute('aria-selected') === 'true';
    }, { timeout: 5000 });
  
    // Verify final state
    const finalState = await page.evaluate(() => {
      const supportTab = document.querySelector('[data-testid="support-tab"]');
      return {
        isSelected: supportTab?.getAttribute('aria-selected') === 'true',
        url: window.location.search
      };
    });
  
    expect(finalState.isSelected).toBe(true);
    expect(finalState.url).toContain('mode=support');
  });

  test('syncs with URL parameters', async ({ page }) => {
    await page.goto('/test/chat?mode=support');
    await injectMockContext(page, 'support');
    await page.waitForSelector('[data-testid="mode-switcher"]');
    
    await page.waitForFunction(() => {
      return window.__MOCK_CHAT_CONTEXT__?.mode === 'support';
    });
    
    await expect(page.getByTestId('support-tab')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('agent-tab')).toHaveAttribute('aria-selected', 'false');
    
    const context = await getMockContext(page);
    expect(context?.mode).toBe('support');
  });
});