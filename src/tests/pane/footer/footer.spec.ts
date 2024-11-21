import { test, expect } from '@playwright/test';
import { mockMessages } from '../fixtures/message.fixture';

test.describe('Footer Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
  });

// TODO: Add tests for footer
// - mode-switcher
// mode switcher will need the context from @test-wrapper for support and agent modes 
// - send button
// send button will need websocket mocks
// - input field
// will need to use the @mention component and it's related context which will be feeding into the prompt context for agent mode
// - resize handle
// resize pane will need context for pane states
});
