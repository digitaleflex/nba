// Service Worker — Notifications push + précache des assets PWA (pas de cache offline)
const SW_VERSION = "2.5.0";
const SW_LOG_PREFIX = `[SW v${SW_VERSION}]`;
const CACHE_NAME = `nba-static-v${SW_VERSION}`;

const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icon.png",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/sounds/default.wav",
  "/sounds/chime.wav",
  "/sounds/pop.wav",
  "/sounds/signal.wav",
  "/sounds/urgent.wav",
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
  let payload = {
    title: "Nouveau signal",
    body: "Nouveau signal — ouvrez NBA",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-96x96.png",
    url: "/dashboard/signals",
    tag: undefined,
    image: undefined,
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = {
        title: data.title || payload.title,
        body: data.body || payload.body,
        icon: data.icon || payload.icon,
        badge: data.badge || payload.badge,
        url: data.url || payload.url,
        tag: data.tag,
        image: data.image,
      };
    } catch {
      try {
        payload.body = event.data.text() || payload.body;
      } catch {}
    }
  }

  // Toujours afficher une notification (iOS révoque l'abonnement si un push
  // ne produit aucune notification visible).
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(self.navigator?.userAgent || "");
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      image: payload.image,
      data: { url: payload.url },
      tag: payload.tag,
      renotify: !!payload.tag,
      requireInteraction: !isMobile,
      silent: false,
      vibrate: [200, 100, 200],
    }),
  );
});


// Changement d'abonnement push (renouvellement/invalide par le navigateur) :
// on réabonne et on met à jour le serveur.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil((async () => {
    try {
      const reg = self.registration;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: event.oldSubscription?.options?.applicationServerKey });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, userAgent: self.navigator?.userAgent || "" }),
      });
    } catch (e) {
      // silencieux : le hook côté app réparera à la prochaine ouverture
    }
  })());
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
