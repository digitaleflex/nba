import { getServerSession } from "./get-session"
import { prisma } from "./db"
import { AppError } from "./errors/app-error"
import { ErrorCode } from "./errors/codes"
import { handleError } from "./errors/handler"

export class AuthError extends AppError {
  constructor(message: string, statusCode: number) {
    super({
      code: statusCode === 401 ? ErrorCode.AUTH_UNAUTHENTICATED
        : statusCode === 403 ? ErrorCode.AUTH_FORBIDDEN
        : ErrorCode.AUTH_UNAUTHENTICATED,
      message,
      httpStatus: statusCode,
      module: "auth",
    })
    this.name = "AuthError"
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

export async function handleAuthError(error: unknown) {
  return handleError(error, { route: "auth-utils" })
}
