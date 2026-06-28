import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { validateId } from "@nba/lib/validations"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("signals.create")

    const { id } = await params
    const idCheck = validateId(id)
    if (!idCheck.valid) return idCheck.response

    await prisma.signalTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleAuthError(err)
  }
}
