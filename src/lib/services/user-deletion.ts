import type { PrismaClient } from "@nba/generated/prisma/client"
import { withRetryTransactionArray } from "@nba/lib/db"

const SESSION_COOKIE_NAMES = ["__Secure-better-auth.session_token", "better-auth.session_token"]

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
