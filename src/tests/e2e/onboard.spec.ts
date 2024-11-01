import { test, expect } from "../fixtures";

test("sign in", async ({ page, mockServer }) => {
  await page.goto("http://localhost:3000");

  await test.step("Login", async () => {
    await page.getByLabel("Email").fill("thomas@backpack.network");
    await page.getByTestId("sign-in-button").click();

    await page.getByTestId(`otp-input-container`).waitFor({ state: "visible" });
    for (let i = 0; i < 6; i++) {
      await page.getByTestId(`otp-input-${i}`).fill(String(i + 1));
    }

    await expect(page.reload()).resolves.toBeTruthy();
    // NOTE: Can we verify the OTP?
  });
});

// TODO: Sign Up
