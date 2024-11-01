import { Page } from "@playwright/test";

export class MockServer {
  constructor(private page: Page) {}

  // Setup all mock routes
  async setup() {
    await this.mockAuth();
    await this.mockWalletConnect();
    await this.mockTransfers();
  }

  // Auth-related mocks
  private async mockAuth() {
    await this.page.route("*/**/v1/auth/login/initiate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 200,
          data: { message: "Login OTP sent successfully" },
        }),
      });
    });

    await this.page.route("*/**/v1/auth/login/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 200,
          data: { message: "Login OTP verified successfully" },
        }),
      });
    });
  }

  // WalletConnect-related mocks
  private async mockWalletConnect() {
    await this.page.route("*/**/v1/wallet/connect", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 200,
          data: {
            uri: "wc:123...abc",
            topic: "test-topic",
          },
        }),
      });
    });

    await this.page.route("*/**/v1/wallet/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 200,
          data: {
            connected: true,
            address: "0x123...abc",
            chainId: 84532,
          },
        }),
      });
    });
  }

  // Transfer-related mocks
  private async mockTransfers() {
    await this.page.route("*/**/v1/transfers", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 200,
          data: {
            transfers: [],
          },
        }),
      });
    });
  }
}
