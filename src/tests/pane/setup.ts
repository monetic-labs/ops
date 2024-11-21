import { Page } from '@playwright/test';

export async function setupContainerTest(page: Page) {
  await page.goto('/test/pane');
  return {
    getPane: () => page.locator('[data-testid="chat-pane-container"]'),
    getBackdrop: () => page.locator('[data-testid="chat-backdrop"]'),
    getResizeHandle: () => page.locator('[data-testid="chat-pane-resize-handle"]')
  };
}

export async function setupMessagingTest(page: Page, mode: 'agent' | 'support' = 'agent') {
  await page.goto(`/test/pane?mode=${mode}`);
  return {
    getMessageList: () => page.locator('[data-testid="message-list"]'),
    getInput: () => page.locator('[data-testid="chat-input"]'),
    getSendButton: () => page.locator('[data-testid="chat-submit"]')
  };
}