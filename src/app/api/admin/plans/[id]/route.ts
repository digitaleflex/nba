import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["SUPER_ADMIN"])
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.subscriptionPlan.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Plan introuvable" }, { status: 404 })

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        price: body.price ?? existing.price,
        currency: body.currency ?? existing.currency,
        durationDays: body.durationDays ?? existing.durationDays,
        features: body.features ?? existing.features,
        sortOrder: body.sortOrder ?? existing.sortOrder,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["SUPER_ADMIN"])
    const { id } = await params

    await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
