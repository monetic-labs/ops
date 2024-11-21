import { test as base } from '@playwright/test';

// Basic WebSocket for Container/Header tests
class MinimalWebSocketMock {
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  
  constructor() {
    setTimeout(() => this.onopen?.(), 0);
  }
  
  close() {
    this.onclose?.();
  }
}

// Enhanced WebSocket for Message/Footer tests
class MessagingWebSocketMock extends MinimalWebSocketMock {
  onmessage: ((data: any) => void) | null = null;
  
  send(data: string) {
    if (this.onmessage) {
      this.onmessage({ data });
    }
  }
}

export const test = base.extend({
  minimalWebSocket: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.WebSocket = MinimalWebSocketMock as any;
    });
    await use(null);
  },
  
  messagingWebSocket: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.WebSocket = MessagingWebSocketMock as any;
    });
    await use(null);
  }
});