import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"
import { selectPlanSchema, validateOrThrow, ValidationError } from "@nba/lib/validations"
import { AuthError } from "@nba/lib/auth-utils"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) throw new AuthError("Non authentifié", 401)

    const body = await req.json()
    const parsed = validateOrThrow(selectPlanSchema, body)

    await prisma.accessRequest.create({
      data: { userId: session.user.id, planId: parsed.planId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
}
