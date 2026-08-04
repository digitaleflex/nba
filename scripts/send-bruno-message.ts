import { PrismaClient } from "../src/generated/prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const BRUNO_EMAILS = ["brunoatika43@gmail.com", "omonwaleatika@gmail.com"]
const ADMIN_EMAIL = "admin@signauxx.com"

const MESSAGE = `Bonjour Bruno,

Nous avons remarqué que vous avez deux comptes actifs sur NeverBrokeAgain :
- brunoatika43@gmail.com (créé le 6 juillet 2026)
- omonwaleatika@gmail.com (créé le 17 juillet 2026)

Les deux comptes ont accès au même plan « Signals X Indices ». Pour éviter les doublons, merci de nous indiquer lequel des deux vous souhaitez conserver. Nous désactiverons l'autre.

Répondez simplement à ce message.

L'équipe NeverBrokeAgain`

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 1,
    ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } })
  if (!admin) { console.log("Admin introuvable"); return }

  const brunos = await prisma.user.findMany({
    where: { email: { in: BRUNO_EMAILS } },
    select: { id: true, email: true },
  })

  for (const bruno of brunos) {
    const existingConv = await prisma.conversationParticipant.findFirst({
      where: { userId: bruno.id },
      select: { conversationId: true },
    })

    let convId: string

    if (existingConv) {
      convId = existingConv.conversationId
      const isAdminInConv = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: convId, userId: admin.id } },
      })
      if (!isAdminInConv) {
        await prisma.conversationParticipant.create({
          data: { conversationId: convId, userId: admin.id },
        })
      }
      console.log(`[${bruno.email}] Conversation existante ${convId.slice(0, 8)}…`)
    } else {
      const conv = await prisma.conversation.create({
        data: {
          type: "DIRECT",
          participants: {
            create: [
              { userId: admin.id },
              { userId: bruno.id },
            ],
          },
        },
      })
      convId = conv.id
      console.log(`[${bruno.email}] Nouvelle conversation ${convId.slice(0, 8)}…`)
    }

    await prisma.message.create({
      data: {
        conversationId: convId,
        senderId: admin.id,
        type: "TEXT",
        content: MESSAGE,
      },
    })
    console.log(`[${bruno.email}] Message envoyé`)
  }

  await pool.end()
}

main().catch(console.error)
