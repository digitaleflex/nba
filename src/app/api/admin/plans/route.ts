import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["SUPER_ADMIN"])

    const body = await request.json()
    const { name, description, price, currency, durationDays, features, sortOrder } = body

    if (!name || price == null || !currency || !durationDays) {
      return NextResponse.json({ error: "name, price, currency et durationDays requis" }, { status: 400 })
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description: description ?? null,
        price,
        currency,
        durationDays,
        features: features ?? [],
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}
