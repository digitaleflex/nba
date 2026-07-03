import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { NextURL } from "next/dist/server/web/next-url";

// ─── Constants ───────────────────────────────────────────────────────────────
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];
const AUTH_API_PREFIX = "/api/auth";
const PUBLIC_API_PREFIX = "/api/public";
const ONBOARDING_API_PREFIX = "/api/onboarding";

// Better Auth cookie name (Secure prefix used in production/HTTPS)
const SESSION_COOKIE_NAMES = ["__Secure-better-auth.session_token", "better-auth.session_token"];

// ─── Cached Auth Status (In-Memory per Edge Runtime Instance) ───────────────
// This avoids repeated DB calls for the same user within a short window
const authStatusCache = new Map<
  string,
  { status: string | null; emailVerified: boolean; timestamp: number }
>();
const CACHE_TTL_MS = 30_000; // 30 seconds - balances freshness vs performance

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthStatus {
  hasSession: boolean;
  userId: string | null;
  emailVerified: boolean;
  onboardingStatus: string | null;
}

// ─── Session Cookie Parser ───────────────────────────────────────────────────
/**
 * Parse the Better Auth session token directly from cookies.
 * This avoids an internal fetch to /api/auth/middleware-check
 *
 * Better Auth stores: base64(sessionId.token)
 * We decode it to get the session ID, then fetch user status
 */
function parseSessionCookie(request: NextRequest): {
  sessionId: string | null;
  tokenValue: string | null;
} {
  const cookies = request.cookies.getAll();
  const sessionCookie = cookies.find((c) => SESSION_COOKIE_NAMES.includes(c.name));

  if (!sessionCookie?.value) {
    return { sessionId: null, tokenValue: null };
  }

  try {
    // Better Auth encodes as base64: base64(JSON.stringify({ token, expiresAt }))
    const decoded = atob(sessionCookie.value);
    const sessionData = JSON.parse(decoded) as { token?: string };

    return {
      sessionId: sessionData.token || null,
      tokenValue: sessionCookie.value,
    };
  } catch {
    // Fallback: try as plain token
    return { sessionId: sessionCookie.value, tokenValue: sessionCookie.value };
  }
}

// ─── Lightweight Session Validation ─────────────────────────────────────────
/**
 * Check if session is valid by calling a lightweight endpoint.
 * We pass the cached status to avoid redundant checks.
 */
async function validateSessionAndGetStatus(
  request: NextRequest,
  sessionId: string | null,
  userId: string | null,
): Promise<AuthStatus> {
  if (!sessionId) {
    return {
      hasSession: false,
      userId: null,
      emailVerified: false,
      onboardingStatus: null,
    };
  }

  // Check cache first
  const cacheKey = userId || sessionId.slice(0, 32);
  const cached = authStatusCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      hasSession: true,
      userId,
      emailVerified: cached.emailVerified,
      onboardingStatus: cached.status,
    };
  }

  try {
    // Single optimized call to get both session + user status
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const res = await fetch(`${baseUrl}/api/auth/middleware-check`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
        // Tell API to use lightweight response
        "x-auth-check": "lightweight",
      },
      // Cache for 30 seconds at the fetch level
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return {
        hasSession: false,
        userId: null,
        emailVerified: false,
        onboardingStatus: null,
      };
    }

    const data = await res.json();

    // Cache the result
    if (data.session?.user?.id) {
      authStatusCache.set(data.session.user.id, {
        status: data.onboardingStatus,
        emailVerified: data.session.user.emailVerified ?? false,
        timestamp: Date.now(),
      });
    }

    return {
      hasSession: !!data.session,
      userId: data.session?.user?.id ?? null,
      emailVerified: data.session?.user?.emailVerified ?? false,
      onboardingStatus: data.onboardingStatus ?? null,
    };
  } catch {
    // On error, assume no session (fail secure)
    return {
      hasSession: false,
      userId: null,
      emailVerified: false,
      onboardingStatus: null,
    };
  }
}

// ─── Redirect Helpers ────────────────────────────────────────────────────────
function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

function redirectToLoginAndClearSession(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  const response = NextResponse.redirect(loginUrl);
  // Clear invalid session cookies to prevent redirect loops
  for (const cookieName of SESSION_COOKIE_NAMES) {
    response.cookies.delete(cookieName);
  }
  return response;
}

function redirectTo(target: string, request: NextRequest) {
  return NextResponse.redirect(new URL(target, request.url));
}

// ─── Main Proxy ──────────────────────────────────────────────────────────────
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── 1. Skip auth for public routes ──────────────────────────────────────
  if (
    pathname.startsWith(AUTH_API_PREFIX) ||
    pathname.startsWith(PUBLIC_API_PREFIX) ||
    pathname.startsWith(ONBOARDING_API_PREFIX) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // ─── 2. Parse session cookie (NO FETCH HERE) ────────────────────────────
  const { sessionId } = parseSessionCookie(request);
  const hasSessionCookie = !!sessionId;

  // ─── 3. Root path: redirect based on auth ────────────────────────────────
  if (pathname === "/") {
    if (hasSessionCookie) {
      return redirectTo("/dashboard", request);
    }
    return redirectTo("/login", request);
  }

  // ─── 4. Auth pages: redirect logged-in users away ────────────────────────
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (hasSessionCookie) {
      return redirectTo("/dashboard", request);
    }
    return NextResponse.next();
  }

  // ─── 5. Protected routes: passthrough with cookie check ────────────────
  const isProtectedRoute =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // No session cookie = redirect to login
  if (!hasSessionCookie) {
    return redirectToLogin(request, pathname);
  }

  // Validate the session to prevent redirect loops with invalid cookies
  // (e.g., after a BETTER_AUTH_SECRET rotation invalidates all sessions)
  const authStatus = await validateSessionAndGetStatus(request, sessionId, null);
  if (!authStatus.hasSession) {
    return redirectToLoginAndClearSession(request, pathname);
  }

  // Valid session: pass through
  const response = NextResponse.next();
  response.headers.set("x-auth-cookie", "present");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
