import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"]
const AUTH_API_PREFIX = "/api/auth"
const PUBLIC_API_PREFIX = "/api/public"

async function getSession(request: NextRequest) {
  try {
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const res = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.session ?? null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith(AUTH_API_PREFIX) || pathname.startsWith(PUBLIC_API_PREFIX)) {
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

    // Force redirection to onboarding if user is not fully active
    if (
      pathname.startsWith("/dashboard") &&
      session.user?.onboardingStatus !== "ACTIVE"
    ) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    // Prevent access to onboarding if already active
    if (
      pathname.startsWith("/onboarding") &&
      session.user?.onboardingStatus === "ACTIVE"
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
