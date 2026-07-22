import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { csrfCheck } from "./lib/csrf";

const PUBLIC_PREFIXES = ["/_next", "/api/auth", "/api/public", "/api/webhooks", "/api/telegram", "/favicon"];
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/cgu", "/privacy", "/cookies", "/risk-disclaimer"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/onboarding", "/dashboard", "/admin"];

const SESSION_COOKIES = ["__Secure-better-auth.session_token", "better-auth.session_token"];

function hasSession(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => SESSION_COOKIES.includes(c.name));
}

function redirectTo(url: string, request: NextRequest) {
  return NextResponse.redirect(new URL(url, request.url));
}

function withRequestId(res: NextResponse, id: string): NextResponse {
  res.headers.set("x-request-id", id);
  return res;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID().slice(0, 8).toUpperCase();

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) || pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    const res = NextResponse.next()
    res.headers.set("x-request-id", requestId)
    if (pathname.startsWith("/api/public/")) {
      res.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
    }
    // Security headers
    res.headers.set("X-Content-Type-Options", "nosniff")
    res.headers.set("X-Frame-Options", "DENY")
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    return res
  }

  if (process.env.MAINTENANCE_MODE === "true" && pathname !== "/maintenance" && !pathname.startsWith("/api/webhooks")) {
    return withRequestId(NextResponse.redirect(new URL("/maintenance", request.url)), requestId);
  }

  if (pathname.startsWith("/api/")) {
    const blocked = csrfCheck(request);
    if (blocked) return withRequestId(blocked, requestId);
  }

  const isAuthenticated = hasSession(request);

  if (pathname === "/") {
    return withRequestId(redirectTo(isAuthenticated ? "/dashboard" : "/login", request), requestId);
  }

  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) return withRequestId(redirectTo("/dashboard", request), requestId);
    return withRequestId(NextResponse.next(), requestId);
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return withRequestId(NextResponse.next(), requestId);
  }

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return withRequestId(NextResponse.redirect(loginUrl), requestId);
    }
    const res = NextResponse.next()
    res.headers.set("x-request-id", requestId)
    res.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate")
    // Security headers
    res.headers.set("X-Content-Type-Options", "nosniff")
    res.headers.set("X-Frame-Options", "DENY")
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    res.headers.set("X-XSS-Protection", "0")
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    return res
  }

  const res = NextResponse.next()
  res.headers.set("x-request-id", requestId)
  return withRequestId(res, requestId);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
