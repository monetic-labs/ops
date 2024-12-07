import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { MERCHANT_COOKIE_NAME } from "./utils/constants";
import jwt from "jsonwebtoken";

function getUserIdFromToken(token: string): string | null {
  try {
    // TODO: Verify the token
    const decoded = jwt.decode(token) as { userId: string } | null;
    return decoded ? decoded.userId : null;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get(MERCHANT_COOKIE_NAME);
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isOnboardRoute = request.nextUrl.pathname.startsWith("/onboard");
  const isHomePage = request.nextUrl.pathname === "/";

  if (authToken) {
    // Fetch compliance status from the API
    const userId = getUserIdFromToken(authToken.value);
    const complianceResponse = await fetch(`${request.nextUrl.origin}/api/checkCompliance?userId=${userId}`, {
      headers: {
        Cookie: `${MERCHANT_COOKIE_NAME}=${authToken.value}`,
      },
    });

    if (!complianceResponse.ok) {
      throw new Error("Failed to check compliance status");
    }

    const { complianceStatus } = await complianceResponse.json();

    if (complianceStatus.kycStatus !== "APPROVED" && complianceStatus.status !== "APPROVED") {
      // Redirect to KYB page if not compliant
      return NextResponse.redirect(new URL("/kyb", request.url));
    }

    if (isAuthRoute || isOnboardRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isHomePage) {
      return NextResponse.rewrite(new URL("/", request.url));
    }
  } else {
    if (!isAuthRoute && !isOnboardRoute) {
      return NextResponse.rewrite(new URL("/auth", request.url));
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
     * - bg-auth.svg (background image)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|bg-auth.svg).*)",
  ],
};
