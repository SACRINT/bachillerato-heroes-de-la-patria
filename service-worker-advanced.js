/**
 * ADVANCED SERVICE WORKER - PWA Avanzado con Background Sync
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

const CACHE_VERSION = 'bge-v3.0.0';
const CACHE_NAMES = {
    static: `${CACHE_VERSION}-static`,
    dynamic: `${CACHE_VERSION}-dynamic`,
    images: `${CACHE_VERSION}-images`,
    api: `${CACHE_VERSION}-api`
};

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/dark-mode.css',
    '/js/main.js',
    '/js/lazy-load-manager.js',
    '/js/notification-client.js',
    '/manifest.json',
    '/images/logo.png',
    '/images/icon-192x192.png',
    '/images/icon-512x512.png'
];

const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 100;

/**
 * Install Event - Precachear recursos estáticos
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v' + CACHE_VERSION);

    event.waitUntil(
        caches.open(CACHE_NAMES.static)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ [SW] Static assets cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ [SW] Error caching static assets:', error);
            })
    );
});

/**
 * Activate Event - Limpiar caches antiguos
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker v' + CACHE_VERSION);

    event.waitUntil(
        Promise.all([
            // Limpiar caches antiguos
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => !Object.values(CACHE_NAMES).includes(cacheName))
                        .map(cacheName => {
                            console.log(`[SW] Deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                        })
                );
            }),
            // Tomar control de todas las páginas
            self.clients.claim()
        ])
    );
});

/**
 * Fetch Event - Estrategias de caching
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar peticiones que no sean GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorar chrome-extension y otras URLs no HTTP
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Estrategia según tipo de recurso
    if (request.url.includes('/api/')) {
        // API Requests: Network First con fallback a cache
        event.respondWith(networkFirstStrategy(request, CACHE_NAMES.api));
    } else if (request.destination === 'image') {
        // Imágenes: Cache First con actualización en background
        event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
    } else if (STATIC_ASSETS.some(asset => request.url.endsWith(asset))) {
        // Recursos estáticos: Cache First
        event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.static));
    } else {
        // Otros recursos: Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.dynamic));
    }
});

/**
 * Estrategia: Network First
 * Intenta red primero, fallback a cache si falla
 */
async function networkFirstStrategy(request, cacheName) {
    try {
        const response = await fetch(request);

        // Si la respuesta es exitosa, guardar en cache
        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);

        // Fallback a cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Si tampoco está en cache, retornar página offline
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }

        throw error;
    }
}

/**
 * Estrategia: Cache First
 * Busca en cache primero, red si no encuentra
 */
async function cacheFirstStrategy(request, cacheName) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
    }

    try {
        const response = await fetch(request);

        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());

            // Limitar tamaño del cache
            if (cacheName === CACHE_NAMES.images) {
                limitCacheSize(cacheName, MAX_IMAGE_CACHE_SIZE);
            } else if (cacheName === CACHE_NAMES.dynamic) {
                limitCacheSize(cacheName, MAX_DYNAMIC_CACHE_SIZE);
            }
        }

        return response;
    } catch (error) {
        console.error('[SW] Error fetching:', request.url, error);

        // Fallback genérico para imágenes
        if (request.destination === 'image') {
            return caches.match('/images/placeholder.png');
        }

        throw error;
    }
}

/**
 * Estrategia: Stale While Revalidate
 * Retorna cache inmediatamente, actualiza en background
 */
async function staleWhileRevalidate(request, cacheName) {
    const cachedResponse = await caches.match(request);

    const fetchPromise = fetch(request)
        .then(response => {
            if (response && response.status === 200) {
                const cache = caches.open(cacheName);
                cache.then(c => c.put(request, response.clone()));
            }
            return response;
        })
        .catch(error => {
            console.log('[SW] Fetch failed for:', request.url);
            return cachedResponse;
        });

    return cachedResponse || fetchPromise;
}

/**
 * Limitar tamaño del cache
 */
async function limitCacheSize(cacheName, maxSize) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxSize) {
        // Eliminar las entradas más antiguas
        const keysToDelete = keys.slice(0, keys.length - maxSize);
        await Promise.all(keysToDelete.map(key => cache.delete(key)));
        console.log(`[SW] Cache ${cacheName} trimmed to ${maxSize} entries`);
    }
}

/**
 * Background Sync - Sincronizar datos pendientes cuando vuelva la conexión
 */
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event:', event.tag);

    if (event.tag === 'sync-pending-data') {
        event.waitUntil(syncPendingData());
    } else if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications());
    } else if (event.tag.startsWith('sync-form-')) {
        const formId = event.tag.replace('sync-form-', '');
        event.waitUntil(syncFormSubmission(formId));
    }
});

/**
 * Sincronizar datos pendientes
 */
async function syncPendingData() {
    try {
        // Obtener datos pendientes de IndexedDB
        const pendingData = await getPendingData();

        if (pendingData.length === 0) {
            console.log('[SW] No pending data to sync');
            return;
        }

        console.log(`[SW] Syncing ${pendingData.length} pending items`);

        for (const item of pendingData) {
            try {
                const response = await fetch(item.url, {
                    method: item.method,
                    headers: item.headers,
                    body: item.body
                });

                if (response.ok) {
                    // Marcar como sincronizado
                    await markAsSynced(item.id);
                    console.log(`✅ [SW] Synced item ${item.id}`);

                    // Notificar al cliente
                    self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'sync-success',
                                itemId: item.id
                            });
                        });
                    });
                } else {
                    console.error(`❌ [SW] Failed to sync item ${item.id}:`, response.status);
                }
            } catch (error) {
                console.error(`❌ [SW] Error syncing item ${item.id}:`, error);
            }
        }
    } catch (error) {
        console.error('❌ [SW] Error in syncPendingData:', error);
    }
}

/**
 * Sincronizar envío de formulario
 */
async function syncFormSubmission(formId) {
    console.log(`[SW] Syncing form submission: ${formId}`);

    try {
        const formData = await getFormData(formId);

        if (!formData) {
            console.warn(`[SW] Form data not found: ${formId}`);
            return;
        }

        const response = await fetch(formData.url, {
            method: 'POST',
            headers: formData.headers,
            body: formData.body
        });

        if (response.ok) {
            await deleteFormData(formId);
            console.log(`✅ [SW] Form ${formId} synced successfully`);

            // Notificar al usuario
            self.registration.showNotification('Formulario Enviado', {
                body: 'Tu formulario se envió correctamente',
                icon: '/images/icon-192x192.png',
                badge: '/images/badge.png'
            });

            // Notificar al cliente
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'form-synced',
                        formId
                    });
                });
            });
        }
    } catch (error) {
        console.error(`❌ [SW] Error syncing form ${formId}:`, error);
    }
}

/**
 * Sincronizar notificaciones
 */
async function syncNotifications() {
    try {
        const response = await fetch('/api/notifications/pending');

        if (response.ok) {
            const notifications = await response.json();

            for (const notification of notifications) {
                self.registration.showNotification(notification.title, {
                    body: notification.message,
                    icon: notification.icon || '/images/icon-192x192.png',
                    badge: '/images/badge.png',
                    data: notification,
                    requireInteraction: notification.priority === 'high'
                });
            }
        }
    } catch (error) {
        console.error('❌ [SW] Error syncing notifications:', error);
    }
}

/**
 * Push Notifications
 */
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.body || 'Nueva notificación',
        icon: data.icon || '/images/icon-192x192.png',
        badge: '/images/badge.png',
        vibrate: [200, 100, 200],
        data: data,
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Notificación', options)
    );
});

/**
 * Notification Click
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.notification.tag);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Si ya hay una ventana abierta, enfocarla
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Si no, abrir nueva ventana
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

/**
 * Message Handler - Comunicación con el cliente
 */
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data.type === 'CACHE_URLS') {
        cacheUrls(event.data.urls);
    } else if (event.data.type === 'CLEAR_CACHE') {
        clearAllCaches();
    } else if (event.data.type === 'GET_CACHE_SIZE') {
        getCacheSize().then(size => {
            event.ports[0].postMessage({ cacheSize: size });
        });
    }
});

/**
 * Cachear URLs bajo demanda
 */
async function cacheUrls(urls) {
    const cache = await caches.open(CACHE_NAMES.dynamic);
    return cache.addAll(urls);
}

/**
 * Limpiar todos los caches
 */
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
}

/**
 * Obtener tamaño total del cache
 */
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalSize += keys.length;
    }

    return totalSize;
}

/**
 * Helper functions para IndexedDB (simplificadas)
 */
async function getPendingData() {
    // TODO: Implementar lectura de IndexedDB
    return [];
}

async function markAsSynced(id) {
    // TODO: Implementar actualización en IndexedDB
}

async function getFormData(formId) {
    // TODO: Implementar lectura de IndexedDB
    return null;
}

async function deleteFormData(formId) {
    // TODO: Implementar eliminación en IndexedDB
}

console.log('✅ [SW] Service Worker loaded v' + CACHE_VERSION);
