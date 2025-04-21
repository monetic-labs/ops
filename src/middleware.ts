import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { MERCHANT_COOKIE_NAME } from "./utils/constants";
import { CookieManager } from "./utils/cookie-manager";

// Route configurations
const ROUTE_CONFIG = {
  onboard: "/onboard",
  auth: "/auth",
  kyb: "/kyb",
  root: "/",
  bypass: ["/api", "/_next", "/favicon.ico"] as string[],
};

// Helper functions
const isPathMatch = (path: string, routes: string[]) => routes.some((route) => path.startsWith(route));

const redirectTo = (url: string, request: NextRequest) => NextResponse.redirect(new URL(url, request.url));

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const authToken = request.cookies.get(MERCHANT_COOKIE_NAME);

  // Skip middleware for bypassed routes
  if (isPathMatch(pathname, ROUTE_CONFIG.bypass)) {
    return NextResponse.next();
  }

  // Handle onboarding with token
  if (pathname.startsWith(ROUTE_CONFIG.onboard)) {
    return searchParams.get("token") ? NextResponse.next() : redirectTo(ROUTE_CONFIG.auth, request);
  }

  // Handle auth route
  if (pathname.startsWith(ROUTE_CONFIG.auth)) {
    return authToken ? redirectTo("/", request) : NextResponse.next();
  }

  // Require authentication for all other routes
  if (!authToken) {
    return redirectTo(ROUTE_CONFIG.auth, request);
  }

  // Get compliance status directly from cookie
  const complianceCookieValue = request.cookies.get(CookieManager.COMPLIANCE_COOKIE)?.value;
  const isApproved = complianceCookieValue === "approved";

  // Handle root path and compliance-based redirects
  if (pathname === ROUTE_CONFIG.root && !isApproved) {
    return redirectTo(ROUTE_CONFIG.kyb, request);
  }

  // If trying to access KYB page while already approved, redirect to root
  if (pathname === ROUTE_CONFIG.kyb && isApproved) {
    return redirectTo(ROUTE_CONFIG.root, request);
  }

  // For all other routes, if not approved, redirect to KYB
  if (!isApproved && pathname !== ROUTE_CONFIG.kyb) {
    const kybUrl = new URL(ROUTE_CONFIG.kyb, request.url);
    kybUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(kybUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
