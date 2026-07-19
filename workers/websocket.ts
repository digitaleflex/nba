import { createServer } from "http"
import { Server as SocketIOServer, Socket } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
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
  transports: ["polling"],
  // Heartbeat serré : keep-alive < 60s pour survivre aux proxies/CDN
  // (Cloudflare coupe les connexions inactives > 100s).
  pingTimeout: 20000,
  pingInterval: 15000,
  // Augmente la taille max des payloads (images de signaux en base64).
  maxHttpBufferSize: 1e7,
})

// ── Adapter Redis (multi-instance) ──
// Permet de scaler le worker WS sur plusieurs instances : les rooms/events
// sont partagés via Redis. En mono-instance (config actuelle) l'adapter est
// quand même actif (idempotent) et prépare le scale-out sans rupture.
if (REDIS_URL) {
  const pub = new IORedis(REDIS_URL, { maxRetriesPerRequest: null, connectTimeout: 5000, commandTimeout: 5000 })
  const sub = new IORedis(REDIS_URL, { maxRetriesPerRequest: null, connectTimeout: 5000, commandTimeout: 5000 })
  pub.on("error", (err) => console.error("[ws] Redis adapter pub error:", err.message))
  sub.on("error", (err) => console.error("[ws] Redis adapter sub error:", err.message))
  io.adapter(createAdapter(pub, sub))
  console.log("[ws] Redis adapter enabled (multi-instance ready)")
}

// Shared connection pour typing indicator (évite de créer une connexion par event)
let typingPub: IORedis | null = null
function getTypingPub(): IORedis | null {
  if (!REDIS_URL) return null
  if (!typingPub) {
    typingPub = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      commandTimeout: 1500,
      lazyConnect: true,
    })
  }
  return typingPub
}

// ── Authentification par cookie de session signé ──
async function authenticateSocket(socket: Socket): Promise<{ userId: string; role: string } | null> {
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
      include: { user: { select: { id: true, isActive: true, role: { select: { name: true } } } } },
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

    return { userId: session.user.id, role: session.user.role?.name ?? "USER" }
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
  socket.data.role = auth.role
  next()
})

// ── Gestion des connexions ──
const onlineCounts = new Map<string, number>()

io.on("connection", (socket) => {
  const userId = socket.data.userId as string
  const role = (socket.data.role as string) ?? "USER"
  const room = `user:${userId}`
  socket.join(room)
  // Les admins rejoignent la room 'admins' pour recevoir les signaux en temps réel
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    socket.join("admins")
  }
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

  // Replay : comblé la fenêtre de perte d'event (worker WS down/reconnect
  // au moment d'un PUBLISH Redis). Le client envoie le dernier signal vu ;
  // on renvoie les signaux publiés depuis lors.
  socket.on("signal:resync", async (data: { since?: string } | undefined) => {
    try {
      const since = data?.since ? new Date(data.since) : new Date(Date.now() - 60_000)
      if (isNaN(since.getTime())) return
      const recent = await prisma.signal.findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: { gt: since },
          createdBy: { not: userId },
        },
        orderBy: { publishedAt: "asc" },
        take: 50,
        select: {
          id: true,
          publishedAt: true,
          imageUrl: true,
          imageUrls: true,
          audience: { select: { plan: { select: { name: true } } } },
          createdBy: true,
        },
      })
      for (const s of recent) {
        socket.emit("signal", {
          type: "signal.created",
          signalId: s.id,
          publishedAt: s.publishedAt,
          imageUrl: s.imageUrl,
          imageUrls: s.imageUrls,
          audience: s.audience.map((a: any) => a.plan.name),
          creatorId: s.createdBy,
        })
      }
    } catch (err) {
      console.error("[ws] signal:resync failed:", err)
    }
  })

  // ── Indicateur "en train d'écrire" ──
  socket.on("typing", (data: { to?: string; conversationId?: string; typing?: boolean }) => {
    const to = data?.to
    if (!to) return
    const channel = `nba:typing:user:${to}`
    const pub = getTypingPub()
    if (!pub) return
    pub.publish(
      channel,
      JSON.stringify({
        from: userId,
        conversationId: data.conversationId,
        typing: data.typing ?? true,
      }),
    ).catch((err) => console.error("[ws] typing publish failed:", err))
  })
})

// ── Subscribe Redis Pub/Sub : forward aux clients Socket.IO ──
if (REDIS_URL) {
  const sub = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    connectTimeout: 5000,
    commandTimeout: 5000,
    retryStrategy: (t) => Math.min(t * 200, 2000),
  })

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

  // Canal dédié aux signaux de trading (temps réel, synchronisé pour tous)
  sub.psubscribe("nba:signal:user:*", (err) => {
    if (err) {
      console.error("[ws] Redis signal psubscribe failed:", err)
    } else {
      console.log("[ws] Subscribed to nba:signal:user:*")
    }
  })

  sub.subscribe("nba:signal:admin", (err) => {
    if (err) {
      console.error("[ws] Redis signal:admin subscribe failed:", err)
    } else {
      console.log("[ws] Subscribed to nba:signal:admin")
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

  // Canal temps réel pour le centre d'audit
  sub.subscribe("nba:audit:admin", (err) => {
    if (err) {
      console.error("[ws] Redis audit:admin subscribe failed:", err)
    } else {
      console.log("[ws] Subscribed to nba:audit:admin")
    }
  })

  sub.on("message", (channel, message) => {
    try {
      if (channel === "nba:signal:admin") {
        // Diffuse le signal à tous les admins connectés (room 'admins')
        const adminRoom = io.sockets.adapter.rooms.get("admins")
        if (adminRoom && adminRoom.size > 0) {
          try {
            const payload = JSON.parse(message)
            io.to("admins").emit("signal", payload)
            console.log(`[ws] 📈 Forwarded signal to ${adminRoom.size} admin socket(s)`)
          } catch (err) {
            console.error("[ws] Failed to parse/forward admin signal:", err)
          }
        }
        return
      }
      if (channel === "nba:audit:admin") {
        const adminRoom = io.sockets.adapter.rooms.get("admins")
        if (adminRoom && adminRoom.size > 0) {
          try {
            const payload = JSON.parse(message)
            io.to("admins").emit("audit", payload)
            console.log(`[ws] ⚡ Forwarded audit event to ${adminRoom.size} admin socket(s)`)
          } catch (err) {
            console.error("[ws] Failed to parse/forward audit event:", err)
          }
        }
        return
      }
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
    } else if (channel.startsWith("nba:signal:user:")) {
      event = "signal"
      userId = channel.replace("nba:signal:user:", "")
    }
    if (event === "signal") {
      const room = `user:${userId}`
      const sockets = io.sockets.adapter.rooms.get(room)
      if (sockets && sockets.size > 0) {
        try {
          const payload = JSON.parse(message)
          io.to(room).emit(event, payload)
          console.log(`[ws] 📈 Forwarded signal to ${sockets.size} socket(s) for user ${userId.slice(0, 8)}...`)
        } catch (err) {
          console.error("[ws] Failed to parse/forward signal:", err)
        }
      }
      return
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
