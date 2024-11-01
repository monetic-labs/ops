import { test, expect, Page } from "@playwright/test";

async function mockLoginInitiate(page: Page) {
  await page.route("*/**/v1/auth/login/initiate", async (route) => {
    const json = {
      statusCode: 200,
      data: {
        message: "Login OTP sent successfully",
      },
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(json),
    });
  });
}

async function mockLoginVerify(page: Page) {
  await page.route("*/**/v1/auth/login/verify", async (route) => {
    const json = {
      statusCode: 200,
      data: {
        message: "Login OTP verified successfully",
      },
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(json),
    });
  });

  await page.context().addCookies([
    {
      name: "pyv2_merchant_token",
      value:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4ZDhlZDM2YS1iMTExLTQzZWMtODQzMy04YjFlZDViYjk2NjgiLCJtZXJjaGFudElkIjoxLCJicmlkZ2VDdXN0b21lcklkIjoiZmRjZjg0MDktZWJiOC00NmU3LWI4MTYtNDVlZTA2NThmYzBiIiwic2Vzc2lvbklkIjoiOGM4YjhiOTQtNTlmZS00ZTQ4LWFjZDQtMjg3MThmMGJjZmJlIiwiaWF0IjoxNzMwNDc3MzE2LCJleHAiOjEwMDMxMDgyMTE2fQ.C_6rmLnTgsHAKs4JLc1GPy8Zlth0yE17QHZSnlZTkaA",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      expires: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
    },
  ]);
}

test("has text", async ({ page }) => {
  await page.goto("http://localhost:3000");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Self Banking Services/);

  // Expect a title "to contain" a substring.
  await expect(page.getByText("Self Banking Portal")).toBeVisible();

  // Expect a subtitle "to contain" a substring.
  await expect(page.getByText("Welcome, Skeptic")).toBeVisible();
});

test("login", async ({ page }) => {
  // Mock the api call before navigating
  await mockLoginInitiate(page);
  await mockLoginVerify(page);

  await page.goto("http://localhost:3000");

  // Enter email
  await page.getByLabel("Email").fill("thomas@backpack.network");

  // Click on Sign In Button
  await page.getByTestId("sign-in-button").click();

  // Wait for OTP input field to be visible
  await page.getByTestId(`otp-input-container`).waitFor({ state: "visible" });

  // Enter OTP
  await page.getByTestId(`otp-input-0`).fill("1");
  await page.getByTestId(`otp-input-1`).fill("2");
  await page.getByTestId(`otp-input-2`).fill("3");
  await page.getByTestId(`otp-input-3`).fill("4");
  await page.getByTestId(`otp-input-4`).fill("5");
  await page.getByTestId(`otp-input-5`).fill("6");

  await expect(page.reload()).resolves.toBeTruthy();
});
