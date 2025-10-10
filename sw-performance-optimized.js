/**
 * 🚀 SERVICE WORKER PERFORMANCE OPTIMIZED - BGE HÉROES DE LA PATRIA
 * Service Worker optimizado para Core Web Vitals y máximo rendimiento
 */

const CACHE_VERSION = 'bge-performance-v2.1';
const CACHE_NAME = `${CACHE_VERSION}-${Date.now()}`;

// Estrategias de cache por tipo de recurso
const CACHE_STRATEGIES = {
    // Recursos críticos: Cache First con Network Fallback
    critical: [
        '/',
        '/index.html',
        '/css/style.css',
        '/js/performance-integration.js',
        '/js/core-web-vitals-optimizer.js',
        '/js/performance-monitor.js'
    ],

    // Imágenes: Cache First con compresión
    images: /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i,

    // Scripts y estilos: Stale While Revalidate
    assets: /\.(js|css)$/i,

    // Fuentes: Cache First (larga duración)
    fonts: /\.(woff|woff2|ttf|eot)$/i,

    // APIs: Network First con Cache Fallback
    api: /\/api\//i,

    // Páginas HTML: Network First con Cache Fallback
    pages: /\.html$/i
};

// Cache de predicción basado en patrones de navegación
const PREDICTIVE_CACHE = {
    enabled: true,
    maxPredictions: 10,
    patterns: new Map()
};

// Métricas de performance del Service Worker
const SW_METRICS = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    predictivePrefetches: 0
};

self.addEventListener('install', event => {
    console.log('🔧 Service Worker Performance Optimized instalando...');

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('📦 Precacheando recursos críticos...');
            return cache.addAll(CACHE_STRATEGIES.critical);
        }).then(() => {
            console.log('✅ Recursos críticos precacheados');
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', event => {
    console.log('🚀 Service Worker Performance Optimized activado');

    event.waitUntil(
        Promise.all([
            // Limpiar caches antiguos
            cleanupOldCaches(),
            // Tomar control inmediatamente
            self.clients.claim(),
            // Configurar métricas iniciales
            initializeMetrics()
        ])
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Solo manejar requests GET
    if (request.method !== 'GET') {
        return;
    }

    // Determinar estrategia de cache
    const strategy = determineStrategy(request, url);

    event.respondWith(
        handleRequest(request, strategy).then(response => {
            // Actualizar métricas
            updateMetrics(strategy, response);

            // Predicción de próximos recursos
            if (PREDICTIVE_CACHE.enabled) {
                predictAndPrefetch(url);
            }

            return response;
        })
    );
});

self.addEventListener('message', event => {
    const { type, data } = event.data;

    switch (type) {
        case 'CONFIGURE_CACHE_STRATEGY':
            configureCacheStrategy(data);
            break;

        case 'GET_SW_METRICS':
            event.ports[0].postMessage(SW_METRICS);
            break;

        case 'PREFETCH_RESOURCES':
            prefetchResources(data.resources);
            break;

        case 'CLEAR_CACHE':
            clearSpecificCache(data.cachePattern);
            break;
    }
});

// Estrategias de cache
async function handleRequest(request, strategy) {
    switch (strategy) {
        case 'critical':
            return cacheFirstStrategy(request);

        case 'images':
            return cacheFirstWithCompressionStrategy(request);

        case 'assets':
            return staleWhileRevalidateStrategy(request);

        case 'fonts':
            return cacheFirstLongTermStrategy(request);

        case 'api':
            return networkFirstStrategy(request);

        case 'pages':
            return networkFirstWithCacheStrategy(request);

        default:
            return networkOnlyStrategy(request);
    }
}

// Cache First - Para recursos críticos
async function cacheFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        SW_METRICS.cacheHits++;
        return cachedResponse;
    }

    SW_METRICS.cacheMisses++;
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
    }

    return networkResponse;
}

// Cache First con compresión para imágenes
async function cacheFirstWithCompressionStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    let cachedResponse = await cache.match(request);

    if (cachedResponse) {
        SW_METRICS.cacheHits++;
        return cachedResponse;
    }

    SW_METRICS.cacheMisses++;

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Optimizar imagen si es posible
            const optimizedResponse = await optimizeImageResponse(networkResponse.clone());
            cache.put(request, optimizedResponse.clone());
            return optimizedResponse;
        }

        return networkResponse;
    } catch (error) {
        // Fallback a imagen placeholder si existe
        return await cache.match('/images/placeholder/default.jpg') || new Response('Image not available');
    }
}

// Stale While Revalidate - Para assets dinámicos
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    const networkResponsePromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => cachedResponse);

    if (cachedResponse) {
        SW_METRICS.cacheHits++;
        // Retornar cache inmediatamente, actualizar en background
        networkResponsePromise.catch(() => {}); // Silenciar errores de background
        return cachedResponse;
    }

    SW_METRICS.cacheMisses++;
    return networkResponsePromise;
}

// Cache First Long Term - Para fuentes
async function cacheFirstLongTermStrategy(request) {
    const cache = await caches.open(`${CACHE_NAME}-fonts`);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        SW_METRICS.cacheHits++;
        return cachedResponse;
    }

    SW_METRICS.cacheMisses++;
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
        // Cache de fuentes por mucho tiempo
        const responseWithLongCache = new Response(networkResponse.body, {
            status: networkResponse.status,
            statusText: networkResponse.statusText,
            headers: {
                ...networkResponse.headers,
                'Cache-Control': 'public, max-age=31536000' // 1 año
            }
        });

        cache.put(request, responseWithLongCache.clone());
        return responseWithLongCache;
    }

    return networkResponse;
}

// Network First - Para APIs
async function networkFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        SW_METRICS.networkRequests++;
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache solo responses exitosas de API
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        SW_METRICS.cacheMisses++;
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            SW_METRICS.cacheHits++;
            return cachedResponse;
        }

        // Fallback para APIs críticas
        return new Response(JSON.stringify({ error: 'Network unavailable', cached: false }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Network First con Cache - Para páginas HTML
async function networkFirstWithCacheStrategy(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        SW_METRICS.networkRequests++;
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        SW_METRICS.cacheMisses++;
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            SW_METRICS.cacheHits++;
            return cachedResponse;
        }

        // Fallback a página offline
        return await cache.match('/offline.html') ||
               new Response('Página no disponible offline', { status: 503 });
    }
}

// Network Only - Para recursos que no deben cachearse
async function networkOnlyStrategy(request) {
    SW_METRICS.networkRequests++;
    return fetch(request);
}

// Optimización de imágenes
async function optimizeImageResponse(response) {
    // Por ahora retorna la respuesta original
    // Aquí se podría implementar compresión adicional
    return response;
}

// Determinar estrategia basada en el request
function determineStrategy(request, url) {
    const pathname = url.pathname;

    if (CACHE_STRATEGIES.critical.some(path => pathname === path || pathname.endsWith(path))) {
        return 'critical';
    }

    if (CACHE_STRATEGIES.images.test(pathname)) {
        return 'images';
    }

    if (CACHE_STRATEGIES.fonts.test(pathname)) {
        return 'fonts';
    }

    if (CACHE_STRATEGIES.api.test(pathname)) {
        return 'api';
    }

    if (CACHE_STRATEGIES.assets.test(pathname)) {
        return 'assets';
    }

    if (CACHE_STRATEGIES.pages.test(pathname)) {
        return 'pages';
    }

    return 'network-only';
}

// Predicción y prefetch de recursos
function predictAndPrefetch(url) {
    const pathname = url.pathname;

    // Actualizar patrones de navegación
    if (!PREDICTIVE_CACHE.patterns.has(pathname)) {
        PREDICTIVE_CACHE.patterns.set(pathname, []);
    }

    // Aquí se implementaría lógica de predicción más sofisticada
    // Por ahora, simplemente prefetch de recursos relacionados

    const predictions = getPredictedResources(pathname);
    if (predictions.length > 0) {
        prefetchResources(predictions);
    }
}

function getPredictedResources(pathname) {
    const predictions = [];

    // Patrones de predicción básicos
    if (pathname === '/' || pathname === '/index.html') {
        predictions.push(
            '/estudiantes.html',
            '/conocenos.html',
            '/contacto.html'
        );
    } else if (pathname === '/estudiantes.html') {
        predictions.push(
            '/calificaciones.html',
            '/citas.html'
        );
    }

    return predictions.slice(0, PREDICTIVE_CACHE.maxPredictions);
}

async function prefetchResources(resources) {
    const cache = await caches.open(CACHE_NAME);

    for (const resource of resources) {
        try {
            const cachedResponse = await cache.match(resource);
            if (!cachedResponse) {
                SW_METRICS.predictivePrefetches++;
                const response = await fetch(resource);
                if (response.ok) {
                    await cache.put(resource, response);
                }
            }
        } catch (error) {
            // Silenciar errores de prefetch
        }
    }
}

// Limpieza de caches antiguos
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name =>
        name.startsWith('bge-performance-') && name !== CACHE_NAME
    );

    await Promise.all(
        oldCaches.map(cacheName => caches.delete(cacheName))
    );

    console.log(`🧹 Limpiados ${oldCaches.length} caches antiguos`);
}

// Configuración dinámica
function configureCacheStrategy(config) {
    if (config.enablePredictivePrefetch !== undefined) {
        PREDICTIVE_CACHE.enabled = config.enablePredictivePrefetch;
    }

    if (config.maxPredictions) {
        PREDICTIVE_CACHE.maxPredictions = config.maxPredictions;
    }

    console.log('⚙️ Estrategia de cache actualizada:', config);
}

async function clearSpecificCache(pattern) {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    const keysToDelete = keys.filter(request => {
        return new RegExp(pattern).test(request.url);
    });

    await Promise.all(
        keysToDelete.map(key => cache.delete(key))
    );

    console.log(`🗑️ Limpiados ${keysToDelete.length} recursos del cache`);
}

function initializeMetrics() {
    SW_METRICS.startTime = Date.now();
    SW_METRICS.version = CACHE_VERSION;

    // Enviar métricas periódicamente
    setInterval(() => {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SW_METRICS_UPDATE',
                    metrics: SW_METRICS
                });
            });
        });
    }, 30000); // Cada 30 segundos
}

function updateMetrics(strategy, response) {
    SW_METRICS.lastUpdate = Date.now();
    SW_METRICS.lastStrategy = strategy;
    SW_METRICS.lastStatus = response.status;
}

console.log('🚀 Service Worker Performance Optimized cargado');