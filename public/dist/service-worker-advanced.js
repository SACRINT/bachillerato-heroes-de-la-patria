/**
 * 🔧 SERVICE WORKER AVANZADO - SEMANA 22
 * PWA Enhanced con offline support, background sync y push notifications
 */

const CACHE_VERSION = 'v4.1.0';
const CACHE_NAME = `bachillerato-heroes-${CACHE_VERSION}`;

const CACHES = {
  static: `${CACHE_NAME}-static`,
  dynamic: `${CACHE_NAME}-dynamic`,
  images: `${CACHE_NAME}-images`,
  api: `${CACHE_NAME}-api`
};

const ESSENTIAL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/public/css/bootstrap.min.css',
  '/public/js/main.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHES.static).then(cache => cache.addAll(ESSENTIAL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v' + CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.map(name => {
          if (!Object.values(CACHES).includes(name)) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request, CACHES.api));
  } else if (event.request.destination === 'image') {
    event.respondWith(cacheFirst(event.request, CACHES.images));
  } else {
    event.respondWith(staleWhileRevalidate(event.request, CACHES.dynamic));
  }
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({error: 'offline'}), {
      status: 503,
      headers: {'Content-Type': 'application/json'}
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', {status: 404});
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const networkPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  
  return cached || networkPromise;
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Syncing data...');
}

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {title: 'Notificación'};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/public/images/logo.png'
    })
  );
});
