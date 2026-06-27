import { prisma } from "@nba/lib/db"

export class SignalPolicy {
  /**
   * Vérifie si l'utilisateur a le droit de créer un signal.
   */
  static async canCreate(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            name: true,
            permissions: {
              select: { permission: { select: { name: true } } },
            },
          },
        },
      },
    })
    if (!user) return false
    if (user.role.name === "ADMIN") return true
    return user.role.permissions.some(
      (rp: any) => rp.permission.name === "signals.create"
    )
  }

  /**
   * Vérifie si l'utilisateur a le droit de modifier un signal.
   * Seuls le créateur du signal ou un administrateur peuvent modifier un signal.
   */
  static async canUpdate(
    userId: string,
    signal: { createdBy: string; status: string }
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            name: true,
            permissions: {
              select: { permission: { select: { name: true } } },
            },
          },
        },
      },
    })
    if (!user) return false

    const isAdmin = user.role.name === "ADMIN"
    const hasCreatePermission = user.role.permissions.some(
      (rp: any) => rp.permission.name === "signals.create"
    )
    const isCreator = signal.createdBy === userId

    // L'administrateur peut tout modifier
    if (isAdmin) return true

    // Le créateur doit avoir la permission signals.create
    return isCreator && hasCreatePermission
  }

  /**
   * Vérifie si l'utilisateur a le droit de publier un signal.
   */
  static async canPublish(userId: string): Promise<boolean> {
    return this.canCreate(userId)
  }

  /**
   * Vérifie si l'utilisateur a le droit de supprimer un signal.
   * Seuls le créateur ou un administrateur peuvent supprimer un signal.
   */
  static async canDelete(
    userId: string,
    signal: { createdBy: string }
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            name: true,
            permissions: {
              select: { permission: { select: { name: true } } },
            },
          },
        },
      },
    })
    if (!user) return false

    const isAdmin = user.role.name === "ADMIN"
    const hasCreatePermission = user.role.permissions.some(
      (rp: any) => rp.permission.name === "signals.create"
    )
    const isCreator = signal.createdBy === userId

    if (isAdmin) return true
    return isCreator && hasCreatePermission
  }

  /**
   * Vérifie si un membre a le droit de visualiser un signal.
   * Un membre peut voir un signal si et seulement si il possède une demande
   * d'accès approuvée (APPROVED) pour l'un des plans ciblés par le signal.
   * Les administrateurs ont accès à tous les signaux.
   */
  static async canView(userId: string, signalId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: { name: true },
        },
      },
    })
    if (!user) return false
    if (user.role.name === "ADMIN") return true

    const audience = await prisma.signalAudience.findMany({
      where: { signalId },
      select: { planId: true },
    })
    const planIds = audience.map((a: any) => a.planId)
    if (planIds.length === 0) return false

    const approvedRequest = await prisma.accessRequest.findFirst({
      where: {
        userId,
        planId: { in: planIds },
        status: "APPROVED",
      },
    })

    return !!approvedRequest
  }
}
