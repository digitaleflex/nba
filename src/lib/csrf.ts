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

  // Rejeter les requêtes qui modifient l'état sans origine/referer vérifiable.
  // Les navigateurs envoient toujours Origin (ou Referer) sur les requêtes cross-site
  // et same-site ; son absence pour un POST/PUT/DELETE indique un contexte non navigable
  // (curl, serveur-à-serveur non autorisé) et doit être bloqué par défaut.
  if (!origin && !referer) {
    return NextResponse.json({ error: "Forbidden — missing origin/referer" }, { status: 403 })
  }

  const originOk = origin ? ALLOWED_ORIGINS.some((o) => new URL(origin).origin === o) : false
  const refererOk = referer ? ALLOWED_ORIGINS.some((o) => referer.startsWith(o)) : false

  if (!originOk && !refererOk) {
    return NextResponse.json({ error: "Forbidden — cross-origin request rejected" }, { status: 403 })
  }

  return null
}