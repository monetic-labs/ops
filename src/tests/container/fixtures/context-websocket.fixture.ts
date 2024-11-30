// fixtures/context-websocket.fixture.ts
import { test as base } from '@playwright/test';
import { WebSocketServer } from 'ws';
import { PaneFixture } from './msg-pane.fixture';

type WebSocketFixture = {
  pane: PaneFixture;
  initMessageHandling: () => Promise<void>;
};

export const test = base.extend<WebSocketFixture>({
  // Pane fixture
  pane: async ({ page }, use) => {
    await use(new PaneFixture(page));
  },

  initMessageHandling: async ({ page }, use) => {
    await use(async () => {
      await page.evaluate(() => {
        const ws = window.__MOCK_WS__;
        if (!ws) throw new Error('WebSocket mock not initialized');
        
        // Enable message handling
        ws.onmessage = (event: MessageEvent) => {
          console.log('Message received:', event.data);
          // Additional message handling setup can go here
        };
      });
    });
  }
});

// Export expect from playwright
export { expect } from '@playwright/test';