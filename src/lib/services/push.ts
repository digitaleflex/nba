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
    console.warn("[push] VAPID keys not configured, push notifications disabled");
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
  tag?: string;
}

const errorCounters = new Map<string, number>()

function shouldDeleteSub(statusCode: number): boolean {
  return [400, 403, 404, 410, 413].includes(statusCode)
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  configure();
  if (!configured) return { sent: 0, failed: 0 };

  // Ne pas envoyer de push à un utilisateur suspendu
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  if (!user?.isActive) return { sent: 0, failed: 0 };

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
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
              jsonPayload
            );
          }, 10_000),
        );
        sent++;
      } catch (err: any) {
        failed++;
        const code = err.statusCode || 0
        errors[code] = (errors[code] || 0) + 1

        if (shouldDeleteSub(code)) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch((err) => {
            log.warn({ err, subscriptionId: sub.id, errorCode: "DATABASE_ERROR" }, "Failed to delete expired push subscription")
          });
        } else if (code >= 500 || code === 0) {
          const key = `${sub.endpoint.slice(0, 40)}:${code}`
          errorCounters.set(key, (errorCounters.get(key) || 0) + 1)
          if ((errorCounters.get(key) || 0) >= 3) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch((err) => {
              log.warn({ err, subscriptionId: sub.id, errorCode: "DATABASE_ERROR" }, "Failed to delete unreliable push subscription")
            });
          }
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
