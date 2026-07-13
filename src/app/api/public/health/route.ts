import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`

    // Si le WebSocket est activé, vérifier que le worker écoute bien sur 3001.
    // Un worker absent rend le conteneur UNHEALTHY (visible via Traefik + make status)
    // sans pour autant couper le site Next.js.
    if (process.env.WS_ENABLED === "true") {
      const ws = await fetch(
        "http://127.0.0.1:3001/socket.io/?EIO=4&transport=polling",
        { signal: AbortSignal.timeout(3000) }
      )
      const body = await ws.text()
      if (!body.includes('"sid"')) {
        return NextResponse.json(
          { status: "unhealthy", reason: "websocket_worker_unreachable", timestamp: new Date().toISOString() },
          { status: 503 }
        )
      }
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch {
    return NextResponse.json(
      { status: "unhealthy", timestamp: new Date().toISOString() },
      { status: 503 }
    )
  }
}
