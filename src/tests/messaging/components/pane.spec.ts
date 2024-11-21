// src/tests/messaging/components/pane.spec.ts
import { test } from '../fixtures/pane-fixture';
import { expect } from '@playwright/test';

test.describe('Chat Pane Component', () => {
  test('renders in initial closed state', async ({ setupPane }) => {
    const { paneElement, getPaneState } = setupPane;
    
    // Wait specifically for closed state
    await expect(paneElement).toHaveAttribute('data-state', 'closed', { 
      timeout: 5000 
    });
    
    // Get initial state
    const state = await getPaneState();
    
    // Verify closed state
    expect(state.isOpen).toBe(false);
    await expect(paneElement).toHaveClass(/-translate-x-full/);
  });

  test('responds to keyboard shortcuts', async ({ setupPane }) => {
    const { paneElement, triggerShortcut } = setupPane;
    
    // Initial state verification
    await expect(paneElement).toHaveAttribute('data-state', 'closed');
    
    // Toggle open with shortcut
    await triggerShortcut();
    await expect(paneElement).toHaveAttribute('data-state', 'open');
    await expect(paneElement).not.toHaveClass(/-translate-x-full/);
    
    // Toggle closed with shortcut
    await triggerShortcut();
    await expect(paneElement).toHaveAttribute('data-state', 'closed');
    await expect(paneElement).toHaveClass(/-translate-x-full/);
  });

  test('handles resize operations', async ({ setupPane }) => {
    const { setOpen, resize, getPaneState } = setupPane;
    
    // Open pane first
    await setOpen(true);
    
    // Perform resize
    const { initialWidth, finalWidth } = await resize(100);
    
    // Verify width changed
    expect(finalWidth).toBeGreaterThan(initialWidth);
    
    // Verify pane remained open during resize
    const finalState = await getPaneState();
    expect(finalState.isOpen).toBe(true);
  });

  test('closes with escape key', async ({ setupPane }) => {
    const { setOpen, paneElement, triggerEscape } = setupPane;
    
    // Open pane
    await setOpen(true);
    await expect(paneElement).toHaveAttribute('data-state', 'open');
    
    // Press escape
    await triggerEscape();
    
    // Verify closed state
    await expect(paneElement).toHaveAttribute('data-state', 'closed');
    await expect(paneElement).toHaveClass(/-translate-x-full/);
  });

  test('maintains proper accessibility attributes', async ({ setupPane }) => {
    const { paneElement, setOpen } = setupPane;
    
    // Check closed state attributes
    await expect(paneElement).toHaveAttribute('aria-hidden', 'true');
    
    // Open and check attributes
    await setOpen(true);
    await expect(paneElement).toHaveAttribute('aria-modal', 'true');
    await expect(paneElement).toHaveAttribute('role', 'dialog');
    await expect(paneElement).not.toHaveAttribute('aria-hidden');
  });
});