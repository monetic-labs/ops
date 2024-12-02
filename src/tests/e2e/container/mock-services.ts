import { Page } from "@playwright/test";
import { MockWebSocket } from "./test-types";

export const initMockWebSocket = async (page: Page, options: { handleMessages?: boolean } = {}) => {
  const isInitialized = await page.evaluate(
    ({ handleMessages }) => {
      return new Promise<boolean>((resolve) => {
        const messages: any[] = [];
        const eventListeners: Record<string, Function[]> = {
          message: [],
          close: [],
          open: [],
          error: [],
        };

        const ws: MockWebSocket = {
          readyState: 0, // Start with CONNECTING
          send: (data: string) => {
            if (handleMessages) {
              const parsed = JSON.parse(data);
              messages.push(parsed);

              const event = new MessageEvent("message", { data });
              eventListeners.message.forEach((handler) => handler(event));
              if (ws.onmessage) ws.onmessage(event);
            }
          },
          close: () => {
            ws.readyState = 3;
            eventListeners.close.forEach((handler) => handler());
            if (ws.onclose) ws.onclose();
          },
          addEventListener: (event: string, handler: Function) => {
            if (eventListeners[event]) {
              eventListeners[event].push(handler);
            }
          },
          removeEventListener: (event: string, handler: Function) => {
            if (eventListeners[event]) {
              const idx = eventListeners[event].indexOf(handler);
              if (idx !== -1) {
                eventListeners[event].splice(idx, 1);
              }
            }
          },
          getAllMessages: () => [...messages],
          onmessage: undefined,
          onclose: undefined,
          onopen: undefined,
          onerror: undefined,
        };

        // Set the mock WS instance
        window.__MOCK_WS__ = ws;

        // Create WebSocket constructor
        window.WebSocket = function () {
          return window.__MOCK_WS__!;
        } as unknown as typeof WebSocket;

        // Add static properties
        (window.WebSocket as any).CONNECTING = 0;
        (window.WebSocket as any).OPEN = 1;
        (window.WebSocket as any).CLOSING = 2;
        (window.WebSocket as any).CLOSED = 3;

        // Immediately set to OPEN state
        ws.readyState = 1;
        if (ws.onopen) ws.onopen();
        eventListeners.open.forEach((handler) => handler(new Event("open")));

        resolve(true);
      });
    },
    { handleMessages: options.handleMessages }
  );

  if (!isInitialized) {
    throw new Error("Failed to initialize WebSocket mock");
  }
};
