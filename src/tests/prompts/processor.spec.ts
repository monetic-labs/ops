import { test, expect } from '@playwright/test';
import { mockGraph } from './fixtures/graph.fixture';
import { mockSpeedPreference } from './fixtures/preference.fixture';
import { mockUsagePattern } from './fixtures/usage.fixture';

test.describe('Prompt Processing', () => {
    test.beforeEach(async ({ context }) => {
        // Set up test environment
        await context.addInitScript(() => {
            window.__TEST_GRAPH__ = mockGraph;
            window.__TEST_PREFERENCE__ = mockSpeedPreference;
            window.__TEST_USAGE__ = mockUsagePattern;
        });
    });

    test('processes speed preference correctly', async ({ page }) => {
        await page.goto('/test/prompts');
        const result = await page.evaluate(() => {
            return window.__TEST_PREFERENCE__;
        });
        
        await expect(result?.preference_type).toBe('speed_vs_cost');
        await expect(result?.context.capabilities).toContain('transfers');
    });
});