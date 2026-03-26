const CACHE_NAME = 'tracker-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: caching assets');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('Service Worker: all assets cached');
        return self.skipWaiting();
      })
      .catch(err => {
        console.log('Service Worker: cache error', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      console.log('Service Worker: cleaning up old caches');
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('Service Worker: deleting cache', k);
          return caches.delete(k);
        })
      );
    }).then(() => {
      console.log('Service Worker: activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if available
        if (response) {
          return response;
        }

        // Otherwise, try to fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback to offline page or cached assets
            return caches.match('./index.html');
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker loaded');
