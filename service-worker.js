
const CACHE_NAME = 'qr-elections-offline-v3-integre';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  'https://unpkg.com/html5-qrcode'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of APP_SHELL) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('Cache install impossible pour', url);
        }
      }
    })
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy).catch(() => {});
          });

          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
