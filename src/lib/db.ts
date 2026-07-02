import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_ROLE_NAME = "MEMBER";

function createPrismaClient() {
  const base = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const extended = base.$extends({
    query: {
      user: {
        async create({ args, query }: { args: any; query: any }) {
          if (!args.data.roleId) {
            const defaultRole = await base.role.findFirst({
              where: { name: DEFAULT_ROLE_NAME },
              select: { id: true },
            });
            if (defaultRole) {
              args.data.roleId = defaultRole.id;
            }
          }
          return query(args);
        },
      },
    },
  });

  return extended as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
