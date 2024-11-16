import { test, expect } from '@playwright/test';
import { sendMessage, injectTestUtils, sendAndVerifyMessage, setupChatEnvironment } from '../../helpers/test-utils';

test.describe('Message Sending', () => {
  test.beforeEach(async ({ page }) => {
    // Add debugging
    page.on('console', msg => console.log('Browser:', msg.text()));

    // Mock WebSocket before navigation
    await page.addInitScript(() => {
        class MockWebSocket {
            onopen: ((event: Event) => void) | null = null;
            onclose: ((event: Event) => void) | null = null;
            onmessage: ((event: MessageEvent) => void) | null = null;
            onerror: ((event: Event) => void) | null = null;
            private eventListeners: { [key: string]: Function[] } = {};
            private connected = false;

            constructor() {
              setTimeout(() => {
                if (!this.connected) {
                    this.connected = true;
                    if (this.onopen) {
                        this.onopen(new Event('open'));
                    }
                    
                    if (this.onmessage) {
                        this.onmessage(new MessageEvent('message', {
                            data: JSON.stringify({
                                type: 'system',
                                id: `sys-${Date.now()}`,
                                text: 'Connected to WebSocket server',
                                timestamp: Date.now(),
                                status: 'sent'
                            })
                        }));
                      }
                  }
              }, 100);
            }

            send(data: string) {
              // Mock message echo for testing
              setTimeout(() => {
                  if (this.onmessage) {
                      const message = JSON.parse(data);
                      this.onmessage(new MessageEvent('message', {
                          data: JSON.stringify({
                              ...message,
                              id: `msg-${Date.now()}`,
                              timestamp: Date.now(),
                              status: 'sent'
                          })
                      }));
                  }
              }, 100);
            }

            addEventListener(event: string, callback: Function) {
                if (!this.eventListeners[event]) {
                    this.eventListeners[event] = [];
                }
                this.eventListeners[event].push(callback);
            }

            removeEventListener(event: string, callback: Function) {
                if (this.eventListeners[event]) {
                    this.eventListeners[event] = this.eventListeners[event].filter(
                        cb => cb !== callback
                    );
                }
            }

            dispatchEvent(event: Event) {
                const listeners = this.eventListeners[event.type] || [];
                listeners.forEach(callback => callback(event));
                return true;
            }
            close() {}
        }

        // @ts-ignore
        window.WebSocket = MockWebSocket;
    });

    // Navigate to chat page and wait for network idle
    await page.goto('/test/chat?mode=agent', {
        waitUntil: 'networkidle'
    });

    // Inject test utilities first
    await injectTestUtils(page);

            // Setup context and force chat open
            await page.evaluate(() => {
              if (window.__TEST_UTILS__) {
                  window.__MOCK_CHAT_CONTEXT__ = window.__TEST_UTILS__.createEmptyAgentContext();
              }
          });
  
          // Wait for WebSocket connection message
          await page.waitForFunction(() => {
              const messages = document.querySelectorAll('[data-testid^="message-"]');
              return Array.from(messages).some(msg => 
                  msg.textContent?.includes('Connected to WebSocket server')
              );
          }, { timeout: 5000 });
  
          // Force chat open after WebSocket is connected
          await page.evaluate(() => {
              window.dispatchEvent(new CustomEvent('force-chat-state', {
                  detail: { isOpen: true }
              }));
          });
  
          // Wait for chat interface to be fully initialized
          await page.waitForFunction(() => {
              const chatBody = document.querySelector('[data-testid="chat-body"]');
              const chatInput = document.querySelector('[data-testid="chat-input"]');
              const sendButton = document.querySelector('[data-testid="send-button"]');
              
              // Log current state
              console.log('Interface check:', {
                  hasBody: !!chatBody,
                  hasInput: !!chatInput,
                  hasButton: !!sendButton,
                  inputCount: document.querySelectorAll('[data-testid="chat-input"]').length,
                  buttonCount: document.querySelectorAll('[data-testid="send-button"]').length
              });
  
              return chatBody && chatInput && sendButton && 
                     document.querySelectorAll('[data-testid="chat-input"]').length === 1 &&
                     document.querySelectorAll('[data-testid="send-button"]').length === 1;
        }, { timeout: 5000, polling: 100 }); // Poll every 100ms
    });

    test('sends message and displays in chat', async ({ page }) => {
      // Setup chat environment with increased timeout
      const { chatBody, input, sendButton } = await setupChatEnvironment(page, {
        timeout: 10000
      });
  
      // Clear any existing non-system messages
      await page.evaluate(() => {
        document.querySelectorAll('[data-testid^="message-"]:not([data-testid^="message-sys-"])')
          .forEach(msg => msg.remove());
      });
  
      // Send and verify message
      const testMessage = 'Test message';
      await input.fill(testMessage);
      await expect(input).toHaveValue(testMessage);
  
      // Click send and wait for message to appear
      await sendButton.click();
  
      // Use Locator instead of ElementHandle for better assertions
      const messageLocator = page.locator(`[data-testid^="message-"]:has-text("${testMessage}")`).first();
  
      // Wait for message to be visible
      await expect(messageLocator).toBeVisible({ timeout: 10000 });
  
      // Verify message content and styling
      await expect(messageLocator).toContainText(testMessage);
      await expect(messageLocator).toHaveClass(/.*message-user.*/);

      // Optional: Debug log the final state
      const finalState = await page.evaluate(() => ({
        messages: Array.from(document.querySelectorAll('[data-testid^="message-"]')).map(el => ({
          id: el.getAttribute('data-testid'),
          text: el.textContent,
          classes: el.className
        }))
      }));
      console.log('Final state:', finalState);
    });
});
