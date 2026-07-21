import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logger } from "./logger";

const log = logger.child({ module: "db" })

const DEFAULT_ROLE_NAME = "MEMBER";

// ── Prisma error codes eligible for retry ──
const RETRYABLE_PRISA_CODES = new Set([
  "P1001", // Can't reach database server
  "P1008", // Operations timed out
  "P1017", // Server closed connection
  "P2028", // Transaction timeout
  "P2034", // Deadlock / serialization failure
]);

function isRetryableTransactionError(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    return RETRYABLE_PRISA_CODES.has((err as { code: string }).code);
  }
  const msg = err instanceof Error ? err.message : "";
  return /ECONNRESET|EPIPE|ETIMEDOUT|connection closed/i.test(msg);
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: parseInt(process.env.DB_POOL_MAX ?? "5", 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? "60000", 10),
    ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  })

  const base = new PrismaClient({
    adapter: new PrismaPg(pool),
    // Query timeout: abort any query running for more than 30 seconds
    transactionOptions: {
      maxWait: 10_000,   // Max 10s to acquire a transaction
      timeout: 30_000,   // Max 30s for the transaction to complete
    },
  });

  // ── Global query-level retry middleware (Prisma $use) ──
  ;(base as any).$use(async (params: any, next: any) => {
    const maxRetries = 2
    let lastError: unknown

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await next(params)
      } catch (err) {
        lastError = err
        if (attempt >= maxRetries || !isRetryableTransactionError(err)) {
          throw err
        }
        const delay = Math.min(1000 * Math.pow(2, attempt), 3000)
        log.warn(
          { attempt: attempt + 1, maxRetries, delayMs: delay, err, model: params.model, action: params.action, errorCode: "DATABASE_ERROR" },
          "Query retry",
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError
  })

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

// ── QW1: Retry Prisma transactions with exponential backoff ──

const TRANSACTION_MAX_RETRIES = 3;
const TRANSACTION_BASE_DELAY_MS = 1000;

/**
 * Wraps prisma.$transaction with automatic retry on transient errors
 * (deadlock, timeout, connection lost). Uses exponential backoff.
 *
 * @example
 * const result = await withRetryTransaction((tx) =>
 *   tx.user.update({ where: { id }, data: { name: "New" } })
 * );
 */
export async function withRetryTransaction<T>(
  fn: (tx: any) => Promise<T>,
  maxRetries = TRANSACTION_MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn);
    } catch (err) {
      lastError = err;

      if (attempt >= maxRetries || !isRetryableTransactionError(err)) {
        throw err;
      }

      const delay = TRANSACTION_BASE_DELAY_MS * Math.pow(2, attempt);
      log.warn(
        { attempt: attempt + 1, maxRetries, delayMs: delay, err, errorCode: "DATABASE_ERROR" },
        "Transaction retry",
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wraps prisma.$transaction (array syntax) with automatic retry.
 */
export async function withRetryTransactionArray<T>(
  operations: any[],
  maxRetries = TRANSACTION_MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(operations) as T;
    } catch (err) {
      lastError = err;

      if (attempt >= maxRetries || !isRetryableTransactionError(err)) {
        throw err;
      }

      const delay = TRANSACTION_BASE_DELAY_MS * Math.pow(2, attempt);
      log.warn(
        { attempt: attempt + 1, maxRetries, delayMs: delay, err, errorCode: "DATABASE_ERROR" },
        "Transaction array retry",
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
