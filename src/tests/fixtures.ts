import { test as base } from "@playwright/test";
import { MockServer } from "./server";

type TestFixtures = {
  mockServer: MockServer;
  autoLogin: void; // New fixture for automatic login
};

export const test = base.extend<TestFixtures>({
  // Original mockServer fixture
  mockServer: async ({ page }, use) => {
    const mockServer = new MockServer(page);
    await mockServer.setup();
    await use(mockServer);
  },

  // New autoLogin fixture that runs before each test
  autoLogin: [
    async ({ page, mockServer }, use) => {
      // Before each test
      await page.goto("http://localhost:3000");
      await mockServer.setup();

      // Run the test
      await use();

      // Optional: After each test cleanup
      await page.context().clearCookies();
    },
    { auto: true },
  ], // auto: true makes this run automatically for each test
});

export { expect } from "@playwright/test";
