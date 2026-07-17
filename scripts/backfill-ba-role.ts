// Backfill : synchronise la colonne ba_role (rôle better-auth, utilisé par
// l'impersonation admin) avec le RBAC custom (role.name) pour tous les users.
// À exécuter une fois après l'ajout du champ ba_role :
//   pnpm tsx scripts/backfill-ba-role.ts
import { prisma } from "../src/lib/db"

async function main() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, role: { select: { name: true } } },
  })
  let updated = 0
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { baRole: u.role.name },
    })
    updated++
  }
  console.log(`ba_role synchronisé pour ${updated} utilisateur(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
