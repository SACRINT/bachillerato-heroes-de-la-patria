/**
 * 🚀 SERVICE WORKER OPTIMIZADO PARA CORE WEB VITALS
 * BGE Héroes de la Patria - Optimización de rendimiento
 */

const CACHE_NAME = 'bge-core-web-vitals-v1.0.0';
const CACHE_VERSION = '1.0.0';

// Recursos críticos para el LCP
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/core-web-vitals.css',
    '/js/core-web-vitals-optimizer.js',
    '/js/performance-monitor.js',
    '/images/hero/fachada1.jpg',
    // Fuentes críticas
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Recursos importantes pero no críticos
const IMPORTANT_RESOURCES = [
    '/css/themes.css',
    '/js/main.js',
    '/js/script.js',
    '/js/responsive-nav.js',
    '/js/lazy-loading-advanced.js',
    '/js/pwa-advanced.js'
];

// Recursos estáticos para cache a largo plazo
const STATIC_RESOURCES = [
    '/images/',
    '/css/',
    '/js/',
    '/partials/'
];

// URLs de API que necesitan estrategias especiales
const API_ENDPOINTS = [
    '/api/health',
    '/api/dashboard',
    '/api/students',
    '/api/teachers'
];

/**
 * Instalación del Service Worker
 */
self.addEventListener('install', event => {
    console.log('🔧 Instalando SW Core Web Vitals:', CACHE_VERSION);

    event.waitUntil(
        Promise.all([
            precacheCriticalResources(),
            precacheImportantResources()
        ]).then(() => {
            console.log('✅ Precache completado');
            // Activar inmediatamente el nuevo SW
            return self.skipWaiting();
        })
    );
});

/**
 * Activación del Service Worker
 */
self.addEventListener('activate', event => {
    console.log('🚀 Activando SW Core Web Vitals:', CACHE_VERSION);

    event.waitUntil(
        Promise.all([
            cleanupOldCaches(),
            self.clients.claim()
        ]).then(() => {
            console.log('✅ SW activado y listo');
        })
    );
});

/**
 * Interceptar requests con estrategias optimizadas
 */
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Solo manejar requests GET
    if (request.method !== 'GET') {
        return;
    }

    // Estrategias según el tipo de recurso
    if (isCriticalResource(request.url)) {
        event.respondWith(handleCriticalResource(request));
    } else if (isImageResource(request.url)) {
        event.respondWith(handleImageResource(request));
    } else if (isAPIRequest(request.url)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isStaticResource(request.url)) {
        event.respondWith(handleStaticResource(request));
    } else {
        event.respondWith(handleGeneralResource(request));
    }
});

/**
 * Precache de recursos críticos (mejorar LCP)
 */
async function precacheCriticalResources() {
    const cache = await caches.open(CACHE_NAME + '-critical');

    const cachePromises = CRITICAL_RESOURCES.map(async url => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                console.log(`✅ Cached critical: ${url}`);
            }
        } catch (error) {
            console.warn(`⚠️ Failed to cache critical: ${url}`, error);
        }
    });

    await Promise.allSettled(cachePromises);
}

/**
 * Precache de recursos importantes
 */
async function precacheImportantResources() {
    const cache = await caches.open(CACHE_NAME + '-important');

    const cachePromises = IMPORTANT_RESOURCES.map(async url => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                console.log(`✅ Cached important: ${url}`);
            }
        } catch (error) {
            console.warn(`⚠️ Failed to cache important: ${url}`, error);
        }
    });

    await Promise.allSettled(cachePromises);
}

/**
 * Manejar recursos críticos - Cache First (mejor LCP)
 */
async function handleCriticalResource(request) {
    try {
        const cache = await caches.open(CACHE_NAME + '-critical');
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            // Servir desde cache inmediatamente para mejor LCP
            return cachedResponse;
        }

        // Si no está en cache, fetch y cache
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;

    } catch (error) {
        console.error('❌ Error handling critical resource:', error);
        return new Response('Resource unavailable', { status: 503 });
    }
}

/**
 * Manejar imágenes - Cache First con optimizaciones
 */
async function handleImageResource(request) {
    try {
        const cache = await caches.open(CACHE_NAME + '-images');
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            // Actualización en background
            updateImageInBackground(request, cache);
            return cachedResponse;
        }

        // Fetch con timeout para evitar bloqueos
        const response = await fetchWithTimeout(request, 5000);

        if (response.ok) {
            // Cache solo imágenes exitosas
            cache.put(request, response.clone());
        }

        return response;

    } catch (error) {
        console.error('❌ Error handling image:', error);
        return generatePlaceholderImage();
    }
}

/**
 * Manejar APIs - Network First con fallback
 */
async function handleAPIRequest(request) {
    try {
        // Intentar network primero para datos frescos
        const response = await fetchWithTimeout(request, 3000);

        if (response.ok) {
            // Cache respuesta exitosa
            const cache = await caches.open(CACHE_NAME + '-api');
            cache.put(request, response.clone());
        }

        return response;

    } catch (error) {
        console.warn('⚠️ Network failed, trying cache:', error);

        // Fallback a cache
        const cache = await caches.open(CACHE_NAME + '-api');
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Si no hay cache, devolver respuesta de error
        return new Response(JSON.stringify({
            error: 'Service unavailable',
            cached: false,
            timestamp: Date.now()
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Manejar recursos estáticos - Stale While Revalidate
 */
async function handleStaticResource(request) {
    try {
        const cache = await caches.open(CACHE_NAME + '-static');
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            // Servir cache y actualizar en background
            updateStaticInBackground(request, cache);
            return cachedResponse;
        }

        // Si no hay cache, fetch
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;

    } catch (error) {
        console.error('❌ Error handling static resource:', error);
        return new Response('Resource unavailable', { status: 503 });
    }
}

/**
 * Manejar recursos generales
 */
async function handleGeneralResource(request) {
    try {
        // Estrategia Network First para contenido dinámico
        const response = await fetchWithTimeout(request, 5000);
        return response;

    } catch (error) {
        // Fallback a cache si existe
        const cache = await caches.open(CACHE_NAME + '-general');
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        return new Response('Service unavailable', { status: 503 });
    }
}

/**
 * Utilidades
 */

function isCriticalResource(url) {
    return CRITICAL_RESOURCES.some(resource => url.includes(resource));
}

function isImageResource(url) {
    return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url) || url.includes('/images/');
}

function isAPIRequest(url) {
    return url.includes('/api/');
}

function isStaticResource(url) {
    return /\.(css|js|woff|woff2|ttf|eot)$/i.test(url) ||
           STATIC_RESOURCES.some(path => url.includes(path));
}

async function fetchWithTimeout(request, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(request, {
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

async function updateImageInBackground(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response);
        }
    } catch (error) {
        console.warn('⚠️ Background image update failed:', error);
    }
}

async function updateStaticInBackground(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response);
        }
    } catch (error) {
        console.warn('⚠️ Background static update failed:', error);
    }
}

function generatePlaceholderImage() {
    // SVG placeholder para imágenes que fallan
    const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#f0f0f0"/>
            <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#999">
                Imagen no disponible
            </text>
        </svg>
    `;

    return new Response(svg, {
        headers: { 'Content-Type': 'image/svg+xml' }
    });
}

async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name =>
        name.startsWith('bge-') && !name.includes(CACHE_VERSION)
    );

    await Promise.all(
        oldCaches.map(cacheName => {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
        })
    );
}

/**
 * Manejo de mensajes desde el cliente
 */
self.addEventListener('message', event => {
    const { type, payload } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'GET_CACHE_STATUS':
            getCacheStatus().then(status => {
                event.ports[0].postMessage(status);
            });
            break;

        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;

        case 'PRECACHE_URLS':
            precacheCustomURLs(payload.urls).then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
    }
});

async function getCacheStatus() {
    const cacheNames = await caches.keys();
    const status = {};

    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        status[cacheName] = keys.length;
    }

    return status;
}

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

async function precacheCustomURLs(urls) {
    const cache = await caches.open(CACHE_NAME + '-custom');

    const cachePromises = urls.map(async url => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
            }
        } catch (error) {
            console.warn(`⚠️ Failed to cache custom URL: ${url}`, error);
        }
    });

    await Promise.allSettled(cachePromises);
}

/**
 * Sync en background para actualizaciones
 */
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(performBackgroundSync());
    }
});

async function performBackgroundSync() {
    try {
        // Actualizar recursos críticos en background
        await precacheCriticalResources();
        console.log('✅ Background sync completado');
    } catch (error) {
        console.error('❌ Error en background sync:', error);
    }
}

/**
 * Notificaciones push para actualizaciones
 */
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();

        if (data.type === 'UPDATE_AVAILABLE') {
            event.waitUntil(
                self.registration.showNotification('Actualización disponible', {
                    body: 'Nueva versión de BGE disponible',
                    icon: '/images/icon-192x192.png',
                    badge: '/images/badge-72x72.png',
                    tag: 'update',
                    actions: [
                        {
                            action: 'update',
                            title: 'Actualizar ahora'
                        },
                        {
                            action: 'dismiss',
                            title: 'Más tarde'
                        }
                    ]
                })
            );
        }
    }
});

/**
 * Manejo de clicks en notificaciones
 */
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'update') {
        // Recargar la aplicación
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'UPDATE_READY' });
                });
            })
        );
    }
});

console.log('🚀 Service Worker Core Web Vitals cargado:', CACHE_VERSION);