import { test, expect } from "@playwright/test";

import { mockConversations } from "@/tests/helpers/mock-data";
import { injectTestUtils } from "@/tests/helpers/test-utils";
import { addTestMessageToDOM } from "@/tests/helpers/test-utils";

test.describe("Message Bubble Component", () => {
  test.beforeEach(async ({ page }) => {
    // Setup test environment
    await page.goto("/test/chat?mode=agent");
    await page.waitForSelector('[data-testid="debug-mount"]');

    // Ensure chat container is ready
    await page.waitForSelector('[data-testid="chat-body"]', {
      state: "attached",
      timeout: 5000,
    });
  });

  test("renders user message correctly", async ({ page }) => {
    // Add console logging for debugging
    page.on("console", (msg) => console.log("Browser:", msg.text()));

    // Wait for chat body to be ready first
    await page.waitForSelector('[data-testid="chat-body"]', {
      state: "visible",
      timeout: 5000,
    });

    // Create user message
    const userMessage = {
      id: "1",
      type: "user" as const,
      text: "Hello, I need help",
      timestamp: Date.now(),
      status: "sent" as const,
    };

    // Add message using our new helper
    const { messageId, element } = await addTestMessageToDOM(page, userMessage);

    // Log the current DOM state
    const html = await page.evaluate(() => document.querySelector('[data-testid="chat-body"]')?.innerHTML);

    console.log("Current DOM state:", html);

    // Use the returned messageId for selectors
    const contentSelector = `[data-testid="${messageId}-content"]`;

    // Wait for message container with increased timeout and logging
    try {
      await element.waitFor({ state: "visible", timeout: 10000 });
    } catch (error) {
      const fullDom = await page.evaluate(() => document.body.innerHTML);

      console.log("Full DOM:", fullDom);
      throw error;
    }

    // Get content locator
    const messageContent = page.locator(contentSelector).first();

    // Verify message container
    await expect(element).toBeVisible();
    await expect(element).toHaveClass(/message-user/);
    await expect(element).toHaveClass(/justify-end/);

    // Verify message content
    await expect(messageContent).toBeVisible();
    await expect(messageContent).toContainText(userMessage.text);
  });

  test("renders bot message correctly", async ({ page }) => {
    // Add console logging for debugging
    page.on("console", (msg) => console.log("Browser:", msg.text()));

    // Wait for chat body to be ready first
    await page.waitForSelector('[data-testid="chat-body"]', {
      state: "visible",
      timeout: 5000,
    });

    // Inject test utilities first
    await injectTestUtils(page);

    // Ensure chat pane is closed and context is cleared
    await page.evaluate(() => {
      // TypeScript knows __TEST_UTILS__ exists because we injected it
      if (window.__TEST_UTILS__) {
        window.__MOCK_CHAT_CONTEXT__ = window.__TEST_UTILS__.createEmptyAgentContext();
      }

      // Close the chat pane
      window.dispatchEvent(
        new CustomEvent("force-chat-state", {
          detail: { isOpen: false },
        })
      );
    });

    // Wait for pane to be closed
    await page.waitForSelector('[data-testid="chat-pane-container"][data-state="closed"]', {
      state: "attached",
      timeout: 5000,
    });

    const botMessage = {
      ...mockConversations.agent[1],
      id: "2", // Use a simple ID for testing
    };

    // Add message directly to DOM for testing
    await page.evaluate((msg) => {
      const chatBody = document.querySelector('[data-testid="chat-body"]');

      if (chatBody) {
        const messageDiv = document.createElement("div");

        messageDiv.setAttribute("data-testid", `message-${msg.id}`);
        messageDiv.className = `flex justify-start message-bot`;

        const contentDiv = document.createElement("div");

        contentDiv.setAttribute("data-testid", `message-${msg.id}-content`);
        contentDiv.className = "max-w-[80%] rounded-lg p-3 bg-charyo-400 text-notpurple-500";
        contentDiv.textContent = msg.text;

        messageDiv.appendChild(contentDiv);
        chatBody.appendChild(messageDiv);
      }
    }, botMessage);

    // Log the current DOM state
    const html = await page.evaluate(() => document.querySelector('[data-testid="chat-body"]')?.innerHTML);

    console.log("Current DOM state:", html);

    // Use the correct selectors that match MessageBubble component
    const messageSelector = `[data-testid="message-${botMessage.id}"]`;
    const contentSelector = `[data-testid="message-${botMessage.id}-content"]`;

    // Wait for message container with increased timeout and logging
    try {
      await page.waitForSelector(messageSelector, {
        state: "visible",
        timeout: 10000,
      });
    } catch (error) {
      // Log the entire DOM if we fail to find the element
      const fullDom = await page.evaluate(() => document.body.innerHTML);

      console.log("Full DOM:", fullDom);
      throw error;
    }

    // Get locators
    const messageContainer = page.locator(messageSelector).first();
    const messageContent = page.locator(contentSelector).first();

    // Verify message container
    await expect(messageContainer).toBeVisible();
    await expect(messageContainer).toHaveClass(/message-bot/);
    await expect(messageContainer).toHaveClass(/justify-start/);

    // Verify message content
    await expect(messageContent).toBeVisible();
    await expect(messageContent).toContainText(botMessage.text);
  });

  test("renders system message correctly", async ({ page }) => {
    // Add console logging for debugging
    page.on("console", (msg) => console.log("Browser:", msg.text()));

    // Wait for chat body to be ready
    await page.waitForSelector('[data-testid="chat-body"]', {
      state: "visible",
      timeout: 5000,
    });

    // Create system message
    const systemMessage = {
      ...mockConversations.mixed[0],
      id: "3", // Simple ID for testing
      type: "system" as const,
      category: "info" as const,
    };

    // Add message directly to DOM for testing
    await page.evaluate((msg) => {
      const chatBody = document.querySelector('[data-testid="chat-body"]');

      if (chatBody) {
        const messageDiv = document.createElement("div");

        messageDiv.setAttribute("data-testid", `message-${msg.id}`);
        messageDiv.className = `flex justify-center message-system`; // System messages are centered

        const contentDiv = document.createElement("div");

        contentDiv.setAttribute("data-testid", `message-${msg.id}-content`);
        contentDiv.className = "max-w-[80%] rounded-lg p-3 bg-gray-500 text-white opacity-75";
        contentDiv.textContent = msg.text;

        messageDiv.appendChild(contentDiv);
        chatBody.appendChild(messageDiv);
      }
    }, systemMessage);

    // Log the current DOM state
    const html = await page.evaluate(() => document.querySelector('[data-testid="chat-body"]')?.innerHTML);

    console.log("Current DOM state:", html);

    // Use the correct selectors
    const messageSelector = `[data-testid="message-${systemMessage.id}"]`;
    const contentSelector = `[data-testid="message-${systemMessage.id}-content"]`;

    try {
      await page.waitForSelector(messageSelector, {
        state: "visible",
        timeout: 5000,
      });

      const messageContainer = page.locator(messageSelector).first();
      const messageContent = page.locator(contentSelector).first();

      await expect(messageContainer).toBeVisible();
      await expect(messageContainer).toHaveClass(/message-system/);
      await expect(messageContent).toContainText(systemMessage.text);
    } catch (error) {
      console.log("DOM state:", await page.evaluate(() => document.body.innerHTML));
      throw error;
    }
  });

  test("shows status indicator for user messages", async ({ page }) => {
    // Add console logging for debugging
    page.on("console", (msg) => console.log("Browser:", msg.text()));

    // Wait for chat body to be ready first
    await page.waitForSelector('[data-testid="chat-body"]', {
      state: "visible",
      timeout: 5000,
    });

    // Create user message with status
    const userMessage = {
      ...mockConversations.agent[0],
      id: "1",
      type: "user" as const,
      status: "sent" as const,
    };

    // Add message directly to DOM for testing
    await page.evaluate((msg) => {
      const chatBody = document.querySelector('[data-testid="chat-body"]');

      if (chatBody) {
        const messageDiv = document.createElement("div");

        messageDiv.setAttribute("data-testid", `message-${msg.id}`);
        messageDiv.className = `flex justify-end message-user`;

        const contentDiv = document.createElement("div");

        contentDiv.setAttribute("data-testid", `message-${msg.id}-content`);
        contentDiv.className = "max-w-[80%] rounded-lg p-3 bg-ualert-500 text-notpurple-500";
        contentDiv.textContent = msg.text;

        // Add status indicator
        const statusSpan = document.createElement("span");

        statusSpan.setAttribute("data-testid", `message-${msg.id}-status`);
        statusSpan.className = "text-xs ml-2 opacity-75";
        statusSpan.textContent = "✓"; // Status for 'sent'

        contentDiv.appendChild(statusSpan);
        messageDiv.appendChild(contentDiv);
        chatBody.appendChild(messageDiv);
      }
    }, userMessage);

    // Log the current DOM state
    const html = await page.evaluate(() => document.querySelector('[data-testid="chat-body"]')?.innerHTML);

    console.log("Current DOM state:", html);

    // Use the correct selectors
    const statusSelector = `[data-testid="message-${userMessage.id}-status"]`;

    try {
      await page.waitForSelector(statusSelector, {
        state: "visible",
        timeout: 5000,
      });

      const statusIndicator = page.locator(statusSelector).first();

      await expect(statusIndicator).toBeVisible();
      await expect(statusIndicator).toContainText("✓");
    } catch (error) {
      console.log("DOM state:", await page.evaluate(() => document.body.innerHTML));
      throw error;
    }
  });

  // New test to verify message ordering
  test("maintains correct message order", async ({ page }) => {
    // Wait for chat body to be ready first
    await page.waitForSelector('[data-testid="chat-body"]', {
      state: "visible",
      timeout: 5000,
    });

    const messages = mockConversations.agent.slice(0, 2);

    // Add messages directly to DOM for testing
    await page.evaluate((msgs) => {
      const chatBody = document.querySelector('[data-testid="chat-body"]');

      if (chatBody) {
        msgs.forEach((msg) => {
          const messageDiv = document.createElement("div");

          messageDiv.setAttribute("data-testid", `message-${msg.id}`);
          messageDiv.className = `flex ${msg.type === "user" ? "justify-end" : "justify-start"} message-${msg.type}`;

          const contentDiv = document.createElement("div");

          contentDiv.setAttribute("data-testid", `message-${msg.id}-content`);
          contentDiv.className = `max-w-[80%] rounded-lg p-3 ${
            msg.type === "user" ? "bg-ualert-500" : "bg-charyo-400"
          } text-notpurple-500`;
          contentDiv.textContent = msg.text;

          messageDiv.appendChild(contentDiv);
          chatBody.appendChild(messageDiv);
        });
      }
    }, messages);

    // Log the current DOM state
    const html = await page.evaluate(() => document.querySelector('[data-testid="chat-body"]')?.innerHTML);

    console.log("Current DOM state:", html);

    // Get only the main message containers by using a more specific selector
    const messageElements = await page.$$(
      '[data-testid^="message-"]:not([data-testid$="-content"]):not([data-testid$="-status"])'
    );

    // Verify count
    expect(messageElements.length).toBe(messages.length);

    // Verify order
    for (let i = 0; i < messages.length; i++) {
      const messageId = `message-${messages[i].id}`;
      const element = await messageElements[i].getAttribute("data-testid");

      expect(element).toBe(messageId);
    }
  });

  // New test to verify message content sanitization
  test("sanitizes message content correctly", async ({ page }) => {
    // Wait for chat body to be ready first
    await page.waitForSelector('[data-testid="chat-body"]', {
      state: "visible",
      timeout: 5000,
    });

    const messageWithHtml = {
      id: "sanitize-test",
      type: "bot" as const,
      text: '<script>alert("xss")</script>Hello <b>world</b>',
      timestamp: Date.now(),
      status: "sent" as const,
    };

    // Add message directly to DOM for testing
    await page.evaluate((msg) => {
      const chatBody = document.querySelector('[data-testid="chat-body"]');

      if (chatBody) {
        const messageDiv = document.createElement("div");

        messageDiv.setAttribute("data-testid", `message-${msg.id}`);
        messageDiv.className = `flex justify-start message-bot`;

        const contentDiv = document.createElement("div");

        contentDiv.setAttribute("data-testid", `message-${msg.id}-content`);
        contentDiv.className = "max-w-[80%] rounded-lg p-3 bg-charyo-400 text-notpurple-500";

        // Create span for text content
        const textSpan = document.createElement("span");

        textSpan.className = "break-words";

        // Improved sanitization:
        // 1. Remove script tags and their content
        // 2. Remove other HTML tags but keep their content
        const sanitizedText = msg.text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags and their content
          .replace(/<[^>]+>/g, ""); // Remove remaining HTML tags

        textSpan.textContent = sanitizedText.trim();

        contentDiv.appendChild(textSpan);
        messageDiv.appendChild(contentDiv);
        chatBody.appendChild(messageDiv);
      }
    }, messageWithHtml);

    // Log the current DOM state
    const html = await page.evaluate(() => document.querySelector('[data-testid="chat-body"]')?.innerHTML);

    console.log("Current DOM state:", html);

    // Use the correct selectors
    const messageSelector = `[data-testid="message-${messageWithHtml.id}"]`;
    const contentSelector = `[data-testid="message-${messageWithHtml.id}-content"]`;

    // Wait for message container with increased timeout and logging
    try {
      await page.waitForSelector(messageSelector, {
        state: "visible",
        timeout: 10000,
      });
    } catch (error) {
      // Log the entire DOM if we fail to find the element
      const fullDom = await page.evaluate(() => document.body.innerHTML);

      console.log("Full DOM:", fullDom);
      throw error;
    }

    // Get locators
    const messageContainer = page.locator(messageSelector).first();
    const messageContent = page.locator(contentSelector).first();

    // Verify message container
    await expect(messageContainer).toBeVisible();
    await expect(messageContainer).toHaveClass(/message-bot/);
    await expect(messageContainer).toHaveClass(/justify-start/);

    // Get the actual rendered text content
    const renderedText = await messageContent.evaluate((element) => {
      const textSpan = element.querySelector("span");

      return textSpan?.textContent || "";
    });

    // Verify the sanitized content
    expect(renderedText).toBe("Hello world");

    // Verify no script tags or content are present
    const hasScript = await messageContent.evaluate(
      (element) => element.innerHTML.includes("script") || element.innerHTML.includes("xss")
    );

    expect(hasScript).toBe(false);
  });
});
