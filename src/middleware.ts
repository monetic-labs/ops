import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { MERCHANT_COOKIE_NAME } from "./utils/constants";

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get(MERCHANT_COOKIE_NAME);
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isOnboardRoute = request.nextUrl.pathname.startsWith("/onboard");
  const isKybRoute = request.nextUrl.pathname.startsWith("/kyb");
  const isHomePage = request.nextUrl.pathname === "/";

  // Case 1: Not logged in
  if (!authToken) {
    if (!isAuthRoute && !isOnboardRoute) {
      return NextResponse.rewrite(new URL("/auth", request.url));
    }
    return NextResponse.next();
  }

  // Case 2: Logged in - Check compliance status
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
      complianceStatus.kycStatus?.toUpperCase() === "APPROVED" && complianceStatus.status?.toUpperCase() === "APPROVED";

    // Case 2a: Not fully approved - must complete KYB
    if (!isFullyApproved && !isKybRoute) {
      return NextResponse.redirect(new URL("/kyb", request.url));
    }

    // Case 2b: Fully approved
    if (isFullyApproved) {
      if (isAuthRoute || isOnboardRoute || isKybRoute) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      if (isHomePage) {
        return NextResponse.rewrite(new URL("/", request.url));
      }
    }
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
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
     * - bg-auth.svg (background image)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|bg-auth.svg).*)",
  ],
};
