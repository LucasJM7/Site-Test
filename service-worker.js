const CACHE_NAME = 'crechenow-v1';
// ⚠️ IMPORTANTE: coloque o nome REAL do seu repositório aqui
const BASE = '/NOME-DO-REPO/';

// Arquivos do app (corrigidos para GitHub Pages)
const STATIC_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'dashboard-parent.html',
  BASE + 'dashboard-staff.html',

  BASE + 'assets/css/main.css',
  BASE + 'assets/css/components.css',

  BASE + 'assets/js/app.js',
  BASE + 'assets/js/auth.js',
  BASE + 'assets/js/notifications.js',
  BASE + 'assets/js/storage.js',

  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// INSTALL → cache seguro (não quebra se 1 falhar)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const file of STATIC_ASSETS) {
        try {
          await cache.add(file);
        } catch (err) {
          console.warn('[SW] Falha ao cachear:', file);
        }
      }
    })
  );
  self.skipWaiting();
});

// ACTIVATE → limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH → estratégia híbrida (offline-first inteligente)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ignora extensões externas não críticas
  if (!url.startsWith(self.location.origin) &&
      !url.includes('cdn.jsdelivr.net')) {
    return;
  }

  // API → network first
  if (url.includes('/api/') || url.includes('/data/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(BASE + 'offline.html')
      )
    );
    return;
  }

  // Static assets → cache first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(() => {
        // fallback simples
        if (event.request.mode === 'navigate') {
          return caches.match(BASE + 'index.html');
        }
      });
    })
  );
});

// PUSH NOTIFICATION
self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Notificação', body: 'Nova atualização' };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Aviso', {
      body: data.body || '',
      icon: BASE + 'assets/img/icons/icon-192x192.png'
    })
  );
});

// CLICK NOTIFICATION
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(BASE + 'dashboard-parent.html')
  );
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/dashboard-parent.html'));
});
