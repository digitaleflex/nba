import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { handleAuthError } from "@nba/lib/auth-utils"
import { msg } from "@nba/lib/messages"

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: msg.auth.NOT_AUTHENTICATED }, { status: 401 })
    }

    // Vérifier le rôle
    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })

    if (!userDb?.role || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: msg.auth.UNAUTHORIZED }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""

    if (query.length < 2) {
      return NextResponse.json({ users: [], signals: [], kyc: [], audit: [] })
    }

    const [users, signals, kyc, audit] = await Promise.all([
    // Recherche Utilisateurs
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    // Recherche Signaux
    prisma.signal.findMany({
      where: {
        content: { contains: query, mode: "insensitive" },
      },
      take: 5,
      select: {
        id: true,
        content: true,
        status: true,
      },
    }),
    // Recherche KYC
    prisma.kycDocument.findMany({
      where: {
        user: {
          name: { contains: query, mode: "insensitive" },
        },
      },
      take: 5,
      select: {
        id: true,
        documentType: true,
        status: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
    // Recherche Journal d'audit
    prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: query, mode: "insensitive" } },
          { resourceType: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        resourceType: true,
        createdAt: true,
      },
    }),
    ])

    return NextResponse.json({ users, signals, kyc, audit })
  } catch (error) {
    return handleAuthError(error)
  }
}
