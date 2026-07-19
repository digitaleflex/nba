import { NextResponse } from "next/server"
import { getServerSession } from "./get-session"
import { prisma } from "./db"
import { ValidationError } from "./validations"
import { Prisma } from "../generated/prisma/client"

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
  if (!session || !session.user) throw new AuthError("Non authentifié", 401)
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
  if (!user || !user.isActive || !user.role || !allowedRoles.includes(user.role.name)) {
    throw new AuthError("Accès refusé", 403)
  }
  return session
}

export function isAdminRole(roleName: string | null | undefined): boolean {
  return roleName === "ADMIN" || roleName === "SUPER_ADMIN"
}

export async function requirePermission(permissionName: string) {
  const session = await requireAuth()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isActive: true,
      role: {
        select: {
          permissions: {
            select: { permission: { select: { name: true } } },
          },
        },
      },
    },
  })
  if (!user || !user.isActive) throw new AuthError("Accès refusé", 403)
  if (!user.role) throw new AuthError("Accès refusé", 403)

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

  // Erreurs Prisma typées → codes HTTP métiers appropriés (évite les 500 systématiques)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`[auth-utils] Prisma error ${error.code}:`, error.meta)
    switch (error.code) {
      case "P2025":
        return NextResponse.json({ error: "Ressource introuvable." }, { status: 404 })
      case "P2002":
        return NextResponse.json({ error: "Ressource en conflit (contrainte unique)." }, { status: 409 })
      case "P2003":
        return NextResponse.json({ error: "Référence invalide (clé étrangère)." }, { status: 400 })
      default:
        return NextResponse.json(
          { error: "Une erreur de base de données est survenue." },
          { status: 500 },
        )
    }
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("[auth-utils] Prisma validation error:", error.message)
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("[auth-utils] Prisma init error:", error.message)
    return NextResponse.json(
      { error: "Base de données temporairement indisponible. Réessayez plus tard." },
      { status: 503 },
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
