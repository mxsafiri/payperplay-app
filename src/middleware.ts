import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to ensure authenticated routes are never served from cache.
 * Sets cache-control headers to prevent Netlify from caching pages
 * that depend on session state.
 */

// Routes that require authentication
const AUTH_ROUTES = [
  "/creator",
  "/dashboard",
  "/feed",
  "/wallet",
  "/profile",
  "/library",
  "/live",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an authenticated route
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    const response = NextResponse.next();

    // Prevent CDN/edge caching of authenticated pages
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Netlify-CDN-Cache-Control", "no-store");
    response.headers.set("CDN-Cache-Control", "no-store");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match authenticated routes but skip static files and API routes
    "/creator/:path*",
    "/dashboard",
    "/feed",
    "/wallet",
    "/profile",
    "/library",
    "/live/:path*",
  ],
};
