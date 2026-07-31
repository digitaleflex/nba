import { NextRequest, NextResponse } from "next/server"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"
import { recordAuthAttempt } from "@nba/lib/security/auth-attempt-recorder"

/**
 * Remplace l'endpoint natif better-auth `/api/auth/sign-up/email` pour
 * enregistrer chaque tentative d'inscription (succès ET échec) dans
 * `login_attempts` + journal d'audit. Le comportement de better-auth
 * (hash, hooks, email de vérification, session) est conservé via
 * `auth.api.signUpEmail`.
 */
export async function POST(req: NextRequest) {
  let email = ""
  let ipAddress: string | undefined
  let userAgent: string | undefined

  try {
    const body = await req.json().catch(() => ({}))
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    const h = req.headers
    ipAddress = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined
    userAgent = h.get("user-agent") ?? undefined

    const response = await auth.api.signUpEmail({
      body,
      headers: req.headers,
      asResponse: true,
    })

    const isSuccess = response.ok || response.status === 200

    let userId: string | null = null
    if (email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        })
        userId = user?.id ?? null
      } catch {
        // Non bloquant
      }
    }

    if (isSuccess) {
      await recordAuthAttempt({
        email,
        type: "SIGNUP",
        success: true,
        ipAddress,
        userAgent,
        userId,
      })
      return response
    }

    let reason: string | null = null
    try {
      const respBody = await response.clone().json()
      reason = typeof respBody?.message === "string" ? respBody.message : null
    } catch {
      // Corps non-JSON : on garde reason null
    }

    await recordAuthAttempt({
      email,
      type: "SIGNUP",
      success: false,
      ipAddress,
      userAgent,
      userId,
      reason,
      status: response.status,
    })

    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne"
    const status = (err as { status?: number })?.status ?? 500

    await recordAuthAttempt({
      email,
      type: "SIGNUP",
      success: false,
      ipAddress,
      userAgent,
      reason: message,
      status,
    })

    return NextResponse.json({ message }, { status })
  }
}
