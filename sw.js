// Service Worker para la aplicación PWA
const CACHE_NAME = 'salchipapa-pos-v1.0';
const urlsToCache = [
  './',
  './index.html',
  './mesero.html',
  './cocina.html',
  './caja.html',
  './css/style.css',
  './js/auth.js',
  './js/database.js',
  './js/app.js',
  './js/mesero.js',
  './js/cocina.js',
  './js/caja.js',
  './manifest.json',
  './icon.png'
];

// Instalación del Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar solicitudes
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      }
    )
  );
});