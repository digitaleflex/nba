import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { csrfCheck } from "./lib/csrf";

const PUBLIC_PREFIXES = ["/_next", "/api/auth", "/api/public", "/api/webhooks", "/favicon"];
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/cgu", "/privacy", "/cookies", "/risk-disclaimer"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/onboarding", "/dashboard", "/admin"];

const SESSION_COOKIES = ["__Secure-better-auth.session_token", "better-auth.session_token"];

// In-memory rate-limit pour routes admin (Edge-compatible, reset au restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkAdminRateLimit(ip: string): boolean {
  const now = Date.now()
  const key = `admin:${ip}`
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60000 })
    return true
  }
  entry.count++
  if (entry.count > 120) return false // 120 req/min max
  return true
}

// Nettoyage periodique de la map (toutes les 5 min)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key)
    }
  }, 300000)
}

function hasSession(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => SESSION_COOKIES.includes(c.name));
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.resend.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID().slice(0, 8).toUpperCase();
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const nextOptions = {
    request: {
      headers: requestHeaders,
    },
  };

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) || pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    const res = NextResponse.next(nextOptions);
    res.headers.set("Content-Security-Policy", buildCsp(nonce));
    return res;
  }

  if (process.env.MAINTENANCE_MODE === "true" && pathname !== "/maintenance" && !pathname.startsWith("/api/webhooks")) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  if (pathname.startsWith("/api/")) {
    const blocked = csrfCheck(request);
    if (blocked) return NextResponse.redirect(new URL("/login", request.url));

    if (pathname.startsWith("/api/admin/")) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        ?? request.headers.get("x-real-ip")
        ?? "unknown"

      if (!checkAdminRateLimit(ip)) {
        return NextResponse.json({ error: "Trop de requetes" }, { status: 429 });
      }

      const allowedEnv = process.env.ADMIN_ALLOWED_IPS
      if (allowedEnv) {
        const allowed = allowedEnv.split(",").map((s) => s.trim()).filter(Boolean)
        if (allowed.length > 0 && !allowed.includes(ip)) {
          return NextResponse.json({ error: "Acces non authorise depuis cette IP" }, { status: 403 });
        }
      }
    }
  }

  const isAuthenticated = hasSession(request);

  if (pathname === "/") {
    return NextResponse.redirect(new URL(isAuthenticated ? "/dashboard" : "/login", request.url));
  }

  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) return NextResponse.redirect(new URL("/dashboard", request.url));
    const res = NextResponse.next(nextOptions);
    res.headers.set("Content-Security-Policy", buildCsp(nonce));
    return res;
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    const res = NextResponse.next(nextOptions);
    res.headers.set("Content-Security-Policy", buildCsp(nonce));
    return res;
  }

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const res = NextResponse.next(nextOptions);
    res.headers.set("Content-Security-Policy", buildCsp(nonce));
    return res;
  }

  const res = NextResponse.next(nextOptions);
  res.headers.set("Content-Security-Policy", buildCsp(nonce));
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};