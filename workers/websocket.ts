import { createServer } from "http"
import { Server as SocketIOServer, Socket } from "socket.io"
import IORedis from "ioredis"
import { prisma } from "../src/lib/db"
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
      include: { user: { select: { id: true } } },
    })

    if (!session?.user) {
      console.log(`[ws] Session not found in DB for ${socket.id}`)
      return null
    }

    if (new Date(session.expiresAt) < new Date()) {
      console.log(`[ws] Session expired for ${socket.id}`)
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
io.on("connection", (socket) => {
  const userId = socket.data.userId as string
  const room = `user:${userId}`
  socket.join(room)
  console.log(`[ws] ✅ ${socket.id} connected as user ${userId.slice(0, 8)}... (${io.engine.clientsCount} total)`)

  socket.emit("connected", { userId, socketId: socket.id })

  socket.on("disconnect", (reason) => {
    console.log(`[ws] ❌ ${socket.id} disconnected: ${reason} (${io.engine.clientsCount} remaining)`)
  })

  socket.on("ping", () => {
    socket.emit("pong", { ts: Date.now() })
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

  sub.on("pmessage", (_pattern, channel, message) => {
    const userId = channel.replace("nba:notif:user:", "")
    const room = `user:${userId}`
    const sockets = io.sockets.adapter.rooms.get(room)
    if (sockets && sockets.size > 0) {
      try {
        const payload = JSON.parse(message)
        io.to(room).emit("notification", payload)
        console.log(`[ws] 📬 Forwarded notification to ${sockets.size} socket(s) for user ${userId.slice(0, 8)}...`)
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
