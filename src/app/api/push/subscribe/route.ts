import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { validateOrThrow, pushSubscribeSchema, pushUnsubscribeSchema } from "@nba/lib/validations"

const pushSubscribeRateLimit = rateLimitMiddleware({ window: 60, max: 10 })

interface SubscribeBody {
  endpoint: string
  keys: { p256dh: string; auth: string }
  userAgent?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveUser()

    const rateLimitRes = await pushSubscribeRateLimit(req, `push-subscribe:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = validateOrThrow(pushSubscribeSchema, await req.json())
    const userAgent = body.userAgent || req.headers.get("user-agent") || undefined

    // Upsert : si l'endpoint existe déjà (autre user ou même user), on met à jour
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: body.endpoint },
    })

    if (existing) {
      if (existing.userId !== session.user.id) {
        // L'endpoint appartient à un autre user — on le réassigne
        await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            userId: session.user.id,
            p256dh: body.keys.p256dh,
            auth: body.keys.auth,
            userAgent,
          },
        })
      } else {
        // Même user — refresh des clés (peuvent changer)
        await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: body.keys.p256dh,
            auth: body.keys.auth,
            userAgent,
          },
        })
      }
    } else {
      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: body.endpoint,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
          userAgent,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireActiveUser()

    const body = validateOrThrow(pushUnsubscribeSchema, await req.json())

    await prisma.pushSubscription.deleteMany({
      where: { endpoint: body.endpoint, userId: session.user.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
