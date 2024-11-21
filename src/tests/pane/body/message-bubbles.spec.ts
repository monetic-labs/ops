import { test, expect } from '@playwright/test';
import { mockMessages } from '../fixtures/message.fixture';

test.describe('Message Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
  });

  test('renders different message types correctly', async ({ page }) => {
    // Text messages
    await expect(page.getByTestId('message-bubble-text')).toHaveClass(/bubble/);
    
    // Code blocks
    await expect(page.getByTestId('message-block-code')).toHaveClass(/code-block/);
    
    // Document blocks
    await expect(page.getByTestId('message-block-document')).toHaveClass(/document-block/);
  });

  test('applies correct alignment for message sources', async ({ page }) => {
    // Inbound messages (left-aligned)
    await expect(page.getByTestId('message-inbound')).toHaveClass(/justify-start/);
    
    // Outbound messages (right-aligned)
    await expect(page.getByTestId('message-outbound')).toHaveClass(/justify-end/);
  });

  test('handles markdown formatting', async ({ page }) => {
    const markdownMessage = page.getByTestId('message-markdown');
    await expect(markdownMessage.getByRole('heading')).toBeVisible();
    await expect(markdownMessage.getByRole('code')).toBeVisible();
  });
});

// TODO: Add tests for message display
// - renders each message type correctly
// - messages are aligned correctly
// - messages have status indicators
// - messages are formatted correctly