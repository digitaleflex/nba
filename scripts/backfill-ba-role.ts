// Backfill CLI : initialise la colonne ba_role (rôle better-auth, utilisé par
// l'impersonation admin) à partir du RBAC custom. "admin" pour ADMIN/
// SUPER_ADMIN, "user" sinon. Idempotent.
//   pnpm tsx scripts/backfill-ba-role.ts
// (ou via l'endpoint /api/admin/sync-ba-role depuis l'UI admin)
import { syncBaRole } from "../src/lib/services/sync-ba-role"
import { prisma } from "../src/lib/db"

syncBaRole()
  .then(({ updated }) => {
    console.log(`ba_role initialisé pour ${updated} utilisateur(s).`)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
