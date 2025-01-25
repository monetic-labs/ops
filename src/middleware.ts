import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { MERCHANT_COOKIE_NAME } from "./utils/constants";
import { BridgeComplianceKycStatus, RainComplianceKybStatus } from "@backpack-fux/pylon-sdk";
import { LocalStorage } from "@/utils/localstorage"; // Import LocalStorage

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get(MERCHANT_COOKIE_NAME);
  const pathname = request.nextUrl.pathname;

  // Skip middleware for auth routes
  const safeUser = LocalStorage.getSafeUser();

  // Protect /onboard route by checking passkeyId and walletAddress
  if (pathname.startsWith("/onboard") && !safeUser) {
    return NextResponse.redirect(new URL("/auth", request.url)); // Redirect to auth if not set
  }

  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // Check compliance status only for authenticated routes
  if (authToken && !pathname.startsWith("/api")) {
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

      // Redirect to KYB if not fully approved (except if already on KYB page)
      if (!isFullyApproved && !pathname.startsWith("/kyb")) {
        return NextResponse.redirect(new URL("/kyb", request.url));
      }

      // Redirect to home if fully approved and trying to access KYB
      if (isFullyApproved && pathname.startsWith("/kyb")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      console.error("Middleware error:", error);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
