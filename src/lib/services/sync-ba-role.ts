import { prisma } from "@nba/lib/db"

// Synchronise la colonne ba_role (rôle better-auth pour l'impersonation admin)
// à partir du RBAC custom : "admin" pour ADMIN/SUPER_ADMIN, "user" sinon.
// Idempotent : peut être relancé sans effet de bord.
export async function syncBaRole(): Promise<{ updated: number }> {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, role: { select: { name: true } } },
  })
  let updated = 0
  for (const u of users) {
    const baRole = ["ADMIN", "SUPER_ADMIN"].includes(u.role.name) ? "admin" : "user"
    await prisma.user.update({
      where: { id: u.id },
      data: { baRole },
    })
    updated++
  }
  return { updated }
}
