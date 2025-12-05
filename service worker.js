const CACHE_NAME = 'fai-fai-pos-cache-' + Date.now();
const FILES = [
  '/',
  '/index.html',
  '/cashier.html',
  '/admin.html',
  '/waiter.html',
  '/kitchen.html',
  '/reports.html',
  '/style.css',
  '/app.js',
  '/products.json'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(names => Promise.all(names.filter(n=>n!==CACHE_NAME).map(n=>caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request))
  );
});
