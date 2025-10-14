/**
 * 🔥 SERVICE WORKER AVANZADO - FASE 3 PWA
 * Sistema de cache inteligente con IA, background sync y push notifications
 * Bachillerato General Estatal "Héroes de la Patria"
 */

// === CONFIGURACIÓN AVANZADA ===
const SW_VERSION = '3.1.0';
const CACHE_PREFIX = 'heroes-patria-advanced';
const CACHES = {
    static: `${CACHE_PREFIX}-static-v${SW_VERSION}`,
    dynamic: `${CACHE_PREFIX}-dynamic-v${SW_VERSION}`,
    api: `${CACHE_PREFIX}-api-v${SW_VERSION}`,
    images: `${CACHE_PREFIX}-images-v${SW_VERSION}`,
    offline: `${CACHE_PREFIX}-offline-v${SW_VERSION}`
};

// === ESTRATEGIAS DE CACHE INTELIGENTE ===
const CACHE_STRATEGIES = {
    staleWhileRevalidate: {
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        maxEntries: 200,
        updateBehavior: 'background'
    },
    cacheFirst: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        maxEntries: 100,
        fallbackDelay: 1000
    },
    networkFirst: {
        timeout: 2000,
        maxAge: 5 * 60 * 1000, // 5 minutos
        maxEntries: 50,
        retryAttempts: 3
    },
    intelligentCache: {
        patterns: new Map(),
        analytics: new Map(),
        predictions: new Map()
    }
};

// === RECURSOS CRÍTICOS PARA APP SHELL ===
const CRITICAL_RESOURCES = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/script.js',
    './js/config.js',
    './js/lazy-loading-optimizer.js',
    './js/performance-monitor.js',
    './js/mobile-performance-optimizer.js',
    './offline.html',
    './images/app_icons/icon-192x192.webp',
    './images/app_icons/icon-512x512.png',
    // Bootstrap crítico
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// === PÁGINAS PRINCIPALES PARA CACHE ===
const MAIN_PAGES = [
    './conocenos.html',
    './oferta-educativa.html',
    './servicios.html',
    './estudiantes.html',
    './padres.html',
    './comunidad.html',
    './contacto.html',
    './calificaciones.html',
    './pagos.html'
];

// === PATRONES DE URL PARA CACHE INTELIGENTE ===
const CACHE_PATTERNS = {
    api: /^https:\/\/api\./,
    images: /\.(jpg|jpeg|png|webp|gif|svg)$/i,
    fonts: /\.(woff|woff2|ttf|eot)$/i,
    static: /\.(css|js)$/i,
    cdn: /^https:\/\/cdn\.|^https:\/\/cdnjs\./,
    external: /^https?:\/\/(?!localhost|127\.0\.0\.1)/
};

// === VARIABLES GLOBALES ===
let cacheAnalytics = new Map();
let backgroundSyncQueue = [];
let pushSubscription = null;
let networkStatus = 'online';

// === EVENTOS PRINCIPALES ===
self.addEventListener('install', handleInstall);
self.addEventListener('activate', handleActivate);
self.addEventListener('fetch', handleFetch);
self.addEventListener('sync', handleBackgroundSync);
self.addEventListener('push', handlePushNotification);
self.addEventListener('notificationclick', handleNotificationClick);
self.addEventListener('message', handleMessage);

// === INSTALACIÓN ===
async function handleInstall(event) {
    console.log('🚀 SW Advanced v' + SW_VERSION + ' instalando...');
    
    event.waitUntil(
        Promise.all([
            precacheAppShell(),
            initializeCacheAnalytics(),
            setupIntelligentCaching()
        ]).then(() => {
            console.log('✅ SW Advanced instalado correctamente');
            self.skipWaiting();
        })
    );
}

async function precacheAppShell() {
    const cache = await caches.open(CACHES.static);
    
    console.log('📦 Precacheando App Shell...');
    
    const precachePromises = CRITICAL_RESOURCES.map(async (resource) => {
        try {
            const response = await fetch(resource);
            if (response.ok) {
                await cache.put(resource, response);
                console.log(`✅ Cached: ${resource}`);
            }
        } catch (error) {
            console.warn(`⚠️ Error caching ${resource}:`, error);
        }
    });
    
    await Promise.allSettled(precachePromises);
    
    // Precachear páginas principales en segundo plano
    setTimeout(() => precacheMainPages(), 5000);
}

async function precacheMainPages() {
    const cache = await caches.open(CACHES.dynamic);
    
    for (const page of MAIN_PAGES) {
        try {
            const response = await fetch(page);
            if (response.ok) {
                await cache.put(page, response);
                console.log(`📄 Page cached: ${page}`);
            }
        } catch (error) {
            console.warn(`⚠️ Error precaching page ${page}`);
        }
    }
}

// === ACTIVACIÓN ===
async function handleActivate(event) {
    console.log('🔄 SW Advanced activándose...');
    
    event.waitUntil(
        Promise.all([
            cleanupOldCaches(),
            updateCacheStrategies(),
            initializeBackgroundSync(),
            setupPushNotifications()
        ]).then(() => {
            console.log('✅ SW Advanced activado');
            self.clients.claim();
        })
    );
}

async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const currentCaches = Object.values(CACHES);
    
    const cleanup = cacheNames
        .filter(name => name.startsWith(CACHE_PREFIX) && !currentCaches.includes(name))
        .map(name => caches.delete(name));
    
    await Promise.all(cleanup);
    console.log('🧹 Caches antiguos eliminados');
}

// === MANEJO DE PETICIONES ===
function handleFetch(event) {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip chrome-extension and other protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(routeRequest(request, url));
}

async function routeRequest(request, url) {
    try {
        // Actualizar analytics
        updateCacheAnalytics(url.pathname);
        
        // Determinar estrategia según el tipo de recurso
        const strategy = determineStrategy(request, url);
        
        // Aplicar la estrategia seleccionada
        const response = await applyStrategy(request, url, strategy);
        
        // Aprender del patrón de uso
        learnFromUsage(url.pathname, strategy, response?.ok);
        
        return response;
        
    } catch (error) {
        console.error('Error en handleFetch:', error);
        return handleFallback(request, url);
    }
}

function determineStrategy(request, url) {
    // API requests
    if (CACHE_PATTERNS.api.test(url.href) || url.pathname.startsWith('/api/')) {
        return 'networkFirst';
    }
    
    // Images
    if (CACHE_PATTERNS.images.test(url.pathname)) {
        return 'cacheFirst';
    }
    
    // Static assets (CSS, JS)
    if (CACHE_PATTERNS.static.test(url.pathname) || CACHE_PATTERNS.cdn.test(url.href)) {
        return 'cacheFirst';
    }
    
    // HTML pages
    if (request.destination === 'document' || url.pathname.endsWith('.html')) {
        return 'staleWhileRevalidate';
    }
    
    // Fonts
    if (CACHE_PATTERNS.fonts.test(url.pathname)) {
        return 'cacheFirst';
    }
    
    // Use intelligent caching for frequently accessed resources
    const intelligence = getIntelligentStrategy(url.pathname);
    if (intelligence) {
        return intelligence;
    }
    
    // Default
    return 'networkFirst';
}

async function applyStrategy(request, url, strategyName) {
    switch (strategyName) {
        case 'cacheFirst':
            return cacheFirstStrategy(request, url);
        case 'networkFirst':
            return networkFirstStrategy(request, url);
        case 'staleWhileRevalidate':
            return staleWhileRevalidateStrategy(request, url);
        case 'intelligent':
            return intelligentCacheStrategy(request, url);
        default:
            return networkFirstStrategy(request, url);
    }
}

// === ESTRATEGIAS DE CACHE ===
async function cacheFirstStrategy(request, url) {
    const cacheName = getCacheName(url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse)) {
        // Background update for static resources
        if (CACHE_PATTERNS.static.test(url.pathname)) {
            setTimeout(() => backgroundUpdate(request, cacheName), 100);
        }
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return cachedResponse || handleFallback(request, url);
    }
}

async function networkFirstStrategy(request, url) {
    const cacheName = getCacheName(url);
    const config = CACHE_STRATEGIES.networkFirst;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const networkResponse = await fetch(request, { 
            signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse && !isExpired(cachedResponse)) {
            return cachedResponse;
        }
        
        // Queue for background sync if it's a critical request
        if (isCriticalRequest(request)) {
            queueBackgroundSync(request);
        }
        
        return handleFallback(request, url);
    }
}

async function staleWhileRevalidateStrategy(request, url) {
    const cacheName = getCacheName(url);
    const cachedResponse = await caches.match(request);
    
    // Always try to update in the background
    const networkUpdate = fetch(request).then(async (response) => {
        if (response.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, response.clone());
        }
        return response;
    }).catch(error => {
        console.log('Background update failed:', error);
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // If no cache, wait for network
    try {
        return await networkUpdate;
    } catch (error) {
        return handleFallback(request, url);
    }
}

async function intelligentCacheStrategy(request, url) {
    const pattern = CACHE_STRATEGIES.intelligentCache.patterns.get(url.pathname);
    
    if (!pattern) {
        return networkFirstStrategy(request, url);
    }
    
    // Use learned behavior
    if (pattern.preferCache && pattern.successRate > 0.8) {
        return cacheFirstStrategy(request, url);
    } else if (pattern.networkReliable && pattern.averageResponseTime < 1000) {
        return networkFirstStrategy(request, url);
    } else {
        return staleWhileRevalidateStrategy(request, url);
    }
}

// === FUNCIONES AUXILIARES ===
function getCacheName(url) {
    if (CACHE_PATTERNS.api.test(url.href)) return CACHES.api;
    if (CACHE_PATTERNS.images.test(url.pathname)) return CACHES.images;
    if (CACHE_PATTERNS.static.test(url.pathname)) return CACHES.static;
    return CACHES.dynamic;
}

function isExpired(response) {
    const dateHeader = response.headers.get('date');
    const maxAge = response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1];
    
    if (!dateHeader || !maxAge) return false;
    
    const responseTime = new Date(dateHeader).getTime();
    const expireTime = responseTime + (parseInt(maxAge) * 1000);
    
    return Date.now() > expireTime;
}

async function backgroundUpdate(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, response);
        }
    } catch (error) {
        console.log('Background update failed:', error);
    }
}

async function handleFallback(request, url) {
    // Return offline page for document requests
    if (request.destination === 'document') {
        const offlineResponse = await caches.match('./offline.html');
        return offlineResponse || new Response('Offline', { status: 503 });
    }
    
    // Return placeholder for images
    if (CACHE_PATTERNS.images.test(url.pathname)) {
        const placeholder = await caches.match('./images/placeholder.png');
        return placeholder || generateImagePlaceholder();
    }
    
    // Generic fallback
    return new Response('Resource unavailable offline', { 
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
    });
}

function generateImagePlaceholder() {
    const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#666">
                Imagen no disponible offline
            </text>
        </svg>
    `;
    
    return new Response(svg, {
        headers: { 'Content-Type': 'image/svg+xml' }
    });
}

// === ANALYTICS E INTELIGENCIA ===
function updateCacheAnalytics(pathname) {
    const current = cacheAnalytics.get(pathname) || {
        hits: 0,
        requests: 0,
        lastAccess: Date.now(),
        avgResponseTime: 0
    };
    
    current.requests++;
    current.lastAccess = Date.now();
    
    cacheAnalytics.set(pathname, current);
}

function learnFromUsage(pathname, strategy, success) {
    const patterns = CACHE_STRATEGIES.intelligentCache.patterns;
    const current = patterns.get(pathname) || {
        strategy,
        successRate: 0,
        attempts: 0,
        averageResponseTime: 0,
        preferCache: false,
        networkReliable: false
    };
    
    current.attempts++;
    if (success) current.successRate = (current.successRate * (current.attempts - 1) + 1) / current.attempts;
    
    // Adjust preferences based on performance
    if (current.attempts > 10) {
        current.preferCache = current.successRate > 0.9;
        current.networkReliable = current.successRate > 0.8;
    }
    
    patterns.set(pathname, current);
}

function getIntelligentStrategy(pathname) {
    const patterns = CACHE_STRATEGIES.intelligentCache.patterns;
    const analytics = cacheAnalytics.get(pathname);
    
    if (!analytics || analytics.requests < 5) return null;
    
    // High frequency resources prefer cache
    if (analytics.requests > 50 && analytics.hits / analytics.requests > 0.8) {
        return 'cacheFirst';
    }
    
    // Dynamic content prefers network
    if (pathname.includes('api') || pathname.includes('dynamic')) {
        return 'networkFirst';
    }
    
    return null;
}

// === BACKGROUND SYNC ===
async function initializeBackgroundSync() {
    console.log('🔄 Inicializando Background Sync...');
    
    self.registration.sync.register('background-sync').catch((error) => {
        console.warn('Background Sync no soportado:', error);
    });
}

function handleBackgroundSync(event) {
    console.log('🔄 Background Sync ejecutándose:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(processBackgroundQueue());
    }
}

async function processBackgroundQueue() {
    console.log(`📤 Procesando ${backgroundSyncQueue.length} elementos en cola...`);
    
    const processed = [];
    
    for (const item of backgroundSyncQueue) {
        try {
            await fetch(item.request.clone());
            processed.push(item);
            console.log('✅ Sync completado:', item.request.url);
        } catch (error) {
            console.log('❌ Sync fallido:', item.request.url, error);
        }
    }
    
    // Remove processed items
    backgroundSyncQueue = backgroundSyncQueue.filter(item => !processed.includes(item));
}

function queueBackgroundSync(request) {
    backgroundSyncQueue.push({
        request: request.clone(),
        timestamp: Date.now()
    });
    
    self.registration.sync.register('background-sync').catch(console.warn);
}

function isCriticalRequest(request) {
    const url = new URL(request.url);
    return url.pathname.includes('/api/') || 
           request.method === 'POST' || 
           request.method === 'PUT';
}

// === PUSH NOTIFICATIONS ===
async function setupPushNotifications() {
    console.log('🔔 Configurando Push Notifications...');
    
    if ('pushManager' in self.registration) {
        try {
            const subscription = await self.registration.pushManager.getSubscription();
            pushSubscription = subscription;
            
            if (subscription) {
                console.log('✅ Push Notifications activas');
            }
        } catch (error) {
            console.warn('Error configurando push notifications:', error);
        }
    }
}

function handlePushNotification(event) {
    console.log('🔔 Push notification recibida:', event);
    
    const options = {
        body: 'Tienes nuevas actualizaciones disponibles',
        icon: './images/app_icons/icon-192x192.webp',
        badge: './images/app_icons/icon-192x192.webp',
        data: { url: './' },
        actions: [
            {
                action: 'open',
                title: 'Abrir',
                icon: './images/icons/open.png'
            },
            {
                action: 'dismiss',
                title: 'Descartar',
                icon: './images/icons/dismiss.png'
            }
        ],
        tag: 'heroes-patria-notification',
        renotify: true,
        silent: false
    };
    
    if (event.data) {
        const data = event.data.json();
        options.body = data.body || options.body;
        options.data.url = data.url || options.data.url;
    }
    
    event.waitUntil(
        self.registration.showNotification('Héroes de la Patria', options)
    );
}

function handleNotificationClick(event) {
    console.log('🔔 Notification click:', event);
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || './';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Check if there's already a window/tab open with the target URL
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
}

// === COMUNICACIÓN CON LA APLICACIÓN ===
function handleMessage(event) {
    console.log('💬 Mensaje recibido:', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'CACHE_UPDATE':
            handleCacheUpdate(data);
            break;
        case 'CLEAR_CACHE':
            handleClearCache(data);
            break;
        case 'GET_CACHE_STATS':
            handleGetCacheStats(event);
            break;
        case 'FORCE_UPDATE':
            handleForceUpdate();
            break;
        default:
            console.log('Tipo de mensaje desconocido:', type);
    }
}

async function handleCacheUpdate(data) {
    const { urls, strategy } = data;
    
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const cacheName = getCacheName(new URL(url));
                const cache = await caches.open(cacheName);
                await cache.put(url, response);
            }
        } catch (error) {
            console.warn('Error updating cache:', error);
        }
    }
}

async function handleClearCache(data) {
    const { cacheNames } = data;
    
    if (cacheNames) {
        for (const name of cacheNames) {
            await caches.delete(name);
        }
    } else {
        // Clear all caches
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
    }
    
    console.log('🧹 Cache cleared');
}

async function handleGetCacheStats(event) {
    const stats = {
        caches: {},
        analytics: Object.fromEntries(cacheAnalytics),
        version: SW_VERSION,
        networkStatus
    };
    
    for (const [name, cacheName] of Object.entries(CACHES)) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        stats.caches[name] = keys.length;
    }
    
    event.ports[0].postMessage(stats);
}

function handleForceUpdate() {
    self.registration.update();
    self.skipWaiting();
}

// === INICIALIZACIÓN ===
async function initializeCacheAnalytics() {
    console.log('📊 Inicializando analytics de cache...');
    cacheAnalytics.clear();
    CACHE_STRATEGIES.intelligentCache.patterns.clear();
}

async function setupIntelligentCaching() {
    console.log('🧠 Configurando cache inteligente...');
    
    // Load patterns from previous session if available
    try {
        const stored = await caches.match('cache-patterns.json');
        if (stored) {
            const patterns = await stored.json();
            CACHE_STRATEGIES.intelligentCache.patterns = new Map(patterns);
        }
    } catch (error) {
        console.log('No previous patterns found');
    }
}

// === NETWORK STATUS MONITORING ===
self.addEventListener('online', () => {
    networkStatus = 'online';
    console.log('🌐 Network online');
    
    // Process background sync queue
    if (backgroundSyncQueue.length > 0) {
        processBackgroundQueue();
    }
});

self.addEventListener('offline', () => {
    networkStatus = 'offline';
    console.log('📵 Network offline');
});

// === CLEANUP AND MAINTENANCE ===
// Periodic cleanup every 24 hours
setInterval(async () => {
    await cleanupExpiredCache();
    await optimizeCacheSize();
    await saveIntelligentPatterns();
}, 24 * 60 * 60 * 1000);

async function cleanupExpiredCache() {
    console.log('🧹 Cleaning up expired cache entries...');
    
    for (const cacheName of Object.values(CACHES)) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response && isExpired(response)) {
                await cache.delete(request);
            }
        }
    }
}

async function optimizeCacheSize() {
    console.log('⚖️ Optimizing cache size...');
    
    for (const [cacheType, cacheName] of Object.entries(CACHES)) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        const maxEntries = CACHE_STRATEGIES[cacheType]?.maxEntries || 100;
        
        if (requests.length > maxEntries) {
            // Remove oldest entries
            const toRemove = requests.slice(0, requests.length - maxEntries);
            await Promise.all(toRemove.map(request => cache.delete(request)));
        }
    }
}

async function saveIntelligentPatterns() {
    console.log('💾 Saving intelligent cache patterns...');
    
    const patterns = Array.from(CACHE_STRATEGIES.intelligentCache.patterns.entries());
    const response = new Response(JSON.stringify(patterns), {
        headers: { 'Content-Type': 'application/json' }
    });
    
    const cache = await caches.open(CACHES.dynamic);
    await cache.put('cache-patterns.json', response);
}

console.log('🚀 Service Worker Advanced v' + SW_VERSION + ' loaded');