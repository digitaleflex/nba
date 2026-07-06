// Service Worker — Notifications push + Cache offline
const SW_VERSION = "2.0.0";
const SW_LOG_PREFIX = `[SW v${SW_VERSION}]`;
const CACHE_NAME = `nba-static-v${SW_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/manifest.webmanifest",
  "/icon.png",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Installation : pré-cache des assets critiques
self.addEventListener("install", (event) => {
  console.log(`${SW_LOG_PREFIX} install`);
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })(),
  );
});

// Activation : nettoyage des anciens caches + prise de contrôle
self.addEventListener("activate", (event) => {
  console.log(`${SW_LOG_PREFIX} activate`);
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await clients.claim();
      console.log(`${SW_LOG_PREFIX} ready (cache: ${CACHE_NAME})`);
    })(),
  );
});

// Fetch : stratégie cache-first pour les statiques, network-first pour les navigations
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API : toujours réseau (pas de cache)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigations (HTML) : network-first avec fallback cache
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Assets statiques (JS, CSS, images, polices, etc.) : cache-first
  if (
    url.pathname.match(
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|json|webmanifest)$/,
    )
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Autre (ex: RSC, prefetch) : network-only
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503 });
  }
}

// Push : réception des notifications push
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "Nouveau signal",
    body: "Un nouveau contenu a été publié",
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
    }),
  );
});

// Click sur la notification
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
      }),
  );
});

// Error handlers globaux
self.addEventListener("error", (event) => {
  console.error(
    `${SW_LOG_PREFIX} unhandled error:`,
    event.error || event.message,
  );
});

self.addEventListener("unhandledrejection", (event) => {
  console.error(`${SW_LOG_PREFIX} unhandled promise rejection:`, event.reason);
});
