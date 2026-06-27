import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { status, reviewerId, notes } = body

  if (!["APPROVED", "REJECTED", "SUSPENDED", "REVOKED"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
  }

  const request = await prisma.accessRequest.findUniqueOrThrow({ where: { id } })

  const updated = await prisma.accessRequest.update({
    where: { id },
    data: { status, reviewedBy: reviewerId, reviewedAt: new Date(), notes },
  })

  if (status === "APPROVED") {
    await prisma.user.update({
      where: { id: request.userId },
      data: { onboardingStatus: "ACTIVE" },
    })
  }

  if (status === "REJECTED") {
    await prisma.user.update({
      where: { id: request.userId },
      data: { onboardingStatus: "REVIEW_PENDING" },
    })
  }

  return NextResponse.json(updated)
}
