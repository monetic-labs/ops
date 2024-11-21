// src/tests/messaging/fixtures/pane-fixture.ts
import { test as base, Locator } from '@playwright/test';
import { PaneState } from '../helpers/utils';

interface PaneFixtures {
  setupPane: {
    paneElement: Locator;
    resizeHandle: Locator;
    closeButton: Locator;
    
    // State management
    getPaneState: () => Promise<PaneState>;
    setOpen: (isOpen: boolean) => Promise<void>;
    addMockContent: () => Promise<{
      element: Locator;
      content: string;
    }>;
    
    // Resize operations
    resize: (deltaX: number, options?: { 
        steps?: number 
      }) => Promise<{
        initialWidth: number;
        finalWidth: number;
      }>;
    
    // Keyboard controls
    triggerShortcut: () => Promise<void>;
    triggerEscape: () => Promise<void>;
    
    // Cleanup
    cleanup: () => Promise<void>;
  };
}

export const test = base.extend<PaneFixtures>({
  setupPane: async ({ page }, use) => {
    // Block WebSocket before navigation
    await page.route('ws://**', route => route.abort());
    
    // Disable TestWrapper keyboard shortcuts
    await page.addInitScript(() => {
      (window as any).__DISABLE_KEYBOARD_SHORTCUTS__ = true;
    });

    // Navigate with both flags
    await page.goto("/test/chat?mode=agent&initialState=closed&disableWs=true");
    
    // Wait for mount and ensure single pane
    await page.waitForSelector('[data-testid="chat-pane-container"]', {
      state: 'attached',
      timeout: 5000
    });

    // Verify single instance
    const paneCount = await page.locator('[data-testid="chat-pane-container"]').count();
    if (paneCount > 1) {
      throw new Error(`Found ${paneCount} pane elements, expected 1`);
    }

    // Initialize core elements
    const paneElement = await page.locator('[data-testid="chat-pane-container"]');
    const resizeHandle = await page.locator('[data-testid="chat-pane-resize-handle"]');
    const closeButton = await page.locator('[data-testid="chat-close-button"]');

    // State management functions
    const getPaneState = async () => {
      return await page.evaluate(() => {
        const pane = document.querySelector('[data-testid="chat-pane-container"]');
        if (!pane) throw new Error("Chat pane not found");
        
        const rect = pane.getBoundingClientRect();
        return {
          isOpen: pane.getAttribute('data-state') === 'open',
          width: rect.width,
          position: { x: rect.x, y: rect.y },
          hasTranslateClass: pane.classList.contains('-translate-x-full')
        };
      });
    };

    const setOpen = async (isOpen: boolean) => {
      await page.evaluate((state) => {
        window.dispatchEvent(
          new CustomEvent("force-chat-state", {
            detail: { isOpen: state }
          })
        );
      }, isOpen);
      
      // Wait for state to stabilize
      await page.waitForSelector(
        `[data-testid="chat-pane-container"][data-state="${isOpen ? 'open' : 'closed'}"]`,
        { timeout: 2000 }
      );
    };

    // Add mock content helper
    const addMockContent = async () => {
        const mockContent = `test-content-${Date.now()}`;
        await page.evaluate((content) => {
          const mockElement = document.createElement('div');
          mockElement.setAttribute('data-testid', 'mock-child');
          mockElement.textContent = content;
          
          const paneBody = document.querySelector('[data-testid="chat-pane-body"]');
          if (!paneBody) throw new Error('Pane body not found');
      
          paneBody.appendChild(mockElement);
        }, mockContent);
  
        return {
          element: page.locator('[data-testid="mock-child"]'),
          content: mockContent
        };
    };

    // Resize helper
    const resize = async (deltaX: number, options?: { steps?: number }) => {
        const handle = await resizeHandle;
        const handleBox = await handle.boundingBox();
        if (!handleBox) throw new Error("Could not get resize handle position");
  
        const initialState = await getPaneState();
        
        await page.mouse.move(handleBox.x, handleBox.y + handleBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          handleBox.x + deltaX,
          handleBox.y + handleBox.height / 2,
          { steps: options?.steps ?? 10 }
        );
        await page.mouse.up();
  
        const finalState = await getPaneState();
        
        return {
          initialWidth: initialState.width,
          finalWidth: finalState.width
        };
    };

    // Keyboard helpers
    const triggerShortcut = async () => {
      await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
    };

    const triggerEscape = async () => {
      await page.keyboard.press("Escape");
    };

    // Cleanup function
    const cleanup = async () => {
        await page.evaluate(() => {
          // Only clean up pane-related state
          window.dispatchEvent(
            new CustomEvent("chat-pane-state", {
              detail: { isOpen: false }
            })
          );
        });
    };

    // Provide fixture
    await use({
      paneElement,
      resizeHandle,
      closeButton,
      getPaneState,
      setOpen,
      addMockContent,
      resize,
      triggerShortcut,
      triggerEscape,
      cleanup
    });

    // Cleanup after use
    await cleanup();
  }
});