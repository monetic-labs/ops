import { Message } from "@/types/messaging";
import { Page, expect } from "@playwright/test";

export interface PaneState {
    isOpen: boolean;
    width: number;
    position: { x: number; y: number };
    hasTranslateClass: boolean;
}

export async function triggerShortcut(page: Page) {
  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
}

export async function setupPane(page: Page) {
    const pane = page.locator('[data-testid="chat-pane-container"]').first();
    await pane.waitFor({ state: "attached" });
    return pane;
}
  
export async function getPaneState(page: Page): Promise<PaneState> {
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
}
  
export async function verifyPaneState(page: Page, expectedState: "open" | "closed", timeout = 5000) {
    const pane = await setupPane(page);
    
    try {
      await Promise.all([
        expect(pane).toHaveAttribute("data-state", expectedState, { timeout }),
        expectedState === "closed" 
          ? expect(pane).toHaveClass(/-translate-x-full/, { timeout })
          : expect(pane).not.toHaveClass(/-translate-x-full/, { timeout })
      ]);
    } catch (error) {
      const currentState = await getPaneState(page);
      console.error('Pane state verification failed:', {
        expected: expectedState,
        actual: currentState
      });
      throw error;
    }
}

// New helper for waiting for transitions
export async function waitForPaneTransition(page: Page): Promise<void> {
    await page.waitForFunction(() => {
      const pane = document.querySelector('[data-testid="chat-pane-container"]');
      return !pane?.classList.contains('transitioning');
    });
    await page.waitForTimeout(100); // Small buffer for any animations
}
  
// Helper for resize operations
export async function resizeChatPane(
    page: Page, 
    deltaX: number,
    options = { steps: 10, timeout: 5000 }
  ): Promise<{ initialWidth: number; finalWidth: number }> {
    const handle = page.locator('[data-testid="chat-pane-resize-handle"]').first();
    await expect(handle).toBeVisible({ timeout: options.timeout });
  
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error("Could not get resize handle position");
  
    const initialState = await getPaneState(page);
    
    // Perform resize with explicit steps
    await page.mouse.move(handleBox.x, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      handleBox.x + deltaX,
      handleBox.y + handleBox.height / 2,
      { steps: options.steps }
    );
    await page.mouse.up();
  
    await waitForPaneTransition(page);
  
    const finalState = await getPaneState(page);
  
    return {
      initialWidth: initialState.width,
      finalWidth: finalState.width
    };
}

// Helper to initialize store with test data
export const initializeStore = async (page: Page, config: {
  mode: 'bot' | 'support',
  messages?: Message[],
  isTyping?: boolean,
  userId?: string
}) => {
  await page.evaluate(({ config }) => {
    const store = window.__MESSAGING_STORE__;
    if (!store) throw new Error('Store not initialized');
    
    store.setState({
      message: {
        ...store.getState().message,
        ...config
      }
    });
  }, { config });

  // Wait for store update if messages are being set
  if (config.messages?.length) {
    await page.waitForFunction(() => {
      const store = window.__MESSAGING_STORE__;
      if (!store) return false;
      return store.getState().message.messages.length > 0;
    });
  }
};