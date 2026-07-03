// Service Worker pour les notifications push navigateur
// Gère les événements push et click sur les notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

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
    payload.body = event.data.text();
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
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Si un onglet est déjà ouvert, focus-le
      for (const client of windowClients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) return client.navigate(url);
        }
      }
      // Sinon, ouvre un nouvel onglet
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
