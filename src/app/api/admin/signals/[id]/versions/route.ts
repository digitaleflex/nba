import { NextRequest, NextResponse } from "next/server"
import { getSignalVersions } from "@nba/modules/signals/services/get-signals"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("signals.create")
    const { id } = await params
    const versions = await getSignalVersions(id, session.user.id)
    return NextResponse.json(versions)
  } catch (error) {
    return handleAuthError(error)
  }
}
