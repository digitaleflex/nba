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

  const raw = sessionCookie.value;

  // Format 1: base64(JSON.stringify({ token, expiresAt })) — ancien format Better Auth
  try {
    const decoded = atob(raw);
    const sessionData = JSON.parse(decoded) as { token?: string };
    if (sessionData.token) {
      return { sessionId: sessionData.token, tokenValue: raw };
    }
  } catch {
    // Pas du base64/JSON → fallback
  }

  // Format 2: token brut (Better Auth actuel: sessionId.signature)
  // Ex: "oq7aTYKUf3qP9WDYNiBw4rW1eU2yxNgi.jTtTmKgVLA173xqOoqrzkk0ELhCjLbR5vI1Nb11wW9w%3D"
  return { sessionId: raw, tokenValue: raw };
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
      // IMPORTANT: pas de cache Next.js ici !
      // Le cache Next.js ne distingue pas par header "cookie", donc
      // une réponse cached "session: null" serait servie pour 30s
      // même avec un nouveau cookie valide. On utilise notre propre
      // cache in-memory (authStatusCache) qui est key-aware.
      cache: "no-store",
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
  // Note: response.cookies.delete() doesn't work reliably in Next.js middleware (Edge runtime).
  // We use set() with maxAge: 0 AND all the original cookie attributes so the browser
  // recognizes and deletes the right cookie (especially important for __Secure- prefix
  // which REQUIRES the Secure flag or browsers reject the Set-Cookie).
  const isSecure = process.env.NODE_ENV === "production";
  for (const cookieName of SESSION_COOKIE_NAMES) {
    response.cookies.set(cookieName, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      // For __Secure- prefixed cookies, Secure is MANDATORY.
      // For non-prefixed, only set Secure in production (HTTPS).
      secure: cookieName.startsWith("__Secure-") ? true : isSecure,
    });
  }
  return response;
}

function redirectTo(target: string, request: NextRequest) {
  return NextResponse.redirect(new URL(target, request.url));
}

// ─── Main Proxy ──────────────────────────────────────────────────────────────
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── 0. Cache des chunks buildés (/_next/static) ─────────────────────────
  // Next les sert avec "immutable" par défaut, ce qui empêche le navigateur
  // de revalider : après un rebuild, l'ancienne URL de chunk 404 et la page
  // casse (CSS/JS manquants). On force no-store pour une revalidation sys.
  if (pathname.startsWith("/_next/static/")) {
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0",
    );
    return response;
  }

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

  // Cookie present: pass through. The protected pages (dashboard, admin)
  // do their own session validation via getServerSession(), which handles
  // the __Secure- cookie correctly. The middleware no longer needs to
  // validate the session itself (which requires a nodejs fetch that
  // doesn't reliably pass __Secure- cookies through the Edge runtime).
  const response = NextResponse.next();
  response.headers.set("x-auth-cookie", "present");

  return response;
}

export const config = {
  matcher: [
    // Inclut /_next/static pour forcer le no-store sur les chunks buildés
    "/((?!_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
