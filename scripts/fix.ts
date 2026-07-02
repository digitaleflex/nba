import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient();
async function main() {
  console.log("Updating user statuses to ACTIVE to allow enum migration...");
  await prisma.$executeRawUnsafe(
    `UPDATE users SET onboarding_status = 'ACTIVE'`,
  );
  console.log("Done.");
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
