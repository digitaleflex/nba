import { NextRequest, NextResponse } from "next/server"
import { ErrorCode, errorResponse } from "@nba/lib/errors"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { msg } from "@nba/lib/messages"

const checkLoginRateLimit = rateLimitMiddleware({ window: 60, max: 10 })

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email) {
    return errorResponse(400, ErrorCode.VALIDATION_MISSING_FIELD, msg.auth.EMAIL_REQUIRED)
  }

  const rateLimitRes = await checkLoginRateLimit(req, `check-login:${email}`)
  if (rateLimitRes) return rateLimitRes

  // Anti-énumération : toujours retourner "ok".
  // Les erreurs spécifiques (banni, inactif, supprimé) sont affichées
  // uniquement après échec du login, côté serveur, sans fuiter l'état du compte.
  return NextResponse.json({ status: "ok" })
}
