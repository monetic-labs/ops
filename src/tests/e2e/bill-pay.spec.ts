import { test, expect, Page } from "@playwright/test";
import { MOCK_BALANCE } from "@/utils/constants";
import { setupContactsApi } from "@/tests/e2e/fixtures/api/disbursement";
import { setupAuthCookie } from "@/tests/e2e/fixtures/api/auth";
import { mockContacts } from "./fixtures/data/disbursement";
import { MINIMUM_DISBURSEMENT_ACH_AMOUNT } from "@/types/validations/bill-pay";
import { MINIMUM_DISBURSEMENT_WIRE_AMOUNT } from "@/types/validations/bill-pay";

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

        const amount = page.getByTestId("amount");

        // Test ACH amount validations
        await page.getByTestId("payment-method").click();
        await page.keyboard.type("ACH");
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");

        await amount.fill("50");
        await expect(page.getByText(`Amount must be at least ${MINIMUM_DISBURSEMENT_ACH_AMOUNT} USDC`)).toBeVisible();

        await amount.fill("150");
        await expect(page.getByTestId("create-modal-button")).toBeEnabled();

        await page.getByTestId("amount").clear();
        await page.getByTestId("payment-method").clear();

        // Test WIRE amount validations
        await page.getByTestId("payment-method").click();
        await page.getByTestId("payment-method").fill("WIRE");
        if (page.context().browser()?.browserType().name() === "chromium") {
          await page.getByText("WIRE").click();
        } else {
          await page.keyboard.press("ArrowDown");
          await page.keyboard.press("Enter");
        }

        await amount.fill("400");
        await expect(page.getByText(`Amount must be at least ${MINIMUM_DISBURSEMENT_WIRE_AMOUNT} USDC`)).toBeVisible();

        await amount.fill("600");
        await expect(page.getByTestId("create-modal-button")).toBeEnabled();

        // Test amount exceeding balance
        await amount.fill((Number(MOCK_BALANCE) + 0.01).toString());
        await expect(page.getByText(`Amount must be less than ${MOCK_BALANCE} USDC`)).toBeVisible();
        await expect(page.getByTestId("create-modal-button")).toBeDisabled();
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
      await page.getByTestId("new-sender-toggle").click();
    });

    test("should validate account holder field", async ({ page }) => {
      const accountHolder = page.getByTestId("account-holder");

      // Empty validation
      await accountHolder.fill(" ");
      await expect(page.getByText("Account holder name is required")).toBeVisible();

      // Special characters validation
      await accountHolder.fill("John@Doe");
      await expect(
        page.getByText("Account holder name can only contain letters, spaces, hyphens and apostrophes")
      ).toBeVisible();

      // Length validation
      await accountHolder.fill("A".repeat(51));
      await expect(page.getByText("Account holder name must be less than 50 characters")).toBeVisible();

      // Valid inputs
      await accountHolder.fill("John-O'Connor Jr");
      await expect(accountHolder).not.toHaveAttribute("aria-invalid", "true");
    });

    test("should validate bank details", async ({ page }) => {
      const bankName = page.getByTestId("bank-name");
      const accountNumber = page.getByTestId("account-number");
      const routingNumber = page.getByTestId("routing-number");

      // Bank Name validations
      await bankName.fill(" ");
      await expect(page.getByText("Bank name is required")).toBeVisible();

      await bankName.fill("Bank@123");
      await expect(
        page.getByText("Bank name can only contain letters, numbers, spaces, &, hyphens and apostrophes")
      ).toBeVisible();

      await bankName.fill("Bank of America & Trust");
      await expect(bankName).not.toHaveAttribute("aria-invalid", "true");

      // Account Number validations
      await accountNumber.fill("123");
      await expect(page.getByText("Account number must be at least 5 digits")).toBeVisible();

      await accountNumber.fill("12345678901234567890");
      await expect(page.getByText("Account number must be less than 17 digits")).toBeVisible();

      await accountNumber.fill("123456789");
      await expect(accountNumber).not.toHaveAttribute("aria-invalid", "true");

      // Routing Number validations
      await routingNumber.fill("12345678"); // Too short
      await expect(page.getByText("Routing number must be 9 digits")).toBeVisible();

      await routingNumber.fill("123456789"); // Invalid checksum
      await expect(page.getByText("Invalid routing number checksum")).toBeVisible();

      await routingNumber.fill("021000021"); // Valid routing number
      await expect(routingNumber).not.toHaveAttribute("aria-invalid", "true");
    });

    test("should validate address fields", async ({ page }) => {
      const street1 = page.getByTestId("street-line-1");
      const street2 = page.getByTestId("street-line-2");
      const city = page.getByTestId("city");
      const state = page.getByTestId("state");
      const zipCode = page.getByTestId("zip-code");
      const method = page.getByTestId("payment-method");

      // Basic street validations (any payment method)
      await street1.fill(" ");
      await expect(page.getByText("Street address cannot start with a space")).toBeVisible();

      await street1.fill("A".repeat(101));
      await expect(page.getByText("Street address must be less than 100 characters")).toBeVisible();

      // Set payment method to WIRE for specific validations
      await method.click();
      if (page.context().browser()?.browserType().name() === "chromium") {
        await page.getByText("WIRE").click();
      } else {
        await page.keyboard.type("WIRE");
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
      }

      // Wire-specific street validations
      await street1.fill("Main St"); // Missing number for wire
      await expect(
        page.getByText("US wire transfers require a street number at the start of the address")
      ).toBeVisible();

      await street1.fill("123 Main St.");
      await expect(street1).not.toHaveAttribute("aria-invalid", "true");

      // Change back to ACH for comparison
      await method.clear();
      await method.click();
      if (page.context().browser()?.browserType().name() === "chromium") {
        await page.getByText("ACH_SAME_DAY").click();
      } else {
        await page.keyboard.type("ACH_SAME_DAY");
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
      }

      // Same address should be valid for ACH
      await street1.fill("Main St");
      await expect(street1).not.toHaveAttribute("aria-invalid", "true");

      // Optional Street 2 validation
      await street2.fill("Suite #100");
      await expect(
        page.getByText("Can only contain letters, numbers, spaces, commas, periods, and hyphens")
      ).toBeVisible();

      await street2.fill("Suite 100");
      await expect(street2).not.toHaveAttribute("aria-invalid", "true");

      // City validation
      await city.fill(" ");
      await expect(page.getByText("City is required")).toBeVisible();

      await city.fill("New York123");
      await expect(page.getByText("City can only contain letters, spaces, periods, and hyphens")).toBeVisible();

      await city.fill("St. Louis");
      await expect(city).not.toHaveAttribute("aria-invalid", "true");

      // State validation
      await state.fill("1");
      await expect(page.getByText("No results found.")).toBeVisible();

      await state.fill("NY");
      if (page.context().browser()?.browserType().name() === "chromium") {
        await page.getByText("New York").click();
      } else {
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
      }
      await expect(state).not.toHaveAttribute("aria-invalid", "true");

      // ZIP code validation
      await zipCode.fill("1234");
      await expect(page.getByText("Please enter a valid ZIP code (e.g., 12345 or 12345-6789)")).toBeVisible();

      await zipCode.fill("12345-123");
      await expect(page.getByText("Please enter a valid ZIP code (e.g., 12345 or 12345-6789)")).toBeVisible();

      await zipCode.fill("12345-6789");
      await expect(zipCode).not.toHaveAttribute("aria-invalid", "true");

      await zipCode.fill("12345");
      await expect(zipCode).not.toHaveAttribute("aria-invalid", "true");
    });

    test("should validate amount field based on payment method", async ({ page }) => {
      const amount = page.getByTestId("amount");

      // Initially disabled
      await expect(amount).toBeDisabled();

      // Test ACH minimum
      await page.getByTestId("payment-method").click();
      await page.getByTestId("payment-method").fill("ACH_SAME_DAY");
      if (page.context().browser()?.browserType().name() === "chromium") {
        await page.getByText("ACH_SAME_DAY").click();
      } else {
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
      }

      await expect(amount).toBeEnabled();
      await amount.fill("50");
      await expect(page.getByText(`Amount must be at least ${MINIMUM_DISBURSEMENT_ACH_AMOUNT} USDC`)).toBeVisible();

      await amount.fill("150");
      await expect(amount).not.toHaveAttribute("aria-invalid", "true");

      // Test Wire minimum
      await page.getByTestId("payment-method").click();
      await page.getByTestId("payment-method").fill("WIRE");
      if (page.context().browser()?.browserType().name() === "chromium") {
        await page.getByText("WIRE").click();
      } else {
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
      }

      await amount.fill("400");
      await expect(page.getByText(`Amount must be at least ${MINIMUM_DISBURSEMENT_WIRE_AMOUNT} USDC`)).toBeVisible();

      // Test decimal places
      await amount.clear();
      await amount.fill("500.123");
      await expect(amount).toHaveValue("");

      // Test max amount
      await amount.fill((Number(MOCK_BALANCE) + 0.01).toString());
      await expect(page.getByText(`Amount must be less than ${MOCK_BALANCE} USDC`)).toBeVisible();

      // Test valid amount
      await amount.fill("600.00");
      await expect(amount).not.toHaveAttribute("aria-invalid", "true");
    });
  });
});

// Helper functions
async function fillBasicFormData(page: Page) {
  // Handle account holder selection
  const accountHolder = page.getByTestId("account-holder");
  await accountHolder.waitFor({ state: "visible" });

  // Focus and type to trigger dropdown
  await accountHolder.click();
  await page.keyboard.type(mockContacts[0].accountOwnerName.substring(0, 3)); // Type "Joh"

  // Wait for dropdown and options
  const dropdown = page.getByRole("listbox");
  await dropdown.waitFor({ state: "visible" });

  // Use keyboard navigation to select option
  // await page.keyboard.type(mockContacts[0].accountOwnerName);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  // Handle payment method selection similarly
  const paymentMethod = page.getByTestId("payment-method");
  await expect(paymentMethod).toBeEnabled();
  await paymentMethod.click();

  await page.keyboard.type(mockContacts[0].disbursements[0].method);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
}
