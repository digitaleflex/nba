import { createServer } from "http"
import { Server as SocketIOServer, Socket } from "socket.io"
import IORedis from "ioredis"
import "dotenv/config"
import { prisma } from "./ws-prisma"
import { verifySignedCookie, extractSessionToken } from "./ws-auth"

const PORT = parseInt(process.env.WS_PORT || "3001", 10)
const HOST = process.env.WS_HOST || "0.0.0.0"
const REDIS_URL = process.env.REDIS_URL
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000"
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET

const COOKIE_NAME = "better-auth.session_token"

if (!BETTER_AUTH_SECRET) {
  console.error("[ws] ❌ BETTER_AUTH_SECRET is not set. Aborting.")
  process.exit(1)
}

// ── HTTP server + Socket.IO ──
const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ status: "ok", connections: io?.engine.clientsCount || 0 }))
    return
  }
  res.writeHead(404)
  res.end()
})

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || BETTER_AUTH_URL,
    credentials: true,
  },
  path: "/socket.io/",
  transports: ["websocket", "polling"],
  pingTimeout: 30000,
  pingInterval: 25000,
})

// ── Authentification par cookie de session signé ──
async function authenticateSocket(socket: Socket): Promise<{ userId: string } | null> {
  try {
    const cookieHeader = socket.handshake.headers.cookie
    const signedCookie = extractSessionToken(cookieHeader, COOKIE_NAME)
    if (!signedCookie) {
      console.log(`[ws] No session cookie for ${socket.id}`)
      return null
    }

    // Vérifier la signature HMAC et extraire le token
    const sessionToken = await verifySignedCookie(signedCookie, BETTER_AUTH_SECRET!)
    if (!sessionToken) {
      console.log(`[ws] Invalid cookie signature for ${socket.id}`)
      return null
    }

    // Query la session en base
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: { select: { id: true, isActive: true } } },
    })

    if (!session?.user) {
      console.log(`[ws] Session not found in DB for ${socket.id}`)
      return null
    }

    if (new Date(session.expiresAt) < new Date()) {
      console.log(`[ws] Session expired for ${socket.id}`)
      return null
    }

    if (!session.user.isActive) {
      console.log(`[ws] User suspended for ${socket.id}`)
      return null
    }

    return { userId: session.user.id }
  } catch (err) {
    console.error(`[ws] Auth error for ${socket.id}:`, err)
    return null
  }
}

// ── Middleware Socket.IO : auth avant connexion ──
io.use(async (socket, next) => {
  const auth = await authenticateSocket(socket)
  if (!auth) {
    return next(new Error("Unauthorized: invalid or missing session"))
  }
  socket.data.userId = auth.userId
  next()
})

// ── Gestion des connexions ──
const onlineCounts = new Map<string, number>()

io.on("connection", (socket) => {
  const userId = socket.data.userId as string
  const room = `user:${userId}`
  socket.join(room)
  console.log(`[ws] socket connected: user=${userId} socket=${socket.id}`)

  socket.emit("connected", { userId, socketId: socket.id })

  const prev = onlineCounts.get(userId) ?? 0
  onlineCounts.set(userId, prev + 1)
  socket.emit("presence:init", Array.from(onlineCounts.keys()))
  if (prev === 0) io.emit("presence", { userId, online: true })

  socket.on("disconnect", (reason) => {
    console.log(`[ws] socket disconnected: user=${userId} socket=${socket.id} reason=${reason}`)
    const n = (onlineCounts.get(userId) ?? 1) - 1
    if (n <= 0) {
      onlineCounts.delete(userId)
      io.emit("presence", { userId, online: false })
    } else {
      onlineCounts.set(userId, n)
    }
  })

  socket.on("ping", () => {
    socket.emit("pong", { ts: Date.now() })
  })

  // ── Indicateur "en train d'écrire" ──
  socket.on("typing", (data: { to?: string; conversationId?: string; typing?: boolean }) => {
    const to = data?.to
    if (!to) return
    const channel = `nba:typing:user:${to}`
    try {
      const pub = new IORedis(REDIS_URL!, { maxRetriesPerRequest: null })
      pub.publish(
        channel,
        JSON.stringify({
          from: userId,
          conversationId: data.conversationId,
          typing: data.typing ?? true,
        }),
      )
      pub.disconnect()
    } catch (err) {
      console.error("[ws] typing publish failed:", err)
    }
  })
})

// ── Subscribe Redis Pub/Sub : forward aux clients Socket.IO ──
if (REDIS_URL) {
  const sub = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })

  sub.on("error", (err) => {
    console.error("[ws] Redis sub error:", err.message)
  })

  sub.on("ready", () => {
    console.log("[ws] Redis subscriber ready")
  })

  sub.psubscribe("nba:notif:user:*", (err) => {
    if (err) {
      console.error("[ws] Redis psubscribe failed:", err)
    } else {
      console.log("[ws] Subscribed to nba:notif:user:*")
    }
  })

  sub.psubscribe("nba:msg:user:*", (err) => {
    if (err) {
      console.error("[ws] Redis msg psubscribe failed:", err)
    } else {
      console.log("[ws] Subscribed to nba:msg:user:*")
    }
  })

  sub.psubscribe("nba:typing:user:*", (err) => {
    if (err) {
      console.error("[ws] Redis typing psubscribe failed:", err)
    } else {
      console.log("[ws] Subscribed to nba:typing:user:*")
    }
  })

  sub.psubscribe("nba:read:user:*", (err) => {
    if (err) {
      console.error("[ws] Redis read psubscribe failed:", err)
    } else {
      console.log("[ws] Subscribed to nba:read:user:*")
    }
  })

  // Canal de contrôle admin (ex: reset realtime d'un user)
  sub.subscribe("nba:ws:control", (err) => {
    if (err) {
      console.error("[ws] Redis control subscribe failed:", err)
    } else {
      console.log("[ws] Subscribed to nba:ws:control")
    }
  })

  sub.on("message", (channel, message) => {
    try {
      if (channel !== "nba:ws:control") return
      if (message.startsWith("reset:")) {
        const targetUserId = message.slice("reset:".length)
        let disconnected = 0
        for (const [, socket] of io.sockets.sockets) {
          if (socket.data.userId === targetUserId) {
            socket.disconnect(true)
            disconnected++
          }
        }
        console.log(`[ws] 🔌 Reset realtime for user ${targetUserId.slice(0, 8)}... (${disconnected} socket(s))`)
      }
    } catch (err) {
      console.error("[ws] control message handling failed:", err)
    }
  })

  sub.on("pmessage", (_pattern, channel, message) => {
    let event = "notification"
    let userId = channel.replace("nba:notif:user:", "")
    if (channel.startsWith("nba:msg:user:")) {
      event = "message"
      userId = channel.replace("nba:msg:user:", "")
    } else if (channel.startsWith("nba:typing:user:")) {
      event = "typing"
      userId = channel.replace("nba:typing:user:", "")
    } else if (channel.startsWith("nba:read:user:")) {
      event = "message_read"
      userId = channel.replace("nba:read:user:", "")
    }
    const room = `user:${userId}`
    const sockets = io.sockets.adapter.rooms.get(room)
    if (sockets && sockets.size > 0) {
      try {
        const payload = JSON.parse(message)
        io.to(room).emit(event, payload)
        console.log(`[ws] 📬 Forwarded ${event} to ${sockets.size} socket(s) for user ${userId.slice(0, 8)}...`)
      } catch (err) {
        console.error("[ws] Failed to parse/forward message:", err)
      }
    }
  })
} else {
  console.warn("[ws] ⚠️  REDIS_URL not set, no realtime notifications will be forwarded")
}

// ── Start server ──
httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 WebSocket server listening on ${HOST}:${PORT}`)
  console.log(`   Path: /socket.io/`)
  console.log(`   CORS origin: ${process.env.NEXT_PUBLIC_APP_URL || BETTER_AUTH_URL}`)
})

process.on("SIGTERM", () => {
  console.log("[ws] SIGTERM, shutting down...")
  io.close()
  process.exit(0)
})
process.on("SIGINT", () => {
  console.log("[ws] SIGINT, shutting down...")
  io.close()
  process.exit(0)
})
