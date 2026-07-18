import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { isEmailBanned } from "@nba/lib/services/moderation"

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { deletedAt: true, isActive: true, suspendedAt: true, updatedAt: true },
  })

  if (user?.deletedAt) {
    return NextResponse.json({
      status: "deleted",
      at: user.deletedAt.toISOString(),
      message: "Ce compte a été supprimé.",
    })
  }

  if (user && !user.isActive) {
    return NextResponse.json({
      status: "inactive",
      at: (user.suspendedAt ?? user.updatedAt).toISOString(),
      message: "Ce compte est désactivé. Contactez le support.",
    })
  }

  const banned = await isEmailBanned(email)
  if (banned) {
    return NextResponse.json({
      status: "banned",
      at: banned.bannedAt,
      message: `Ce compte a été banni : ${banned.reason}. Contactez le support.`,
    })
  }

  return NextResponse.json({ status: "ok" })
}
