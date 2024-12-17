import { Page } from "@playwright/test";

import { mockAuthCookie, mockLoginResponses } from "../data/auth";
import { mockMerchantCreateResponse } from "../data/onboarding";

export async function setupAuthMocks(page: Page) {
  await page.route("*/**/v1/auth/login/initiate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockLoginResponses.initiate),
    });
  });

  await page.route("*/**/v1/auth/login/verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockLoginResponses.verify),
    });
  });
}

export async function setupAuthCookie(page: Page) {
  await page.context().addCookies([mockAuthCookie]);
}

export async function setupMerchantApi(page: Page) {
  await page.route("**/v1/merchant/", async (route) => {
    const request = route.request();

    console.log("Intercepted merchant create request:", request.url());

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockMerchantCreateResponse),
    });
  });
}
