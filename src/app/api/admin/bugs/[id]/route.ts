import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "FIXED", "CLOSED"] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { id } = await params
    const body = await request.json()
    const { status, adminNote } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      )
    }

    const bug = await prisma.notification.findUnique({
      where: { id, type: "bug_report" },
      select: { id: true, data: true, title: true, userId: true },
    })

    if (!bug) {
      return NextResponse.json({ error: "Bug introuvable" }, { status: 404 })
    }

    const existingData = (bug.data ?? {}) as Record<string, unknown>
    const updatedData = {
      ...existingData,
      status,
      ...(adminNote ? { adminNote: String(adminNote).slice(0, 2000) } : {}),
      respondedAt: new Date().toISOString(),
      respondedBy: session.user.name ?? "Admin",
    }

    await prisma.notification.update({
      where: { id },
      data: { data: updatedData },
    })

    // Prévenir le rapporteur quand son bug est traité / corrigé
    const reporterId = (existingData.userId as string | undefined) ?? bug.userId
    if (reporterId) {
      await prisma.notification.create({
        data: {
          userId: reporterId,
          type: "bug_report_update",
          title: `Statut de votre bug : ${status === "FIXED" ? "Corrigé" : status === "IN_PROGRESS" ? "En cours" : status === "CLOSED" ? "Fermé" : "Ouvert"}`,
          body: adminNote ? String(adminNote).slice(0, 300) : `Votre rapport « ${bug.title} » est passé au statut ${status}.`,
          data: {
            bugId: id,
            status,
            ...(adminNote ? { adminNote: String(adminNote).slice(0, 500) } : {}),
          },
        },
      })
    }

    return NextResponse.json({ ok: true, data: updatedData })
  } catch (error) {
    return handleAuthError(error)
  }
}
