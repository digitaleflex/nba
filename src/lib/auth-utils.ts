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
    select: { role: { select: { name: true } }, isActive: true },
  })
  if (!user || !user.isActive || !allowedRoles.includes(user.role.name)) {
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
  // Message générique rassurant : aucun détail technique ne fuit vers le client.
  return NextResponse.json(
    {
      error:
        "Une erreur inattendue est survenue de notre côté. Réessayez dans quelques instants, ou contactez le support.",
    },
    { status: 500 },
  )
}
