import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"

const undoHandlers: Record<string, (id: string) => Promise<void>> = {
  "unban": async (email) => {
    await prisma.ban.deleteMany({ where: { email } })
  },
  "restore-member": async (userId) => {
    await prisma.user.update({ where: { id: userId }, data: { isActive: true } })
  },
  "unarchive-signal": async (signalId) => {
    await prisma.signal.update({ where: { id: signalId }, data: { deletedAt: null } })
  },
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { id } = await params

    const [actionType, ...rest] = id.split(":")
    const targetId = rest.join(":")

    const handler = undoHandlers[actionType]
    if (!handler) {
      return NextResponse.json({ error: `Type d'action inconnu : ${actionType}` }, { status: 400 })
    }

    await handler(targetId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
