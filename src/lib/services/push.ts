import webpush from "web-push";
import { prisma } from "@nba/lib/db";
import { logger } from "@nba/lib/logger";
import { createCircuitBreaker, withTimeout } from "@nba/lib/circuit-breaker";

const log = logger.child({ module: "push" })

const pushBreaker = createCircuitBreaker("push", {
  threshold: 5,
  cooldownMs: 60_000,
  onOpen: (name) => {
    import("../security/admin-alert").then(({ sendAdminPanic }) => {
      sendAdminPanic(
        "⚠️ Circuit breaker ouvert : Push",
        `<h2>Circuit breaker "${name}" ouvert</h2>
<p>L'envoi de notifications push est temporairement désactivé après 5 échecs consécutifs.</p>
<p>Le circuit se refermera automatiquement après 60 secondes si l'appel suivant réussit.</p>`
      )
    })
  },
})

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@signauxx.com";

  if (!publicKey || !privateKey) {
    log.warn("Clés VAPID non configurées, notifications push désactivées");
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  image?: string;
  tag?: string;
}

interface ErrorCounter {
  count: number
  expiresAt: number
}
const errorCounters = new Map<string, ErrorCounter>()
const ERROR_COUNTER_TTL = 60 * 60 * 1000 // 1h

function cleanupErrorCounters(): void {
  const now = Date.now()
  for (const [key, val] of errorCounters) {
    if (now > val.expiresAt) errorCounters.delete(key)
  }
}

function shouldDeleteSub(statusCode: number): boolean {
  return [400, 403, 404, 410, 413].includes(statusCode)
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number; skipped?: "NOT_CONFIGURED" | "NO_SUBSCRIPTION" | "INACTIVE" }> {
  configure();
  if (!configured) return { sent: 0, failed: 0, skipped: "NOT_CONFIGURED" };

  // Ne pas envoyer de push à un utilisateur suspendu
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  if (!user?.isActive) return { sent: 0, failed: 0, skipped: "INACTIVE" };

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, skipped: "NO_SUBSCRIPTION" };
  }

  const jsonPayload = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const errors: Record<number, number> = {};

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await pushBreaker.execute(() =>
          withTimeout(async () => {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              jsonPayload,
              {
                urgency: "high",
                TTL: Number(process.env.PUSH_TTL_SECONDS ?? 15 * 60),
                topic: payload.tag?.slice(0, 32),
              },
            );
          }, 10_000),
        );
        sent++;
        await prisma.pushSubscription.update({ where: { id: sub.id }, data: { lastSuccessAt: new Date(), failureCount: 0, lastErrorCode: null } }).catch(() => {})
      } catch (err: any) {
        failed++;
        const code = err.statusCode || 0
        errors[code] = (errors[code] || 0) + 1

        // Suivi observabilité (PUSH-3) : enregistrer l'échec sans supprimer
        // l'abonnement pour une panne passagère.
        await prisma.pushSubscription.update({ where: { id: sub.id }, data: { lastFailureAt: new Date(), lastErrorCode: code || null, failureCount: { increment: 1 } } }).catch(() => {})

        const shouldDelete = [400, 401, 403, 404, 410, 413].includes(code)
        if (shouldDelete) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch((err) => {
            log.warn({ err, subscriptionId: sub.id, errorCode: "DATABASE_ERROR" }, "Failed to delete expired push subscription")
          });
        } else if (code >= 500 || code === 0) {
          const key = `${sub.endpoint.slice(0, 40)}:${code}`
          cleanupErrorCounters()
          const prev = errorCounters.get(key)
          const nextCount = (prev?.count ?? 0) + 1
          errorCounters.set(key, { count: nextCount, expiresAt: Date.now() + ERROR_COUNTER_TTL })
          // Ne supprimer qu'après N jours sans succès : ici on garde l'abonnement.
        }
      }
    })
  );

  const errorSummary = Object.entries(errors)
    .filter(([_, count]) => count > 0)
    .map(([code, count]) => `${code}=${count}`)
    .join(", ")

  if (failed > 0) {
    log.warn({ userId: userId.slice(0, 8), sent, failed, errors: errorSummary, errorCode: "INTEGRATION_ERROR" }, "Push send had failures")
  }

  return { sent, failed };
}
