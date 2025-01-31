import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { BridgeComplianceKycStatus, RainComplianceKybStatus } from "@backpack-fux/pylon-sdk";
import { MERCHANT_COOKIE_NAME } from "./utils/constants";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ["/auth"];
const PROTECTED_ROUTES = ["/", "/kyb", "/onboard"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get(MERCHANT_COOKIE_NAME);

  // Special handling for invite route
  if (pathname.startsWith("/invite")) {
    const token = request.nextUrl.searchParams.get("token");
    return token ? NextResponse.next() : NextResponse.redirect(new URL("/auth", request.url));
  }

  // If no auth token, only allow public routes
  if (!authToken) {
    return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/auth", request.url));
  }

  // If auth token exists, prevent access to public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Skip compliance check for API routes and static assets
  if (pathname.startsWith("/api") || pathname.includes("/_next")) {
    return NextResponse.next();
  }

  // Check compliance status for authenticated routes
  try {
    const complianceResponse = await fetch(`${request.nextUrl.origin}/api/check-compliance`, {
      headers: {
        Cookie: `${MERCHANT_COOKIE_NAME}=${authToken.value}`,
      },
    });

    if (!complianceResponse.ok) {
      console.error("Failed to fetch compliance status");
      return NextResponse.next();
    }

    const complianceStatus = await complianceResponse.json();
    const isFullyApproved =
      complianceStatus?.kycStatus.toUpperCase() === BridgeComplianceKycStatus.APPROVED.toUpperCase() &&
      complianceStatus?.rainKybStatus.toUpperCase() === RainComplianceKybStatus.APPROVED.toUpperCase();

    // Handle KYB routing based on compliance status
    if (!isFullyApproved && !pathname.startsWith("/kyb")) {
      return NextResponse.redirect(new URL("/kyb", request.url));
    }

    if (isFullyApproved && pathname.startsWith("/kyb")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, we might want to redirect to an error page or clear auth
    return NextResponse.redirect(new URL("/auth", request.url));
  }
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
