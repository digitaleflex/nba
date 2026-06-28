import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { selectPlanSchema, validateOrThrow, ValidationError } from "@nba/lib/validations"
import { AuthError } from "@nba/lib/auth-utils"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) throw new AuthError("Non authentifié", 401)

    const body = await req.json()
    const parsed = validateOrThrow(selectPlanSchema, body)

    // Rate limiting is handled by Better Auth's customRules
    // Additional protection: ensure no duplicate pending requests
    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        userId: session.user.id,
        planId: parsed.planId,
        status: "PENDING",
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: "Demande déjà en attente pour ce plan" },
        { status: 409 }
      )
    }

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

// Rate limiting handled by Better Auth in src/lib/auth.ts
// /select-plan inherits from default rate limit: 100 req/min window
// For enhanced protection, add to customRules if needed
