import { Page } from "@playwright/test";

export async function setupRainCardCompany(page: Page) {
  await page.route("**/company/rain", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          merchant: {
            bridgeCustomerId: "800f8ebf-dd16-42ca-9eea-72167a31c9c7",
            rainCompanyId: "bee6e47e-8bd4-47d2-9862-433697a9fa08",
            walletAddress: "0x1234567890123456789012345678901234567890",
            fee: "6.5",
            companyId: "1",
          },
          providerComplianceId: "bee6e47e-8bd4-47d2-9862-433697a9fa08",
          provider: "RAIN",
          status: "PENDING",
        },
      }),
    });
  });
}
