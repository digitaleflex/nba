// Service Worker pour les notifications push navigateur
// Robuste: gère les erreurs, ne s'active pas sur les pages non-HTTPS,
// et n'intercepte jamais les requêtes fetch (sauf si on l'ajoute explicitement).

const SW_VERSION = "1.0.0";
const SW_LOG_PREFIX = `[SW v${SW_VERSION}]`;

// Skip l'enregistrement en HTTP (dev local) ou en mode privé buggé
function isSWSupported() {
  return (
    "serviceWorker" in navigator &&
    typeof window !== "undefined" &&
    window.isSecureContext !== false // true ou undefined (HTTP local)
  );
}

self.addEventListener("install", (event) => {
  console.log(`${SW_LOG_PREFIX} install`);
  // skipWaiting: prend le contrôle immédiatement (ok car pas de fetch handler)
  self.skipWaiting().catch((err) => {
    console.error(`${SW_LOG_PREFIX} skipWaiting failed:`, err);
  });
});

self.addEventListener("activate", (event) => {
  console.log(`${SW_LOG_PREFIX} activate`);
  event.waitUntil(
    clients
      .claim()
      .then(() => {
        console.log(`${SW_LOG_PREFIX} clients claimed`);
      })
      .catch((err) => {
        console.error(`${SW_LOG_PREFIX} claim failed:`, err);
      })
  );
});

// Push: réception d'une notification push
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn(`${SW_LOG_PREFIX} push event without data`);
    return;
  }

  let payload = {
    title: "Nouveau signal",
    body: "Un nouveau contenu a été publié",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
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
  } catch (e) {
    // Si le payload n'est pas du JSON valide, on utilise le texte brut
    try {
      payload.body = event.data.text();
    } catch (_) {
      // Fallback silencieux
    }
  }

  event
    .waitUntil(
      self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        data: { url: payload.url },
        tag: payload.tag,
        requireInteraction: false,
        vibrate: [200, 100, 200],
      })
    )
    .catch((err) => {
      console.error(`${SW_LOG_PREFIX} showNotification failed:`, err);
    });
});

// Click sur la notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Si un onglet est déjà ouvert, focus-le
        for (const client of windowClients) {
          if ("focus" in client) {
            return client.focus().then(() => {
              if ("navigate" in client) return client.navigate(url);
            });
          }
        }
        // Sinon, ouvre un nouvel onglet
        if (clients.openWindow) return clients.openWindow(url);
      })
      .catch((err) => {
        console.error(`${SW_LOG_PREFIX} notificationclick failed:`, err);
      })
  );
});

// Error handler global
self.addEventListener("error", (event) => {
  console.error(`${SW_LOG_PREFIX} unhandled error:`, event.error || event.message);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error(`${SW_LOG_PREFIX} unhandled promise rejection:`, event.reason);
});
