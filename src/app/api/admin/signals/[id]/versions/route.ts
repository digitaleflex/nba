import { NextRequest, NextResponse } from "next/server"
import { getSignalVersions } from "@nba/modules/signals/services/get-signals"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { validateId } from "@nba/lib/validations"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("signals.create")
    const { id } = await params
    const idCheck = validateId(id)
    if (!idCheck.valid) return idCheck.response
    const versions = await getSignalVersions(id, session.user.id)
    return NextResponse.json(versions)
  } catch (error) {
    return handleAuthError(error)
  }
}
