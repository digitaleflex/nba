import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@nba/lib/auth"
import { prisma } from "@nba/lib/db"

export async function POST(req: NextRequest) {
  const { planId } = await req.json()
  if (!planId) {
    return NextResponse.json({ error: "Plan requis" }, { status: 400 })
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  await prisma.accessRequest.create({
    data: { userId: session.user.id, planId },
  })

  return NextResponse.json({ ok: true })
}
