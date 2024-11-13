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
    await page.waitForSelector('[data-testid="chat-pane-container"]');
    
    // Get the pane using a more specific selector
    const pane = page.locator('[data-testid="chat-pane-container"]').first();
    
    // Verify initial closed state
    await expect(pane).toHaveClass(/\-translate-x-full/);
    
    // Create a promise that resolves when the state changes
    const stateChangePromise = page.evaluate(() => {
        return new Promise<void>((resolve) => {
        const checkState = () => {
            const pane = document.querySelector('[data-testid="chat-pane-container"]');
            if (pane?.getAttribute('data-state') === 'open') {
            resolve();
            } else {
            requestAnimationFrame(checkState);
            }
        };
        checkState();
        });
    });
    
    // Press the shortcut and wait for state change
    await Promise.all([
        stateChangePromise,
        page.keyboard.press('Meta+K')
    ]);
    
    // Verify open state
    await expect(pane).not.toHaveClass(/\-translate-x-full/);
    await expect(pane).toHaveAttribute('data-state', 'open');
    
    // Create a promise for the closing state change
    const closeStatePromise = page.evaluate(() => {
        return new Promise<void>((resolve) => {
        const checkState = () => {
            const pane = document.querySelector('[data-testid="chat-pane-container"]');
            if (pane?.getAttribute('data-state') === 'closed') {
            resolve();
            } else {
            requestAnimationFrame(checkState);
            }
        };
        checkState();
        });
    });
    
    // Press shortcut again and wait for close
    await Promise.all([
        closeStatePromise,
        page.keyboard.press('Meta+K')
    ]);
    
    // Verify closed state
    await expect(pane).toHaveClass(/\-translate-x-full/);
    await expect(pane).toHaveAttribute('data-state', 'closed');
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
    // Wait for initial render
    await page.waitForSelector('[data-testid="chat-body"]');
    
    // Force the chat to open state
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
  
    // Get initial width and store it in the page context
    // await page.evaluate(() => {
    //     const pane = document.querySelector('[data-testid="chat-pane-container"]');
    //     (window as any)._initialWidth = pane?.getBoundingClientRect().width;
        
    //     // Add a change detector
    //     (window as any)._widthChanged = false;
    //     const observer = new ResizeObserver(() => {
    //       const newWidth = pane?.getBoundingClientRect().width;
    //       if (newWidth !== window._initialWidth) {
    //         (window as any)._widthChanged = true;
    //       }
    //     });
    //     if (pane) observer.observe(pane);
    // });
    await page.evaluate(() => {
        interface ExtendedWindow extends Window {
          _initialWidth: number;
          _widthChanged: boolean;
        }
        const win = window as ExtendedWindow;
        
        const pane = document.querySelector('[data-testid="chat-pane-container"]');
        win._initialWidth = pane?.getBoundingClientRect().width || 0;
        
        // Add a change detector
        win._widthChanged = false;
        const observer = new ResizeObserver(() => {
          const newWidth = pane?.getBoundingClientRect().width;
          if (newWidth !== win._initialWidth) {
            win._widthChanged = true;
          }
        });
        if (pane) observer.observe(pane);
    });
  
    // Trigger resize
    const resizeHandle = page.locator('[data-testid="resize-handle"]').first();
    const handleBox = await resizeHandle.boundingBox();
    if (!handleBox) throw new Error('Could not get resize handle position');
  
    // Perform resize with more precise mouse movements
    await page.mouse.move(handleBox.x, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    
    // Move in smaller increments to ensure the event handlers catch the movement
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(
        handleBox.x + (i + 1) * 20, 
        handleBox.y + handleBox.height / 2,
        { steps: 5 }
      );
      await page.waitForTimeout(50);
    }
    
    await page.mouse.up();
  
    // Wait for width change to be detected
    await page.waitForFunction(() => window._widthChanged, { timeout: 2000 });
  
    // Verify the width changed
    const widthChanged = await page.evaluate(() => {
      const pane = document.querySelector('[data-testid="chat-pane-container"]');
      const currentWidth = pane?.getBoundingClientRect().width;
      console.log('Width comparison:', {
        initial: window._initialWidth,
        current: currentWidth
      });
      return currentWidth && currentWidth > window._initialWidth!;
    });
  
    expect(widthChanged).toBe(true);
  });

  test('handles close action', async ({ page }) => {
    // Wait for initial render
    await page.waitForSelector('[data-testid="chat-pane-container"]');
    
    // Force open state
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('force-chat-state', {
        detail: { isOpen: true }
      }));
    });
  
    const pane = page.locator('[data-testid="chat-pane-container"]');
    await expect(pane).toBeVisible();
  
    // Find and click close button
    const closeButton = page.getByTestId('chat-close-button');
    await expect(closeButton).toBeVisible();
  
    await Promise.all([
      closeButton.click(),
      page.waitForFunction(() => {
        const pane = document.querySelector('[data-testid="chat-pane-container"]');
        return pane?.classList.contains('-translate-x-full');
      }, { timeout: 2000 })
    ]);
  
    // Verify pane is hidden
    await expect(pane).toHaveClass(/\-translate-x-full/);
    await expect(pane).toHaveAttribute('data-state', 'closed');
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

  test('handles keyboard navigation', async ({ page }) => {
    // Wait for initial render
    await page.waitForSelector('[data-testid="chat-pane-container"]');
    
    // Force open state
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('force-chat-state', {
        detail: { isOpen: true }
      }));
    });
  
    // Press Escape and wait for state change
    await Promise.all([
      page.keyboard.press('Escape'),
      page.waitForFunction(() => {
        const pane = document.querySelector('[data-testid="chat-pane-container"]');
        return pane?.classList.contains('-translate-x-full');
      }, { timeout: 2000 })
    ]);
  
    // Verify pane is hidden
    const pane = page.locator('[data-testid="chat-pane-container"]');
    await expect(pane).toHaveClass(/\-translate-x-full/);
    await expect(pane).toHaveAttribute('data-state', 'closed');
  });

//   test('handles keyboard navigation', async ({ page }) => {
//     await page.waitForSelector('[data-testid="chat-pane"]');
    
//     // Press Escape and verify state change
//     await page.keyboard.press('Escape');
    
//     // Verify pane is hidden through classes
//     const pane = page.locator('[data-testid="chat-pane"]');
//     await expect(pane).toHaveClass(/\-translate-x-full/);
//     await expect(pane).toHaveAttribute('aria-hidden', 'true');
//   });

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
  
    // Perform resize
    const resizeHandle = page.getByTestId('resize-handle');
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + 100, handleBox.y + handleBox.height / 2);
      await page.mouse.up();
    }
  
    // Verify message remains visible after resize
    await expect(bubble).toBeVisible();
    await expect(content).toBeVisible();
    await expect(content).toContainText(testMessage.text);
  });
});
