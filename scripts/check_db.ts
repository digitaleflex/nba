import { PrismaClient } from "../src/generated/prisma/client";
import * as fs from "fs";

const envPath = fs.existsSync(".env.local") ? ".env.local" : ".env";
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  const dbUrlMatch = envFile.match(/^DATABASE_URL=(.+)$/m);
  if (dbUrlMatch) {
    process.env.DATABASE_URL = dbUrlMatch[1].replace(/['"]/g, "").trim();
  }
}

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.$queryRawUnsafe<any[]>(`
      SELECT onboarding_status, COUNT(*) as count
      FROM users
      GROUP BY onboarding_status
    `);
    console.log("=== USER STATUSES ===");
    users.forEach((u) =>
      console.log(`${u.onboarding_status}: ${Number(u.count)}`),
    );

    const total = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total FROM users`,
    );
    console.log("Total users:", Number(total[0].total));
  } catch (e) {
    console.error(e);
  }
}

main().finally(() => prisma.$disconnect());
