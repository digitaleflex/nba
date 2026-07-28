import { msg } from "../messages"
import { prisma } from "@nba/lib/db"
import { publishMessage, publishMessageRead } from "@nba/lib/redis-pubsub"
import { getStorage } from "@nba/lib/storage"
import { AuthError } from "@nba/lib/auth-utils"
import { notify } from "@nba/lib/services/notifications"
import { invalidatePrefix } from "@nba/lib/cache"
import { logger } from "@nba/lib/logger"

const log = logger.child({ module: "messaging" })

export const MESSAGE_VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"]
export const MESSAGE_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"]
export const MESSAGE_MAX_SIZE = 50 * 1024 * 1024 // 50 Mo (vidéos)
export const MESSAGE_IMAGE_MAX_SIZE = 10 * 1024 * 1024 // 10 Mo (images)

/**
 * Valide et stocke une pièce jointe (vidéo ou image) à un message. Retourne le
 * chemin de stockage (à persister dans `attachmentUrl`) et l'URL publique.
 */
export async function uploadMessageAttachment(file: File) {
  const isImage = MESSAGE_IMAGE_MIME.includes(file.type)
  const isVideo = MESSAGE_VIDEO_MIME.includes(file.type)
  if (!isImage && !isVideo) {
    throw new Error(msg.support.FORMAT_NOT_SUPPORTED(file.type))
  }
  const maxSize = isImage ? MESSAGE_IMAGE_MAX_SIZE : MESSAGE_MAX_SIZE
  if (file.size > maxSize) {
    throw new Error(isImage ? msg.support.IMAGE_TOO_LARGE : msg.support.VIDEO_TOO_LARGE)
  }
  const storage = getStorage()
  const result = await storage.upload(file, "messages")
  return {
    path: result.path,
    url: `/api/files/${result.path}`,
    mimeType: result.mimeType,
    size: result.size,
    name: file.name,
  }
}

export interface ConversationSummary {
  id: string
  other: { id: string; name: string; email: string } | null
  lastMessage: {
    id: string
    type: string
    content: string
    senderId: string
    createdAt: string
  } | null
  unreadCount: number
  updatedAt: string
}

export interface MessageAttachment {
  url: string
  mime: string
  name?: string | null
  size?: number | null
}

export interface MessageReactionDTO {
  userId: string
  emoji: string
}

export interface QuotedMessageDTO {
  id: string
  type: string
  content: string
  senderName: string
  attachmentMime?: string | null
}

export interface MessageDTO {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  type: string
  content: string
  attachmentUrl?: string | null
  attachmentMime?: string | null
  attachmentName?: string | null
  attachmentSize?: number | null
  readAt: string | null
  editedAt: string | null
  deletedAt: string | null
  quotedMessageId?: string | null
  quoted?: QuotedMessageDTO | null
  reactions: MessageReactionDTO[]
  createdAt: string
}

type ParticipantWithUser = {
  userId: string
  user: { id: string; name: string; email: string }
}

function otherUserOf(participants: ParticipantWithUser[], myId: string) {
  const other = participants.find((p) => p.userId !== myId)
  return other?.user ?? null
}

/**
 * Liste les conversations d'un utilisateur (membre ou admin), avec dernier
 * message, interlocuteur et nombre de messages non lus pour cet utilisateur.
 */
export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })

  const ids = conversations.map((c) => c.id)
  const unreadMap = new Map<string, number>()
  if (ids.length > 0) {
    const groups = await prisma.message.groupBy({
      by: ["conversationId"],
      where: { conversationId: { in: ids }, senderId: { not: userId }, readAt: null },
      _count: { _all: true },
    })
    for (const g of groups) unreadMap.set(g.conversationId, g._count._all)
  }

  return conversations.map((c) => ({
    id: c.id,
    other: otherUserOf(c.participants as ParticipantWithUser[], userId),
    lastMessage: c.messages[0]
      ? {
          id: c.messages[0].id,
          type: c.messages[0].type,
          content: c.messages[0].content,
          senderId: c.messages[0].senderId,
          createdAt: c.messages[0].createdAt.toISOString(),
        }
      : null,
    unreadCount: unreadMap.get(c.id) ?? 0,
    updatedAt: c.updatedAt.toISOString(),
  }))
}

export const MESSAGES_PAGE_SIZE = 30

/**
 * Récupère les messages d'une conversation (par pages, du plus récent au plus
 * ancien) et marque comme lus ceux envoyés par les autres participants (du
 * point de vue de `userId`).
 *
 * @param opts.before  ISO date du message le plus ancien déjà chargé ; charge
 *                     les messages strictement antérieurs (pagination arrière).
 * @returns messages (ordre chronologique croissant) + `hasMore`.
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  opts?: { before?: string | null; limit?: number },
): Promise<{ messages: MessageDTO[]; hasMore: boolean }> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId } } },
  })
  if (!conversation) throw new AuthError(msg.support.CONVERSATION_NOT_FOUND, 404)

  // Marque comme lus les messages reçus, et notifie leurs expéditeurs
  // en temps réel (accusé de lecture).
  const toMark = await prisma.message.findMany({
    where: { conversationId, senderId: { not: userId }, readAt: null },
    select: { id: true, senderId: true },
  })

  if (toMark.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: toMark.map((m) => m.id) } },
      data: { readAt: new Date() },
    })

    const bySender = new Map<string, string[]>()
    for (const m of toMark) {
      if (!bySender.has(m.senderId)) bySender.set(m.senderId, [])
      bySender.get(m.senderId)!.push(m.id)
    }
    for (const [senderId, messageIds] of bySender) {
      await publishMessageRead(senderId, { conversationId, messageIds })
    }
  }

  const limit = Math.min(opts?.limit ?? MESSAGES_PAGE_SIZE, 100)
  const where = opts?.before
    ? { conversationId, createdAt: { lt: new Date(opts.before) } }
    : { conversationId }

  const page = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      sender: { select: { id: true, name: true } },
      reactions: { select: { userId: true, emoji: true } },
      quotedMessage: {
        select: {
          id: true,
          type: true,
          content: true,
          attachmentMime: true,
          sender: { select: { name: true } },
        },
      },
    },
  })

  const hasMore = page.length > limit
  const ordered = (hasMore ? page.slice(0, limit) : page).reverse()

  const messages = ordered.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderName: m.sender.name,
    type: m.type,
    content: m.content,
    attachmentUrl: m.attachmentUrl,
    attachmentMime: m.attachmentMime,
    attachmentName: m.attachmentName,
    attachmentSize: m.attachmentSize,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    editedAt: m.editedAt ? m.editedAt.toISOString() : null,
    deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
    quotedMessageId: m.quotedMessageId,
    quoted: m.quotedMessage
      ? {
          id: m.quotedMessage.id,
          type: m.quotedMessage.type,
          content: m.quotedMessage.content,
          senderName: m.quotedMessage.sender.name,
          attachmentMime: m.quotedMessage.attachmentMime,
        }
      : null,
    reactions: m.reactions.map((r) => ({ userId: r.userId, emoji: r.emoji })),
    createdAt: m.createdAt.toISOString(),
  }))

  return { messages, hasMore }
}

/**
 * Envoie un message dans une conversation existante. L'expéditeur doit en
 * être participant. Notifie en temps réel tous les autres participants.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  attachment?: MessageAttachment | null,
  quotedMessageId?: string | null,
): Promise<MessageDTO> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId: senderId } } },
  })
  if (!conversation) throw new AuthError(msg.support.CONVERSATION_NOT_FOUND, 404)

  const isVideo = attachment?.mime?.startsWith("video/") ?? false
  const isImage = attachment?.mime?.startsWith("image/") ?? false
  const messageType = isVideo ? "VIDEO" : isImage ? "IMAGE" : "TEXT"

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      type: messageType,
      content: content ?? "",
      attachmentUrl: attachment?.url ?? null,
      attachmentMime: attachment?.mime ?? null,
      attachmentName: attachment?.name ?? null,
      attachmentSize: attachment?.size ?? null,
      quotedMessageId: quotedMessageId ?? null,
    },
    include: {
      sender: { select: { id: true, name: true } },
      quotedMessage: {
        select: {
          id: true,
          type: true,
          content: true,
          attachmentMime: true,
          sender: { select: { name: true } },
        },
      },
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: senderId } },
    include: { user: { select: { role: { select: { name: true } } } } },
  })

  const payload = {
    type: "MESSAGE",
    conversationId,
    message: {
      id: message.id,
      conversationId,
      senderId: message.senderId,
      senderName: message.sender.name,
      type: message.type,
      content: message.content,
      attachmentUrl: message.attachmentUrl,
      attachmentMime: message.attachmentMime,
      attachmentName: message.attachmentName,
      attachmentSize: message.attachmentSize,
      quotedMessageId: message.quotedMessageId,
      createdAt: message.createdAt.toISOString(),
    },
  }
  for (const p of others) {
    publishMessage(p.userId, payload).catch((err) =>
      log.warn({ err, userId: p.userId, errorCode: "INTEGRATION_ERROR" }, "Échec envoi message")
    )
  }

  // Notification centrale (in-app + push + email + telegram/whatsapp)
  // via le système notify() qui respecte les préférences utilisateur,
  // les heures silencieuses, et tracke les livraisons.
  const preview = message.content?.trim()
    ? message.content
    : message.type === "IMAGE"
      ? "🖼️ Image"
      : message.type === "VIDEO"
        ? "🎥 Vidéo"
        : "Message"
  for (const p of others) {
    const recipientIsAdmin =
      p.user?.role?.name === "ADMIN" || p.user?.role?.name === "SUPER_ADMIN"
    const url = recipientIsAdmin
      ? `/admin/messages?conv=${conversationId}`
      : `/dashboard/messages?conv=${conversationId}`
    notify({
      userId: p.userId,
      type: "MESSAGE",
      title: message.sender.name,
      body: preview,
      data: { conversationId, messageId: message.id },
      linkUrl: url,
    }).catch((err) => log.error({ err, errorCode: "INTEGRATION_ERROR" }, "Échec notification message"))
  }

  // Bust le cache des listes de conversations (les deux participants)
  await invalidatePrefix("conv:")

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderName: message.sender.name,
    type: message.type,
    content: message.content,
    attachmentUrl: message.attachmentUrl,
    attachmentMime: message.attachmentMime,
    attachmentName: message.attachmentName,
    attachmentSize: message.attachmentSize,
    readAt: message.readAt ? message.readAt.toISOString() : null,
    editedAt: null,
    deletedAt: null,
    quotedMessageId: message.quotedMessageId,
    quoted: message.quotedMessage
      ? {
          id: message.quotedMessage.id,
          type: message.quotedMessage.type,
          content: message.quotedMessage.content,
          senderName: message.quotedMessage.sender.name,
          attachmentMime: message.quotedMessage.attachmentMime,
        }
      : null,
    reactions: [],
    createdAt: message.createdAt.toISOString(),
  }
}

/**
 * Récupère la liste des réactions d'un message (userId + emoji).
 */
async function getMessageReactions(messageId: string): Promise<MessageReactionDTO[]> {
  const rows = await prisma.messageReaction.findMany({
    where: { messageId },
    select: { userId: true, emoji: true },
  })
  return rows.map((r) => ({ userId: r.userId, emoji: r.emoji }))
}

/**
 * Ajoute, remplace ou retire (emoji = null) la réaction de l'utilisateur sur un
 * message. Retourne la liste à jour des réactions et notifie les participants.
 */
export async function reactToMessage(
  messageId: string,
  userId: string,
  emoji: string | null,
): Promise<MessageReactionDTO[]> {
  const message = await prisma.message.findFirst({
    where: { id: messageId, deletedAt: null },
    include: { conversation: { include: { participants: true } } },
  })
  if (!message) throw new AuthError(msg.support.MESSAGE_NOT_FOUND, 404)
  const isParticipant = message.conversation.participants.some((p) => p.userId === userId)
  if (!isParticipant) throw new AuthError(msg.auth.UNAUTHORIZED, 403)

  if (emoji) {
    await prisma.messageReaction.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId, emoji },
      update: { emoji },
    })
  } else {
    await prisma.messageReaction.deleteMany({ where: { messageId, userId } })
  }

  const reactions = await getMessageReactions(messageId)

  const payload = {
    type: "MESSAGE_REACTION",
    conversationId: message.conversationId,
    messageId,
    userId,
    emoji,
    reactions,
  }
  for (const p of message.conversation.participants) {
    publishMessage(p.userId, payload).catch((err) =>
      log.warn({ err, userId: p.userId, errorCode: "INTEGRATION_ERROR" }, "Échec réaction")
    )
  }

  return reactions
}

/**
 * Édite le contenu d'un message envoyé par l'utilisateur (tag "modifié").
 * L'original n'est pas conservé côté serveur (édition simple).
 */
export async function editMessage(
  messageId: string,
  userId: string,
  content: string,
): Promise<MessageDTO> {
  const trimmed = content.trim()
  if (!trimmed) throw new Error(msg.support.MESSAGE_EMPTY)

  const message = await prisma.message.findFirst({
    where: { id: messageId, deletedAt: null },
    include: { conversation: { include: { participants: true } } },
  })
  if (!message) throw new AuthError(msg.support.MESSAGE_NOT_FOUND, 404)
  if (message.senderId !== userId) throw new AuthError(msg.auth.UNAUTHORIZED, 403)

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: trimmed, editedAt: new Date() },
  })

  const payload = {
    type: "MESSAGE_UPDATED",
    conversationId: message.conversationId,
    messageId,
    content: trimmed,
    editedAt: updated.editedAt ? updated.editedAt.toISOString() : null,
  }
  for (const p of message.conversation.participants) {
    if (p.userId === userId) continue
    publishMessage(p.userId, payload).catch((err) =>
      log.warn({ err, userId: p.userId, errorCode: "INTEGRATION_ERROR" }, "Échec modification message")
    )
  }

  return {
    id: updated.id,
    conversationId: updated.conversationId,
    senderId: updated.senderId,
    senderName: "",
    type: updated.type,
    content: updated.content,
    attachmentUrl: updated.attachmentUrl,
    attachmentMime: updated.attachmentMime,
    attachmentName: updated.attachmentName,
    attachmentSize: updated.attachmentSize,
    readAt: updated.readAt ? updated.readAt.toISOString() : null,
    editedAt: updated.editedAt ? updated.editedAt.toISOString() : null,
    deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
    quotedMessageId: updated.quotedMessageId,
    quoted: null,
    reactions: [],
    createdAt: updated.createdAt.toISOString(),
  }
}

/**
 * Supprime un message. `forEveryone` n'est possible que par l'expéditeur
 * (soft-delete côté serveur, diffusé à tous). Sinon, le masquage "pour moi"
 * est géré côté client.
 */
export async function deleteMessage(
  messageId: string,
  userId: string,
  forEveryone: boolean,
): Promise<{ messageId: string; forEveryone: boolean }> {
  const message = await prisma.message.findFirst({
    where: { id: messageId, deletedAt: null },
    include: { conversation: { include: { participants: true } } },
  })
  if (!message) throw new AuthError(msg.support.MESSAGE_NOT_FOUND, 404)
  const isParticipant = message.conversation.participants.some((p) => p.userId === userId)
  if (!isParticipant) throw new AuthError(msg.auth.UNAUTHORIZED, 403)

  if (forEveryone) {
    const canDelete =
      message.senderId === userId ||
      (await isModerator(userId))
    if (!canDelete) throw new AuthError(msg.auth.UNAUTHORIZED, 403)
    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: "" },
    })
    const payload = {
      type: "MESSAGE_DELETED",
      conversationId: message.conversationId,
      messageId,
      forEveryone: true,
    }
    for (const p of message.conversation.participants) {
      if (p.userId === userId) continue
      publishMessage(p.userId, payload).catch((err) =>
        log.warn({ err, userId: p.userId, errorCode: "INTEGRATION_ERROR" }, "Échec suppression message")
      )
    }
  }

  return { messageId, forEveryone }
}

async function isModerator(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { name: true } } },
  })
  return user?.role.name === "ADMIN" || user?.role.name === "SUPER_ADMIN"
}

/**
 * Signale un message (membre ou admin). Crée un `MessageReport` conservé pour
 * la modération. Un même utilisateur ne peut pas signaler deux fois le même message.
 */
export async function reportMessage(
  messageId: string,
  reporterId: string,
  reason: string,
): Promise<{ id: string }> {
  const message = await prisma.message.findFirst({
    where: { id: messageId, deletedAt: null },
    include: { conversation: { include: { participants: true } } },
  })
  if (!message) throw new AuthError(msg.support.MESSAGE_NOT_FOUND, 404)
  const isParticipant = message.conversation.participants.some((p) => p.userId === reporterId)
  if (!isParticipant) throw new AuthError(msg.auth.UNAUTHORIZED, 403)

  const existing = await prisma.messageReport.findFirst({
    where: { messageId, reporterId },
  })
  if (existing) return { id: existing.id }

  const report = await prisma.messageReport.create({
    data: { messageId, reporterId, reason: reason.slice(0, 500) },
  })
  return { id: report.id }
}

export interface MessageReportDTO {
  id: string
  messageId: string
  reason: string
  createdAt: string
  handledAt: string | null
  conversationId: string
  messageContent: string
  messageSenderName: string
  reporterName: string
  reporterEmail: string
}

/**
 * Liste les signalements de messages (file de modération admin).
 */
export async function listMessageReports(onlyPending = true): Promise<MessageReportDTO[]> {
  const reports = await prisma.messageReport.findMany({
    where: onlyPending ? { handledAt: null } : {},
    orderBy: { createdAt: "desc" },
    include: {
      message: {
        select: {
          conversationId: true,
          content: true,
          sender: { select: { name: true } },
        },
      },
      reporter: { select: { name: true, email: true } },
    },
  })
  return reports.map((r) => ({
    id: r.id,
    messageId: r.messageId,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
    handledAt: r.handledAt ? r.handledAt.toISOString() : null,
    conversationId: r.message.conversationId,
    messageContent: r.message.content,
    messageSenderName: r.message.sender.name,
    reporterName: r.reporter.name,
    reporterEmail: r.reporter.email,
  }))
}

/**
 * Marque un signalement comme traité (sans supprimer le message).
 */
export async function resolveReport(reportId: string): Promise<void> {
  await prisma.messageReport.update({
    where: { id: reportId },
    data: { handledAt: new Date() },
  })
}

/**
 * Trouve (ou crée) une conversation directe à 2 participants entre deux
 * utilisateurs. Réutilise la conversation existante si elle existe déjà.
 */
async function findOrCreateDirectConversation(userA: string, userB: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          { participants: { some: { userId: userA } } },
          { participants: { some: { userId: userB } } },
        ],
      },
      include: { participants: true },
    })

    if (existing) return existing.id

    const created = await tx.conversation.create({
      data: {
        type: "DIRECT",
        participants: { create: [{ userId: userA }, { userId: userB }] },
      },
    })
    return created.id
  }, { isolationLevel: "Serializable" })
}

/**
 * (Admin) Trouve ou crée une conversation directe avec un membre, puis envoie
 * le premier message.
 */
export async function startOrReplyAsAdmin(
  adminId: string,
  memberId: string,
  content: string,
  attachment?: MessageAttachment | null,
): Promise<{ conversationId: string; message: MessageDTO }> {
  const conversationId = await findOrCreateDirectConversation(adminId, memberId)
  const message = await sendMessage(conversationId, adminId, content, attachment)
  return { conversationId, message }
}

/**
 * (Membre) Démarre une conversation directe avec un admin, puis envoie le
 * premier message. Symétrique de `startOrReplyAsAdmin`.
 */
export async function startConversationAsMember(
  memberId: string,
  adminId: string,
  content: string,
  attachment?: MessageAttachment | null,
): Promise<{ conversationId: string; message: MessageDTO }> {
  const conversationId = await findOrCreateDirectConversation(memberId, adminId)
  const message = await sendMessage(conversationId, memberId, content, attachment)
  return { conversationId, message }
}
