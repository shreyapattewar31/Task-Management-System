// Task Management System — Service Worker
const CACHE = 'tms-v1';
const PRECACHE = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Skip API calls and non-GET requests — always go to network
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const networkFetch = fetch(e.request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
      // Network-first for navigation, cache-first for assets
      return e.request.mode === 'navigate'
        ? networkFetch.catch(() => cached || caches.match('/index.html'))
        : cached || networkFetch;
    })
  );
});
