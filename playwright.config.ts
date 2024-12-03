import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Use more specific .env path configuration
dotenv.config();

export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Keep the more robust retry logic
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  // Combine reporters from both configs
  reporter: [["list", { printSteps: true }], ["github"], ["html"]],

  use: {
    baseURL: "http://localhost:3000",
    testIdAttribute: "data-testid",
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
    launchOptions: {
      env: {
        ...process.env,
        PLAYWRIGHT_TEST: "true",
      },
    },
  },

  // Keep all projects including mobile devices
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 5"],
      },
    },
    {
      name: "mobile-webkit",
      use: {
        ...devices["iPhone 12"],
      },
    },
  ],
});
