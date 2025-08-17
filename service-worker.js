const CACHE_NAME = 'estudio-flash-cache-v2';
const urlsToCache = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache abierto');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // fuerza que el SW nuevo tome control
});

// Activación y limpieza de cachés viejos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Cache eliminado:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim(); // toma control inmediato de las páginas abiertas
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Devuelve la respuesta desde caché si existe
      if (response) return response;

      // Si no, la pide a la red y la cachea para la próxima
      return fetch(event.request).then(networkResponse => {
        // Solo cacheamos respuestas exitosas y tipo básico
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      });
    }).catch(() => {
      // Opcional: puedes devolver un fallback si no hay conexión
      return caches.match('index.html');
    })
  );
});