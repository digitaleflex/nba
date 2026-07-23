// Service Worker — Notifications push + cache offline (Workbox-free)
const SW_VERSION = "2.2.0";
const SW_LOG_PREFIX = `[SW v${SW_VERSION}]`;
const CACHE_NAME = `nba-static-v${SW_VERSION}`;
const ASSET_CACHE = `nba-assets-v${SW_VERSION}`;
const PAGE_CACHE = `nba-pages-v${SW_VERSION}`;
const API_CACHE = `nba-api-v${SW_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icon.png",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  OFFLINE_URL,
];

// ── HELPERS ──

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/) ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)
  );
}

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isMutation(request) {
  return request.method !== "GET";
}

async function fromNetworkOrFallback(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaqueredirect") return response;
    throw new Error(`HTTP ${response.status}`);
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return new Response("Hors ligne", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), timeoutMs)
  );
  try {
    const response = await Promise.race([fetch(request), timeoutPromise]);
    if (response.ok || response.type === "opaqueredirect") {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      return response;
    }
    throw new Error(`HTTP ${response.status}`);
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (isNavigationRequest(request)) {
      const fallback = await caches.match(OFFLINE_URL);
      if (fallback) return fallback;
    }
    return new Response("Hors ligne", { status: 503 });
  }
}

// ── INSTALL ──
self.addEventListener("install", (event) => {
  console.log(`${SW_LOG_PREFIX} install`);
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(PRECACHE_URLS);
      } catch (err) {
        console.error(`${SW_LOG_PREFIX} precache failed:`, err);
      }
      await self.skipWaiting();
    })()
  );
});

// ── ACTIVATE ──
self.addEventListener("activate", (event) => {
  console.log(`${SW_LOG_PREFIX} activate`);
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== ASSET_CACHE && k !== PAGE_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      );
      await clients.claim();
    })()
  );
});

// ── FETCH ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ne pas intercepter les requetes non-HTTP(S) ou les WebSocket
  if (!url.protocol.startsWith("http")) return;

  // Mutation (POST, PUT, DELETE, PATCH) : toujours le reseau
  if (isMutation(event.request)) {
    return;
  }

  // Assets statiques versionnes : cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(ASSET_CACHE);
          cache.put(event.request, response.clone());
        }
        return response;
      })()
    );
    return;
  }

  // API GET : network-first avec timeout 5s
  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithTimeout(event.request, API_CACHE, 5000));
    return;
  }

  // Navigation (pages) : network-first avec timeout 5s, fallback offline
  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirstWithTimeout(event.request, PAGE_CACHE, 5000));
    return;
  }

  // Autres GET (images externes, etc.) : stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request, ASSET_CACHE));
});

// ── PUSH ──
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "Nouveau signal",
    body: "Un nouveau contenu a ete publie",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    url: "/dashboard/signals",
    tag: undefined,
  };

  try {
    const data = event.data.json();
    payload = {
      title: data.title || payload.title,
      body: data.body || payload.body,
      icon: data.icon || payload.icon,
      badge: data.badge || payload.badge,
      url: data.url || payload.url,
      tag: data.tag,
    };
  } catch {
    try {
      payload.body = event.data.text();
    } catch {}
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      data: { url: payload.url },
      tag: payload.tag,
      requireInteraction: false,
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            return client.focus().then(() => {
              if ("navigate" in client) return client.navigate(url);
            });
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

self.addEventListener("error", (event) => {
  console.error(`${SW_LOG_PREFIX} error:`, event.error || event.message);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error(`${SW_LOG_PREFIX} unhandled rejection:`, event.reason);
});
