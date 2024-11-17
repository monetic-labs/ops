import { MockWebSocket } from "./test-types";

// Helper types for events
type WebSocketEventTypes = keyof WebSocketEventMap;
type WebSocketEventListener<K extends WebSocketEventTypes> = 
  (this: WebSocket, ev: WebSocketEventMap[K]) => any;

export const createMockWebSocket = (): MockWebSocket => {
    const messages: any[] = [];
    const eventListeners: Record<string, Function[]> = {
        message: [],
        close: [],
        open: [],
        error: []
    };

    const mockWs: MockWebSocket = {
        readyState: 1, // OPEN
        
        send: (data: string) => {
            const parsed = JSON.parse(data);
            messages.push(parsed);
            
            // Trigger message handlers
            const event = new MessageEvent('message', { data });
            eventListeners.message.forEach(handler => handler(event));
            if (mockWs.onmessage) mockWs.onmessage(event);
        },

        close: () => {
            mockWs.readyState = 3; // CLOSED
            eventListeners.close.forEach(handler => handler());
            if (mockWs.onclose) mockWs.onclose();
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
    };

    // Simulate immediate open
    setTimeout(() => {
        eventListeners.open.forEach(handler => handler());
        if (mockWs.onopen) mockWs.onopen();
    }, 0);

    return mockWs;
};

// Helper function to create typed events
const createWebSocketEvent = <K extends WebSocketEventTypes>(
  type: K, 
  data?: any
): WebSocketEventMap[K] => {
  switch (type) {
    case 'open':
      return new Event('open') as WebSocketEventMap[K];
    case 'close':
      return new CloseEvent('close') as WebSocketEventMap[K];
    case 'message':
      return new MessageEvent('message', {
        data: typeof data === 'string' ? data : JSON.stringify(data)
      }) as WebSocketEventMap[K];
    case 'error':
      return new Event('error') as WebSocketEventMap[K];
    default:
      throw new Error(`Unsupported event type: ${type}`);
  }
};
