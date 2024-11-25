import { test as base, mergeTests } from '@playwright/test';
import { test as wsTest } from './websocket.fixture';
import { test as contextTest } from './context.fixture';
import { PaneFixture } from './pane.fixture';
import { TestContextFixtures } from './fixture-types';

// First extend base test with WebSocket fixtures
const wsAndContextTest = mergeTests(wsTest, contextTest);

// Then add pane fixture
const paneTest = wsAndContextTest.extend<TestContextFixtures & { pane: PaneFixture }>({
  pane: async ({ page }, use) => {
    await use(new PaneFixture(page));
  }
});

export const test = paneTest;