import { NextRequest, NextResponse } from "next/server"
import { verifyCaptcha } from "@nba/lib/captcha"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    const { checkRateLimit } = await import("@nba/lib/rate-limit")
    const { allowed } = await checkRateLimit(`captcha:${ip}`, { window: 60, max: 30 })
    if (!allowed) return NextResponse.json({ valid: false, error: "Trop de tentatives" }, { status: 429 })

    const { token, answer } = await req.json()
    if (!token || answer === undefined) {
      return NextResponse.json({ valid: false, error: "Paramètres manquants" }, { status: 400 })
    }
    const valid = verifyCaptcha(token, answer)
    return NextResponse.json({ valid })
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 })
  }
}
