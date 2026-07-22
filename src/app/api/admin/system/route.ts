import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    return NextResponse.json({
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
      },
      env: process.env.NODE_ENV,
      cwd: process.cwd(),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
