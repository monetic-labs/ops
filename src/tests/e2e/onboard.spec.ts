import { test, expect, Page } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should sign up with email", async ({ page }) => {
    const email = "hello@backpack.network";
    // Enter email
    await page.getByLabel("Email").fill(email);
    await page.getByTestId("sign-up-button").click();

    // Wait for onboarding page to load
    await page.waitForURL(`**/onboard?email=${encodeURIComponent(email)}`);
    expect(page.url()).toBe(`http://localhost:3000/onboard?email=${encodeURIComponent(email)}`);

    // Wait for onboarding form to be visible
    expect(await page.getByText("Know Your Business").isVisible()).toBe(true);
    expect(await page.getByRole("heading", { name: "Company Account" }).isVisible()).toBe(true);

    // Verify email is filled in
    expect(await page.getByTestId("company-account-email-input").inputValue()).toBe(email);
  });

  test("should sign up without email", async ({ page, browserName }) => {
    // Click sign in button
    await page.getByTestId("sign-up-button").click();

    // Wait for onboarding page to load
    await page.waitForURL(`**/onboard?email=`);
    expect(page.url()).toBe(`http://localhost:3000/onboard?email=`);

    // Wait for onboarding form to be visible
    expect(await page.getByText("Know Your Business").isVisible()).toBe(true);

    expect(await page.getByRole("heading", { name: "Company Account" }).isVisible()).toBe(true);

    // PAGE 1
    // Fill out company account form
    await page.getByTestId("company-account-name-input").fill("Backpack Network");
    await page.getByTestId("company-account-email-input").fill("thomas@backpack.network");
    await page.getByTestId("company-account-website-input").fill("backpack.network");

    // Enter postcode and wait for address lookup
    await page.getByTestId("company-account-postcode-input").fill("10001");
    await page.getByTestId("company-account-postcode-loading").waitFor({ state: "hidden" });

    // Verify address fields are populated
    await expect(page.getByTestId("company-account-city")).toHaveText("New York");
    await expect(page.getByTestId("company-account-state")).toHaveText("NY");
    await expect(page.getByTestId("company-account-country")).toHaveText("US");

    // Verify street address fields appear
    await expect(page.getByTestId("company-account-street-address-1-input")).toBeVisible();
    await expect(page.getByTestId("company-account-street-address-2-input")).toBeVisible();

    // Fill street address
    await page.getByTestId("company-account-street-address-1-input").fill("123 Main St");
    await page.getByTestId("company-account-street-address-2-input").fill("Suite 100");

    // Click Submit
    await page.getByTestId("company-account-submit-button").click();

    // PAGE 2
    // Verify company details form is visible
    expect(await page.getByRole("heading", { name: "Company Details" }).isVisible()).toBe(true);

    // Fill out company details form
    await page
      .getByTestId("company-details-settlement-address-input")
      .fill("0x1234567890123456789012345678901234567890");
    await page.getByTestId("company-details-company-ein-input").fill("123456789");
    await selectDropdownOption(page, "company-details-company-type-input", "LLC", browserName);
    await page.getByTestId("company-details-company-description-input").fill("A company that does things");

    // Click Submit
    await page.getByTestId("company-details-submit-button").click();

    // PAGE 3
    // Verify account users form is visible
    expect(await page.getByRole("heading", { name: "Account Users" }).isVisible()).toBe(true);

    // Fill out first user form
    await page.getByTestId("account-users-first-name-input-0").fill("John");
    await page.getByTestId("account-users-last-name-input-0").fill("Doe");
    await page.getByTestId("account-users-email-input-0").fill("john.doe@backpack.network");
    await page.getByTestId("account-users-phone-number-input-0").fill("1234567890");
    expect(await page.getByTestId("account-users-role-input-0").getAttribute("value")).toBe("Owner");

    // Add second user
    await page.getByTestId("form-card-tabs-add-button").click();

    // Fill out second user form
    await page.getByTestId("account-users-first-name-input-1").fill("Jane");
    await page.getByTestId("account-users-last-name-input-1").fill("Doe");
    await page.getByTestId("account-users-email-input-1").fill("jane.doe@backpack.network");
    await page.getByTestId("account-users-phone-number-input-1").fill("0987654321");
    await selectDropdownOption(page, "account-users-role-input-1", "Representative", browserName);

    // Click Submit
    await page.getByTestId("form-card-tabs-submit-button").click();

    // PAGE 4
    // Verify onboarding complete page is visible
    expect(await page.getByRole("heading", { name: "User Details" }).isVisible()).toBe(true);

    // TODO
  });
});

async function selectDropdownOption(page: Page, selector: string, value: string, browserName?: string) {
  await page.getByTestId(selector).click();
  await page.getByTestId(selector).fill(value);

  if (browserName === "chromium" || page.context().browser()?.browserType().name() === "chromium") {
    await page.getByText(value).click();
  } else {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
  }
}
