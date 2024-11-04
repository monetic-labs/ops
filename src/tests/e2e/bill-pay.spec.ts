import { test, expect, Page } from "@playwright/test";
import { MOCK_BALANCE } from "@/utils/constants";
import { setupContactsApi } from "@/tests/fixtures/api/disbursement";
import { setupAuthCookie } from "@/tests/fixtures/api/auth";

test.describe("Bill Pay Modal", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthCookie(page);
    await setupContactsApi(page);
    await page.goto("http://localhost:3000");
    // Open the modal
    await page.getByTestId("create-transfer-button").click();
    await page.getByTestId("create-transfer-modal").waitFor({ state: "visible" });
  });

  test.describe("Initial State", () => {
    test("should have correct disabled states on load", async ({ page }) => {
      await expect(page.getByTestId("account-holder")).toBeEnabled();
      await expect(page.getByTestId("bank-name")).toBeDisabled();
      await expect(page.getByTestId("account-number")).toBeDisabled();
      await expect(page.getByTestId("routing-number")).toBeDisabled();
      await expect(page.getByTestId("payment-method")).toBeDisabled();
      await expect(page.getByTestId("amount")).toBeDisabled();
      await expect(page.getByTestId("memo")).not.toBeVisible();
    });

    test("should show balance information", async ({ page }) => {
      expect(page.getByText("Available balance:")).toBeVisible();
      await expect(page.getByText("USDC", { exact: false })).toBeVisible();
      await expect(page.getByTestId("create-modal-button")).toBeDisabled();
    });
  });

  test.describe("Existing Transfer", () => {
    test.describe("Form Validation", () => {
      test("should validate memo field", async ({ page }) => {
        // Setup form with basic valid data
        await fillBasicFormData(page);

        await expect(page.getByTestId("memo")).toBeVisible();
        await expect(page.getByTestId("memo-label")).toHaveText("ACH Reference");

        // Test memo length validation
        await page.getByTestId("memo").fill("This is too long for ACH");
        await expect(page.getByText(`Must be less than 10 characters`)).toBeVisible();

        // Test valid memo
        await page.getByTestId("memo").fill("INV1234");
        await expect(page.getByText(`Must be less than 10 characters`)).not.toBeVisible();
      });

      test("should validate amount field", async ({ page }) => {
        await fillBasicFormData(page);

        // Test amount exceeding balance
        await page.getByTestId("amount").fill("100.01");
        await expect(page.getByText(`Amount must be less than ${MOCK_BALANCE} USDC`)).toBeVisible();

        // Test amount below minimum
        await page.getByTestId("amount").fill("0.99");
        await expect(page.getByText(`Amount must be at least 1 USDC`)).toBeVisible();

        // Test valid amount
        await page.getByTestId("amount").fill("1");
        await expect(page.getByTestId("create-modal-button")).toBeEnabled();
      });

      test("should show correct fee and total", async ({ page }) => {
        await fillBasicFormData(page);
        await page.getByTestId("amount").fill("1");

        await expect(page.getByTestId("fee")).toBeVisible();
        await expect(page.getByTestId("fee")).toHaveText("Free");
        await expect(page.getByTestId("total")).toHaveText("$1.00");
      });
    });
  });

  test.describe("New Transfer", () => {
    test.beforeEach(async ({ page }) => {
      // Switch to new transfer mode
      await page.getByTestId("new-sender-toggle").click();
    });

    // Add similar validation tests for new transfer form
    // ...
  });
});

// Helper functions
async function fillBasicFormData(page: Page) {
  // Handle account holder selection
  await page.getByTestId("account-holder").click();

  // Wait for dropdown list to be visible and select John Doe
  const accountHolderList = page.getByRole("listbox");
  await accountHolderList.waitFor({ state: "visible" });
  await page.getByText("John Doe").click();

  // Handle payment method selection
  const paymentMethod = page.getByTestId("payment-method");
  await expect(paymentMethod).toBeEnabled();
  await paymentMethod.click();

  // Wait for payment method dropdown and select ACH_SAME_DAY
  const paymentMethodList = page.getByRole("listbox");
  await paymentMethodList.waitFor({ state: "visible" });
  await page.getByText("ACH_SAME_DAY").click();

  // Wait for form to stabilize after selections
  await page.waitForTimeout(100);
}
