import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { logAuditEvent } from "@nba/lib/services/audit"

export async function PUT(request: Request) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])

    const body = await request.json()
    const { smtpHost, smtpPort, smtpTls, smtpUser, smtpPass, smtpFrom } = body

    const settings = [
      { key: "smtp_host", value: smtpHost || "" },
      { key: "smtp_port", value: smtpPort || "587" },
      { key: "smtp_tls", value: smtpTls || "TLS" },
      { key: "smtp_user", value: smtpUser || "" },
      { key: "smtp_pass", value: smtpPass || "" },
      { key: "smtp_from", value: smtpFrom || "" },
    ]

    const changedKeys: string[] = []
    for (const setting of settings) {
      const existing = await prisma.setting.findUnique({
        where: { key: setting.key },
        select: { value: true },
      })
      if (existing && existing.value !== setting.value) {
        changedKeys.push(setting.key)
      } else if (!existing && setting.value) {
        changedKeys.push(setting.key)
      }

      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    }

    if (changedKeys.length > 0) {
      await logAuditEvent({
        userId: session.user.id,
        action: "UPDATE",
        resourceType: "settings",
        details: {
          changes: changedKeys,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return handleAuthError(error)
  }
}

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })

    if (!userDb || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ["smtp_host", "smtp_port", "smtp_tls", "smtp_user", "smtp_pass", "smtp_from"] },
      },
    })

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json(settingsMap)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
