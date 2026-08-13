/* ==========================================================================
   WildLens — Service Worker
   App-shell caching so the site installs as a PWA and works offline
   after the first visit. Bump CACHE_VERSION whenever shipping changes
   to CSS/JS/HTML so clients pick up the new files.
   ========================================================================== */

const CACHE_VERSION = 'v1';
const CACHE_NAME = 'wildlens-' + CACHE_VERSION;

// Paths are relative so this works whether the site is served from a
// domain root or a GitHub Pages project path (e.g. /wildlens/).
const APP_SHELL = [
  './',
  './index.html',
  './identify.html',
  './encyclopedia.html',
  './community.html',
  './image-generator.html',
  './image-to-video.html',
  './offline.html',
  './css/style.css',
  './js/main.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function () {
        // Never let one missing asset block install (e.g. during local dev)
        return Promise.all(
          APP_SHELL.map(function (url) {
            return cache.add(url).catch(function () {});
          })
        );
      });
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  // Page navigations: network-first, fall back to cache, then offline page.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            return cached || caches.match('./offline.html');
          });
        })
    );
    return;
  }

  // Same-origin static assets: cache-first for speed.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        return cached || fetch(req).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
          return res;
        });
      })
    );
    return;
  }

  // Cross-origin assets (fonts/CDN libraries): stale-while-revalidate.
  event.respondWith(
    caches.match(req).then(function (cached) {
      var fetchPromise = fetch(req).then(function (res) {
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, res.clone()); });
        return res;
      }).catch(function () { return cached; });
      return cached || fetchPromise;
    })
  );
});
