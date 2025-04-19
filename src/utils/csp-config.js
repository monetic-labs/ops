/**
 * Content Security Policy Configuration
 *
 * This file centralizes the CSP configuration to make it easier to maintain.
 * When adding new external services or resources, add them to the appropriate
 * category below rather than directly modifying next.config.js.
 */

// Authentication & Identity Services
const AUTH_SERVICES = {
  script: ["https://challenges.cloudflare.com", "https://auth.privy.io"],
  connect: ["https://auth.privy.io", "https://*.rpc.privy.systems"],
  frame: [
    "https://auth.privy.io",
    "https://verify.walletconnect.com",
    "https://verify.walletconnect.org",
    "https://challenges.cloudflare.com",
  ],
};

// Wallet & Blockchain Services
const BLOCKCHAIN_SERVICES = {
  script: [],
  connect: [
    // WalletConnect
    "wss://relay.walletconnect.com",
    "wss://relay.walletconnect.org",
    "wss://www.walletlink.org",
    "https://explorer-api.walletconnect.com",

    // RPC Endpoints
    "https://*.base.org/",
    "https://*.rpc.thirdweb.com/",
    "https://rpc.ankr.com/",
    "https://*.public.blastapi.io/",
    "https://*.g.alchemy.com/v2/",

    // Candide
    "https://*.candide.dev/",
  ],
  frame: ["https://verify.walletconnect.com", "https://verify.walletconnect.org"],
};

// Payment & Banking Services
const PAYMENT_SERVICES = {
  script: ["https://*.worldpay.com"],
  connect: ["https://faucet.circle.com", "https://*.worldpay.com"],
  frame: ["https://*.worldpay.com", "https://faucet.circle.com"],
};

// Compliance & KYC Services
const COMPLIANCE_SERVICES = {
  script: ["https://*.withpersona.com", "https://*.bridge.xyz", "https://*.raincards.xyz"],
  connect: ["https://*.withpersona.com", "https://*.bridge.xyz", "https://*.raincards.xyz"],
  frame: ["https://*.withpersona.com", "https://*.bridge.xyz", "https://*.raincards.xyz"],
  form: ["https://*.withpersona.com", "https://*.bridge.xyz", "https://*.raincards.xyz"],
};

// Analytics & Monitoring
const ANALYTICS_SERVICES = {
  script: [],
  connect: [],
  frame: [],
};

// Development & Debugging
const DEV_SERVICES = {
  script: ["https://vercel.live", "https://*.vercel.live", "https://vercel.live/_next-live/feedback/feedback.js"],
  connect: ["https://vercel.live", "https://*.vercel.live"],
  frame: ["https://vercel.live", "https://*.vercel.live"],
};

// Internal Services
const INTERNAL_SERVICES = {
  script: [],
  connect: [
    "https://*.monetic.xyz",
    "https://api.monetic.xyz",
    "https://api.staging.monetic.xyz",
    "https://ops.staging.monetic.xyz",
    "https://ops.monetic.xyz",
    "https://api.staging.monetic.xyz/v1/*",
    "https://api.monetic.xyz/v1/*",
    // Allow Cloudflare R2 storage for file uploads/downloads
    "https://*.cloudflarestorage.com",
    "https://*.r2.cloudflarestorage.com",
  ],
  frame: [],
  form: [
    "https://*.monetic.xyz",
    "https://api.monetic.xyz",
    "https://api.staging.monetic.xyz",
    "https://ops.staging.monetic.xyz",
    "https://ops.monetic.xyz",
  ],
};

// Media & Content
const MEDIA_SERVICES = {
  img: [
    "https://i.pravatar.cc",
    "https://explorer-api.walletconnect.com",
    // Allow Cloudflare R2 storage for image loading
    "https://*.cloudflarestorage.com",
    "https://*.r2.cloudflarestorage.com",
  ],
};

/**
 * Generates CSP configuration for use in next.config.js
 * @param {Object} options - Configuration options
 * @param {boolean} options.isDevelopment - Whether the app is in development mode
 * @returns {Object} CSP configuration object
 */
function generateCSP({ isDevelopment = false } = {}) {
  // Combine all script sources
  const scriptSources = [
    "'self'",
    "'unsafe-eval'",
    "'unsafe-inline'",
    "blob:",
    "https://*.nextsrc.dev",
    ...AUTH_SERVICES.script,
    ...BLOCKCHAIN_SERVICES.script,
    ...PAYMENT_SERVICES.script,
    ...ANALYTICS_SERVICES.script,
    ...INTERNAL_SERVICES.script,
    ...COMPLIANCE_SERVICES.script,
    // Always include Vercel Live scripts for feedback
    ...DEV_SERVICES.script,
  ];

  // Combine all connect sources
  const connectSources = [
    "'self'",
    ...AUTH_SERVICES.connect,
    ...BLOCKCHAIN_SERVICES.connect,
    ...PAYMENT_SERVICES.connect,
    ...ANALYTICS_SERVICES.connect,
    ...INTERNAL_SERVICES.connect,
    ...COMPLIANCE_SERVICES.connect,
    // Always include Vercel Live connect sources
    ...DEV_SERVICES.connect,
  ];

  // Combine all frame sources
  const frameSources = [
    "'self'",
    ...AUTH_SERVICES.frame,
    ...BLOCKCHAIN_SERVICES.frame,
    ...PAYMENT_SERVICES.frame,
    ...ANALYTICS_SERVICES.frame,
    ...INTERNAL_SERVICES.frame,
    ...COMPLIANCE_SERVICES.frame,
    // Always include Vercel Live frame sources
    ...DEV_SERVICES.frame,
  ];

  // Add localhost in development
  if (isDevelopment) {
    scriptSources.push("http://localhost:*", "https://localhost:*", "data:");
    connectSources.push("http://localhost:*", "https://localhost:*");
    frameSources.push("http://localhost:*", "https://localhost:*");
  }

  // Return the complete CSP configuration
  return {
    "default-src": ["'self'", "data:", "blob:"],
    "script-src": scriptSources,
    "script-src-elem": scriptSources,
    "style-src": [
      "'self'",
      "'unsafe-inline'",
      "data:",
      ...(isDevelopment ? ["http://localhost:*", "https://localhost:*"] : []),
    ],
    "style-src-elem": [
      "'self'",
      "'unsafe-inline'",
      "data:",
      ...(isDevelopment ? ["http://localhost:*", "https://localhost:*"] : []),
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      ...MEDIA_SERVICES.img,
      ...(isDevelopment ? ["http://localhost:*", "https://localhost:*"] : []),
    ],
    "font-src": ["'self'", "data:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", ...(INTERNAL_SERVICES.form || []), ...(COMPLIANCE_SERVICES.form || [])],
    "frame-ancestors": [
      "'self'",
      "https://*.monetic.xyz",
      "https://ops.monetic.xyz",
      "https://ops.staging.monetic.xyz",
    ],
    "child-src": ["'self'", "blob:", ...AUTH_SERVICES.frame],
    "frame-src": ["'self'", "blob:", ...frameSources],
    "connect-src": connectSources,
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "media-src": ["'self'", "data:", "blob:"],
  };
}

/**
 * Converts a CSP configuration object to a string
 * @param {Object} cspConfig - CSP configuration object
 * @returns {string} CSP header value
 */
function cspObjectToString(cspConfig) {
  return Object.entries(cspConfig)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")};`)
    .join(" ");
}

module.exports = {
  generateCSP,
  cspObjectToString,
};
