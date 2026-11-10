const CACHE_NAME = 'hcl-pwa-v5';

// Core assets to pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/worker-manifest.json',
  '/inspector-manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Web Push Notification handler (works even when app/browser is closed!)
self.addEventListener('push', (event) => {
  let payload = {
    title: '🔔 משימה חדשה / Новая задача!',
    body: 'התקבלה משימה חדשה ב-WorkerApp',
    isRework: false,
    isQr: false,
    url: '/worker.html'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: payload.isRework
      ? [600, 150, 600, 150, 600, 150, 800]
      : [500, 150, 500, 150, 700, 150, 500],
    requireInteraction: true,
    renotify: true,
    tag: payload.tag || 'hcl-worker-task-alert',
    data: {
      url: payload.url || '/worker.html',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title, options),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'PUSH_TASK_ALERT',
            payload
          });
        }
      })
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/worker.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('worker.html') && 'focus' in client) {
          client.postMessage({ type: 'STOP_ALARM_AND_REFRESH' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') return;

  // For API requests: Network First, only cache valid 200 responses
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For HTML, CSS, JS and Images, use Network First / Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => {
        // Ignore network errors on revalidate
      });

      return cachedResponse || fetchPromise;
    })
  );
});
