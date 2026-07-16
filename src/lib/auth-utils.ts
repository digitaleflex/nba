import { NextResponse } from "next/server"
import { getServerSession } from "./get-session"
import { prisma } from "./db"
import { ValidationError } from "./validations"

export class AuthError extends Error {
  public statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.name = "AuthError"
    this.statusCode = statusCode
  }
}

export async function requireAuth() {
  const session = await getServerSession()
  if (!session) throw new AuthError("Non authentifié", 401)
  return session
}

/**
 * Vérifie l'authentification + que le compte est actif (pas suspendu).
 */
export async function requireActiveUser() {
  const session = await requireAuth()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true },
  })
  if (!user || !user.isActive) {
    throw new AuthError("Votre compte a été suspendu. Contactez le support.", 403)
  }
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

export async function requirePermission(permissionName: string) {
  const session = await requireAuth()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: {
        select: {
          permissions: {
            select: { permission: { select: { name: true } } },
          },
        },
      },
    },
  })
  if (!user) throw new AuthError("Accès refusé", 403)

  const hasPermission = user.role.permissions.some(
    (rp: any) => rp.permission.name === permissionName,
  )
  if (!hasPermission) throw new AuthError("Accès refusé", 403)

  return session
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    )
  }
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 },
    )
  }
  console.error("[auth-utils] Unexpected error:", error)
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Erreur interne du serveur" },
    { status: 500 },
  )
}
