import type { PrismaClient } from "@nba/generated/prisma/client"
import { withRetryTransactionArray } from "@nba/lib/db"

const COOLDOWN_HOURS = 72
const COOLDOWN_SECONDS = COOLDOWN_HOURS * 3600
const COOLDOWN_PREFIX = "cooldown:deleted:"

/**
 * Retourne un timestamp Unix (secondes) pour un cooldown.
 */
function cooldownKey(email: string): string {
  return `${COOLDOWN_PREFIX}${email.toLowerCase().trim()}`
}

/**
 * Enregistre l'email d'un utilisateur qui vient de supprimer son compte.
 * Cet email ne pourra pas être réutilisé pendant 72h.
 */
export async function setDeleteCooldown(email: string): Promise<void> {
  try {
    const { getConnection } = await import("@nba/lib/redis-pubsub")
    const redis = getConnection()
    if (redis) {
      const key = cooldownKey(email)
      await redis.setex(key, COOLDOWN_SECONDS, Date.now().toString())
    }
  } catch {
    // Redis indisponible — le cooldown ne s'applique pas
  }
}

/**
 * Vérifie si un email est en période de cooldown après suppression.
 * Retourne le nombre d'heures restantes, ou 0 si pas de cooldown.
 */
export async function getDeleteCooldown(email: string): Promise<{ blocked: boolean; remainingHours: number }> {
  try {
    const { getConnection } = await import("@nba/lib/redis-pubsub")
    const redis = getConnection()
    if (redis) {
      const key = cooldownKey(email)
      const ttl = await redis.ttl(key)
      if (ttl > 0) {
        return { blocked: true, remainingHours: Math.ceil(ttl / 3600) }
      }
    }
  } catch {
    // Redis indisponible — pas de cooldown
  }
  return { blocked: false, remainingHours: 0 }
}

/**
 * Soft-deletes a user : anonymise l'email pour libérer l'adresse,
 * désactive le compte, supprime les sessions, et conserve les données
 * pour l'historique (audit, signaux, etc.).
 */
export async function softDeleteUser(prisma: PrismaClient, userId: string): Promise<void> {
  const suffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 6)

  await withRetryTransactionArray([
    prisma.session.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        email: `deleted-${suffix}@deleted.local`,
        phone: null,
        whatsapp: null,
        country: null,
        name: "Compte supprimé",
        image: null,
      },
    }),
  ])
}

/**
 * Hard-deletes a user and all dependent records.
 * Utilisé uniquement pour le nettoyage interne (GDPR, purge).
 */
export async function hardDeleteUser(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.notificationDelivery.deleteMany({
    where: { notification: { userId } },
  })

  await withRetryTransactionArray([
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.accessRequest.deleteMany({ where: { userId } }),
    prisma.device.deleteMany({ where: { userId } }),
    prisma.deviceVerification.deleteMany({ where: { userId } }),
    prisma.kycDocument.deleteMany({ where: { userId } }),
    prisma.brokerVerification.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.signalRead.deleteMany({ where: { userId } }),
    prisma.signalFavorite.deleteMany({ where: { userId } }),
    prisma.signalArchive.deleteMany({ where: { userId } }),
  ])

  await prisma.signalVersion.deleteMany({
    where: { updater: { id: userId } },
  })

  await prisma.signal.deleteMany({
    where: { createdBy: userId },
  })

  await prisma.user.delete({ where: { id: userId } })
}

/**
 * Supprime définitivement les comptes soft-deletés pour libérer l'email
 * lors d'une réinscription. Appelé avant la création d'un nouvel utilisateur.
 */
export async function purgeSoftDeletedUser(prisma: PrismaClient, email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true },
  })

  if (user?.deletedAt) {
    await hardDeleteUser(prisma, user.id)
  }
}
