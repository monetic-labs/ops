import { test, expect } from '@playwright/test';
import { injectMockContext, getMockContext } from '@/tests/helpers/mock-chat-context';
import { verifyComponentMount } from '@/tests/helpers/test-utils';

test.describe('Mode Switcher Component', () => {
    test.beforeEach(async ({ page }) => {
        // Add console logging
        page.on('console', msg => console.log('Browser:', msg.text()));
        page.on('pageerror', err => console.error('Browser Error:', err));
      
        // Navigate and wait for initial load
        await page.goto('/test/chat?mode=agent');
        await page.waitForSelector('[data-testid="debug-mount"]');
        
        // Inject context and verify
        await injectMockContext(page, 'agent');
        
        // Wait for context to be available
        await page.waitForFunction(() => window.__MOCK_CHAT_CONTEXT__ !== undefined);
      
        // Log DOM state before waiting for mode-switcher
        const preMountState = await page.evaluate(() => ({
          html: document.body.innerHTML,
          context: window.__MOCK_CHAT_CONTEXT__
        }));
        console.log('Pre-mount state:', preMountState);
      
        // Wait for mode-switcher with better error handling
        try {
          await page.waitForSelector('[data-testid="mode-switcher"]', { 
            state: 'attached',
            timeout: 5000 
          });
        } catch (error) {
          console.error('Failed to find mode-switcher:', error);
          throw error;
        }
    });

  test('renders both mode tabs', async ({ page }) => {
        // First verify the component exists and is mounted
        const mountState = await verifyComponentMount(page, 'mode-switcher');
        expect(mountState.exists, 'ModeSwitcher should exist').toBe(true);
        expect(mountState.visible, 'ModeSwitcher should be visible').toBe(true);
      
        // Wait for mode-tabs container to be ready
        await page.waitForSelector('[data-testid="mode-tabs"]', { 
          state: 'visible',
          timeout: 5000 
        });
      
        // Use more specific selectors by targeting the text elements directly
        const agentTabText = page.locator('[data-testid="agent-tab-text"]').first();
        const supportTabText = page.locator('[data-testid="support-tab-text"]').first();
      
        // Verify text content
        await expect(agentTabText).toBeVisible();
        await expect(supportTabText).toBeVisible();
        await expect(agentTabText).toHaveText('PACKS');
        await expect(supportTabText).toHaveText('Support');
      
        // Verify initial tab states using aria-selected
        const agentTab = page.locator('[data-testid="agent-tab"]').first();
        const supportTab = page.locator('[data-testid="support-tab"]').first();
        
        await expect(agentTab).toHaveAttribute('aria-selected', 'true');
        await expect(supportTab).toHaveAttribute('aria-selected', 'false');
  });

  test('starts in agent mode by default', async ({ page }) => {
    const context = await getMockContext(page);
    expect(context?.mode).toBe('agent');
    
    // Use .first() to handle multiple elements
    const agentTab = page.getByTestId('agent-tab').first();
    const supportTab = page.getByTestId('support-tab').first();
    
    await expect(agentTab).toHaveAttribute('aria-selected', 'true');
    await expect(supportTab).toHaveAttribute('aria-selected', 'false');
  });

  test('switches to support mode when support tab is clicked', async ({ page }) => {
    // Wait for initial mount
    await page.waitForSelector('[data-testid="mode-switcher"]');
    
    // Ensure chat pane is closed first
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('force-chat-state', {
        detail: { isOpen: false }
      }));
    });
    
    // Wait for pane to be closed and out of the way
    await page.waitForSelector('[data-testid="chat-pane-container"][data-state="closed"]', {
      state: 'attached',
      timeout: 5000
    });

    // Now try to click the support tab
    const supportTab = page.getByTestId('support-tab').first();
    await supportTab.click();
  
    // Wait for URL to update
    await expect(page).toHaveURL(/mode=support/);
  
    // Wait for the new context to be established after navigation
    await page.waitForFunction(() => {
      const tab = document.querySelector('[data-testid="support-tab"]');
      return tab?.getAttribute('aria-selected') === 'true';
    }, { timeout: 5000 });
  
    // Verify final state using first() to ensure single element selection
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
    // Start with base URL and wait for initial load
    await page.goto('/test/chat');
    await page.waitForLoadState('networkidle');
    
    // Wait for mode-switcher to be ready
    await page.waitForSelector('[data-testid="mode-switcher"]', {
        state: 'visible',
        timeout: 5000
    });

    // Helper function to check tab states
    const verifyTabStates = async (activeMode: 'support' | 'agent') => {
        const supportTab = page.locator('[data-testid="support-tab"]').first();
        const agentTab = page.locator('[data-testid="agent-tab"]').first();
        
        await expect(supportTab).toHaveAttribute('aria-selected', 
            activeMode === 'support' ? 'true' : 'false'
        );
        await expect(agentTab).toHaveAttribute('aria-selected', 
            activeMode === 'agent' ? 'true' : 'false'
        );
    };

    // Test support mode
    await page.evaluate(() => {
        window.history.pushState({}, '', '/test/chat?mode=support');
        // Trigger any necessary internal state updates
        window.dispatchEvent(new Event('popstate'));
    });

    // Wait for state to settle after URL change
    await page.waitForTimeout(100);
    await verifyTabStates('support');

    // Test agent mode
    await page.evaluate(() => {
        window.history.pushState({}, '', '/test/chat?mode=agent');
        window.dispatchEvent(new Event('popstate'));
    });

    // Wait for state to settle after URL change
    await page.waitForTimeout(100);
    await verifyTabStates('agent');
});
});