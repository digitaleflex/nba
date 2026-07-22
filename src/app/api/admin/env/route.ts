import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

const SECRET_KEYS = ["SECRET", "PASSWORD", "TOKEN", "KEY", "PRIVATE", "PASS", "DSN", "SECRET"]

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const vars = Object.entries(process.env).map(([key, value]) => {
      const isSecret = SECRET_KEYS.some(sk => key.toUpperCase().includes(sk))
      return {
        key,
        value: isSecret ? "••••••••" : (value ?? ""),
        isSecret,
        length: value?.length ?? 0,
      }
    }).sort((a, b) => a.key.localeCompare(b.key))
    return NextResponse.json({ vars, count: vars.length })
  } catch (error) {
    return handleAuthError(error)
  }
}
