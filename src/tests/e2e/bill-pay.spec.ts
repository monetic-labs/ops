import { test, expect } from "../fixtures";

// TODO: we want to test form validation
test("create existing transfer", async ({ page }) => {
  await page.goto("http://localhost:3000");

  // Click on Create Transfer button
  await page.getByTestId("create-transfer-button").click();

  // Wait for Create Bill Pay Modal to be visible
  await page.getByTestId("create-transfer-modal").waitFor({ state: "visible" });

  // Click on Connect Wallet button
  await page.getByTestId("connect-wallet-button").click();

  // Wait for 15 seconds for the QR code to be visible
  await page.waitForTimeout(15000);

  // Click on Copy Link button by Label
  await page.getByLabel("Copy Link").click();

  // Wait for connect wallet button to not be visible
  await expect(page.getByTestId("connect-wallet-button")).not.toBeVisible();
});

// TODO: Create new transfer
// TODO: Test form validation
