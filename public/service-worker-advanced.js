/**
 * 📱 SERVICE WORKER AVANZADO - PWA Offline
 *
 * 3 estrategias de caching + Background Sync + Push Notifications
 * SEMANA 3 - Performance Frontend
 *
 * Versión: 2.0.0
 * Fecha: 17 Noviembre 2025
 */

const CACHE_VERSION = 'v2.30.0';
const CACHE_NAMES = {
    static: `static-${CACHE_VERSION}`,
    dynamic: `dynamic-${CACHE_VERSION}`,
    images: `images-${CACHE_VERSION}`,
    api: `api-${CACHE_VERSION}`
};

// Límites de cache
const CACHE_LIMITS = {
    dynamic: 50,
    images: 100,
    api: 30
};

// Recursos estáticos críticos para precache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/public/css/styles.css',
    '/public/js/main.js',
    '/public/js/logger-manager.js',
    '/manifest.json',
    '/offline.html'
];

// ============================================
// INSTALL EVENT
// ============================================

self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAMES.static)
            .then((cache) => {
                console.log('[SW] Precaching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ============================================
// ACTIVATE EVENT
// ============================================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => !Object.values(CACHE_NAMES).includes(name))
                        .map((name) => {
                            console.log(`[SW] Eliminando cache antiguo: ${name}`);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ============================================
// FETCH EVENT - ESTRATEGIAS DE CACHING
// ============================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo cachear requests GET
    if (request.method !== 'GET') {
        return;
    }

    // Estrategia según tipo de recurso
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request, CACHE_NAMES.api));
    } else if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
        event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
    } else if (STATIC_ASSETS.includes(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.static));
    } else {
        event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAMES.dynamic));
    }
});

// ============================================
// CACHING STRATEGIES
// ============================================

/**
 * Cache First: Intenta cache primero, luego network
 * Ideal para: Imágenes, assets estáticos
 */
async function cacheFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
            await limitCacheSize(cacheName);
        }
        return response;
    } catch (error) {
        // Retornar fallback offline
        return caches.match('/offline.html');
    }
}

/**
 * Network First: Intenta network primero, fallback a cache
 * Ideal para: API calls, datos dinámicos
 */
async function networkFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
            await limitCacheSize(cacheName);
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        return new Response(JSON.stringify({ offline: true, error: 'Sin conexión' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Stale While Revalidate: Retorna cache inmediatamente, actualiza en background
 * Ideal para: Páginas HTML, JS, CSS
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
                limitCacheSize(cacheName);
            }
            return response;
        })
        .catch(() => cached || caches.match('/offline.html'));

    return cached || fetchPromise;
}

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Limitar tamaño del cache
 */
async function limitCacheSize(cacheName) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    const limit = CACHE_LIMITS[cacheName.split('-')[0]] || 50;

    if (keys.length > limit) {
        const toDelete = keys.length - limit;
        for (let i = 0; i < toDelete; i++) {
            await cache.delete(keys[i]);
        }
        console.log(`[SW] Limpiados ${toDelete} items de ${cacheName}`);
    }
}

// ============================================
// BACKGROUND SYNC
// ============================================

self.addEventListener('sync', (event) => {
    console.log('[SW] Background Sync:', event.tag);

    if (event.tag === 'sync-forms') {
        event.waitUntil(syncPendingForms());
    }
});

async function syncPendingForms() {
    // Sincronizar formularios pendientes desde IndexedDB
    console.log('[SW] Sincronizando formularios pendientes...');

    // Implementación específica según tu BD local
    // const db = await openDB('forms-queue');
    // const pending = await db.getAll('pending');
    // ...
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.body || 'Nueva notificación',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        },
        actions: data.actions || [
            { action: 'open', title: 'Abrir' },
            { action: 'close', title: 'Cerrar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'BGE', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        const url = event.notification.data.url || '/';
        event.waitUntil(
            clients.openWindow(url)
        );
    }
});

// ============================================
// MESSAGES
// ============================================

self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }

    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.keys().then((names) => {
                return Promise.all(names.map((name) => caches.delete(name)));
            })
        );
    }
});

console.log(`[SW] Service Worker ${CACHE_VERSION} cargado`);
