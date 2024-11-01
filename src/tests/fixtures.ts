import { test as base } from "@playwright/test";
import { MockServer } from "./server";

type TestFixtures = {
  mockServer: MockServer;
};

export const test = base.extend<TestFixtures>({
  mockServer: async ({ page }, use) => {
    const mockServer = new MockServer(page);
    await mockServer.setup();
    await use(mockServer);
  },
});

export { expect } from "@playwright/test";
