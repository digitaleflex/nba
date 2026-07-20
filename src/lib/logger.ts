import pino from "pino"

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug")

/**
 * Structured logger using pino.
 * In production: JSON output to stdout (parsed by Docker/Kubernetes/PM2 logs).
 * In development: pretty-printed with pino-pretty.
 *
 * @example
 * import { logger } from "@nba/lib/logger"
 * logger.info({ userId, action: "login" }, "User authenticated")
 * logger.error({ err, jobId }, "Job processing failed")
 */
export const logger = pino({
  level,
  ...(process.env.NODE_ENV !== "production"
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
  base: process.env.SERVICE_NAME ? { service: process.env.SERVICE_NAME } : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
})

/**
 * Create a child logger with a fixed module prefix.
 *
 * @example
 * const log = logger.child({ module: "worker:cleanup" })
 * log.info("Worker started")
 */
export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings)
}
