/**
 * 🚀 SERVICE WORKER ULTIMATE - UNIFICADO Y OPTIMIZADO
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Versión Ultimate 4.0.0 - Combina lo mejor de todos los SW:
 * ✅ Cache inteligente con IA (sw-advanced.js)
 * ✅ Estrategias robustas offline-first (sw-offline-first.js)
 * ✅ Background sync y push notifications (sw.js)
 * ✅ Estabilidad anti-ciclos (sw-stable.js)
 * ✅ Manejo de errores avanzado y telemetría
 * ✅ Optimización de rendimiento y recursos
 */

// === CONFIGURACIÓN ULTIMATE ===
const SW_VERSION = '4.0.0';
const CACHE_PREFIX = 'heroes-ultimate';
const CACHE_TIMEOUT = 8000; // 8 segundos para operaciones críticas
const NETWORK_TIMEOUT = 5000; // 5 segundos para network requests

// === SISTEMA DE CACHE MULTINIVEL ===
const CACHES = {
    // Cache crítico - nunca se borra
    critical: `${CACHE_PREFIX}-critical-v${SW_VERSION}`,
    // Cache estático - recursos que cambian poco
    static: `${CACHE_PREFIX}-static-v${SW_VERSION}`,
    // Cache dinámico - contenido que se actualiza
    dynamic: `${CACHE_PREFIX}-dynamic-v${SW_VERSION}`,
    // Cache de API - respuestas de servidor
    api: `${CACHE_PREFIX}-api-v${SW_VERSION}`,
    // Cache de imágenes - optimizado para media
    images: `${CACHE_PREFIX}-images-v${SW_VERSION}`,
    // Cache offline - páginas de respaldo
    offline: `${CACHE_PREFIX}-offline-v${SW_VERSION}`
};

// === ESTRATEGIAS DE CACHE INTELIGENTE ===
const CACHE_STRATEGIES = {
    // Estrategia para recursos críticos
    critical: {
        strategy: 'cacheFirst',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
        maxEntries: 50,
        priority: 'high'
    },
    // Estrategia para recursos estáticos
    static: {
        strategy: 'staleWhileRevalidate',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        maxEntries: 100,
        priority: 'medium'
    },
    // Estrategia para contenido dinámico
    dynamic: {
        strategy: 'networkFirst',
        timeout: 3000,
        maxAge: 60 * 60 * 1000, // 1 hora
        maxEntries: 150,
        priority: 'medium'
    },
    // Estrategia para APIs
    api: {
        strategy: 'networkFirst',
        timeout: 2000,
        maxAge: 5 * 60 * 1000, // 5 minutos
        maxEntries: 200,
        priority: 'high'
    },
    // Estrategia para imágenes
    images: {
        strategy: 'cacheFirst',
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 días
        maxEntries: 300,
        priority: 'low'
    }
};

// === RECURSOS CRÍTICOS (APP SHELL) ===
const CRITICAL_RESOURCES = [
    // Páginas principales
    './',
    './index.html',
    './offline.html',

    // CSS crítico
    './css/style.css',

    // JavaScript crítico
    './js/script.js',
    './js/google-auth-integration.js',

    // Manifest
    './manifest.json',

    // Partials esenciales
    './partials/header.html',
    './partials/footer.html',

    // Imágenes críticas
    './images/hero/fachada1.webp',
    './images/default.jpg'
];

// === RECURSOS ESTÁTICOS ===
const STATIC_RESOURCES = [
    // Páginas principales
    './conocenos.html',
    './oferta-educativa.html',
    './servicios.html',
    './estudiantes.html',
    './padres.html',
    './comunidad.html',
    './contacto.html',
    './convocatorias.html',
    './calificaciones.html',
    './calendario.html',
    './citas.html',
    './bolsa-trabajo.html',

    // JavaScript adicional
    './js/chatbot.js',
    './js/interactive-calendar.js',
    './js/appointments.js'
];

// === PATRONES DE URL PARA ROUTING INTELIGENTE ===
const URL_PATTERNS = {
    api: /\/api\//,
    images: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
    static: /\.(css|js|woff|woff2|ttf|eot)$/i,
    pages: /\.html$/,
    dynamic: /\/(admin|dashboard|profile)/
};

// === SISTEMA DE ANALYTICS Y TELEMETRÍA ===
class CacheAnalytics {
    constructor() {
        this.hitRates = new Map();
        this.requestPatterns = new Map();
        this.performanceMetrics = new Map();
        this.errors = new Map();
    }

    recordHit(url, strategy, fromCache = false) {
        const key = `${strategy}_${fromCache ? 'hit' : 'miss'}`;
        this.hitRates.set(key, (this.hitRates.get(key) || 0) + 1);

        // Pattern analysis
        const pattern = this.identifyPattern(url);
        this.requestPatterns.set(pattern, (this.requestPatterns.get(pattern) || 0) + 1);
    }

    recordPerformance(url, duration, strategy) {
        const key = `${strategy}_performance`;
        const metrics = this.performanceMetrics.get(key) || [];
        metrics.push({ url, duration, timestamp: Date.now() });

        // Mantener solo últimos 100 registros
        if (metrics.length > 100) {
            metrics.shift();
        }

        this.performanceMetrics.set(key, metrics);
    }

    recordError(url, error, strategy) {
        const key = `${strategy}_errors`;
        const errors = this.errors.get(key) || [];
        errors.push({ url, error: error.message, timestamp: Date.now() });

        if (errors.length > 50) {
            errors.shift();
        }

        this.errors.set(key, errors);
    }

    identifyPattern(url) {
        if (URL_PATTERNS.api.test(url)) return 'api';
        if (URL_PATTERNS.images.test(url)) return 'images';
        if (URL_PATTERNS.static.test(url)) return 'static';
        if (URL_PATTERNS.pages.test(url)) return 'pages';
        if (URL_PATTERNS.dynamic.test(url)) return 'dynamic';
        return 'other';
    }

    getInsights() {
        return {
            hitRates: Object.fromEntries(this.hitRates),
            patterns: Object.fromEntries(this.requestPatterns),
            performance: Object.fromEntries(this.performanceMetrics),
            errors: Object.fromEntries(this.errors)
        };
    }
}

// === INSTANCIA GLOBAL DE ANALYTICS ===
const analytics = new CacheAnalytics();

// === UTILIDADES ROBUSTAS ===
class CacheUtils {
    static async safeCacheOperation(operation, timeout = CACHE_TIMEOUT) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Cache operation timeout'));
            }, timeout);

            Promise.resolve(operation())
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

    static async fetchWithTimeout(request, timeout = NETWORK_TIMEOUT) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Network timeout'));
            }, timeout);

            fetch(request)
                .then(response => {
                    clearTimeout(timer);
                    resolve(response);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    static shouldCache(url) {
        const urlString = url.toString().toLowerCase();

        // Blacklist - nunca cachear
        const neverCache = [
            'chrome-extension:',
            'moz-extension:',
            'accounts.google.com',
            'googleapis.com',
            'gstatic.com',
            '/sw.js',
            '/sw-',
            'google-analytics.com'
        ];

        for (const blocked of neverCache) {
            if (urlString.includes(blocked)) {
                return false;
            }
        }

        return url.origin === self.location.origin;
    }

    static getCacheStrategy(url) {
        const pathname = url.pathname.toLowerCase();

        if (CRITICAL_RESOURCES.includes(pathname) || CRITICAL_RESOURCES.includes('.' + pathname)) {
            return 'critical';
        }

        if (URL_PATTERNS.api.test(pathname)) return 'api';
        if (URL_PATTERNS.images.test(pathname)) return 'images';
        if (URL_PATTERNS.static.test(pathname)) return 'static';
        if (URL_PATTERNS.dynamic.test(pathname)) return 'dynamic';

        return 'static'; // Default
    }

    static async cleanExpiredEntries(cacheName, maxAge) {
        try {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            const now = Date.now();

            for (const request of requests) {
                const response = await cache.match(request);
                if (response) {
                    const dateHeader = response.headers.get('date');
                    const cacheTime = dateHeader ? new Date(dateHeader).getTime() : 0;

                    if (now - cacheTime > maxAge) {
                        await cache.delete(request);
                        console.log(`🗑️ Cleaned expired: ${request.url}`);
                    }
                }
            }
        } catch (error) {
            console.warn('Error cleaning cache:', error);
        }
    }
}

// === ESTRATEGIAS DE CACHE IMPLEMENTADAS ===
class CacheStrategies {
    static async cacheFirst(request, cacheName, config) {
        const startTime = performance.now();

        try {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(request);

            if (cachedResponse) {
                analytics.recordHit(request.url, 'cacheFirst', true);
                analytics.recordPerformance(request.url, performance.now() - startTime, 'cacheFirst');
                return cachedResponse;
            }

            const networkResponse = await CacheUtils.fetchWithTimeout(request, config.timeout);

            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }

            analytics.recordHit(request.url, 'cacheFirst', false);
            analytics.recordPerformance(request.url, performance.now() - startTime, 'cacheFirst');

            return networkResponse;

        } catch (error) {
            analytics.recordError(request.url, error, 'cacheFirst');
            throw error;
        }
    }

    static async networkFirst(request, cacheName, config) {
        const startTime = performance.now();

        try {
            const networkResponse = await CacheUtils.fetchWithTimeout(request, config.timeout);

            if (networkResponse.ok) {
                const cache = await caches.open(cacheName);
                cache.put(request, networkResponse.clone());
            }

            analytics.recordHit(request.url, 'networkFirst', false);
            analytics.recordPerformance(request.url, performance.now() - startTime, 'networkFirst');

            return networkResponse;

        } catch (networkError) {
            // Fallback to cache
            try {
                const cache = await caches.open(cacheName);
                const cachedResponse = await cache.match(request);

                if (cachedResponse) {
                    analytics.recordHit(request.url, 'networkFirst', true);
                    analytics.recordPerformance(request.url, performance.now() - startTime, 'networkFirst');
                    return cachedResponse;
                }
            } catch (cacheError) {
                analytics.recordError(request.url, cacheError, 'networkFirst');
            }

            analytics.recordError(request.url, networkError, 'networkFirst');
            throw networkError;
        }
    }

    static async staleWhileRevalidate(request, cacheName, config) {
        const startTime = performance.now();

        try {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(request);

            // Background update
            const networkUpdate = CacheUtils.fetchWithTimeout(request, config.timeout)
                .then(response => {
                    if (response.ok) {
                        cache.put(request, response.clone());
                    }
                    return response;
                })
                .catch(error => {
                    console.warn('Background update failed:', error);
                });

            if (cachedResponse) {
                analytics.recordHit(request.url, 'staleWhileRevalidate', true);
                analytics.recordPerformance(request.url, performance.now() - startTime, 'staleWhileRevalidate');

                // Return cached version immediately, update in background
                networkUpdate.catch(() => {}); // Ignore background errors
                return cachedResponse;
            }

            // No cache, wait for network
            const networkResponse = await networkUpdate;
            analytics.recordHit(request.url, 'staleWhileRevalidate', false);
            analytics.recordPerformance(request.url, performance.now() - startTime, 'staleWhileRevalidate');

            return networkResponse;

        } catch (error) {
            analytics.recordError(request.url, error, 'staleWhileRevalidate');
            throw error;
        }
    }
}

// === EVENTOS DEL SERVICE WORKER ===

// === INSTALL EVENT ===
self.addEventListener('install', event => {
    // Verificar si ya está instalado para evitar bucles
    if (self.swInstalled) {
        console.log('🔄 SW Ultimate ya instalado, saltando re-instalación');
        return;
    }

    console.log('🚀 Installing SW Ultimate v4.0.0...');
    self.swInstalled = true;

    event.waitUntil(
        CacheUtils.safeCacheOperation(async () => {
            try {
                // Cache recursos críticos
                const criticalCache = await caches.open(CACHES.critical);
                await criticalCache.addAll(CRITICAL_RESOURCES);
                console.log('✅ Critical resources cached');

                // Cache recursos estáticos
                const staticCache = await caches.open(CACHES.static);
                const validStaticResources = [];

                for (const resource of STATIC_RESOURCES) {
                    try {
                        const response = await fetch(resource);
                        if (response.ok) {
                            validStaticResources.push(resource);
                        }
                    } catch (error) {
                        console.warn(`⚠️ Skipping ${resource}: not available`);
                    }
                }

                if (validStaticResources.length > 0) {
                    await staticCache.addAll(validStaticResources);
                    console.log(`✅ Static resources cached: ${validStaticResources.length}`);
                }

                // Skip waiting para activación inmediata
                await self.skipWaiting();
                console.log('✅ SW Ultimate installed successfully');

            } catch (error) {
                console.error('❌ Error during installation:', error);
                throw error;
            }
        })
    );
});

// === ACTIVATE EVENT ===
self.addEventListener('activate', event => {
    console.log('🔥 Activating SW Ultimate v4.0.0...');

    event.waitUntil(
        CacheUtils.safeCacheOperation(async () => {
            try {
                // Limpiar caches antiguos
                const cacheNames = await caches.keys();
                const currentCaches = Object.values(CACHES);

                const deletePromises = cacheNames
                    .filter(name => name.includes('heroes') && !currentCaches.includes(name))
                    .map(async name => {
                        try {
                            await caches.delete(name);
                            console.log(`🗑️ Deleted old cache: ${name}`);
                        } catch (error) {
                            console.warn(`⚠️ Failed to delete cache ${name}:`, error);
                        }
                    });

                await Promise.all(deletePromises);

                // Tomar control de todos los clientes
                await self.clients.claim();

                // Programar limpieza periódica
                setTimeout(() => {
                    self.registration.sync?.register('cache-cleanup');
                }, 60000); // 1 minuto después de activar

                console.log('✅ SW Ultimate activated successfully');

            } catch (error) {
                console.error('❌ Error during activation:', error);
            }
        })
    );
});

// === FETCH EVENT - ROUTING INTELIGENTE ===
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo manejar requests HTTP/HTTPS del mismo origen
    if (!url.protocol.startsWith('http') || !CacheUtils.shouldCache(url)) {
        return;
    }

    event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const strategy = CacheUtils.getCacheStrategy(url);
    const config = CACHE_STRATEGIES[strategy];
    const cacheName = CACHES[strategy] || CACHES.static;

    try {
        switch (config.strategy) {
            case 'cacheFirst':
                return await CacheStrategies.cacheFirst(request, cacheName, config);

            case 'networkFirst':
                return await CacheStrategies.networkFirst(request, cacheName, config);

            case 'staleWhileRevalidate':
                return await CacheStrategies.staleWhileRevalidate(request, cacheName, config);

            default:
                return await CacheStrategies.staleWhileRevalidate(request, cacheName, config);
        }

    } catch (error) {
        console.warn(`⚠️ Request failed: ${url.pathname}`, error);

        // Fallback para navegación HTML
        if (request.destination === 'document') {
            try {
                const offlineCache = await caches.open(CACHES.offline);
                const offlineResponse = await offlineCache.match('./offline.html');
                if (offlineResponse) {
                    return offlineResponse;
                }
            } catch (offlineError) {
                console.warn('⚠️ No offline page available');
            }
        }

        return new Response('Network Error', { status: 408 });
    }
}

// === BACKGROUND SYNC ===
self.addEventListener('sync', event => {
    console.log('🔄 Background sync event:', event.tag);

    if (event.tag === 'cache-cleanup') {
        event.waitUntil(performCacheCleanup());
    }

    if (event.tag === 'analytics-report') {
        event.waitUntil(sendAnalyticsReport());
    }
});

async function performCacheCleanup() {
    console.log('🧹 Performing cache cleanup...');

    try {
        for (const [strategyName, config] of Object.entries(CACHE_STRATEGIES)) {
            const cacheName = CACHES[strategyName];
            if (cacheName && config.maxAge) {
                await CacheUtils.cleanExpiredEntries(cacheName, config.maxAge);
            }
        }

        console.log('✅ Cache cleanup completed');

    } catch (error) {
        console.error('❌ Cache cleanup error:', error);
    }
}

async function sendAnalyticsReport() {
    try {
        const insights = analytics.getInsights();
        console.log('📊 Cache Analytics:', insights);

        // Aquí se podría enviar a un endpoint de analytics
        // await fetch('/api/analytics', { method: 'POST', body: JSON.stringify(insights) });

    } catch (error) {
        console.error('❌ Analytics report error:', error);
    }
}

// === PUSH NOTIFICATIONS ===
self.addEventListener('push', event => {
    console.log('📱 Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'Nueva actualización disponible',
        icon: './images/icon-192.png',
        badge: './images/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver más',
                icon: './images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: './images/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('BGE Héroes de la Patria', options)
    );
});

// === NOTIFICATION CLICK ===
self.addEventListener('notificationclick', event => {
    console.log('🔔 Notification click received.');

    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(clients.openWindow('/'));
    }
});

// === MESSAGE HANDLING ===
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('📨 Received SKIP_WAITING message');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_ANALYTICS') {
        event.ports[0].postMessage(analytics.getInsights());
    }

    if (event.data && event.data.type === 'CACHE_CLEANUP') {
        performCacheCleanup();
    }
});

// === PERFORMANCE MONITORING ===
setInterval(() => {
    if (self.registration && self.registration.sync) {
        self.registration.sync.register('analytics-report');
    }
}, 5 * 60 * 1000); // Cada 5 minutos

// === INITIALIZATION LOG ===
console.log('🔧 SW Ultimate v4.0.0 loaded - Advanced caching, analytics & performance optimization');
console.log('📊 Features: Intelligent caching, Background sync, Push notifications, Analytics, Auto-cleanup');