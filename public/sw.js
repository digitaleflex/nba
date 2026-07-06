// Service Worker — Notifications push + précache des assets PWA (pas de cache offline)
const SW_VERSION = "2.1.0";
const SW_LOG_PREFIX = `[SW v${SW_VERSION}]`;
const CACHE_NAME = `nba-static-v${SW_VERSION}`;

const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icon.png",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Installation : précache des icônes et du manifest
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
    })(),
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  console.log(`${SW_LOG_PREFIX} activate`);
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await clients.claim();
    })(),
  );
});

// PAS de fetch handler : on laisse Next.js gérer le réseau normalement.
// Le précache sert uniquement à ce que les icônes PWA soient disponibles immédiatement.

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

// Click sur notification
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

// Error handlers
self.addEventListener("error", (event) => {
  console.error(`${SW_LOG_PREFIX} error:`, event.error || event.message);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error(`${SW_LOG_PREFIX} unhandled rejection:`, event.reason);
});
