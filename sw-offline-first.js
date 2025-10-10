/**
 * SERVICE WORKER AVANZADO - PWA OFFLINE FIRST
 * Bachillerato General Estatal "Héroes de la Patria"
 * Versión 3.0 - Integración completa con API y funcionalidades avanzadas
 */

// === CONFIGURATION ===
const CACHE_NAME = 'heroes-patria-v4.3.0-auto-update';
const OFFLINE_PAGE = './offline.html';
const API_CACHE_NAME = 'heroes-api-cache-v1';
const IMAGES_CACHE_NAME = 'heroes-images-v1';
const STATIC_CACHE_NAME = 'heroes-static-v1';
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

// Versión del service worker para auto-actualizaciones
const SW_VERSION = '4.3.0-auto-update';

const CACHE_STRATEGY_CONFIG = {
    staleWhileRevalidate: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        maxEntries: 100
    },
    cacheFirst: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxEntries: 50
    },
    networkFirst: {
        timeout: 3000, // 3 seconds
        maxAge: 60 * 60 * 1000, // 1 hour
        maxEntries: 30
    },
    apiCache: {
        maxAge: 5 * 60 * 1000, // 5 minutes for API responses
        maxEntries: 100
    }
};

// === APP SHELL - CRITICAL RESOURCES FOR OFFLINE ===
const PRECACHE_RESOURCES = [
    // Core pages (App Shell)
    './',
    './index.html',
    './conocenos.html',
    './oferta-educativa.html',
    './servicios.html',
    './estudiantes.html',
    './padres.html',
    './comunidad.html',
    './contacto.html',
    './offline.html',
    
    // Partials
    './partials/header.html',
    './partials/footer.html',
    
    // Core styles
    './css/style.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    
    // Core scripts
    './js/script.js',
    './js/cms-integration.js',
    './js/api-client.js',
    './js/auth-interface.js',
    './js/chatbot.js',
    './js/performance-optimizer.js',
    './js/cache-manager.js',
    './js/advanced-search.js',
    './js/mobile-enhancements.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
    
    // PWA essentials
    '/manifest.json',
    
    // Critical images
    '/images/logo-bachillerato-HDLP.webp',
    '/images/app_icons/icon-192x192.png',
    '/images/app_icons/icon-512x512.png',
    
    // Hero images (solo las que existen)
    '/images/hero/fachada1.webp',
    '/images/hero/fachada1.jpeg'
];

// === DYNAMIC CONTENT PATTERNS ===
const CACHE_STRATEGIES = {
    // Static assets - Cache First (long cache)
    cacheFirst: [
        /\.(css|js|woff2?|ttf|eot)(\?.*)?$/,
        /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?.*)?$/,
        /\/images\//,
        /\/fonts\//,
        /cdn\.(jsdelivr|cloudflare)\.com/,
        /fonts\.(googleapis|gstatic)\.com/
    ],
    
    // HTML pages - Network First with cache fallback
    networkFirst: [
        /\.html(\?.*)?$/,
        /\/$/
    ],
    
    // API data - Stale While Revalidate
    staleWhileRevalidate: [
        /\/data\//,
        /\.json(\?.*)?$/
    ]
};

// === INSTALL EVENT ===
self.addEventListener('install', event => {
    console.log('🔄 Service Worker installing...');
    
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                
                // Precache critical resources with error handling
                console.log('📦 Precaching App Shell...');
                
                // Cache resources individually to avoid total failure
                for (const resource of PRECACHE_RESOURCES) {
                    try {
                        await cache.add(resource);
                        console.log(`✅ Cached: ${resource}`);
                    } catch (error) {
                        console.warn(`⚠️ Failed to cache ${resource}:`, error.message);
                        // Continue with other resources instead of failing completely
                    }
                }
                
                console.log('✅ Service Worker installed successfully');
                
                // Skip waiting to activate immediately
                await self.skipWaiting();
                
            } catch (error) {
                console.error('❌ Service Worker installation failed:', error);
            }
        })()
    );
});

// === ACTIVATE EVENT ===
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        (async () => {
            try {
                // Clean up old caches más agresivamente
                const cacheNames = await caches.keys();
                const currentCaches = [CACHE_NAME, API_CACHE_NAME, IMAGES_CACHE_NAME, STATIC_CACHE_NAME];
                const deletionPromises = cacheNames
                    .filter(cacheName => !currentCaches.includes(cacheName))
                    .map(async cacheName => {
                        console.log(`🗑️ Deleting old cache: ${cacheName}`);
                        try {
                            await caches.delete(cacheName);
                            console.log(`✅ Deleted cache: ${cacheName}`);
                        } catch (error) {
                            console.warn(`⚠️ Failed to delete cache ${cacheName}:`, error);
                        }
                    });
                
                await Promise.all(deletionPromises);
                
                // Take control of all clients immediately
                await self.clients.claim();
                
                console.log('✅ Service Worker activated successfully');
                
            } catch (error) {
                console.error('❌ Service Worker activation failed:', error);
            }
        })()
    );
});

// === FETCH EVENT ===
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Only handle HTTP/HTTPS requests
    if (!url.protocol.startsWith('http')) return;
    
    // Skip chrome-extension requests
    if (url.protocol === 'chrome-extension:') return;
    
    // CRITICAL: Don't intercept authentication and critical API requests
    // Let them go directly to the server to avoid 404 conflicts
    if (url.pathname.includes('/api/auth/') ||
        url.pathname.includes('/api/analytics/') ||
        url.pathname.includes('/health') ||
        url.pathname.includes('/dashboard-manager-2025.js') ||
        url.pathname.includes('/admin-dashboard.js') ||
        request.method === 'POST' ||
        request.method === 'PUT' ||
        request.method === 'DELETE') {
        // Let critical API requests go through directly
        return;
    }
    
    event.respondWith(handleRequest(request));
});

// === REQUEST HANDLING STRATEGIES ===
async function handleRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Determine cache strategy based on URL pattern
        const strategy = getCacheStrategy(url);
        
        switch (strategy) {
            case 'cacheFirst':
                return await cacheFirstStrategy(request);
            
            case 'networkFirst':
                return await networkFirstStrategy(request);
            
            case 'staleWhileRevalidate':
                return await staleWhileRevalidateStrategy(request);
            
            default:
                // Default to network first for unknown patterns
                return await networkFirstStrategy(request);
        }
        
    } catch (error) {
        console.warn('⚠️ Request handling failed:', error);
        return await getOfflineFallback(request);
    }
}

// === CACHE STRATEGY DETERMINATION ===
function getCacheStrategy(url) {
    const urlString = url.href;
    
    // Check Cache First patterns
    for (const pattern of CACHE_STRATEGIES.cacheFirst) {
        if (pattern.test(urlString)) {
            return 'cacheFirst';
        }
    }
    
    // Check Network First patterns
    for (const pattern of CACHE_STRATEGIES.networkFirst) {
        if (pattern.test(urlString)) {
            return 'networkFirst';
        }
    }
    
    // Check Stale While Revalidate patterns
    for (const pattern of CACHE_STRATEGIES.staleWhileRevalidate) {
        if (pattern.test(urlString)) {
            return 'staleWhileRevalidate';
        }
    }
    
    return 'networkFirst'; // Default strategy
}

// === CACHE FIRST STRATEGY ===
async function cacheFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // Check if cached response is still valid
        const cachedTime = new Date(cachedResponse.headers.get('sw-cached-date') || 0);
        const maxAge = CACHE_STRATEGY_CONFIG.cacheFirst.maxAge;
        
        if (Date.now() - cachedTime.getTime() < maxAge) {
            return cachedResponse;
        }
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Clone and cache the response
            const responseToCache = networkResponse.clone();
            
            // Add cache timestamp
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-date', new Date().toISOString());
            
            const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            await cache.put(request, modifiedResponse);
            return networkResponse;
        }
    } catch (error) {
        console.warn('Network failed, serving from cache:', error);
    }
    
    return cachedResponse || getOfflineFallback(request);
}

// === NETWORK FIRST STRATEGY ===
async function networkFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CACHE_STRATEGY_CONFIG.networkFirst.timeout);
        
        const networkResponse = await fetch(request, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (networkResponse.ok) {
            // Cache successful responses
            await cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Network timeout, falling back to cache');
        } else {
            console.warn('Network failed:', error);
        }
    }
    
    // Try cache fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    return await getOfflineFallback(request);
}

// === STALE WHILE REVALIDATE STRATEGY ===
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Start network request (don't await)
    const networkPromise = fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => null);
    
    // Return cached response immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // If no cache, wait for network
    try {
        return await networkPromise;
    } catch (error) {
        return await getOfflineFallback(request);
    }
}

// === OFFLINE FALLBACK ===
async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // For HTML requests, return offline page
    if (request.headers.get('accept')?.includes('text/html')) {
        const cache = await caches.open(CACHE_NAME);
        const offlineResponse = await cache.match(OFFLINE_PAGE);
        
        if (offlineResponse) {
            return offlineResponse;
        }
        
        // Fallback HTML if offline.html is not cached
        return new Response(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Sin conexión - Héroes de la Patria</title>
                <style>
                    body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background: #f8f9fa; }
                    .container { max-width: 500px; margin: 0 auto; }
                    .icon { font-size: 4rem; margin-bottom: 1rem; }
                    h1 { color: #1976D2; }
                    .btn { background: #1976D2; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 1rem; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">📡</div>
                    <h1>Sin conexión a Internet</h1>
                    <p>No es posible conectarse al servidor en este momento. Verifica tu conexión a Internet e intenta nuevamente.</p>
                    <a href="/" class="btn" onclick="window.location.reload()">Reintentar</a>
                </div>
            </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
    
    // For other requests, let them go to network
    // Don't intercept all requests - let the server handle them naturally
    return fetch(request).catch(error => {
        console.warn('SW: Network request failed:', request.url, error);
        return new Response('Recurso no disponible sin conexión', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
        });
    });
}

// === BACKGROUND SYNC ===
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Perform any background sync operations here
        console.log('🔄 Performing background sync...');
        
        // Example: Sync form submissions, update cache, etc.
        const cache = await caches.open(CACHE_NAME);
        
        // Update critical resources
        const criticalResources = ['/data/config.json', '/data/noticias.json'];
        
        for (const resource of criticalResources) {
            try {
                const response = await fetch(resource);
                if (response.ok) {
                    await cache.put(resource, response);
                    console.log(`✅ Updated cache for: ${resource}`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to update: ${resource}`, error);
            }
        }
        
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// === PUSH NOTIFICATIONS ===
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Nueva actualización disponible',
        icon: '/images/app_icons/icon-192x192.png',
        badge: '/images/app_icons/icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver más',
                icon: '/images/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/images/icons/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Héroes de la Patria', options)
    );
});

// === NOTIFICATION CLICK ===
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(self.clients.openWindow('/'));
    }
});

// === API REQUEST HANDLING ===
async function handleAPIRequest(request) {
    const url = new URL(request.url);
    
    // API requests que deben ser cacheados
    if (url.pathname.includes('/api/')) {
        try {
            const response = await fetch(request);
            
            if (response.ok) {
                // Cachear respuestas exitosas de API
                const apiCache = await caches.open(API_CACHE_NAME);
                const responseToCache = response.clone();
                
                // Agregar timestamp para expiracion
                const headers = new Headers(responseToCache.headers);
                headers.set('sw-api-cached', new Date().toISOString());
                
                const cachedResponse = new Response(responseToCache.body, {
                    status: responseToCache.status,
                    statusText: responseToCache.statusText,
                    headers: headers
                });
                
                await apiCache.put(request, cachedResponse);
                return response;
            }
        } catch (error) {
            // Si falla la red, intentar cache
            const apiCache = await caches.open(API_CACHE_NAME);
            const cachedResponse = await apiCache.match(request);
            
            if (cachedResponse) {
                // Verificar si no está muy viejo
                const cachedTime = new Date(cachedResponse.headers.get('sw-api-cached') || 0);
                const maxAge = CACHE_STRATEGY_CONFIG.apiCache.maxAge;
                
                if (Date.now() - cachedTime.getTime() < maxAge) {
                    return cachedResponse;
                }
            }
            
            // Retornar respuesta offline para API
            return new Response(JSON.stringify({
                error: 'Sin conexión',
                message: 'No hay datos disponibles offline',
                offline: true
            }), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }
    
    return fetch(request);
}

// === ADVANCED CACHING STRATEGIES ===
async function intelligentCacheStrategy(request) {
    const url = new URL(request.url);
    
    // Estrategia inteligente basada en tipo de contenido
    if (url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png') || 
        url.pathname.endsWith('.webp') || url.pathname.endsWith('.svg')) {
        return await imagesCacheStrategy(request);
    }
    
    if (url.pathname.includes('/api/')) {
        return await handleAPIRequest(request);
    }
    
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        return await cacheFirstStrategy(request);
    }
    
    return await networkFirstStrategy(request);
}

async function imagesCacheStrategy(request) {
    const imagesCache = await caches.open(IMAGES_CACHE_NAME);
    const cachedResponse = await imagesCache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            // Solo cachear imágenes que no sean muy grandes
            const contentLength = response.headers.get('content-length');
            if (!contentLength || parseInt(contentLength) < 1024 * 1024) { // < 1MB
                const responseToCache = response.clone();
                await imagesCache.put(request, responseToCache);
            }
        }
        
        return response;
    } catch (error) {
        // Retornar imagen placeholder si está disponible
        const placeholderUrl = './images/placeholder.jpg';
        const placeholderResponse = await imagesCache.match(placeholderUrl);
        
        return placeholderResponse || new Response('', { status: 404 });
    }
}

// === BACKGROUND SYNC PARA DATOS ===
self.addEventListener('sync', event => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'chat-messages-sync') {
        event.waitUntil(syncChatMessages());
    }
    
    if (event.tag === 'offline-actions-sync') {
        event.waitUntil(syncOfflineActions());
    }
    
    if (event.tag === 'user-preferences-sync') {
        event.waitUntil(syncUserPreferences());
    }
});

async function syncChatMessages() {
    try {
        // Obtener mensajes pendientes de IndexedDB
        const pendingMessages = await getPendingChatMessages();
        
        for (const message of pendingMessages) {
            try {
                const response = await fetch('/api/chatbot/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                });
                
                if (response.ok) {
                    await removePendingChatMessage(message.id);
                    console.log('✅ Chat message synced:', message.id);
                }
            } catch (error) {
                console.warn('⚠️ Failed to sync chat message:', message.id);
            }
        }
    } catch (error) {
        console.error('❌ Chat sync failed:', error);
    }
}

async function syncOfflineActions() {
    // Sincronizar acciones realizadas offline
    try {
        const offlineActions = await getOfflineActions();
        
        for (const action of offlineActions) {
            try {
                const response = await fetch(action.endpoint, {
                    method: action.method,
                    headers: action.headers,
                    body: action.body
                });
                
                if (response.ok) {
                    await removeOfflineAction(action.id);
                    console.log('✅ Offline action synced:', action.type);
                }
            } catch (error) {
                console.warn('⚠️ Failed to sync action:', action.type);
            }
        }
    } catch (error) {
        console.error('❌ Offline actions sync failed:', error);
    }
}

async function syncUserPreferences() {
    // Sincronizar preferencias de usuario
    try {
        const preferences = await getUserPreferences();
        
        if (preferences && preferences.needsSync) {
            const response = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${preferences.token}`
                },
                body: JSON.stringify(preferences.data)
            });
            
            if (response.ok) {
                await markPreferencesAsSynced();
                console.log('✅ User preferences synced');
            }
        }
    } catch (error) {
        console.error('❌ Preferences sync failed:', error);
    }
}

// === UTILITY FUNCTIONS PARA INDEXEDDB ===
async function getPendingChatMessages() {
    // Implementación placeholder - en producción usar IndexedDB
    return [];
}

async function removePendingChatMessage(id) {
    // Implementación placeholder
}

async function getOfflineActions() {
    // Implementación placeholder
    return [];
}

async function removeOfflineAction(id) {
    // Implementación placeholder
}

async function getUserPreferences() {
    // Implementación placeholder
    return null;
}

async function markPreferencesAsSynced() {
    // Implementación placeholder
}

// === PUSH NOTIFICATIONS AVANZADAS ===
self.addEventListener('push', event => {
    const options = {
        body: 'Tienes nuevas actualizaciones disponibles',
        icon: './images/icons/icon-192x192.png',
        badge: './images/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver actualizaciones',
                icon: './images/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: './images/icons/xmark.png'
            }
        ],
        requireInteraction: true,
        renotify: true,
        tag: 'heroes-patria-notification'
    };

    if (event.data) {
        const payload = event.data.json();
        options.body = payload.body || options.body;
        options.data = { ...options.data, ...payload.data };
    }

    event.waitUntil(
        self.registration.showNotification('Héroes de la Patria', options)
    );
});

// === CACHE CLEANUP AVANZADO ===
async function performIntelligentCacheCleanup() {
    try {
        const cacheNames = await caches.keys();
        const currentCaches = [CACHE_NAME, API_CACHE_NAME, IMAGES_CACHE_NAME, STATIC_CACHE_NAME];
        
        // Eliminar cachés obsoletos
        for (const cacheName of cacheNames) {
            if (!currentCaches.includes(cacheName)) {
                await caches.delete(cacheName);
                console.log('🗑️ Deleted obsolete cache:', cacheName);
            }
        }
        
        // Limpiar entradas expiradas en cada caché
        for (const cacheName of currentCaches) {
            await cleanExpiredCacheEntries(cacheName);
        }
        
        console.log('✅ Cache cleanup completed');
    } catch (error) {
        console.error('❌ Cache cleanup failed:', error);
    }
}

// === SISTEMA DE ACTUALIZACIONES AUTOMÁTICAS ===
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('🔄 [AUTO-UPDATE] Activando nueva versión del service worker');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CHECK_UPDATE') {
        console.log('🔍 [AUTO-UPDATE] Verificación manual de actualizaciones');
        event.waitUntil(checkForManualUpdate(event));
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: SW_VERSION,
            cacheName: CACHE_NAME
        });
    }
});

async function checkForManualUpdate(event) {
    try {
        // Verificar si hay una nueva versión disponible
        const registration = await self.registration.update();

        if (registration.installing) {
            console.log('🔄 [AUTO-UPDATE] Nueva versión encontrada y descargando');

            // Notificar al cliente que hay una actualización
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    version: SW_VERSION
                });
            });
        } else {
            console.log('✅ [AUTO-UPDATE] Ya tienes la versión más reciente');

            // Notificar que no hay actualizaciones
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'NO_UPDATE_AVAILABLE',
                    version: SW_VERSION
                });
            });
        }
    } catch (error) {
        console.error('❌ [AUTO-UPDATE] Error verificando actualizaciones:', error);
    }
}

// Verificación periódica de actualizaciones en background
self.addEventListener('activate', event => {
    console.log('🚀 [AUTO-UPDATE] Service Worker activado - Versión:', SW_VERSION);

    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            performIntelligentCacheCleanup(),
            scheduleUpdateChecks()
        ])
    );
});

async function scheduleUpdateChecks() {
    // Programar verificaciones periódicas de actualizaciones
    console.log('⏰ [AUTO-UPDATE] Programando verificaciones automáticas');

    // Verificar actualizaciones cada 5 minutos cuando la app esté en uso
    setInterval(async () => {
        try {
            const clients = await self.clients.matchAll();
            if (clients.length > 0) { // Solo verificar si hay clientes activos
                await self.registration.update();
            }
        } catch (error) {
            console.warn('⚠️ [AUTO-UPDATE] Error en verificación automática:', error);
        }
    }, UPDATE_CHECK_INTERVAL);
}

async function cleanExpiredCacheEntries(cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            const cachedDate = response.headers.get('sw-cached-date') || 
                              response.headers.get('sw-api-cached');
            
            if (cachedDate) {
                const cacheTime = new Date(cachedDate).getTime();
                const maxAge = getMaxAgeForCache(cacheName);
                
                if (Date.now() - cacheTime > maxAge) {
                    await cache.delete(request);
                    console.log(`🗑️ Deleted expired entry from ${cacheName}:`, request.url);
                }
            }
        }
    } catch (error) {
        console.warn(`⚠️ Failed to clean cache ${cacheName}:`, error);
    }
}

function getMaxAgeForCache(cacheName) {
    if (cacheName === API_CACHE_NAME) {
        return CACHE_STRATEGY_CONFIG.apiCache.maxAge;
    } else if (cacheName === IMAGES_CACHE_NAME) {
        return CACHE_STRATEGY_CONFIG.cacheFirst.maxAge;
    }
    return CACHE_STRATEGY_CONFIG.staleWhileRevalidate.maxAge;
}

// === MESSAGE HANDLING EXTENDIDO ===
self.addEventListener('message', event => {
    console.log('📨 SW Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_NAME,
            timestamp: new Date().toISOString()
        });
    }
    
    if (event.data && event.data.type === 'FORCE_UPDATE') {
        event.waitUntil(performIntelligentCacheCleanup());
    }
    
    if (event.data && event.data.type === 'CACHE_API_DATA') {
        event.waitUntil(cacheAPIData(event.data.data));
    }
    
    if (event.data && event.data.type === 'SYNC_OFFLINE_DATA') {
        event.waitUntil(syncOfflineActions());
    }
});

async function cacheAPIData(data) {
    try {
        const apiCache = await caches.open(API_CACHE_NAME);
        const response = new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'sw-api-cached': new Date().toISOString()
            }
        });
        
        await apiCache.put(data.url, response);
        console.log('✅ API data cached:', data.url);
    } catch (error) {
        console.error('❌ Failed to cache API data:', error);
    }
}

// === PERIODIC BACKGROUND SYNC ===
self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-sync') {
        event.waitUntil(syncContent());
    }
});

async function syncContent() {
    try {
        console.log('🔄 Syncing content in background...');
        
        const cache = await caches.open(CACHE_NAME);
        const dataFiles = [
            '/data/noticias.json',
            '/data/eventos_calendario_pwa.json',
            '/data/testimonios.json',
            '/data/docentes.json'
        ];
        
        for (const file of dataFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    await cache.put(file, response.clone());
                }
            } catch (error) {
                console.warn(`Failed to sync ${file}:`, error);
            }
        }
        
        console.log('✅ Content sync completed');
        
    } catch (error) {
        console.error('❌ Content sync failed:', error);
    }
}

// === ERROR HANDLING ===
self.addEventListener('error', event => {
    console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ Service Worker unhandled rejection:', event.reason);
});

console.log('🚀 Service Worker script loaded - Version:', CACHE_NAME);