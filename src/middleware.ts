import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { csrfCheck } from "./lib/csrf";

const PUBLIC_PREFIXES = ["/_next", "/api/auth", "/api/public", "/api/onboarding", "/api/webhooks", "/api/telegram", "/favicon"];
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

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) || pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    return NextResponse.next();
  }

  // Mode maintenance : rediriger toutes les requêtes sauf /maintenance et les webhooks
  if (process.env.MAINTENANCE_MODE === "true" && pathname !== "/maintenance" && !pathname.startsWith("/api/webhooks")) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // Protection CSRF globale sur les routes API mutables (GET/HEAD/OPTIONS gérés dans csrfCheck).
  if (pathname.startsWith("/api/")) {
    const blocked = csrfCheck(request);
    if (blocked) return blocked;
  }

  const isAuthenticated = hasSession(request);

  if (pathname === "/") {
    return redirectTo(isAuthenticated ? "/dashboard" : "/login", request);
  }

  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) return redirectTo("/dashboard", request);
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
