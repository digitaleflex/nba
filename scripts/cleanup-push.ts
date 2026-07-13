import webpush from "web-push"
import { prisma } from "../src/lib/db"

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
if (!publicKey || !privateKey) {
  console.error("VAPID keys not configured")
  process.exit(1)
}
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@signauxx.com",
  publicKey,
  privateKey,
)

async function main() {
  const subs = await prisma.pushSubscription.findMany({
    select: { id: true, endpoint: true },
  })
  console.log("Total subscriptions:", subs.length)

  let dead = 0
  let kept = 0

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: "test", auth: "test" } },
        JSON.stringify({ title: "cleanup", body: "cleanup" }),
      )
      kept++
    } catch (err: any) {
      if ([400, 403, 404, 410, 413].includes(err.statusCode)) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        dead++
        continue
      }
      kept++
    }
  }

  console.log("Supprimés:", dead)
  console.log("Conservés:", kept)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
