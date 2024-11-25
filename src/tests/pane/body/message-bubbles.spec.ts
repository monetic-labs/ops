import { expect } from '@playwright/test';
import { mockMessages } from '../fixtures/message.fixture';
import { test as baseTest } from '@/tests/pane/fixtures/service.fixture';
import { waitForTestContext } from '../fixtures/context.fixture';

const test = baseTest;

test.describe('Message Bubbles', () => {
  test.beforeEach(async ({ page, pane, messagingContext }) => {
    await page.goto('/test/pane');
    await waitForTestContext(page);
    
    // Verify context is properly initialized
    expect(messagingContext.initialized).toBe(true);
    expect(messagingContext.wsReady).toBe(true);
    expect(messagingContext.isOpen).toBe(true);

    // First trigger the pane to open
    //await pane.triggerShortcut();
    
    // Wait for pane to be visible instead of trying to open it
    await page.waitForSelector('[data-testid="chat-pane-container"][data-state="open"]', {
      state: 'visible',
      timeout: 10000
    });
  });

  test('renders agent messages correctly', async ({ page, messagingContext }) => {
    // Ensure messaging context is initialized before testing
    expect(messagingContext.initialized).toBe(true);
    expect(messagingContext.mode).toBe('agent');

    const agentMessage = page.getByTestId('message-bubble-agent');
    await expect(agentMessage).toBeVisible();
    await expect(agentMessage).toHaveClass(/bubble/);
    await expect(agentMessage).toHaveClass(/justify-start/);

    // Test code blocks within agent messages
    const codeBlock = agentMessage.getByTestId('message-block-code');
    await expect(codeBlock).toHaveClass(/code-block/);
    await expect(codeBlock).toHaveAttribute('data-language');
  });

  test('renders support messages correctly', async ({ page }) => {
    const supportMessage = page.getByTestId('message-bubble-support');
    await expect(supportMessage).toBeVisible();
    await expect(supportMessage).toHaveClass(/bubble/);
    await expect(supportMessage).toHaveClass(/justify-start/);
    await expect(supportMessage).toHaveText(mockMessages.support[0].text);
  });

  test('renders user messages correctly', async ({ page }) => {
    // Test user messages
    const userMessage = page.getByTestId('message-bubble-user');
    await expect(userMessage).toBeVisible();
    await expect(userMessage).toHaveClass(/bubble/);
    await expect(userMessage).toHaveClass(/justify-end/);
  });

  test('handles message states and indicators', async ({ page }) => {
    // Test message status indicators
    await expect(page.getByTestId('message-status-sent')).toBeVisible();
    await expect(page.getByTestId('message-status-delivered')).toBeVisible();
    await expect(page.getByTestId('message-status-error')).toBeVisible();

    // Test typing indicators
    await expect(page.getByTestId('typing-indicator')).toBeVisible();
    await expect(page.getByTestId('typing-indicator')).toHaveClass(/animate-pulse/);
  });

  test('handles message interactions', async ({ page }) => {
    const message = page.getByTestId('message-bubble-agent');

    // Test code block copy functionality
    const codeBlock = message.getByTestId('message-block-code');
    await codeBlock.getByRole('button', { name: 'Copy' }).click();
    await expect(page.getByText('Copied!')).toBeVisible();

    // Test document block download
    const documentBlock = page.getByTestId('message-block-document');
    await documentBlock.getByRole('button', { name: 'Download' }).click();
    // Verify download started
  });

  test('maintains correct message order and grouping', async ({ page }) => {
    // Test message timestamps and ordering
    const messages = page.getByTestId('message-bubble');
    const timestamps = await messages.evaluateAll(els => 
      els.map(el => el.getAttribute('data-timestamp'))
    );
    
    // Verify timestamps are in ascending order
    const sortedTimestamps = [...timestamps].sort();
    expect(timestamps).toEqual(sortedTimestamps);

    // Test message grouping
    await expect(page.getByTestId('message-group')).toHaveCount(2);
  });
});