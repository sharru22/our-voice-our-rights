const CACHE_VERSION = 'v1';
const APP_SHELL = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE_VERSION ? caches.delete(k) : Promise.resolve())))).then(() => self.clients.claim())
  );
});

// Network-first for API; cache-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          // Cache successful API responses to serve when offline
          caches.open(CACHE_VERSION).then(cache => cache.put(request, clone)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, clone)).catch(() => {});
        return response;
      }).catch(() => cached)
    )
  );
});
