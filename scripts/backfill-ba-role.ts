// Backfill : initialise la colonne ba_role (rôle better-auth, utilisé par
// l'impersonation admin) à partir du RBAC custom. "admin" pour ADMIN/
// SUPER_ADMIN, "user" sinon. À exécuter une fois après l'ajout du champ
// ba_role (prisma db push) :
//   pnpm tsx scripts/backfill-ba-role.ts
import { prisma } from "../src/lib/db"

async function main() {
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
  console.log(`ba_role initialisé pour ${updated} utilisateur(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
