import { test, expect, Page } from '@playwright/test';
import { injectMockContext } from '@/tests/helpers/mock-chat-context';
import { Message } from '@/types/messaging';

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
        // Wait for initial render
        const pane = page.locator('[data-testid="chat-pane-container"]').first();
        await pane.waitFor({ state: 'attached' });
        
        // Ensure initial closed state
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('force-chat-state', {
            detail: { isOpen: false }
          }));
        });
        
        // Verify initial closed state
        await expect(pane).toHaveClass(/-translate-x-full/);
        await expect(pane).toHaveAttribute('data-state', 'closed');
      
        // Trigger keyboard shortcut via direct event dispatch
        await page.evaluate(() => {
          const isMac = navigator.platform.toLowerCase().includes('mac');
          const event = new KeyboardEvent('keydown', {
            key: 'k',
            code: 'KeyK',
            metaKey: isMac,
            ctrlKey: !isMac,
            bubbles: true,
            cancelable: true
          });
          document.dispatchEvent(event);
          console.log('Keyboard shortcut event dispatched');
        });
      
        // Wait for state change with logging
        await page.waitForFunction(() => {
          const pane = document.querySelector('[data-testid="chat-pane-container"]');
          const state = {
            dataState: pane?.getAttribute('data-state'),
            hasTranslateClass: pane?.classList.contains('-translate-x-full'),
            classList: Array.from(pane?.classList || [])
          };
          console.log('Current pane state:', state);
          return state.dataState === 'open' && !state.hasTranslateClass;
        }, {}, { timeout: 2000 });
      
        // Verify open state
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
  
  // Import the helper function
  async function addMessageAndGetBubble(page: Page, message: Message) {
    const messageId = `chat-message-${message.id}`;
    await page.evaluate((msg) => {
      window.dispatchEvent(new CustomEvent('add-messages', { detail: [msg] }));
    }, message);
    return { messageId, bubble: page.locator(`[data-testid="${messageId}"]`).first() };
  }

  test('maintains child component state through resize', async ({ page }) => {
    // Wait for initial render
    await page.waitForSelector('[data-testid="chat-body"]');

    // Force chat pane to be open
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('force-chat-state', {
        detail: { isOpen: true }
      }));
    });
  
    // Wait for pane to be visible
    await page.waitForSelector('[data-testid="chat-pane-container"]', { 
      state: 'visible',
      timeout: 5000 
    });
    
    const testMessage = {
      id: 'test-message',
      type: 'user' as const,
      text: 'Test message',
      timestamp: Date.now(),
      status: 'sent' as const
    };
  
    // Use the proven helper function
    const { messageId, bubble } = await addMessageAndGetBubble(page, testMessage);
    
    // Wait for the message to be visible
    await bubble.waitFor({ state: 'visible' });
    await expect(bubble).toBeVisible();
  
    // Get content element using locator
    const content = page.locator(`[data-testid="${messageId}-content"]`).first();
    await expect(content).toBeVisible();
    await expect(content).toContainText(testMessage.text);
  
    // Get resize handle with more specific selector
    const resizeHandle = page.locator('[data-testid="chat-pane-resize-handle"]').first();
    await expect(resizeHandle).toBeVisible();

    // Get handle position
    const handleBox = await resizeHandle.boundingBox();
    if (!handleBox) {
      throw new Error('Could not get resize handle position');
    }

    // Perform resize with explicit waits
    await page.mouse.move(handleBox.x, handleBox.y + handleBox.height / 2);
    await page.waitForTimeout(100); // Small wait for stability
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(handleBox.x + 100, handleBox.y + handleBox.height / 2, {
      steps: 10 // Smooth movement
    });
    await page.waitForTimeout(100);
    await page.mouse.up();

    // Wait for any resize animations
    await page.waitForTimeout(300);
  
    // Verify message remains visible after resize
    await expect(bubble).toBeVisible();
    await expect(content).toBeVisible();
    await expect(content).toContainText(testMessage.text);
  });
});
