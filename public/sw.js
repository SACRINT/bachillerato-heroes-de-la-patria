/**
 * SERVICE WORKER AVANZADO - PWA FASE 2 v4.0
 * Bachillerato General Estatal "Héroes de la Patria"
 * Versión 4.0 - Integración completa Fase 2: Analytics, Notifications, Google Classroom
 */

// === CONFIGURATION ===
const CACHE_NAME = 'heroes-patria-v4.0.0';
const OFFLINE_PAGE = './offline.html';
const API_CACHE_NAME = 'heroes-api-cache-v2';
const IMAGES_CACHE_NAME = 'heroes-images-v2';
const STATIC_CACHE_NAME = 'heroes-static-v2';
const COMMUNICATION_CACHE_NAME = 'heroes-communication-v1';

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
    './estudiantes.html',
    './padres.html',
    './comunidad.html',
    './contacto.html',
    './admin-dashboard.html',
    './calificaciones.html',
    './comunicacion-padres-docentes.html',
    './offline.html',

    // Partials
    './partials/header.html',
    './partials/footer.html',

    // Core styles
    './css/style.css',
    './css/parent-teacher-chat.css',
    './css/virtual-appointments.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',

    // Core scripts
    './js/resource-optimizer.js',
    './js/parent-teacher-chat.js',
    './js/virtual-appointments.js',
    './js/dashboard-manager-2025.js',
    './js/auth-interface.js',
    './js/chatbot.js',
    './js/performance-monitor.js',

    // Fase 2 scripts
    './js/google-classroom-integration.js',
    './js/bge-analytics-advanced-system.js',
    './js/bge-push-notification-system.js',
    './js/bge-pwa-advanced.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',

    // PWA essentials
    '/manifest.json',

    // Critical images
    '/images/logo-bachillerato-HDLP.webp',
    '/images/app_icons/icon-192x192.png',
    '/images/app_icons/icon-512x512.png',

    // Hero images
    '/images/hero/fachada1.webp',
    '/images/hero/fachada1.jpg',

    // Fallback images
    '/images/galeria/placeholder_actividad.webp',
    '/images/placeholder/avatar-placeholder.jpg',
    '/images/placeholder/teacher-placeholder.jpg'
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

// === CONFIGURACIÓN MEJORADA DEL SERVICE WORKER ===
const isDevelopment = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

console.log('🚀 Service Worker iniciando...', isDevelopment ? '(Modo Desarrollo)' : '(Modo Producción)');

// === INSTALL EVENT MEJORADO ===
self.addEventListener('install', event => {
    console.log('🔄 Service Worker installing...');
    
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                
                // Precache critical resources with error handling
                console.log('📦 Precaching App Shell...');
                
                // Cache resources individually to avoid total failure
                // En desarrollo, limitar la frecuencia de logs para evitar spam
                const logInterval = isDevelopment ? 5 : 1; // Log cada 5 recursos en desarrollo
                let logCounter = 0;

                for (const resource of PRECACHE_RESOURCES) {
                    try {
                        await cache.add(resource);

                        // Log controlado para evitar spam en desarrollo
                        if (!isDevelopment || (logCounter % logInterval === 0)) {
                            console.log(`✅ Cached: ${resource}`);
                        }
                        logCounter++;
                    } catch (error) {
                        console.warn(`⚠️ Failed to cache ${resource}:`, error.message);
                        // Continue with other resources instead of failing completely
                    }
                }

                // Log de resumen en lugar de individual para desarrollo
                if (isDevelopment) {
                    console.log(`📦 Precache completado: ${logCounter} recursos procesados`);
                }

                console.log('✅ Service Worker installed successfully');

                // Skip waiting habilitado para producción - activación inmediata de actualizaciones
                if (!isDevelopment) {
                    await self.skipWaiting();
                } else {
                    // En desarrollo, permitir activación manual para evitar bucles
                    console.log('⚠️ [DEV] skipWaiting deshabilitado - usa mensaje SKIP_WAITING para activar manualmente');
                }

            } catch (error) {
                console.error('❌ Service Worker installation failed:', error);
            }
        })()
    );
});

// === ACTIVATE EVENT MEJORADO ===
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...', isDevelopment ? '(Desarrollo)' : '(Producción)');
    
    event.waitUntil(
        (async () => {
            try {
                // Clean up old caches
                const cacheNames = await caches.keys();
                const deletionPromises = cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => {
                        console.log(`🗑️ Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
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

    // Skip Google OAuth and authentication requests to prevent 403 errors
    if (url.hostname.includes('accounts.google.com') ||
        url.hostname.includes('oauth2.googleapis.com') ||
        url.hostname.includes('gsi.client') ||
        url.pathname.includes('gsi/client') ||
        url.pathname.includes('oauth') ||
        url.search.includes('client_id') ||
        url.search.includes('oauth')) {
        console.log('🔐 Skipping OAuth request:', url.href);
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
    
    // For other requests, return 404
    return new Response('Recurso no disponible sin conexión', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
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

    if (event.tag === 'parent-teacher-messages-sync') {
        event.waitUntil(syncParentTeacherMessages());
    }

    if (event.tag === 'appointments-sync') {
        event.waitUntil(syncAppointments());
    }

    if (event.tag === 'grades-sync') {
        event.waitUntil(syncGrades());
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

// === FUNCIONES DE SINCRONIZACIÓN PARA COMUNICACIÓN PADRES-DOCENTES ===

async function syncParentTeacherMessages() {
    try {
        console.log('📤 [PT-SYNC] Sincronizando mensajes padres-docentes...');

        const pendingMessages = await getPendingParentTeacherMessages();

        for (const message of pendingMessages) {
            try {
                const response = await fetch('/api/parent-teacher/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${message.authToken}`
                    },
                    body: JSON.stringify(message.data)
                });

                if (response.ok) {
                    await removePendingParentTeacherMessage(message.id);
                    console.log('✅ [PT-SYNC] Mensaje sincronizado:', message.id);

                    // Notificar al cliente sobre la sincronización exitosa
                    notifyClients({
                        type: 'MESSAGE_SYNCED',
                        messageId: message.id,
                        conversationId: message.data.conversation_id
                    });
                } else {
                    console.warn('⚠️ [PT-SYNC] Error HTTP al sincronizar mensaje:', response.status);
                }

            } catch (error) {
                console.warn('⚠️ [PT-SYNC] Error sincronizando mensaje individual:', message.id, error);
            }
        }

    } catch (error) {
        console.error('❌ [PT-SYNC] Error en syncParentTeacherMessages:', error);
    }
}

async function syncAppointments() {
    try {
        console.log('📅 [APPT-SYNC] Sincronizando citas...');

        const pendingAppointments = await getPendingAppointments();

        for (const appointment of pendingAppointments) {
            try {
                const response = await fetch('/api/parent-teacher/appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${appointment.authToken}`
                    },
                    body: JSON.stringify(appointment.data)
                });

                if (response.ok) {
                    await removePendingAppointment(appointment.id);
                    console.log('✅ [APPT-SYNC] Cita sincronizada:', appointment.id);

                    notifyClients({
                        type: 'APPOINTMENT_SYNCED',
                        appointmentId: appointment.id,
                        data: appointment.data
                    });
                }

            } catch (error) {
                console.warn('⚠️ [APPT-SYNC] Error sincronizando cita:', appointment.id, error);
            }
        }

    } catch (error) {
        console.error('❌ [APPT-SYNC] Error en syncAppointments:', error);
    }
}

async function syncGrades() {
    try {
        console.log('📊 [GRADES-SYNC] Sincronizando calificaciones...');

        const pendingGrades = await getPendingGrades();

        for (const grade of pendingGrades) {
            try {
                const response = await fetch('/api/grades', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${grade.authToken}`
                    },
                    body: JSON.stringify(grade.data)
                });

                if (response.ok) {
                    await removePendingGrade(grade.id);
                    console.log('✅ [GRADES-SYNC] Calificación sincronizada:', grade.id);
                }

            } catch (error) {
                console.warn('⚠️ [GRADES-SYNC] Error sincronizando calificación:', grade.id, error);
            }
        }

    } catch (error) {
        console.error('❌ [GRADES-SYNC] Error en syncGrades:', error);
    }
}

// === FUNCIONES AUXILIARES PARA INDEXEDDB ESPECÍFICAS ===

async function getPendingParentTeacherMessages() {
    // En implementación real, usar IndexedDB
    // Por ahora retornamos array vacío
    return [];
}

async function removePendingParentTeacherMessage(id) {
    console.log(`🗑️ [PT-SYNC] Removiendo mensaje pendiente:`, id);
    return true;
}

async function getPendingAppointments() {
    return [];
}

async function removePendingAppointment(id) {
    console.log(`🗑️ [APPT-SYNC] Removiendo cita pendiente:`, id);
    return true;
}

async function getPendingGrades() {
    return [];
}

async function removePendingGrade(id) {
    console.log(`🗑️ [GRADES-SYNC] Removiendo calificación pendiente:`, id);
    return true;
}

// === NOTIFICACIÓN A CLIENTES ===
async function notifyClients(message) {
    try {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage(message);
        });
        console.log('📨 [SW] Notificación enviada a clientes:', message.type);
    } catch (error) {
        console.error('❌ [SW] Error notificando clientes:', error);
    }
}

// === MANEJO DE API PARENT-TEACHER ===
async function handleParentTeacherAPI(request) {
    const url = new URL(request.url);
    const communicationCache = await caches.open(COMMUNICATION_CACHE_NAME);

    // Endpoints críticos que deben cacharse para funcionamiento offline
    const criticalEndpoints = [
        '/api/parent-teacher/conversations',
        '/api/parent-teacher/stats'
    ];

    const isCriticalEndpoint = criticalEndpoints.some(endpoint =>
        url.pathname.includes(endpoint)
    );

    try {
        // Network First para APIs críticas
        const response = await fetch(request);

        if (response.ok && isCriticalEndpoint) {
            // Cachear respuestas exitosas de endpoints críticos
            const responseToCache = response.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-date', new Date().toISOString());

            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });

            await communicationCache.put(request, cachedResponse);
            console.log('📞 [PT-API] Cached:', url.pathname);
        }

        return response;

    } catch (error) {
        console.warn('⚠️ [PT-API] Network failed, trying cache:', url.pathname);

        // Buscar en cache específico de comunicación
        const cachedResponse = await communicationCache.match(request);

        if (cachedResponse && isCriticalEndpoint) {
            // Verificar que no esté muy viejo (5 minutos)
            const cachedTime = new Date(cachedResponse.headers.get('sw-cached-date') || 0);
            const maxAge = 5 * 60 * 1000; // 5 minutos

            if (Date.now() - cachedTime.getTime() < maxAge) {
                console.log('📞 [PT-API] Serving from cache:', url.pathname);
                return cachedResponse;
            }
        }

        // Respuesta offline estructurada para Parent-Teacher API
        return new Response(JSON.stringify({
            error: 'offline',
            message: 'Sistema de comunicación no disponible sin conexión',
            endpoint: url.pathname,
            timestamp: new Date().toISOString(),
            cached: !!cachedResponse
        }), {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'X-SW-Source': 'offline'
            }
        });
    }
}

// === GOOGLE CLASSROOM SYNC ===
self.addEventListener('sync', event => {
    if (event.tag === 'google-classroom-sync') {
        event.waitUntil(syncGoogleClassroomData());
    }

    if (event.tag === 'analytics-events-sync') {
        event.waitUntil(syncAnalyticsEvents());
    }
});

async function syncGoogleClassroomData() {
    try {
        console.log('📚 [CLASSROOM] Sincronizando datos de Google Classroom...');

        const pendingActions = await getPendingClassroomActions();

        for (const action of pendingActions) {
            try {
                const response = await fetch(`/api/google-classroom/${action.endpoint}`, {
                    method: action.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${action.token}`
                    },
                    body: JSON.stringify(action.data)
                });

                if (response.ok) {
                    await removePendingClassroomAction(action.id);
                    console.log('✅ [CLASSROOM] Acción sincronizada:', action.type);
                }
            } catch (error) {
                console.warn('⚠️ [CLASSROOM] Error sincronizando:', action.type, error);
            }
        }
    } catch (error) {
        console.error('❌ [CLASSROOM] Error en sync:', error);
    }
}

async function syncAnalyticsEvents() {
    try {
        console.log('📊 [ANALYTICS] Sincronizando eventos de analytics...');

        const pendingEvents = await getPendingAnalyticsEvents();

        for (const event of pendingEvents) {
            try {
                const response = await fetch('/api/analytics/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(event.data)
                });

                if (response.ok) {
                    await removePendingAnalyticsEvent(event.id);
                    console.log('✅ [ANALYTICS] Evento sincronizado:', event.type);
                }
            } catch (error) {
                console.warn('⚠️ [ANALYTICS] Error sincronizando evento:', error);
            }
        }
    } catch (error) {
        console.error('❌ [ANALYTICS] Error en sync:', error);
    }
}

// === FUNCIONES AUXILIARES FASE 2 ===
async function getPendingClassroomActions() {
    // En implementación real usar IndexedDB
    return [];
}

async function removePendingClassroomAction(id) {
    console.log('🗑️ [CLASSROOM] Removiendo acción pendiente:', id);
    return true;
}

async function getPendingAnalyticsEvents() {
    // En implementación real usar IndexedDB
    return [];
}

async function removePendingAnalyticsEvent(id) {
    console.log('🗑️ [ANALYTICS] Removiendo evento pendiente:', id);
    return true;
}

// === NOTIFICACIONES PUSH EDUCATIVAS ===
self.addEventListener('push', event => {
    if (event.data) {
        const payload = event.data.json();

        // Configuración específica por tipo de notificación educativa
        let options = {
            icon: '/images/app_icons/icon-192x192.png',
            badge: '/images/app_icons/icon-96x96.png',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            data: payload.data || {}
        };

        switch (payload.type) {
            case 'academic':
                options.body = payload.body || 'Nueva actualización académica';
                options.actions = [
                    { action: 'view-grades', title: 'Ver calificaciones', icon: '/images/icons/grades.png' },
                    { action: 'dismiss', title: 'Cerrar', icon: '/images/icons/close.png' }
                ];
                break;

            case 'administrative':
                options.body = payload.body || 'Nueva información administrativa';
                options.actions = [
                    { action: 'view-info', title: 'Ver información', icon: '/images/icons/info.png' },
                    { action: 'dismiss', title: 'Cerrar', icon: '/images/icons/close.png' }
                ];
                break;

            case 'emergency':
                options.body = payload.body || 'Alerta importante del plantel';
                options.vibrate = [500, 200, 500];
                options.requireInteraction = true;
                options.actions = [
                    { action: 'view-alert', title: 'Ver alerta', icon: '/images/icons/alert.png' }
                ];
                break;

            case 'classroom':
                options.body = payload.body || 'Nueva actividad en Google Classroom';
                options.actions = [
                    { action: 'open-classroom', title: 'Abrir Classroom', icon: '/images/icons/classroom.png' },
                    { action: 'dismiss', title: 'Cerrar', icon: '/images/icons/close.png' }
                ];
                break;

            default:
                options.body = payload.body || 'Nueva notificación de Héroes de la Patria';
        }

        event.waitUntil(
            self.registration.showNotification('BGE Héroes de la Patria', options)
        );
    }
});

// === MANEJO DE CLICKS EN NOTIFICACIONES EDUCATIVAS ===
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const action = event.action;
    const data = event.notification.data;

    switch (action) {
        case 'view-grades':
            event.waitUntil(self.clients.openWindow('/calificaciones.html'));
            break;

        case 'view-info':
            event.waitUntil(self.clients.openWindow('/admin-dashboard.html'));
            break;

        case 'view-alert':
            event.waitUntil(self.clients.openWindow('/'));
            break;

        case 'open-classroom':
            if (data.classroomUrl) {
                event.waitUntil(self.clients.openWindow(data.classroomUrl));
            } else {
                event.waitUntil(self.clients.openWindow('/estudiantes.html'));
            }
            break;

        default:
            // Click en la notificación sin acción específica
            event.waitUntil(self.clients.openWindow('/'));
    }
});

console.log('🚀 Service Worker FASE 2 cargado - Version:', CACHE_NAME);