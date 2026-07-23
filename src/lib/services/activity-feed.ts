import { prisma } from "@nba/lib/db"

export interface ActivityItem {
  type: "signal" | "kyc" | "broker" | "streak" | "message" | "read"
  icon: string
  title: string
  description: string
  link?: string
  timestamp: Date
}

export async function getActivityFeed(userId: string, since: Date): Promise<ActivityItem[]> {
  const items: ActivityItem[] = []

  const newSignals = await prisma.signal.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gt: since },
      audience: { some: { plan: { accessRequests: { some: { userId, status: "APPROVED" } } } } },
    },
    orderBy: { publishedAt: "desc" },
    take: 10,
    select: { id: true, content: true, publishedAt: true },
  })
  for (const s of newSignals) {
    items.push({
      type: "signal",
      icon: "📡",
      title: "Nouveau signal publié",
      description: s.content.slice(0, 120),
      link: `/dashboard/signals?id=${s.id}`,
      timestamp: s.publishedAt!,
    })
  }

  const kycDocs = await prisma.kycDocument.findMany({
    where: { userId, updatedAt: { gt: since } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { status: true, updatedAt: true },
  })
  for (const k of kycDocs) {
    const label = k.status === "APPROVED" ? "Documents KYC approuvés" : k.status === "REJECTED" ? "Documents KYC rejetés" : "Documents KYC mis à jour"
    items.push({
      type: "kyc",
      icon: k.status === "APPROVED" ? "✅" : "❌",
      title: label,
      description: "Statut de vos documents KYC",
      link: "/dashboard/verification",
      timestamp: k.updatedAt,
    })
  }

  const brokerVerifs = await prisma.brokerVerification.findMany({
    where: { userId, updatedAt: { gt: since } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { status: true, updatedAt: true },
  })
  for (const b of brokerVerifs) {
    const label = b.status === "APPROVED" ? "Compte broker vérifié" : b.status === "REJECTED" ? "Vérification broker rejetée" : "Vérification broker mise à jour"
    items.push({
      type: "broker",
      icon: b.status === "APPROVED" ? "✅" : "❌",
      title: label,
      description: "Statut de votre vérification broker",
      link: "/dashboard/verification",
      timestamp: b.updatedAt,
    })
  }

  const unreadMessages = await prisma.message.count({
    where: {
      conversation: { participants: { some: { userId } } },
      senderId: { not: userId },
      createdAt: { gt: since },
      isRead: false,
    },
  })
  if (unreadMessages > 0) {
    items.push({
      type: "message",
      icon: "💬",
      title: `${unreadMessages} message${unreadMessages > 1 ? "s" : ""} non lu${unreadMessages > 1 ? "s" : ""}`,
      description: "Vous avez des messages en attente",
      link: "/dashboard/messages",
      timestamp: new Date(),
    })
  }

  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  return items.slice(0, 20)
}
