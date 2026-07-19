import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getActionLabel, getResourceLabel } from "@nba/lib/audit/labels"
import { renderDescription } from "@nba/lib/audit/renderers"
import { createHash } from "node:crypto"
import PDFDocument from "pdfkit"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") ?? ""
    const action = searchParams.get("action") ?? ""
    const resourceType = searchParams.get("resourceType") ?? ""
    const resourceId = searchParams.get("resourceId") ?? ""
    const startDate = searchParams.get("startDate") ?? ""
    const endDate = searchParams.get("endDate") ?? ""
    const limit = Math.min(5000, Math.max(1, parseInt(searchParams.get("limit") ?? "1000")))

    const where: Record<string, unknown> = {}

    if (query) {
      where.OR = [
        { searchText: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ]
    }

    if (action) where.action = action
    if (resourceType) where.resourceType = resourceType
    if (resourceId) where.resourceId = resourceId

    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {}
      if (startDate) createdAt.gte = new Date(startDate)
      if (endDate) createdAt.lte = new Date(endDate)
      where.createdAt = createdAt
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        details: true,
        ipAddress: true,
        createdAt: true,
        hash: true,
        user: { select: { name: true, email: true } },
      },
    })

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: "Rapport d'audit",
        Author: "NBA — Never Broke Again",
        Subject: "Centre d'audit",
        Keywords: "audit, sécurité, conformité",
      },
    })

    const chunks: Buffer[] = []
    doc.on("data", (c) => chunks.push(c))

    const font = "Helvetica"
    const bold = "Helvetica-Bold"

    // Helper: draw a cell in a table
    const colX = [50, 110, 220, 330, 440]
    const colW = [60, 110, 110, 110, 100]

    function drawHeader(y: number) {
      doc.fontSize(7).font(bold)
      const headers = ["Date", "Action", "Ressource", "Utilisateur", "Description"]
      headers.forEach((h, i) => doc.text(h, colX[i], y, { width: colW[i], continued: false }))
      doc.moveTo(50, y + 12).lineTo(545, y + 12).strokeColor("#ccc").stroke()
      return y + 16
    }

    // ── En-tête ──
    doc.fontSize(18).font(bold).text("Centre d'audit", 50, 50)
    doc.fontSize(10).font(font).text("Rapport d'audit — NBA (Never Broke Again)", 50, 76)
    doc.moveTo(50, 94).lineTo(545, 94).strokeColor("#333").stroke()

    let y = 110
    doc.fontSize(8).font(font)
    doc.text(`Généré le : ${new Date().toLocaleString("fr-FR")}`, 50, y)
    y += 14
    doc.text(`Nombre d'événements : ${logs.length}`, 50, y)
    y += 14
    if (startDate) doc.text(`Du : ${new Date(startDate).toLocaleDateString("fr-FR")}`, 50, y)
    if (endDate) {
      doc.text(`Au : ${new Date(endDate).toLocaleDateString("fr-FR")}`, startDate ? 200 : 50, y)
    }
    if (startDate || endDate) y += 14
    y += 10

    // ── Tableau ──
    y = drawHeader(y)

    let entryCount = 0
    for (const log of logs) {
      if (y > 720) {
        doc.addPage()
        y = 50
        y = drawHeader(y)
      }

      const d = log.details as Record<string, unknown> | null
      const resourceLabel = d?.resourceLabel as string | undefined
      const description = renderDescription({
        action: log.action,
        resourceType: log.resourceType,
        resourceLabel: resourceLabel ?? null,
        details: d ?? null,
        user: log.user ?? null,
      })

      const date = new Date(log.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      })
      const actionLabel = getActionLabel(log.action)
      const resourceLabelText = getResourceLabel(log.resourceType)
      const userText = log.user?.name ?? log.user?.email ?? "Système"
      const descText = description.length > 80 ? description.slice(0, 77) + "..." : description

      const rowH = 22

      doc.fontSize(7).font(font)
      doc.text(date, colX[0], y, { width: colW[0], continued: false })
      doc.text(actionLabel, colX[1], y, { width: colW[1], continued: false })
      doc.text(resourceLabelText, colX[2], y, { width: colW[2], continued: false })
      doc.text(userText, colX[3], y, { width: colW[3], continued: false })
      doc.text(descText, colX[4], y, { width: colW[4], continued: false })

      y += rowH
      entryCount++

      // Ligne de séparation légère
      if (entryCount % 5 === 0) {
        doc.moveTo(50, y).lineTo(545, y).strokeColor("#eee").stroke()
      }
    }

    // ── Signature d'intégrité ──
    y = Math.max(y + 30, 700)
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#333").stroke()
    y += 16
    doc.fontSize(9).font(bold).text("Signature d'intégrité SHA-256", 50, y)
    y += 16

    // Compute SHA-256 of the entire content
    const contentForHash = logs
      .map(
        (l) =>
          `${l.createdAt.toISOString()}|${l.action}|${l.resourceType}|${l.resourceId ?? ""}|${l.user?.email ?? ""}|${l.ipAddress ?? ""}`
      )
      .join("\n")
    const hash = createHash("sha256").update(contentForHash, "utf-8").digest("hex")

    doc.fontSize(7).font("Courier").fillColor("#666")
    const hashLines = hash.match(/.{1,64}/g) ?? []
    hashLines.forEach((line) => {
      doc.text(line, 50, y, { width: 495 })
      y += 10
    })
    doc.fillColor("#000")

    doc.fontSize(7).font(font)
    y += 10
    doc.text(
      `Cette signature permet de vérifier que le contenu du rapport n'a pas été modifié après sa génération.`,
      50,
      y
    )

    // ── Pied de page (numérotation) ──
    const totalPages = doc.bufferedPageRange().count
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i)
      doc.fontSize(7).font(font).fillColor("#999")
      doc.text(
        `NBA — Centre d'audit | Page ${i + 1}/${totalPages} | ${new Date().toLocaleDateString("fr-FR")}`,
        50,
        800,
        { align: "center", width: 495 }
      )
      doc.fillColor("#000")
    }

    doc.end()

    return new Promise<NextResponse>((resolve) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(
          new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="audit-${new Date().toISOString().slice(0, 10)}.pdf"`,
              "Content-Length": String(pdfBuffer.length),
            },
          })
        )
      })
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
