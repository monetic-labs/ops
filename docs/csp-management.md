# Content Security Policy (CSP) Management

This document explains how to manage the Content Security Policy (CSP) for our non-custodial banking application.

## Overview

Content Security Policy is a security feature that helps prevent cross-site scripting (XSS) attacks by controlling which resources can be loaded by the browser. Our implementation balances security with maintainability, making it easier to add new services without constantly debugging CSP issues.

## How Our CSP Is Implemented

We use a modular approach to CSP management:

1. **Centralized Configuration**: All CSP rules are defined in `src/utils/csp-config.js`
2. **Category-Based Organization**: External services are organized by category (auth, blockchain, payment, etc.)
3. **Development Mode**: CSP runs in report-only mode during development to avoid breaking functionality
4. **Violation Reporting**: CSP violations are logged with guidance on how to fix them
5. **Vercel Integration**: Vercel Live scripts are included in both development and production environments
6. **Comprehensive Directives**: We include both `script-src` and `script-src-elem` directives to ensure compatibility across browsers

## Current Service Integrations

Our CSP configuration includes the following service categories:

1. **Authentication & Identity Services**: Privy, WalletConnect, Cloudflare
2. **Wallet & Blockchain Services**: WalletConnect, various RPC endpoints, Candide
3. **Payment & Banking Services**: Circle, Worldpay
4. **Analytics & Monitoring**: (Reserved for future use)
5. **Development & Debugging**: Vercel Live (including feedback scripts and wildcards)
6. **Internal Services**: Backpack API endpoints (including staging environments)
7. **Media & Content**: Avatar services, WalletConnect explorer

## Adding New Services

When you need to add a new external service or domain to the CSP, follow these steps:

1. Open `src/utils/csp-config.js`
2. Identify the appropriate category for your service (or create a new one if needed)
3. Add the domain to the relevant directive(s):
   - `script` for JavaScript sources
   - `connect` for API endpoints, WebSockets, etc.
   - `frame` for iframes
   - `img` for image sources

Example:

```javascript
// Adding a new payment processor
const PAYMENT_SERVICES = {
  script: [
    "https://*.worldpay.com", // Payment processor
  ],
  connect: [
    "https://*.worldpay.com", // Payment processor
    "https://faucet.circle.com",
  ],
  frame: [
    "https://*.worldpay.com", // Payment processor
  ],
};
```

## Handling CSP Violations

When a CSP violation occurs:

1. Check the server logs for detailed information about the violation
2. Look for the "Guidance" message which suggests how to fix the issue
3. Add the blocked URI to the appropriate category in `src/utils/csp-config.js`
4. Restart the development server to apply the changes

## Using Wildcards

To reduce maintenance, use wildcards when appropriate:

```javascript
// Instead of listing every subdomain
"https://api.example.com",
"https://cdn.example.com",
"https://auth.example.com",

// Use a wildcard
"https://*.example.com",
```

However, be cautious with wildcards as they can reduce security by allowing more domains than necessary.

## CSP in Production vs. Development

- **Development**: CSP runs in report-only mode, which logs violations but doesn't block resources
- **Production**: CSP runs in enforcement mode, actively blocking resources that violate the policy

This approach allows you to develop without CSP-related interruptions while maintaining security in production.

## Troubleshooting Common Issues

### Resource Blocked by CSP

If a resource is blocked by CSP, you'll see a violation report in the server logs. Add the domain to the appropriate category in `src/utils/csp-config.js`.

### CSP Breaking Functionality

If CSP is breaking functionality in production:

1. Temporarily add the domain to the appropriate category
2. Consider if there's a more secure alternative
3. If using inline scripts or styles, consider moving them to external files

### Too Many CSP Violations

If you're seeing too many CSP violations:

1. Review your third-party dependencies
2. Consider consolidating services to reduce the number of external domains
3. Use more specific wildcards instead of broad ones

## Security Considerations

While our implementation prioritizes maintainability, keep these security best practices in mind:

1. Avoid `'unsafe-inline'` and `'unsafe-eval'` when possible
2. Be specific with domains rather than using broad wildcards
3. Regularly review and audit your CSP configuration
4. Consider implementing nonce-based CSP in the future for enhanced security

## Future Improvements

As the application grows, consider these improvements:

1. Implement nonce-based CSP for better security
2. Add automated testing for CSP configuration
3. Integrate CSP violation reporting with your monitoring system
4. Implement a more sophisticated CSP violation analysis tool
