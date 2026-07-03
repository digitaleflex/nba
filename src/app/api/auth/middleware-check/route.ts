import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"

// ─── In-Memory Cache (per server instance) ────────────────────────────────────
interface CachedAuthStatus {
  emailVerified: boolean
  onboardingStatus: string | null
  timestamp: number
}

const authCache = new Map<string, CachedAuthStatus>()
const CACHE_TTL_MS = 30_000 // 30 seconds

export const runtime = "nodejs" // Required for Prisma + PostgreSQL

export async function GET() {
  try {
    const requestHeaders = await headers()
    const isLightweight = requestHeaders.get("x-auth-check") === "lightweight"

    const session = await auth.api.getSession({ headers: requestHeaders })
    
    if (!session) {
      return NextResponse.json({ 
        session: null, 
        onboardingStatus: null 
      }, { 
        status: 200,
        headers: {
          "Cache-Control": "no-store, private",
          "X-Auth-Result": "no-session"
        }
      })
    }

    const userId = session.user.id

    // ─── Lightweight mode: use cache + minimal query ─────────────────────
    if (isLightweight) {
      const cached = authCache.get(userId)
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json({
          session: {
            ...session,
            user: {
              ...session.user,
              emailVerified: cached.emailVerified,
            },
          },
          onboardingStatus: cached.onboardingStatus,
        }, {
          headers: {
            "Cache-Control": "private, max-age=30",
            "X-Auth-Result": "cached"
          }
        })
      }

      // Lightweight query: only fetch what middleware needs
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          emailVerified: true, 
          onboardingStatus: true,
          updatedAt: true  // For cache validation
        },
      })

      if (user) {
        authCache.set(userId, {
          emailVerified: user.emailVerified,
          onboardingStatus: user.onboardingStatus,
          timestamp: Date.now()
        })
      }

      return NextResponse.json({
        session: {
          ...session,
          user: {
            ...session.user,
            emailVerified: user?.emailVerified ?? session.user.emailVerified,
          },
        },
        onboardingStatus: user?.onboardingStatus ?? null,
      }, {
        headers: {
          "Cache-Control": "private, max-age=30",
          "X-Auth-Result": "fresh"
        }
      })
    }

    // ─── Full mode: return complete session data ──────────────────────────
    // Still use cache for DB portion
    const cached = authCache.get(userId)
    const needsRefresh = !cached || Date.now() - cached.timestamp > CACHE_TTL_MS

    if (needsRefresh) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          emailVerified: true, 
          onboardingStatus: true,
          name: true,
          email: true,
          image: true,
          roleId: true,
          phone: true,
          country: true,
        },
      })

      if (user) {
        authCache.set(userId, {
          emailVerified: user.emailVerified,
          onboardingStatus: user.onboardingStatus,
          timestamp: Date.now()
        })
      }

      return NextResponse.json({
        session,
        onboardingStatus: user?.onboardingStatus ?? null,
      }, {
        headers: {
          "Cache-Control": "private, max-age=60",
          "X-Auth-Result": "full"
        }
      })
    }

    // Use cached values
    return NextResponse.json({
      session: {
        ...session,
        user: {
          ...session.user,
          emailVerified: cached.emailVerified,
        },
      },
      onboardingStatus: cached.onboardingStatus,
    }, {
      headers: {
        "Cache-Control": "private, max-age=30",
        "X-Auth-Result": "cached"
      }
    })
  } catch (error) {
    console.error("[middleware-check] Error:", error)
    return NextResponse.json({ 
      session: null, 
      onboardingStatus: null 
    }, { 
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Auth-Result": "error"
      }
    })
  }
}
