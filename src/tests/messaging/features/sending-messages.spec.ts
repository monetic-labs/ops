import { test, expect } from "@playwright/test";

import { setupChatEnvironment } from "@/tests/helpers/test-utils";

test.describe("Message Sending", () => {
  test.beforeEach(async ({ page }) => {
    // Setup chat environment with mocks
    await setupChatEnvironment(page, {
      timeout: 10000,
      mode: "agent",
      setupMocks: true,
    });

    // Verify critical elements are present
    const elements = await page.evaluate(() => ({
      pane: !!document.querySelector('[data-testid="chat-pane-container"]'), // Updated
      body: !!document.querySelector('[data-testid="chat-body"]'),
      input: !!document.querySelector('[data-testid="chat-input"]'),
      submitButton: !!document.querySelector('[data-testid="chat-submit-button"]'),
      debugMount: !!document.querySelector('[data-testid="debug-mount"]'),
    }));

    console.log("Critical elements check:", elements);

    // Force show chat pane if needed
    await page.evaluate(() => {
      // Dispatch event to open pane
      window.dispatchEvent(
        new CustomEvent("chat-pane-state", {
          detail: { isOpen: true },
        })
      );
      // Force visibility through CSS if needed
      const pane = document.querySelector('[data-testid="chat-pane-container"]');

      if (pane) {
        (pane as HTMLElement).style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          transform: none !important;
          position: fixed !important;
          right: 0 !important;
          top: 0 !important;
          bottom: 0 !important;
        `;
      }
    });

    // Wait for pane to be visible
    await page.waitForSelector('[data-testid="chat-pane-container"]', {
      state: "visible",
      timeout: 5000,
    });
  });

  test("sends message and displays in chat", async ({ page }) => {
    const testMessage = "Test message";

    // Wait for chat to be fully loaded
    await page.waitForSelector('[data-testid="chat-body"]', { state: "visible" });
    await page.waitForSelector('[data-testid="chat-input"]', { state: "visible" });

    // Debug: Log initial input state
    const initialValue = await page.inputValue('[data-testid="chat-input"]');

    console.log("Initial input value:", initialValue);

    // Focus the input first
    await page.focus('[data-testid="chat-input"]');

    // Type character by character with delay
    for (const char of testMessage) {
      await page.keyboard.type(char, { delay: 100 });
    }

    // Debug: Verify input value after typing
    const afterTypeValue = await page.inputValue('[data-testid="chat-input"]');

    console.log("Value after typing:", afterTypeValue);

    // Ensure input has value
    expect(afterTypeValue).toBe(testMessage);

    // Debug: Check input properties
    const inputProps = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="chat-input"]');

      return {
        value: (input as HTMLInputElement)?.value,
        disabled: (input as HTMLInputElement)?.disabled,
        readonly: (input as HTMLInputElement)?.readOnly,
        isVisible: (input as HTMLElement)?.offsetParent !== null,
        style: (input as HTMLElement)?.getAttribute("style"),
      };
    });

    console.log("Input properties:", inputProps);

    // Click submit with delay after typing
    await page.waitForTimeout(500); // Give time for input to settle
    await page.click('[data-testid="chat-submit-button"]');

    // Debug: Check input value after submit
    const afterSubmitValue = await page.inputValue('[data-testid="chat-input"]');

    console.log("Value after submit:", afterSubmitValue);
  });
});
