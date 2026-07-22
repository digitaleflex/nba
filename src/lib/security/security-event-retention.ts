import { prisma } from "../db"
import { logger } from "../logger"
import { CATALOG } from "./security-event-catalog"

const log = logger.child({ module: "security-event-retention" })

export class SecurityEventRetention {
  async purgeOldEvents(): Promise<{ purged: number }> {
    try {
      let totalPurged = 0

      for (const meta of Object.values(CATALOG)) {
        try {
          const cutoff = new Date(Date.now() - meta.retentionDays * 86400000)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (prisma as any).securityEvent.deleteMany({
            where: {
              type: meta.type,
              createdAt: { lt: cutoff },
            },
          })

          if (result.count > 0) {
            totalPurged += result.count
            log.info({ type: meta.type, purged: result.count, retentionDays: meta.retentionDays },
              "Evenements de securite purges")
          }
        } catch {
          const cutoff = new Date(Date.now() - 90 * 86400000)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (prisma as any).securityEvent.deleteMany({
            where: {
              type: meta.type,
              createdAt: { lt: cutoff },
            },
          })
          totalPurged += result.count
        }
      }

      return { purged: totalPurged }
    } catch (err) {
      log.error({ err, errorCode: "INTEGRATION_ERROR" }, "Echec purge des evenements de securite")
      return { purged: 0 }
    }
  }
}

export const securityEventRetention = new SecurityEventRetention()
