import { NextRequest, NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { resolveReport } from "@nba/lib/services/messaging"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { reportId } = await params
    await resolveReport(reportId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
