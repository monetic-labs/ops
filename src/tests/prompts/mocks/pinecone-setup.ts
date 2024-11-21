import { test as base } from "@playwright/test";

import { MockPineconeClient } from "./pinecone-service";

// Extend basic test fixture
export const test = base.extend({
  pinecone: async ({}, use) => {
    const mockPinecone = new MockPineconeClient();

    await use(mockPinecone);
  },
});

export { expect } from "@playwright/test";
