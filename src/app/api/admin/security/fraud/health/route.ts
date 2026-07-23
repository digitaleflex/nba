import { NextResponse } from "next/server"

export async function GET() {
  const now = new Date()

  const statuses = ["healthy", "degraded", "down"] as const
  const randomIndex = Math.random()
  const status = randomIndex > 0.85 ? "degraded" : randomIndex > 0.97 ? "down" : "healthy"

  return NextResponse.json({
    status,
    lastActivity: new Date(now.getTime() - Math.floor(Math.random() * 30000)).toISOString(),
    activityRate: status === "healthy" ? Math.floor(Math.random() * 20 + 5) : status === "degraded" ? Math.floor(Math.random() * 10 + 1) : 0,
    activeAlerts: status === "healthy" ? Math.floor(Math.random() * 3) : status === "degraded" ? Math.floor(Math.random() * 5 + 3) : Math.floor(Math.random() * 8 + 5),
    components: {
      riskEngine: "up",
      securityEventBus: "up",
      ipReputation: "up",
      redis: "up",
      bullmq: "up",
    },
  })
}
