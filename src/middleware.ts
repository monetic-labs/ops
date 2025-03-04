import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { BridgeComplianceKycStatus, RainComplianceKybStatus } from "@backpack-fux/pylon-sdk";

import { MERCHANT_COOKIE_NAME } from "./utils/constants";

// Route configurations
const ROUTE_CONFIG = {
  onboard: "/onboard",
  auth: "/auth",
  kyb: "/kyb",
  bypass: ["/api", "/_next", "/favicon.ico"] as string[],
};

// Helper functions
const isPathMatch = (path: string, routes: string[]) => routes.some((route) => path.startsWith(route));

const redirectTo = (url: string, request: NextRequest) => NextResponse.redirect(new URL(url, request.url));

const checkComplianceStatus = async (
  origin: string,
  authToken: string
): Promise<{ isFullyApproved: boolean } | null> => {
  try {
    const response = await fetch(`${origin}/api/check-compliance`, {
      headers: { Cookie: `${MERCHANT_COOKIE_NAME}=${authToken}` },
    });

    if (!response.ok) {
      console.error("Failed to fetch compliance status");
      return null;
    }

    const status = await response.json();
    return {
      isFullyApproved:
        status?.kycStatus.toUpperCase() === BridgeComplianceKycStatus.APPROVED.toUpperCase() &&
        status?.rainKybStatus.toUpperCase() === RainComplianceKybStatus.APPROVED.toUpperCase(),
    };
  } catch (error) {
    console.error("Compliance check error:", error);
    return null;
  }
};

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

  // Check compliance for authenticated routes
  const complianceStatus = await checkComplianceStatus(request.nextUrl.origin, authToken.value);
  if (!complianceStatus) {
    return redirectTo(ROUTE_CONFIG.auth, request);
  }

  // Handle KYB routing
  const isKybRoute = pathname.startsWith(ROUTE_CONFIG.kyb);
  if (!complianceStatus.isFullyApproved && !isKybRoute) {
    return redirectTo(ROUTE_CONFIG.kyb, request);
  }
  if (complianceStatus.isFullyApproved && isKybRoute) {
    return redirectTo("/", request);
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
