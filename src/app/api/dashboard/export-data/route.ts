import { NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { logAuditEvent } from "@nba/lib/services/audit"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { msg } from "@nba/lib/messages"

const log = logger.child({ module: "export-data" })

const exportRateLimit = rateLimitMiddleware({ window: 3600, max: 5 })

export async function GET(request: Request) {
  const requestClone = request.clone()
  try {
    const session = await requireActiveUser()

    const rateLimitRes = await exportRateLimit(requestClone, `export-data:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const userId = session.user.id

    const [
      user,
      accessRequests,
      kycDocuments,
      brokerVerifications,
      signalReads,
      signalFavorites,
      signalArchives,
      notifications,
      devices,
      conversations,
      messages,
      auditLogs,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          phone: true,
          whatsapp: true,
          country: true,
          language: true,
          onboardingStatus: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { name: true } },
        },
      }),
      prisma.accessRequest.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.kycDocument.findMany({
        where: { userId },
        select: { id: true, documentType: true, status: true, createdAt: true },
      }),
      prisma.brokerVerification.findMany({
        where: { userId },
        select: { id: true, status: true, brokerName: true, createdAt: true },
      }),
      prisma.signalRead.findMany({
        where: { userId },
        select: { signalId: true, readAt: true },
      }),
      prisma.signalFavorite.findMany({
        where: { userId },
        select: { signalId: true, createdAt: true },
      }),
      prisma.signalArchive.findMany({
        where: { userId },
        select: { signalId: true, createdAt: true },
      }),
      prisma.notification.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          body: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.device.findMany({
        where: { userId },
        select: {
          id: true,
          deviceType: true,
          brand: true,
          model: true,
          os: true,
          browser: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          lastSeenAt: true,
        },
      }),
      prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true, createdAt: true },
      }),
      prisma.message.findMany({
        where: { senderId: userId },
        select: { id: true, type: true, attachmentUrl: true, createdAt: true, conversationId: true },
      }),
      prisma.auditLog.findMany({
        where: { userId },
        select: { action: true, resourceType: true, createdAt: true, details: true },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: msg.member.NOT_FOUND_ALT }, { status: 404 })
    }

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      user,
      accessRequests,
      kycDocuments,
      brokerVerifications,
      signals: {
        reads: signalReads,
        favorites: signalFavorites,
        archives: signalArchives,
      },
      notifications,
      devices,
      conversations,
      messages,
      auditLogs,
    }

    Promise.all([
      logAuditEvent({
        userId,
        action: "EXPORT",
        resourceType: "user",
        resourceId: userId,
        details: { selfService: true },
      }),
    ]).catch((err) => {
      log.warn({ err, userId, errorCode: "DATABASE_ERROR" }, "Non-blocking audit log failed during data export")
    })

    return NextResponse.json(exportPayload, {
      headers: {
        "Content-Disposition": `attachment; filename="mes-donnees-nba-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
