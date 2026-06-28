import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { reviewAccessSchema, validateOrThrow, validateId } from "@nba/lib/validations"
import { logAuditEvent } from "@nba/lib/services/audit"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("users.read")
    const { id } = await params
    const idCheck = validateId(id)
    if (!idCheck.valid) return idCheck.response

    const request = await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
            country: true,
            language: true,
            timezone: true,
            image: true,
            onboardingStatus: true,
            createdAt: true,
            kycDocuments: { orderBy: { submittedAt: "desc" } },
            brokerVerifications: { orderBy: { submittedAt: "desc" } },
            devices: { orderBy: { lastSeenAt: "desc" }, take: 5 },
          },
        },
        plan: true,
        reviewer: { select: { id: true, name: true, email: true } },
      },
    })

    if (!request) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
    }

    return NextResponse.json(request)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("subscriptions.manage")
    const { id } = await params
    const idCheck = validateId(id)
    if (!idCheck.valid) return idCheck.response
    const body = await req.json()
    const parsed = validateOrThrow(reviewAccessSchema, body)

    const request = await prisma.accessRequest.findUniqueOrThrow({ where: { id } })

    const updated = await prisma.accessRequest.update({
      where: { id },
      data: {
        status: parsed.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        notes: parsed.notes,
      },
    })

    if (parsed.status === "APPROVED") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { onboardingStatus: "ACTIVE" },
      })
    }

    if (parsed.status === "REJECTED") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { onboardingStatus: "REVIEW_PENDING" },
      })
    }

    await logAuditEvent({
      userId: session.user.id,
      action: `access_request.${parsed.status.toLowerCase()}`,
      resourceType: "access_request",
      resourceId: id,
      details: { notes: parsed.notes },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
