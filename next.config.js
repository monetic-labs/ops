/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["i.pravatar.cc"],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  transpilePackages: ["@backpack-fux/pylon-sdk"],

  // Content Security Policy configuration
  async headers() {
    // Determine if we're in a local development environment
    const isLocal = process.env.NODE_ENV === "development";

    // Base CSP directives
    const baseCSP = {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://challenges.cloudflare.com"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "blob:", "https://i.pravatar.cc", "https://explorer-api.walletconnect.com"],
      "font-src": ["'self'", "data:"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "child-src": ["https://auth.privy.io", "https://verify.walletconnect.com", "https://verify.walletconnect.org"],
      "frame-src": [
        "'self'",
        "https://auth.privy.io",
        "https://verify.walletconnect.com",
        "https://verify.walletconnect.org",
        "https://challenges.cloudflare.com",
      ],
      "connect-src": [
        "'self'",
        "https://faucet.circle.com",
        "https://*.backpack.network",
        "wss://*.backpack.network",
        "https://auth.privy.io",
        "wss://relay.walletconnect.com",
        "wss://relay.walletconnect.org",
        "wss://www.walletlink.org",
        "https://*.rpc.privy.systems",
        "https://explorer-api.walletconnect.com",
        // Blockchain RPC endpoints
        "https://sepolia.base.org/",
        "https://*.rpc.thirdweb.com/",
        "https://rpc.ankr.com/base_sepolia",
        "https://*.public.blastapi.io/",
        "https://*.base.org/",
        // Candide bundler endpoints
        "https://api.candide.dev/",
        "https://api.candide.dev/bundler/v3/*",
        "https://*.candide.dev/",
      ],
      "worker-src": ["'self'", "blob:"],
      "manifest-src": ["'self'"],
      "media-src": ["'self'"],
    };

    // Add localhost to CSP for local development
    if (isLocal) {
      baseCSP["connect-src"].push("http://localhost:*", "https://localhost:*", "ws://localhost:*", "wss://localhost:*");
      baseCSP["frame-src"].push("http://localhost:*", "https://localhost:*");
      baseCSP["img-src"].push("http://localhost:*", "https://localhost:*");
    }

    // Convert CSP object to string
    const cspString = Object.entries(baseCSP)
      .map(([directive, sources]) => `${directive} ${sources.join(" ")};`)
      .join(" ");

    // Create report-only CSP with the same directives plus report-uri
    const reportOnlyCSP = cspString + " report-uri /api/csp-report;";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspString,
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: reportOnlyCSP,
          },
          // Add additional security headers
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
