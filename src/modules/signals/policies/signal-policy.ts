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
    if (user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN") return true
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
   * Seuls le créateur (avec permission signals.create) ou un administrateur peuvent publier.
   */
  static async canPublish(
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
   * Accès accordé si l'utilisateur a une demande d'accès APPROUVÉE
   * pour l'un des plans ciblés par le signal, ou si admin/override.
   */
  static async canView(userId: string, signalId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { name: true } },
        isActive: true,
        signalsAccessOverride: true,
      },
    })
    if (!user) return false
    if (!user.isActive) return false
    if (user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN") return true
    if (user.signalsAccessOverride) return true

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
