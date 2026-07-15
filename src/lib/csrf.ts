import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "https://access.signauxx.com",
  "https://access.signaux.com",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean) as string[]

export function csrfCheck(req: NextRequest): Response | null {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return null
  }

  const origin = req.headers.get("origin")
  const referer = req.headers.get("referer")

  // Skip if no origin (e.g., native apps, curl, server-to-server)
  if (!origin && !referer) return null

  const originOk = origin ? ALLOWED_ORIGINS.some((o) => origin.startsWith(o)) : false
  const refererOk = referer ? ALLOWED_ORIGINS.some((o) => referer.startsWith(o)) : false

  if (!originOk && !refererOk) {
    return NextResponse.json({ error: "Forbidden — cross-origin request rejected" }, { status: 403 })
  }

  return null
}