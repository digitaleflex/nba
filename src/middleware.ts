import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"]
const AUTH_API_PREFIX = "/api/auth"
const PUBLIC_API_PREFIX = "/api/public"
const ONBOARDING_API_PREFIX = "/api/onboarding"

async function getSession(request: NextRequest) {
  try {
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const res = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data ?? null
  } catch {
    return null
  }
}

async function getOnboardingStatus(request: NextRequest): Promise<string | null> {
  try {
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const res = await fetch(`${baseUrl}/api/onboarding/state`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.status ?? null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith(AUTH_API_PREFIX) ||
    pathname.startsWith(PUBLIC_API_PREFIX) ||
    pathname.startsWith(ONBOARDING_API_PREFIX)
  ) {
    return NextResponse.next()
  }

  if (pathname === "/") {
    const session = await getSession(request)
    return NextResponse.redirect(
      new URL(session ? "/dashboard" : "/login", request.url),
    )
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    const session = await getSession(request)
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  if (
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin")
  ) {
    const session = await getSession(request)
    if (!session) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Vérifier le vrai statut onboarding depuis l'API (la session Better Auth n'inclut pas les champs customs)
    const onboardingStatus = await getOnboardingStatus(request)

    // Forcer la vérification email avant tout accès
    const emailVerified = session?.user?.emailVerified ?? false
    if (!emailVerified && pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    if (
      pathname.startsWith("/dashboard") &&
      onboardingStatus !== "ACTIVE"
    ) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    // Prevent access to onboarding if already active
    if (
      pathname.startsWith("/onboarding") &&
      onboardingStatus === "ACTIVE"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
