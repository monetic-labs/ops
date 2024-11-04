import { test, expect, Page } from "@playwright/test";

// TODO: we want to test form validation
test("create existing transfer", async ({ page }) => {
  await page.goto("http://localhost:3000");

  // Click on Create Transfer button
  await page.getByTestId("create-transfer-button").click();

  // Wait for Create Bill Pay Modal to be visible
  await page.getByTestId("create-transfer-modal").waitFor({ state: "visible" });

  // NOTE: We skip wallet connection as CI doesn't support it

  // Check Account Holder is enabled
  await expect(page.getByTestId("account-holder")).toBeEnabled();

  // Check all other fields are disabled
  await expect(page.getByTestId("bank-name")).toBeDisabled();
  await expect(page.getByTestId("account-number")).toBeEnabled();
  await expect(page.getByTestId("routing-number")).toBeDisabled();
  await expect(page.getByTestId("payment-method")).toBeDisabled();
  await expect(page.getByTestId("amount")).toBeDisabled();

  // Optional: Check memo field is not present initially
  await expect(page.getByTestId("memo")).not.toBeVisible();

  // Check for balance label and USDC separately
  expect(page.getByText("Available balance:")).toBeVisible();
  await expect(page.getByText("USDC", { exact: false })).toBeVisible();

  // Expect create button to be disabled
  expect(page.getByTestId("create-modal-button")).toBeDisabled();

  // Click on Account Holder
  await page.getByTestId("account-holder").click();

  // Select 
});

// TODO: Create new transfer
// TODO: Test form validation
