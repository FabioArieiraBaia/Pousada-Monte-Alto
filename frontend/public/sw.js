// Service Worker: Pousada Monte Alto - Web Push Notifications & PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 Novo Lead — Pousada Monte Alto',
    body: 'Uma nova solicitação de reserva ou mensagem acabou de chegar!',
    url: '/admin/reservas',
    icon: '/logo-icon.png',
    badge: '/favicon.png'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = Object.assign(data, parsed);
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/logo-icon.png',
    badge: data.badge || '/favicon.png',
    vibrate: [300, 100, 300, 100, 300], // Vibração dupla padrão hoteleiro
    tag: 'pousada-lead-notification',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/admin/reservas',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Ver Reserva / Lead' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/admin/reservas';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já houver uma aba aberta no painel admin, foca nela e navega
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Se não houver aba aberta, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});