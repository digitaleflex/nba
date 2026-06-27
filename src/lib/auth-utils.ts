import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "./auth"
import { prisma } from "./db"

export class AuthError extends Error {
  public statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.name = "AuthError"
    this.statusCode = statusCode
  }
}

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new AuthError("Non authentifié", 401)
  return session
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: { select: { name: true } } },
  })
  if (!user || !allowedRoles.includes(user.role.name)) {
    throw new AuthError("Accès refusé", 403)
  }
  return session
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    )
  }
  throw error
}
