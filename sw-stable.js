/**
 * SERVICE WORKER ESTABLE - SIN CICLOS INFINITOS
 * Bachillerato General Estatal "Héroes de la Patria"
 * Versión ESTABLE - Diseñado para evitar bucles infinitos de cache
 */

// === CONFIGURACIÓN SIMPLE Y ESTABLE ===
const CACHE_NAME = 'heroes-stable-v1.0.0';
const CACHE_TIMEOUT = 5000; // 5 segundos máximo para operaciones de cache

// Solo recursos críticos que SABEMOS que existen
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/images/hero/fachada1.jpg',
    '/images/hero/fachada1.webp',
    '/images/placeholder/avatar-placeholder.jpg',
    '/images/placeholder/teacher-placeholder.jpg',
    '/images/default.jpg'
];

// URLs que NUNCA debemos cachear (para evitar bucles)
const NEVER_CACHE = [
    // Google OAuth y servicios externos
    'accounts.google.com',
    'googleapis.com',
    'gstatic.com',
    'google.com/gsi',

    // APIs dinámicas
    '/api/',
    '/socket.io/',

    // Archivos del service worker
    '/sw.js',
    '/sw-stable.js',
    '/sw-offline-first.js',

    // Extensiones del navegador
    'chrome-extension:',
    'moz-extension:',

    // Analytics y tracking
    'google-analytics.com',
    'googletagmanager.com'
];

// === FUNCIONES UTILITARIAS ===
function shouldCache(url) {
    const urlString = url.toString().toLowerCase();

    // Nunca cachear URLs en la lista negra
    for (const blocked of NEVER_CACHE) {
        if (urlString.includes(blocked.toLowerCase())) {
            return false;
        }
    }

    // Solo cachear recursos del mismo dominio
    return url.origin === self.location.origin;
}

function isStaticResource(url) {
    const pathname = url.pathname.toLowerCase();
    return pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|ico)$/);
}

async function safeCacheOperation(operation, timeout = CACHE_TIMEOUT) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Cache operation timeout'));
        }, timeout);

        operation()
            .then(result => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch(error => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

// === EVENTO INSTALL ===
self.addEventListener('install', event => {
    console.log('🔄 Service Worker ESTABLE instalando...');

    event.waitUntil(
        safeCacheOperation(async () => {
            try {
                const cache = await caches.open(CACHE_NAME);

                // Solo cachear recursos críticos que SABEMOS que existen
                for (const resource of CRITICAL_RESOURCES) {
                    try {
                        // Verificar si el recurso existe antes de cachearlo
                        const response = await fetch(resource);
                        if (response.ok) {
                            await cache.put(resource, response);
                            console.log(`✅ Cached: ${resource}`);
                        }
                    } catch (error) {
                        console.warn(`⚠️ Skipped ${resource}: not available`);
                    }
                }

                // Tomar control inmediatamente
                await self.skipWaiting();
                console.log('✅ Service Worker ESTABLE instalado');

            } catch (error) {
                console.error('❌ Error en instalación:', error);
                throw error;
            }
        })
    );
});

// === EVENTO ACTIVATE ===
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker ESTABLE activando...');

    event.waitUntil(
        safeCacheOperation(async () => {
            try {
                // Limpiar caches antiguos de manera segura
                const cacheNames = await caches.keys();
                const deletePromises = cacheNames
                    .filter(name => name !== CACHE_NAME && name.includes('heroes'))
                    .map(async name => {
                        try {
                            await caches.delete(name);
                            console.log(`🗑️ Deleted old cache: ${name}`);
                        } catch (error) {
                            console.warn(`⚠️ Failed to delete cache ${name}:`, error);
                        }
                    });

                await Promise.all(deletePromises);

                // Tomar control de todas las páginas
                await self.clients.claim();
                console.log('✅ Service Worker ESTABLE activado');

            } catch (error) {
                console.error('❌ Error en activación:', error);
            }
        })
    );
});

// === EVENTO FETCH - ESTRATEGIA SIMPLE ===
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo manejar requests HTTP/HTTPS del mismo origen
    if (!url.protocol.startsWith('http') || !shouldCache(url)) {
        return; // Dejar que el navegador maneje la request
    }

    event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
    const url = new URL(request.url);

    try {
        // Estrategia simple: Network First con Cache Fallback
        return await safeCacheOperation(async () => {
            try {
                // Intentar red primero
                const networkResponse = await fetch(request);

                // Si la respuesta es exitosa y es un recurso estático, cachearlo
                if (networkResponse.ok && isStaticResource(url)) {
                    try {
                        const cache = await caches.open(CACHE_NAME);
                        // Clonar la respuesta antes de cachearla
                        cache.put(request, networkResponse.clone());
                    } catch (cacheError) {
                        console.warn('⚠️ Failed to cache:', url.pathname, cacheError);
                    }
                }

                return networkResponse;

            } catch (networkError) {
                // Si la red falla, intentar cache
                console.log('🔍 Network failed, trying cache for:', url.pathname);

                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(request);

                if (cachedResponse) {
                    console.log('✅ Served from cache:', url.pathname);
                    return cachedResponse;
                }

                // Si no hay cache, retornar error de red
                throw networkError;
            }
        });

    } catch (error) {
        console.warn('⚠️ Request failed completely:', url.pathname, error);

        // Para navegación (HTML), intentar servir página offline si existe
        if (request.destination === 'document') {
            try {
                const cache = await caches.open(CACHE_NAME);
                const offlineResponse = await cache.match('/offline.html');
                if (offlineResponse) {
                    return offlineResponse;
                }
            } catch (offlineError) {
                console.warn('⚠️ No offline page available');
            }
        }

        // Retornar error original
        return Response.error();
    }
}

// === MENSAJE DESDE LA PÁGINA ===
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('📨 Received SKIP_WAITING message');
        self.skipWaiting();
    }
});

// === LOG DE INICIO ===
console.log('🔧 Service Worker ESTABLE cargado - Sin ciclos infinitos');