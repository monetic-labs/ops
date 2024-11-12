import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { MERCHANT_COOKIE_NAME } from "./utils/constants";

export function middleware(request: NextRequest) {

  // Bypass auth for test routes
  if (
    process.env.NODE_ENV !== "production" &&
    request.nextUrl.pathname.startsWith("/test/")
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get(MERCHANT_COOKIE_NAME);
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isOnboardRoute = request.nextUrl.pathname.startsWith("/onboard");
  const isHomePage = request.nextUrl.pathname === "/";

  if (authToken) {
    // User is authenticated
    if (isAuthRoute || isOnboardRoute) {
      // Redirect authenticated users from auth routes to the dashboard
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isHomePage) {
      // Rewrite authenticated users from home page to the dashboard
      return NextResponse.rewrite(new URL("/", request.url));
    }
  } else {
    // User is not authenticated
    if (!isAuthRoute && !isOnboardRoute) {
      // Rewrite unauthenticated users from home page to the auth route
      return NextResponse.rewrite(new URL("/auth", request.url));
    }
  }

  // Allow the request to proceed if no redirection is needed
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
