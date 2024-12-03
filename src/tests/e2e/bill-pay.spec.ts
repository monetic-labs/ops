import { test, expect, Page } from "@playwright/test";
import { MOCK_BALANCE } from "@/utils/constants";
import { setupContactsApi } from "@/tests/e2e/fixtures/api/disbursement";
import { setupAuthCookie } from "@/tests/e2e/fixtures/api/auth";
import {
  BANK_VALIDATIONS,
  ACCOUNT_HOLDER_VALIDATIONS,
  VALID_FORM_DATA,
  ADDRESS_VALIDATIONS,
  FieldValidations,
  FormField,
  mockContacts,
} from "./fixtures/data/disbursement";
import { MINIMUM_DISBURSEMENT_ACH_AMOUNT, MINIMUM_DISBURSEMENT_WIRE_AMOUNT } from "./fixtures/data/disbursement";

test.describe("Bill Pay Modal", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthCookie(page);
    await setupContactsApi(page);
    await page.goto("http://localhost:3000/?tab=bill-pay");
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

      test("should validate amount field", async ({ page, browserName }) => {
        await fillBasicFormData(page);

        const amount = page.getByTestId("amount");

        // Test ACH amount validations
        await selectDropdownOption(page, "payment-method", "ACH_SAME_DAY", browserName);

        await amount.fill("50");
        await expect(page.getByText(`Amount must be at least ${MINIMUM_DISBURSEMENT_ACH_AMOUNT} USDC`)).toBeVisible();

        await amount.fill("150");
        await expect(page.getByTestId("create-modal-button")).toBeEnabled();

        await page.getByTestId("amount").clear();
        await page.getByTestId("payment-method").clear();

        // Test WIRE amount validations
        if (isMobile(page) && browserName === "chromium") return; // TODO: skip on chromium mobile
        await selectDropdownOption(page, "payment-method", "WIRE", browserName);

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
      await runValidationTests(page, ACCOUNT_HOLDER_VALIDATIONS);
    });

    test("should validate bank details", async ({ page }) => {
      for (const validation of BANK_VALIDATIONS) {
        await runValidationTests(page, validation);
      }
    });

    test("should validate address fields", async ({ page, browserName }) => {
      // Basic address validations
      for (const validation of ADDRESS_VALIDATIONS) {
        await runValidationTests(page, validation);
      }

      // Wire-specific validations
      await selectDropdownOption(page, "payment-method", "WIRE", browserName);
      await runValidationTests(page, {
        selector: "street-line-1",
        tests: [
          {
            value: "Main St",
            validation: "US wire transfers require a street number at the start of the address",
          },
          {
            value: "123 Main St.",
            isValid: true,
          },
        ],
      });

      // ACH validations
      await selectDropdownOption(page, "payment-method", "ACH_SAME_DAY", browserName);
      await runValidationTests(page, {
        selector: "street-line-1",
        tests: [
          {
            value: "Main St",
            isValid: true,
          },
        ],
      });

      // ZIP code validations
      await runValidationTests(page, {
        selector: "zip-code",
        tests: [
          {
            value: "1234",
            validation: "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)",
          },
          {
            value: "12345-123",
            validation: "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)",
          },
          {
            value: "12345-6789",
            isValid: true,
          },
          {
            value: "12345",
            isValid: true,
          },
        ],
      });
    });

    test("should validate amount field based on payment method", async ({ page, browserName }) => {
      const amount = page.getByTestId("amount");

      // Initially disabled
      await expect(amount).toBeDisabled();

      // Test ACH minimum
      await selectDropdownOption(page, "payment-method", "ACH_SAME_DAY", browserName);
      await expect(amount).toBeEnabled();

      const achValidations: FormField[] = [
        {
          selector: "amount",
          value: "50",
          validation: `Amount must be at least ${MINIMUM_DISBURSEMENT_ACH_AMOUNT} USDC`,
        },
        {
          selector: "amount",
          value: "150",
        },
      ];

      for (const validation of achValidations) {
        await fillFormField(page, validation);
      }
      await expect(amount).not.toHaveAttribute("aria-invalid", "true");

      if (isMobile(page) && browserName === "chromium") return; // TODO: skip on chromium mobile

      // Test Wire minimum
      await selectDropdownOption(page, "payment-method", "WIRE", browserName);

      const wireValidations: FormField[] = [
        {
          selector: "amount",
          value: "400",
          validation: `Amount must be at least ${MINIMUM_DISBURSEMENT_WIRE_AMOUNT} USDC`,
        },
        {
          selector: "amount",
          value: "500.123",
        },
        {
          selector: "amount",
          value: (Number(MOCK_BALANCE) + 0.01).toString(),
          validation: `Amount must be less than ${MOCK_BALANCE} USDC`,
        },
        {
          selector: "amount",
          value: "600.00",
        },
      ];

      for (const validation of wireValidations) {
        await fillFormField(page, validation);
      }
      await expect(amount).not.toHaveAttribute("aria-invalid", "true");
    });

    test("should validate create button state", async ({ page, browserName }) => {
      const createButton = page.getByTestId("create-modal-button");
      await expect(createButton).toBeDisabled();

      // Fill form fields sequentially and check button state
      const fields: [keyof typeof VALID_FORM_DATA, string][] = [
        ["accountHolder", "account-holder"],
        ["bankName", "bank-name"],
        ["accountNumber", "account-number"],
        ["routingNumber", "routing-number"],
        ["street1", "street-line-1"],
        ["city", "city"],
        ["zipCode", "zip-code"],
      ];

      for (const [key, selector] of fields) {
        await fillFormField(page, {
          selector,
          value: VALID_FORM_DATA[key],
        });
        await expect(createButton).toBeDisabled();
      }

      // Handle dropdowns
      await selectDropdownOption(page, "state", "New York", browserName);
      await selectDropdownOption(page, "country", "United States", browserName);
      await selectDropdownOption(page, "payment-method", "ACH_SAME_DAY", browserName);
      await expect(createButton).toBeDisabled();

      // Fill amount last
      await fillFormField(page, {
        selector: "amount",
        value: VALID_FORM_DATA.amount,
      });
      await expect(createButton).toBeEnabled();
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

async function selectDropdownOption(page: Page, selector: string, value: string, browserName?: string) {
  await page.getByTestId(selector).click();
  await page.getByTestId(selector).fill(value);

  if (browserName === "chromium" && !isMobile(page)) {
    await page.getByText(value).click();
  } else {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
  }
}

async function fillFormField(page: Page, field: FormField) {
  const element = page.getByTestId(field.selector);
  await element.fill(field.value);

  if (field.validation) {
    await expect(page.getByText(field.validation)).toBeVisible();
  }
}

async function runValidationTests(page: Page, fieldValidations: FieldValidations) {
  const element = page.getByTestId(fieldValidations.selector);

  for (const test of fieldValidations.tests) {
    await element.fill(test.value);

    if (test.validation) {
      await expect(page.getByText(test.validation)).toBeVisible();
    }

    if (test.isValid) {
      await expect(element).not.toHaveAttribute("aria-invalid", "true");
    }
  }
}

function isMobile(page: Page) {
  const viewport = page.viewportSize();
  return viewport ? viewport.width <= 600 : false;
}
