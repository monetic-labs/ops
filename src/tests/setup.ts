import { Page } from "@playwright/test";
import { mockContacts } from "@/tests/fixtures/contacts";

export async function setupTest(page: Page) {
  // Setup API mocks
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

  // Setup auth cookies
  await page.context().addCookies([
    {
      name: "pyv2_merchant_token",
      value:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4ZDhlZDM2YS1iMTExLTQzZWMtODQzMy04YjFlZDViYjk2NjgiLCJtZXJjaGFudElkIjoxLCJicmlkZ2VDdXN0b21lcklkIjoiZmRjZjg0MDktZWJiOC00NmU3LWI4MTYtNDVlZTA2NThmYzBiIiwic2Vzc2lvbklkIjoiOGM4YjhiOTQtNTlmZS00ZTQ4LWFjZDQtMjg3MThmMGJjZmJlIiwiaWF0IjoxNzMwNDc3MzE2LCJleHAiOjEwMDMxMDgyMTE2fQ.C_6rmLnTgsHAKs4JLc1GPy8Zlth0yE17QHZSnlZTkaA",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      expires: Math.floor(Date.now() / 1000) + 86400 * 7,
    },
  ]);

  // Navigate to page
  await page.goto("http://localhost:3000");
}
