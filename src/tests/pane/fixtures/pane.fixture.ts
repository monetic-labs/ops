import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

type PaneState = {
  isOpen: boolean;
  width: number;
};

export class PaneFixture {
  constructor(private page: Page) {}

  // Core selectors
  getPane() {
    return this.page.getByTestId('chat-pane-container').first();
  }

  getActivePane() {
    // Only use this when we need the active/visible pane
    return this.getPane().filter({
      has: this.page.getByTestId('chat-pane-resize-handle')
    }).first();
  }

  getBackdrop() {
    return this.page.getByTestId('chat-backdrop');
  }

  private getResizeHandle() {
    return this.page.getByTestId('chat-pane-resize-handle');
  }

  async triggerShortcut() {
    const shortcut = process.platform === 'darwin' ? 'Meta+K' : 'Control+K';
    
    await this.page.keyboard.press(shortcut);
    
    await this.page.waitForSelector('[data-testid="chat-pane-container"][data-state="open"]', {
      state: 'attached',
      timeout: 5000
    });

    await this.page.evaluate(() => {
      const panes = Array.from(document.querySelectorAll('[data-testid="chat-pane-container"]'));
      if (panes.length > 1) {
        panes.slice(0, -1).forEach(pane => pane.remove());
      }
    });
  }

  async closeWithEscape() {
    const initialState = await this.getState();
    if (!initialState.isOpen) {
      throw new Error(`Cannot close pane - current state is ${initialState}`);
    }

    await this.page.keyboard.press('Escape');
    await this.page.waitForFunction(() => {
      const pane = document.querySelector('[data-testid="chat-pane-container"]');
      return !pane || pane.getAttribute('data-state') === 'closed';
    }, { timeout: 5000 });
  }

  async waitForTransition() {
    await this.page.waitForTimeout(300);
  }

  async getState() {
    const state = await this.page.evaluate(() => {
      const pane = document.querySelector('[data-testid="chat-pane-container"]');
      if (!pane) return { isOpen: false, width: 0 };
      
      const width = pane.getBoundingClientRect().width;
      const isOpen = pane.getAttribute('data-state') === 'open';
      
      return { isOpen, width };
    });
    
    return state;
  }

  async verifyState(expectedState: 'open' | 'closed') {
    const state = await this.getState();
    const pane = this.page.getByTestId('chat-pane-container').first();

    if (expectedState === 'open') {
      await expect(pane).toHaveAttribute('data-state', 'open');
      await expect(pane).not.toHaveClass(/-translate-x-full/);
      expect(state.isOpen).toBe(true);
    } else {
      try {
        await expect(pane).toHaveAttribute('data-state', 'closed', { timeout: 1000 });
      } catch (e) {
        // Pane not found is acceptable for closed state
      }
      expect(state.isOpen).toBe(false);
    }
  }

  async resize(deltaX: number) {
    const handle = this.getResizeHandle();
    await handle.waitFor({ state: 'visible' });
    
    const initialState = await this.getState();
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error("Could not get resize handle position");

    // Perform resize
    await this.page.mouse.move(handleBox.x, handleBox.y + handleBox.height/2);
    await this.page.mouse.down();
    await this.page.mouse.move(handleBox.x + deltaX, handleBox.y + handleBox.height/2, { steps: 10 });
    await this.page.mouse.up();

    // Wait for transition and get final state
    await this.page.waitForTimeout(300);
    const finalState = await this.getState();
    
    return { initialState, finalState };
  }

  async waitForState(expectedState: 'open' | 'closed', timeout = 5000) {
    const pane = this.getPane();
    
    await Promise.all([
      expect(pane).toHaveAttribute('data-state', expectedState, { timeout }),
      expectedState === 'open' 
        ? expect(pane).not.toHaveClass(/-translate-x-full/, { timeout })
        : expect(pane).toHaveClass(/-translate-x-full/, { timeout })
    ]);
  
    await this.waitForTransition();
    return this.getState();
  }
}
