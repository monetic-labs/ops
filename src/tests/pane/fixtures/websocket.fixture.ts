import { createMockWebSocket, createWebSocketEvent } from '@/tests/helpers/mock-services';
import { MockWebSocket } from '@/tests/pane/fixtures/fixture-types';
import { TestMessage } from '@/tests/helpers/test-types';
import { test as base, Page, TestFixture } from '@playwright/test';
import { IntegrationContextType, TestContextFixtures } from './fixture-types';

type WebSocketFixtures = {
  minimalWebSocket: MockWebSocket;
  messagingWebSocket: MockWebSocket;
  integrationWebSocket: MockWebSocket;
};

type WebSocketFixturesDeps = {
  page: Page;
  integrationContext?: IntegrationContextType;
};
// Basic WebSocket for Container/Header tests
class MinimalWebSocketMock implements MockWebSocket {
  private mockWs: MockWebSocket;
  private _onopen: (() => void) | undefined;
  private _onclose: (() => void) | undefined;
  private _onmessage: ((data: any) => void) | undefined;
  private _onerror: ((error: any) => void) | undefined;

  constructor() {
    this.mockWs = createMockWebSocket();

    this.addEventListener = this.mockWs.addEventListener.bind(this.mockWs);
    this.removeEventListener = this.mockWs.removeEventListener.bind(this.mockWs);
    this.getAllMessages = this.mockWs.getAllMessages.bind(this.mockWs);
  }


  get onopen() { return this._onopen; }
  set onopen(handler) { 
    this._onopen = handler;
    this.mockWs.onopen = handler;
  }
  get onclose() { return this._onclose; }
  set onclose(handler) { 
    this._onclose = handler;
    this.mockWs.onclose = handler;
  }
  get onmessage() { return this._onmessage; }
  set onmessage(handler) { 
    this._onmessage = handler;
    this.mockWs.onmessage = handler;
  }

  get onerror() { return this._onerror; }
  set onerror(handler) { 
    this._onerror = handler;
    this.mockWs.onerror = handler;
  }

  get readyState() { return this.mockWs.readyState; }

  send(data: string) { this.mockWs.send(data); }
  close() { this.mockWs.close(); }
  addEventListener: (event: string, handler: Function) => void;
  removeEventListener: (event: string, handler: Function) => void;
  getAllMessages: () => any[];
}

// Enhanced WebSocket for Message/Footer tests
class MessagingWebSocketMock implements MockWebSocket {
  onopen: (() => void) | undefined = undefined;
  onclose: (() => void) | undefined = undefined;
  onmessage: ((data: any) => void) | undefined = undefined;
  onerror: ((error: any) => void) | undefined = undefined;
  readyState: number = WebSocket.CONNECTING;
  private mockWs: MockWebSocket;
  protected messages: TestMessage[] = [];

  constructor() {
    this.mockWs = createMockWebSocket();
    this.mockWs.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messages.push(message);
      if (this.onmessage) this.onmessage(event);
    };
  }
  
  send(data: string) {
    try {
      const message = JSON.parse(data);
      this.mockWs.send(data);
    } catch (error) {
      if (this.onerror) this.onerror(createWebSocketEvent('error'));
    }
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }

  addEventListener(event: string, handler: Function) {}
  removeEventListener(event: string, handler: Function) {}
  getAllMessages() { return this.messages; }
}

// Full Integration WebSocket with context awareness
class IntegrationWebSocketMock extends MessagingWebSocketMock {
  protected chatContext: any;

  constructor(chatContext?: any) {
    super();
    this.chatContext = chatContext;
  }

  send(data: string) {
    try {
      const message = JSON.parse(data);
      if (this.chatContext?.mode === 'support') {
        this.handleSupportMessage(message);
      } else {
        this.handleAgentMessage(message);
      }
      super.send(data);
    } catch (error) {
      if (this.onerror) this.onerror(createWebSocketEvent('error'));
    }
  }

  private handleSupportMessage(message: any) {
    const response = {
      id: `support-${Date.now()}`,
      type: 'support',
      text: `Support response to: ${message.text}`,
      timestamp: Date.now(),
      status: 'sent',
      agentId: 'support-agent-1'
    };
    if (this.onmessage) {
      this.onmessage(createWebSocketEvent('message', response));
    }
  }

  private handleAgentMessage(message: any) {
    const response = {
      id: `agent-${Date.now()}`,
      type: 'bot',
      text: `Agent response to: ${message.text}`,
      timestamp: Date.now(),
      status: 'sent',
      source: 'agent'
    };
    if (this.onmessage) {
      this.onmessage(createWebSocketEvent('message', response));
    }
  }
}

export const test = base
  .extend<WebSocketFixtures, WebSocketFixturesDeps>({
    minimalWebSocket: async ({ 
      page 
    }, 
    use
    ) => {
      await page.addInitScript(() => {
        window.WebSocket = MinimalWebSocketMock as any;
      });
      await use(new MinimalWebSocketMock());
    },
    
    messagingWebSocket: async ({ 
      page 
    }, 
    use
    ) => {
      await page.addInitScript(() => {
        window.WebSocket = MessagingWebSocketMock as any;
      });
      await use(new MessagingWebSocketMock());
    },

    integrationWebSocket: [async ({ 
      page,
      integrationContext 
    }, 
    use
    ) => {
      await page.addInitScript(() => {
        window.WebSocket = class extends IntegrationWebSocketMock {
          constructor() {
            super(window.__MOCK_CHAT_CONTEXT__);
          }
        } as any;
      });
      await use(new IntegrationWebSocketMock(integrationContext));
    }, { auto: false }] // Mark as not auto-fixture
  });