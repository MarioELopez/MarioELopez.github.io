// ── Service Worker — Mario E. López C. Portfolio ──────────────────
// Estrategia: Cache-first para recursos estáticos, network-first para
// strava.json (datos dinámicos).

const CACHE_NAME = 'mario-portfolio-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './config.js',
  './FOTO_PERFIL.webp',
  './FOTO_PERFIL.jpg',
  './og-image.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
];

// ── INSTALL: pre-cachear estáticos ──────────────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS.filter(function(url) {
        // No pre-cachear URLs de datos externas que puedan fallar
        return !url.startsWith('https://fonts');
      }));
    }).catch(function() {
      // Si algún asset falla, continuar igual
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: limpiar caches viejos ────────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// ── FETCH: estrategia según tipo de recurso ─────────────────────────
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // strava.json → network-first (datos dinámicos)
  if (url.pathname.endsWith('strava.json')) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // meta.json → network-first
  if (url.pathname.endsWith('meta.json')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Todo lo demás → cache-first, stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetchPromise = fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() { return cached; });

      return cached || fetchPromise;
    })
  );
});
