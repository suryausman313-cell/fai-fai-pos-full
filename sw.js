// sw.js - basic cache
const CACHE = 'fai-fai-v1';
self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c=>c.addAll(['index.html','style.css','scripts/app.js'])));
});
self.addEventListener('fetch', ev => {
  ev.respondWith(caches.match(ev.request).then(r=>r||fetch(ev.request)));
});
