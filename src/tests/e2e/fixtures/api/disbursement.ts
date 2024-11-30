import { Page } from "@playwright/test";
import { mockContacts } from "../data/disbursement";

export async function setupContactsApi(page: Page) {
  await page.route("**/v1/merchant/disbursement/contacts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          contacts: mockContacts,
          pagination: {
            hasNextPage: false,
            endCursor: null,
          },
        },
      }),
    });
  });
}
