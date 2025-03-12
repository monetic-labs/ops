/** @type {import('next').NextConfig} */
const { generateCSP, cspObjectToString } = require("./src/utils/csp-config");

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

    // Generate CSP configuration using our utility
    const cspConfig = generateCSP({ isDevelopment: isLocal });

    // Convert CSP object to string
    const cspString = cspObjectToString(cspConfig);

    // Create report-only CSP with the same directives plus report-uri
    const reportOnlyCSP = cspString + " report-uri /api/csp-report;";

    return [
      {
        source: "/:path*",
        headers: [
          {
            // Use report-only in development, enforce in production
            key: isLocal ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
            value: cspString,
          },
          // In development, we don't need both headers since we're using report-only
          ...(isLocal
            ? []
            : [
                {
                  key: "Content-Security-Policy-Report-Only",
                  value: reportOnlyCSP,
                },
              ]),
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
