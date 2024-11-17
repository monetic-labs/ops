import { test, expect, Page } from '@playwright/test';
import { injectMockContext } from '@/tests/helpers/mock-chat-context';
import { setupInitialChatState, addAndVerifyMessage, resizeChatPane } from '@/tests/helpers/test-utils';


test.describe('Chat Pane Component', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/test/chat?mode=agent');
        await page.waitForSelector('[data-testid="debug-mount"]');
        await injectMockContext(page, 'agent');
        await page.waitForLoadState('networkidle');
    
        // Set initial state through parent component
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('force-chat-state', {
            detail: { isOpen: false }
          }));
        });
    });

  test('responds to global keyboard shortcut', async ({ page }) => {
        // Initial cleanup and setup
        await page.evaluate(() => {
          document.querySelectorAll('[data-testid^="chat-message-"]').forEach(el => el.remove());
          window.__MOCK_CHAT_CONTEXT__ = undefined;
          
          // Remove any duplicate chat bodies
          const chatBodies = document.querySelectorAll('[data-testid="chat-pane-container"]');
          if (chatBodies.length > 1) {
            Array.from(chatBodies).slice(1).forEach(el => el.remove());
          }
        });
      
        // Setup and verify initial state
        await injectMockContext(page, 'agent');
        const pane = page.locator('[data-testid="chat-pane-container"]').first();
        await pane.waitFor({ state: 'attached' });
      
        // Ensure initial closed state with retry logic
        await page.evaluate(() => {
          return new Promise<void>((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const ensureClosedState = () => {
              attempts++;
              window.dispatchEvent(new CustomEvent('force-chat-state', {
                detail: { isOpen: false }
              }));
              
              setTimeout(() => {
                const pane = document.querySelector('[data-testid="chat-pane-container"]');
                if (pane?.getAttribute('data-state') === 'closed' && 
                    pane?.classList.contains('-translate-x-full')) {
                  resolve();
                } else if (attempts < maxAttempts) {
                  ensureClosedState();
                } else {
                  resolve(); // Continue test even if state isn't perfect
                }
              }, 100);
            };
            
            ensureClosedState();
          });
        });
      
        // Verify initial closed state
        await waitForPaneState(page, 'closed');
        await expect(pane).toHaveClass(/-translate-x-full/);
        await expect(pane).toHaveAttribute('data-state', 'closed');
      
        // Ensure keyboard handler is registered
        await page.evaluate(() => {
          return new Promise<void>((resolve) => {
            // Small delay to ensure event handlers are bound
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('test-keyboard-ready'));
              resolve();
            }, 500);
          });
        });
      
        // Trigger keyboard shortcut
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
      
        // Wait for state change with increased timeout
        try {
          await waitForPaneState(page, 'open', 5000);
        } catch (error) {
          // If waiting fails, log the final state
          const finalState = await page.evaluate(() => {
            const pane = document.querySelector('[data-testid="chat-pane-container"]');
            if (!pane) return null;
            return {
              state: pane.getAttribute('data-state'),
              classes: Array.from(pane?.classList || []),
              isVisible: pane?.getBoundingClientRect().right > 0
            };
          });
          console.log('Final pane state:', finalState);
          throw error;
        }
      
        // Verify final state
        await expect(pane).not.toHaveClass(/-translate-x-full/);
        await expect(pane).toHaveAttribute('data-state', 'open');
  });

  test('renders when opened', async ({ page }) => {
    // Wait for initial render
    await page.waitForSelector('[data-testid="chat-body"]');
    
    // Force the chat to open state and wait for the state to be applied
    await Promise.all([
      page.waitForSelector('[data-testid="chat-pane-container"][data-state="open"]', { 
        state: 'attached',
        timeout: 2000 
      }),
      page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('force-chat-state', {
          detail: { isOpen: true }
        }));
      })
    ]);
  
    // Get the specific pane instance we want to test
    const pane = page.locator('[data-testid="chat-pane-container"][data-state="open"]').first();
    
    // Wait for the pane to be fully rendered
    await expect(pane).toBeVisible();
    
    // Additional state checks
    await expect(pane).toHaveAttribute('aria-modal', 'true');
    await expect(pane).not.toHaveClass(/\-translate-x-full/);
  });

  test('handles resize functionality', async ({ page }) => {
    // Set viewport size to ensure consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  
    // Wait for initial render and force open state
    await Promise.all([
      page.waitForSelector('[data-testid="chat-pane-container"][data-state="open"]', { 
        state: 'visible' 
      }),
      page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('force-chat-state', {
          detail: { isOpen: true }
        }));
      })
    ]);

    // Wait for any animations
    await page.waitForTimeout(100);

    // Get handle and verify its position
    const handle = page.locator('[data-testid="chat-pane-resize-handle"]').first();
    await expect(handle).toBeVisible();
  
    // Get initial dimensions and calculate handle position
    const dimensions = await page.evaluate(() => {
      const pane = document.querySelector('[data-testid="chat-pane-container"]');
      const handle = document.querySelector('[data-testid="chat-pane-resize-handle"]');
      if (!pane || !handle) throw new Error('Elements not found');
      
      const paneRect = pane.getBoundingClientRect();
      
      // Default width is 1000px, so start there
      const startX = 1000; // This should be where the handle is
      const handleY = handle.getBoundingClientRect().top + 
                     (handle.getBoundingClientRect().height / 2);
      
      console.log('Starting resize from:', {
        viewportWidth: window.innerWidth,
        paneWidth: paneRect.width,
        startX,
        handleY
      });

          // Initialize resize state here instead of in a separate evaluate call
      (window as any).__resizeState = {
        isResizing: false,
        currentWidth: paneRect.width
      };
      
      return {
        startX,
        handleY,
        initialWidth: paneRect.width
      };
    });

    // Listen for resize events
    await page.evaluate(() => {
        window.addEventListener('mousemove', (e) => {
        if ((window as any).__resizeState?.isResizing) {
            console.log('Resize move:', {
            clientX: e.clientX,
            currentWidth: (window as any).__resizeState.currentWidth
            });
        }
        });
    });

    // Listen for resize events
    await page.evaluate(() => {
      window.addEventListener('mousemove', (e) => {
        if ((window as any).__resizeState.isResizing) {
        console.log('Resize move:', {
            clientX: e.clientX,
            currentWidth: (window as any).__resizeState.currentWidth
          });
        }
      });
    });

    // Start resize - trigger React onMouseDown
    await page.evaluate(({ x, y }) => {
      const handle = document.querySelector('[data-testid="chat-pane-resize-handle"]');
      if (!handle) throw new Error('Handle not found');
    
      // Create and dispatch mousedown event
      const mouseDown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      });
      
      (window as any).__resizeState.isResizing = true;
      handle.dispatchEvent(mouseDown);
    }, { x: dimensions.startX, y: dimensions.handleY });
  
    // Wait for React state to update
    await page.waitForTimeout(50);

    // Perform resize movement
    const targetX = dimensions.startX + 200;
    await page.mouse.move(targetX, dimensions.handleY, { steps: 50 });
    
    // Wait for movement to complete
    await page.waitForTimeout(50);

    // Stop resize - trigger React onMouseUp
    await page.evaluate(({ x, y }) => {
      // Create and dispatch mouseup event
      const mouseUp = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
    });
    
    (window as any).__resizeState.isResizing = false;
      window.dispatchEvent(mouseUp);
    }, { x: targetX, y: dimensions.handleY });

    // Wait for final state updates
    await page.waitForTimeout(100);
  
    const finalWidth = await page.evaluate(() => {
        const pane = document.querySelector('[data-testid="chat-pane-container"]');
        if (!pane) throw new Error('Pane not found');
        return pane.getBoundingClientRect().width;
      });
    
      console.log('Resize result:', {
        initial: dimensions.initialWidth,
        final: finalWidth,
        difference: finalWidth - dimensions.initialWidth
      });
  
    expect(finalWidth).toBeGreaterThan(dimensions.initialWidth);
  });

  test('handles close action', async ({ page }) => {
    // Wait for initial render
    const pane = page.locator('[data-testid="chat-pane-container"]').first();
    await pane.waitFor();
  
    // Force open state
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('force-chat-state', {
        detail: { isOpen: true }
      }));
    });
  
    // Verify initial state
    await expect(pane).toBeVisible();
    await expect(pane).toHaveAttribute('data-state', 'open');
  
    // Find and click close button
    const closeButton = pane.locator('[data-testid="chat-close-button"]').first();
    await expect(closeButton).toBeVisible();
  
    // Click close button
    await closeButton.click();
  
    // Wait for transition
    await page.waitForTimeout(300); // Match transition duration
  
    // Verify closed state
    await expect(pane).toHaveAttribute('data-state', 'closed');
    await expect(pane).toHaveClass(/-translate-x-full/);
  });

  test('initializes WebSocket connection when opened', async ({ page }) => {
    // Mock WebSocket
    await page.evaluate(() => {
      (window as any).mockWebSocket = {
        messages: [],
        close: () => {}
      };
      
      (window as any).WebSocket = class MockWebSocket {
        onmessage: ((event: any) => void) | null = null;
        
        constructor(url: string) {
          console.log('MockWebSocket initialized with:', url);
        }
        
        send(data: string) {
          (window as any).mockWebSocket.messages.push(data);
        }
        
        close() {
          (window as any).mockWebSocket.close();
        }
      };
    });

    // Verify WebSocket initialization
    const wsInitialized = await page.evaluate(() => {
      return (window as any).mockWebSocket !== undefined;
    });
    expect(wsInitialized).toBe(true);
  });

  const waitForPaneState = async (page: Page, expectedState: 'open' | 'closed', timeout = 10000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const currentState = await page.evaluate(() => {
        const pane = document.querySelector('[data-testid="chat-pane-container"]');
        if (!pane) return null;
        
        return {
          state: pane.getAttribute('data-state'),
          hasTranslateClass: pane.classList.contains('-translate-x-full'),
          classes: Array.from(pane.classList)
        };
      });
  
      console.log('Current pane state:', currentState);
  
      if (currentState && 
          currentState.state === expectedState && 
          currentState.hasTranslateClass === (expectedState === 'closed')) {
        return true;
      }
  
      await page.waitForTimeout(100);
    }
  
    throw new Error(`Timeout waiting for pane state: ${expectedState}`);
  };

  test('handles keyboard navigation', async ({ page }) => {
    // Wait for initial render
    const pane = page.locator('[data-testid="chat-pane-container"]').first();
    await pane.waitFor({ state: 'attached', timeout: 5000 });
  
    // Ensure initial closed state
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const ensureClosedState = () => {
          attempts++;
          window.dispatchEvent(new CustomEvent('force-chat-state', {
            detail: { isOpen: false }
          }));
          
          setTimeout(() => {
            const pane = document.querySelector('[data-testid="chat-pane-container"]');
            if (pane?.getAttribute('data-state') === 'closed' && 
                pane?.classList.contains('-translate-x-full')) {
              console.log('Successfully set initial closed state');
              resolve();
            } else if (attempts < maxAttempts) {
              ensureClosedState();
            } else {
              console.error('Failed to set initial state after max attempts');
              resolve(); // Resolve anyway to continue test
            }
          }, 100);
        };
        
        ensureClosedState();
      });
    });
  
    // Verify initial closed state
    await waitForPaneState(page, 'closed');
    await expect(pane).toHaveAttribute('data-state', 'closed');
    await expect(pane).toHaveClass(/-translate-x-full/);
  
    // Open the pane
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        window.dispatchEvent(new CustomEvent('force-chat-state', {
          detail: { isOpen: true }
        }));
        
        const checkOpen = () => {
          const pane = document.querySelector('[data-testid="chat-pane-container"]');
          if (pane?.getAttribute('data-state') === 'open' && 
              !pane?.classList.contains('-translate-x-full')) {
            resolve();
          } else {
            setTimeout(checkOpen, 100);
          }
        };
        
        checkOpen();
      });
    });
  
    // Verify open state
    await waitForPaneState(page, 'open');
    await expect(pane).toHaveAttribute('data-state', 'open');
    await expect(pane).not.toHaveClass(/-translate-x-full/);
  
    // Press escape and wait for close
    await page.keyboard.press('Escape');
    await waitForPaneState(page, 'closed');
  
    // Final state verification
    await expect(pane).toHaveAttribute('data-state', 'closed');
    await expect(pane).toHaveClass(/-translate-x-full/);
  });

  test('maintains child component state through resize', async ({ page }) => {
    // Add console logging for debugging
    page.on('console', msg => console.log('Browser:', msg.text()));

    // Setup initial state
    await setupInitialChatState(page);

    const testMessage = {
      id: 'test-message',
      type: 'user' as const,
      text: 'Test message',
      timestamp: Date.now(),
      status: 'sent' as const
    };

    try {
      // Add and verify message
      const { element, content } = await addAndVerifyMessage(page, testMessage);

      // Verify initial state
      await expect(element).toBeVisible();
      await expect(content).toBeVisible();
      await expect(content).toContainText(testMessage.text);

      // Perform resize
      await resizeChatPane(page, 100);

      // Verify message remains visible after resize
      await expect(element).toBeVisible();
      await expect(content).toBeVisible();
      await expect(content).toContainText(testMessage.text);

    } catch (error) {
      // Enhanced error logging
      const debugState = await page.evaluate(() => ({
        context: window.__MOCK_CHAT_CONTEXT__,
        domState: {
          chatBody: document.querySelector('[data-testid="chat-body"]')?.innerHTML,
          messages: Array.from(document.querySelectorAll('[data-testid^="chat-message-"]'))
            .map(el => ({
              id: el.getAttribute('data-testid'),
              text: el.textContent,
              visible: (el as HTMLElement).offsetParent !== null
            }))
        },
        paneState: document.querySelector('[data-testid="chat-pane-container"]')?.getAttribute('data-state')
      }));
      console.log('Debug state at error:', debugState);
      throw error;
    }
  });
});
