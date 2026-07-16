import type { PrismaClient } from "../generated/prisma/client"

/**
 * Hard-deletes a user and all dependent records.
 * Must be called inside a transaction or with a dedicated prisma instance.
 *
 * Tables with ON DELETE RESTRICT that must be cleaned up manually:
 * - Session, Account
 * - AccessRequest, Device, DeviceVerification
 * - KycDocument, BrokerVerification
 * - Signal (createdBy), SignalVersion, SignalRead, SignalFavorite, SignalArchive
 * - Notification, NotificationDelivery
 *
 * Tables with ON DELETE CASCADE (auto-handled by DB):
 * - ConversationParticipant, Message, MessageReaction, MessageReport
 * - PushSubscription
 *
 * Tables with ON DELETE SET NULL (auto-handled by DB):
 * - AuditLog (userId → null)
 * - Setting (updatedBy → null)
 */
export async function hardDeleteUser(prisma: PrismaClient, userId: string): Promise<void> {
  // 1. NotificationDeliveries depend on Notifications (RESTRICT)
  await prisma.notificationDelivery.deleteMany({
    where: { notification: { userId } },
  })

  // 2. All tables with direct RESTRICT on userId
  await prisma.$transaction([
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

  // 3. SignalVersions where user is the updater (RESTRICT on updatedBy)
  await prisma.signalVersion.deleteMany({
    where: { updater: { id: userId } },
  })

  // 4. Signals created by the user (RESTRICT on createdBy)
  //    Child tables (SignalAudience, SignalVersion, SignalRead, etc.) cascade on signalId
  await prisma.signal.deleteMany({
    where: { createdBy: userId },
  })

  // 5. Finally delete the user
  await prisma.user.delete({ where: { id: userId } })
}
