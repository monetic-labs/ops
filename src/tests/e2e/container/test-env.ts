export const TEST_CONFIG = {
  routes: {
    pane: "/test/pane",
  },
  modes: {
    bot: "bot",
    support: "support",
  },
} as const;

// Helper to check if we're in test environment
export const isTestEnvironment = () => {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_TEST === "true" ||
    window.location.pathname.startsWith("/test/")
  );
};
