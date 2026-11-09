import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"

export async function requireAdmin() {
  const session = await getServerSession()
  if (!session?.user) {
    const err = new Error("Non authentifié") as Error & { httpStatus: number }
    err.httpStatus = 401
    throw err
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, role: { select: { name: true } } },
  })
  const role = user?.role?.name
  if (!user?.isActive || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    const err = new Error("Accès refusé") as Error & { httpStatus: number }
    err.httpStatus = 403
    throw err
  }
  return session
}

export function adminError(error: unknown) {
  const status =
    error instanceof Error && "httpStatus" in error
      ? Number((error as Error & { httpStatus: number }).httpStatus) || 500
      : 500
  const message = error instanceof Error ? error.message : "Erreur interne"
  return Response.json({ error: message }, { status })
}
