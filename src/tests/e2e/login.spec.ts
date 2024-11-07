// import { test, expect } from "@playwright/test";
// import { setupAuthMocks, setupAuthCookie } from "@/tests/e2e/fixtures/api/auth";

// test.describe("Login Flow", () => {
//   test.beforeEach(async ({ page }) => {
//     await setupAuthMocks(page);
//     await page.goto("http://localhost:3000");
//   });

//   test("should show correct landing page text", async ({ page }) => {
//     await expect(page).toHaveTitle(/Self Banking Services/);
//     await expect(page.getByText("Self Banking Portal")).toBeVisible();
//     await expect(page.getByText("Welcome, Skeptic")).toBeVisible();
//   });

//   test("should complete login flow successfully", async ({ page, browserName }) => {
//     test.skip(browserName === "webkit", "This test is flaky in WebKit");

//     // Enter email
//     await page.getByLabel("Email").fill("thomas@backpack.network");
//     await page.getByTestId("sign-in-button").click();

//     // Handle OTP
//     await page.getByTestId(`otp-input-container`).waitFor({ state: "visible" });
//     for (let i = 0; i < 6; i++) {
//       await page.getByTestId(`otp-input-${i}`).fill((i + 1).toString());
//     }

//     // Set auth cookie and verify page reload
//     await setupAuthCookie(page);
//     await expect(page.reload()).resolves.toBeTruthy();
//   });
// });
