import { test } from "@playwright/test";

import { setupAuthCookie } from "@/tests/e2e/fixtures/api/auth";
import { setupComplianceMocks } from "@/tests/e2e/fixtures/api/compliance";

test.describe("Support Chat", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthCookie(page);
    await setupComplianceMocks(page);
    await page.goto("http://localhost:3000");
  });

  test("should open support chat", async ({ page }) => {
    // TODO: OPEN SUPPORT CHAT (test different ways to open it)
    // TODO: TEST SUPPORT CHAT (test sending a message, test closing chat, test reopening chat)
    // TODO: CLOSE SUPPORT CHAT (test closing chat, test reopening chat)
  });
});
