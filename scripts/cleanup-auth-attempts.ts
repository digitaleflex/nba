import { prisma } from "../src/lib/db"

const RETENTION_DAYS = 90

async function main() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000)

  const deleted = await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })

  console.log(`Supprimées ${deleted.count} tentatives d'auth > ${RETENTION_DAYS} jours`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
