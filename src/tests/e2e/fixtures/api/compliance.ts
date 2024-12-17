import { Page } from "@playwright/test";

import { mockBridgeComplianceResponse, mockRainComplianceResponse } from "../data/compliance";

export async function setupComplianceMocks(page: Page) {
  await page.route("*/**/v1/bridge/compliance", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockBridgeComplianceResponse),
    });
  });

  await page.route("*/**/v1/merchant/company/rain/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockRainComplianceResponse),
    });
  });
}
