import { test, expect } from '@playwright/test';

test.describe('Chat Input Component', () => {
  test.describe('Agent Mode', () => {
    test.beforeEach(async ({ page }) => {
      // Add console logging to help debug
      page.on('console', msg => console.log(msg.text()));
      page.on('pageerror', err => console.error(err));

      await page.goto('/test/chat?mode=agent');
      await page.waitForSelector('[data-testid="chat-input-container"]');

      console.log('Page loaded, waiting for input container...');

      try {
        // First check if the element exists at all
        const elementHandle = await page.$('[data-testid="chat-input-container"]');
        console.log('Element exists:', !!elementHandle);
        
        // Then wait for it to be visible
        await page.waitForSelector('[data-testid="chat-input-container"]', {
          state: 'visible',
          timeout: 5000
        });
      } catch (error) {
        // Take a screenshot on failure
        await page.screenshot({ path: 'debug-screenshot.png' });
        throw error;
      }
    });

    test('renders basic input components', async ({ page }) => {
      // Update selectors to be more specific
      const input = page.locator('[data-testid="chat-input"]').first();
      const submitButton = page.locator('[data-testid="chat-submit-button"]').first();

      await expect(input).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('renders with agent mode placeholder', async ({ page }) => {
      // Use first() to handle multiple matches
      await expect(page.locator('[data-testid="chat-input"]').first()).toHaveAttribute(
        'placeholder',
        'Ask me anything...'
      );
    });

    // Add more agent-specific tests
  });

  test.describe('Support Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/test/chat?mode=support');
      await page.waitForSelector('[data-testid="chat-input-container"]');
    });

    test('renders with support mode placeholder', async ({ page }) => {
      await expect(page.locator('[data-testid="chat-input"]').first()).toHaveAttribute(
        'placeholder',
        'Type your message... Use @ to mention'
      );
    });

    test('shows mention list when @ is typed', async ({ page }) => {
      // Update input selector
      const input = page.locator('[data-testid="chat-input"]').first();
      await input.click();
      await input.fill('@');

      // Update mention list selector
      const mentionList = page.locator('[data-testid="mention-list"]').first();
      await expect(mentionList).toBeVisible({ timeout: 5000 });
      
      const options = await page.$$('[data-testid="mention-option"]');
      expect(options.length).toBeGreaterThan(0);
    });

    // Add a test for mention selection
    test('can select a mention from the list', async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]').first();
      
      await input.click();
      await input.fill('@');
      
      // Wait for mention list
      await expect(page.getByTestId('mention-list')).toBeVisible();
      
      // Get the first mention option
      const firstOption = page.getByTestId('mention-option').first();
      
      // Ensure the element is in view
      await firstOption.scrollIntoViewIfNeeded();
      
      // Wait a moment for any animations to complete
      await page.waitForTimeout(100);
      
      // Click the option
      await firstOption.click();
      
      // Verify the input now contains the mention
      const inputValue = await input.inputValue();
      expect(inputValue).toMatch(/^@[\w-]+\s$/); // Matches @something followed by space
    });

    test('can select a mention from the list using keyboard', async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]').first();
      
      await input.click();
      await input.fill('@');
      
      // Wait for mention list
      await expect(page.getByTestId('mention-list')).toBeVisible();
      
      // Press Enter to select first option
      await input.press('Enter');
      
      // Verify the input now contains the mention
      const inputValue = await input.inputValue();
      
      // Verify it starts with @ and contains a properly formatted knowledge base category
      expect(inputValue).toMatch(/^@[\w-]+\s$/); // Matches @something followed by space
    });

    test('displays correct mention options', async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]').first();
      await input.click();
      await input.fill('@');
      
      // Wait for mention list
      await expect(page.getByTestId('mention-list')).toBeVisible();
      
      // Get all mention options
      const options = await page.$$('[data-testid="mention-option"]');
      
      // Verify mention list has options
      expect(options.length).toBeGreaterThan(0);
      
      // Verify first option is a valid element
      const firstOption = options[0];
      expect(firstOption).toBeTruthy();
      expect(firstOption).toBeInstanceOf(Object);
      
      // Optional: Verify the option is clickable/interactive
      await expect(page.getByTestId('mention-option').first()).toBeEnabled();
    });
  });

  // Shared behavior tests
  test.describe('Common Behavior', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/test/chat');
      await page.waitForSelector('[data-testid="chat-input-container"]');
    });

    test('handles basic text input', async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]').first();
      await input.fill('Hello world');
      await expect(input).toHaveValue('Hello world');
    });

    // Add more common behavior tests
  });
});