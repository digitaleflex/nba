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

export function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // Pas de 'strict-dynamic' : aucun script CDN tiers n'est utilisé, et il
    // désactive la allowlist 'self'. Les scripts inline émis par Next.js
    // portent le nonce (via l'en-tête x-nonce).
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,
    // Pas de nonce ici : 'unsafe-inline' est ignoré par les navigateurs dès
    // qu'un nonce est présent dans la directive, et les libs (recharts,
    // radix, driver.js) injectent des styles au runtime qui ne peuvent pas
    // porter le nonce → styles bloqués, UI cassée.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.resend.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ]
    .filter((v) => v.trim() !== "")
    .join("; ");
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID().slice(0, 8).toUpperCase();
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // La CSP est posée sur les headers de la requête (Next.js l'utilise pour
  // injecter le nonce dans les <script>/<style> inline) ET sur la réponse.
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const nextOptions = {
    request: {
      headers: requestHeaders,
    },
  };

  const withCsp = (res: NextResponse): NextResponse => {
    res.headers.set("Content-Security-Policy", csp);
    res.headers.set("x-request-id", requestId);
    return res;
  };

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) || pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    return withCsp(NextResponse.next(nextOptions));
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
    return withCsp(NextResponse.redirect(new URL(isAuthenticated ? "/dashboard" : "/login", request.url)));
  }

  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) return withCsp(NextResponse.redirect(new URL("/dashboard", request.url)));
    return withCsp(NextResponse.next(nextOptions));
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return withCsp(NextResponse.next(nextOptions));
  }

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return withCsp(NextResponse.redirect(loginUrl));
    }
    return withCsp(NextResponse.next(nextOptions));
  }

  return withCsp(NextResponse.next(nextOptions));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};