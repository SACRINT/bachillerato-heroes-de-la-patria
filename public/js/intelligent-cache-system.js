/**
 * Sistema de Caché Inteligente BGE
 * Versión: 1.0
 * Fecha: 21-09-2025
 */

class BGEIntelligentCacheSystem {
    constructor() {
        this.cachePrefix = 'bge-intelligent-';
        this.analyticsKey = 'bge_cache_analytics';
        this.configKey = 'bge_cache_config';
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB
        this.cleanupThreshold = 0.85; // 85% de uso
        this.analytics = this.loadAnalytics();
        this.config = this.loadConfig();

        void 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startPeriodicOptimization();
        this.preloadCriticalResources();
        this.setupIntersectionObserver();
    }

    loadAnalytics() {
        const stored = localStorage.getItem(this.analyticsKey);
        return stored ? JSON.parse(stored) : {
            resourceAccess: {},
            userPatterns: {},
            timeBasedAccess: {},
            deviceInfo: {
                connectionType: this.getConnectionType(),
                deviceMemory: navigator.deviceMemory || 4,
                hardwareConcurrency: navigator.hardwareConcurrency || 4
            },
            cachePerformance: {
                hits: 0,
                misses: 0,
                totalRequests: 0
            }
        };
    }

    loadConfig() {
        const stored = localStorage.getItem(this.configKey);
        const defaultConfig = {
            aggressiveCaching: false,
            predictiveLoading: true,
            compressionEnabled: true,
            maxPredictions: 5,
            cacheStrategy: 'intelligent', // 'aggressive', 'conservative', 'intelligent'
            preloadImages: true,
            preloadCritical: true
        };

        return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    }

    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }

    setupEventListeners() {
        // Rastrear clics en enlaces
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                this.recordResourceAccess(link.href, 'click');
                this.predictNextResources(link.href);
            }
        });

        // Rastrear navegación
        window.addEventListener('beforeunload', () => {
            this.saveAnalytics();
        });

        // Rastrear cambios de visibilidad
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveAnalytics();
            } else {
                this.updateTimeBasedPatterns();
            }
        });

        // Rastrear cambios de conexión
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.analytics.deviceInfo.connectionType = this.getConnectionType();
                this.adaptCacheStrategy();
            });
        }
    }

    recordResourceAccess(url, type = 'request') {
        const now = Date.now();
        const hour = new Date().getHours();

        // Registrar acceso a recurso
        if (!this.analytics.resourceAccess[url]) {
            this.analytics.resourceAccess[url] = {
                count: 0,
                lastAccess: now,
                firstAccess: now,
                accessTypes: {},
                timePattern: {}
            };
        }

        this.analytics.resourceAccess[url].count++;
        this.analytics.resourceAccess[url].lastAccess = now;
        this.analytics.resourceAccess[url].accessTypes[type] =
            (this.analytics.resourceAccess[url].accessTypes[type] || 0) + 1;

        // Patrón horario
        this.analytics.resourceAccess[url].timePattern[hour] =
            (this.analytics.resourceAccess[url].timePattern[hour] || 0) + 1;

        // Patrones basados en tiempo
        if (!this.analytics.timeBasedAccess[hour]) {
            this.analytics.timeBasedAccess[hour] = [];
        }
        this.analytics.timeBasedAccess[hour].push(url);

        void 0;
    }

    async predictNextResources(currentUrl) {
        if (!this.config.predictiveLoading) return;

        try {
            const predictions = this.generatePredictions(currentUrl);

            for (const prediction of predictions.slice(0, this.config.maxPredictions)) {
                if (prediction.confidence > 0.3) {
                    await this.preloadResource(prediction.url, prediction.priority);
                }
            }
        } catch (error) {
            void 0;
        }
    }

    generatePredictions(currentUrl) {
        const predictions = [];
        const currentHour = new Date().getHours();

        // Analizar recursos frecuentemente accedidos después del actual
        for (const [url, data] of Object.entries(this.analytics.resourceAccess)) {
            if (url === currentUrl) continue;

            let confidence = 0;

            // Factor: frecuencia de acceso
            confidence += Math.min(data.count / 100, 0.4);

            // Factor: patrón temporal
            const hourlyAccess = data.timePattern[currentHour] || 0;
            const totalAccess = Object.values(data.timePattern).reduce((a, b) => a + b, 0);
            if (totalAccess > 0) {
                confidence += (hourlyAccess / totalAccess) * 0.3;
            }

            // Factor: recencia
            const daysSinceAccess = (Date.now() - data.lastAccess) / (1000 * 60 * 60 * 24);
            confidence += Math.max(0, (7 - daysSinceAccess) / 7) * 0.2;

            // Factor: tipo de recurso
            if (url.includes('.css') || url.includes('.js')) {
                confidence += 0.1; // Recursos críticos
            }

            predictions.push({
                url,
                confidence,
                priority: this.calculatePriority(confidence, data)
            });
        }

        return predictions.sort((a, b) => b.confidence - a.confidence);
    }

    calculatePriority(confidence, resourceData) {
        if (confidence > 0.7) return 'high';
        if (confidence > 0.4) return 'medium';
        return 'low';
    }

    async preloadResource(url, priority = 'low') {
        try {
            // Verificar si ya está en caché
            const cached = await this.checkCache(url);
            if (cached) return;

            // Verificar límites de caché
            if (!(await this.canCache())) {
                await this.optimizeCache();
            }

            void 0;

            const options = {
                priority: priority === 'high' ? 'high' : 'low',
                cache: 'force-cache'
            };

            const response = await fetch(url, options);

            if (response.ok) {
                await this.storeInCache(url, response.clone(), priority);
                this.analytics.cachePerformance.hits++;
            }

        } catch (error) {
            void 0;
            this.analytics.cachePerformance.misses++;
        }

        this.analytics.cachePerformance.totalRequests++;
    }

    async checkCache(url) {
        try {
            const cacheName = this.getCacheName(url);
            const cache = await caches.open(cacheName);
            const response = await cache.match(url);
            return !!response;
        } catch (error) {
            return false;
        }
    }

    async storeInCache(url, response, priority = 'medium') {
        try {
            const cacheName = this.getCacheName(url, priority);
            const cache = await caches.open(cacheName);

            // Agregar metadata
            const headers = new Headers(response.headers);
            headers.set('bge-cached-at', new Date().toISOString());
            headers.set('bge-priority', priority);
            headers.set('bge-access-count', this.analytics.resourceAccess[url]?.count || 0);

            const cachedResponse = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
            });

            await cache.put(url, cachedResponse);
            void 0;

        } catch (error) {
            console.error('❌ [INTELLIGENT-CACHE] Error almacenando:', error);
        }
    }

    getCacheName(url, priority = 'medium') {
        if (url.includes('.css') || url.includes('.js')) {
            return `${this.cachePrefix}critical`;
        }
        if (url.includes('.jpg') || url.includes('.png') || url.includes('.webp')) {
            return `${this.cachePrefix}images`;
        }
        if (priority === 'high') {
            return `${this.cachePrefix}high-priority`;
        }
        return `${this.cachePrefix}standard`;
    }

    async canCache() {
        try {
            const estimate = await navigator.storage?.estimate();
            if (estimate) {
                const usage = estimate.usage || 0;
                const quota = estimate.quota || this.maxCacheSize;
                return (usage / quota) < this.cleanupThreshold;
            }
            return true;
        } catch (error) {
            return true;
        }
    }

    async optimizeCache() {
        void 0;

        try {
            const cacheNames = await caches.keys();
            const bgeCaches = cacheNames.filter(name => name.startsWith(this.cachePrefix));

            for (const cacheName of bgeCaches) {
                await this.optimizeSingleCache(cacheName);
            }

            void 0;
        } catch (error) {
            console.error('❌ [INTELLIGENT-CACHE] Error en optimización:', error);
        }
    }

    async optimizeSingleCache(cacheName) {
        try {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            const entries = [];

            // Analizar cada entrada
            for (const request of requests) {
                const response = await cache.match(request);
                const cachedAt = response.headers.get('bge-cached-at');
                const accessCount = parseInt(response.headers.get('bge-access-count')) || 0;
                const priority = response.headers.get('bge-priority') || 'medium';

                const age = cachedAt ? Date.now() - new Date(cachedAt).getTime() : 0;
                const score = this.calculateRetentionScore(accessCount, age, priority);

                entries.push({
                    request,
                    score,
                    age,
                    accessCount,
                    priority
                });
            }

            // Ordenar por score (menor = eliminar primero)
            entries.sort((a, b) => a.score - b.score);

            // Eliminar las entradas menos valiosas (25% del caché)
            const toRemove = Math.floor(entries.length * 0.25);
            for (let i = 0; i < toRemove; i++) {
                await cache.delete(entries[i].request);
                void 0;
            }

        } catch (error) {
            console.error(`❌ [INTELLIGENT-CACHE] Error optimizando ${cacheName}:`, error);
        }
    }

    calculateRetentionScore(accessCount, age, priority) {
        let score = accessCount * 10; // Base: frecuencia de acceso

        // Penalizar por edad (después de 7 días)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
        if (age > maxAge) {
            score *= Math.max(0.1, 1 - (age - maxAge) / maxAge);
        }

        // Bonificar por prioridad
        const priorityMultiplier = {
            'high': 2.0,
            'medium': 1.0,
            'low': 0.5
        };
        score *= priorityMultiplier[priority] || 1.0;

        return score;
    }

    adaptCacheStrategy() {
        const connection = this.analytics.deviceInfo.connectionType;
        const memory = this.analytics.deviceInfo.deviceMemory;

        if (connection === 'slow-2g' || connection === '2g') {
            this.config.aggressiveCaching = false;
            this.config.maxPredictions = 2;
            this.config.preloadImages = false;
        } else if (connection === '3g') {
            this.config.aggressiveCaching = false;
            this.config.maxPredictions = 3;
            this.config.preloadImages = true;
        } else {
            this.config.aggressiveCaching = memory > 4;
            this.config.maxPredictions = memory > 4 ? 5 : 3;
            this.config.preloadImages = true;
        }

        void 0;
        this.saveConfig();
    }

    async preloadCriticalResources() {
        if (!this.config.preloadCritical) return;

        const criticalResources = [
            '/css/style.css',
            '/js/script.js',
            '/js/chatbot.js',
            '/partials/header.html',
            '/partials/footer.html'
        ];

        void 0;

        for (const resource of criticalResources) {
            await this.preloadResource(resource, 'high');
        }
    }

    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        this.recordResourceAccess(img.dataset.src, 'view');

                        // Precargar imágenes relacionadas
                        if (this.config.preloadImages) {
                            this.preloadRelatedImages(img);
                        }
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Observar imágenes lazy
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.imageObserver.observe(img);
        });
    }

    async preloadRelatedImages(currentImg) {
        const container = currentImg.closest('.carousel, .gallery, .row');
        if (!container) return;

        const relatedImages = container.querySelectorAll('img[data-src]');
        const currentIndex = Array.from(relatedImages).indexOf(currentImg);

        // Precargar las siguientes 2 imágenes
        for (let i = 1; i <= 2; i++) {
            const nextImg = relatedImages[currentIndex + i];
            if (nextImg && nextImg.dataset.src) {
                await this.preloadResource(nextImg.dataset.src, 'medium');
            }
        }
    }

    updateTimeBasedPatterns() {
        const hour = new Date().getHours();
        const currentPage = window.location.pathname;

        if (!this.analytics.userPatterns[hour]) {
            this.analytics.userPatterns[hour] = {};
        }

        this.analytics.userPatterns[hour][currentPage] =
            (this.analytics.userPatterns[hour][currentPage] || 0) + 1;
    }

    startPeriodicOptimization() {
        // Optimización cada 30 minutos
        setInterval(() => {
            this.performMaintenanceTasks();
        }, 30 * 60 * 1000);

        // Análisis cada 5 minutos
        setInterval(() => {
            this.updateTimeBasedPatterns();
            this.saveAnalytics();
        }, 5 * 60 * 1000);

        void 0;
    }

    async performMaintenanceTasks() {
        void 0;

        try {
            // Verificar si necesita optimización
            if (!(await this.canCache())) {
                await this.optimizeCache();
            }

            // Actualizar predicciones basadas en patrones
            await this.updatePredictiveCache();

            // Limpiar analytics antiguos
            this.cleanOldAnalytics();

        } catch (error) {
            console.error('❌ [INTELLIGENT-CACHE] Error en mantenimiento:', error);
        }
    }

    async updatePredictiveCache() {
        const currentHour = new Date().getHours();
        const hourlyPattern = this.analytics.timeBasedAccess[currentHour];

        if (!hourlyPattern || hourlyPattern.length === 0) return;

        // Encontrar los recursos más accedidos en esta hora
        const resourceCounts = {};
        hourlyPattern.forEach(url => {
            resourceCounts[url] = (resourceCounts[url] || 0) + 1;
        });

        const sortedResources = Object.entries(resourceCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        for (const [url] of sortedResources) {
            if (!(await this.checkCache(url))) {
                await this.preloadResource(url, 'medium');
            }
        }
    }

    cleanOldAnalytics() {
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
        const cutoff = Date.now() - maxAge;

        for (const [url, data] of Object.entries(this.analytics.resourceAccess)) {
            if (data.lastAccess < cutoff) {
                delete this.analytics.resourceAccess[url];
            }
        }
    }

    saveAnalytics() {
        try {
            localStorage.setItem(this.analyticsKey, JSON.stringify(this.analytics));
        } catch (error) {
            void 0;
        }
    }

    saveConfig() {
        try {
            localStorage.setItem(this.configKey, JSON.stringify(this.config));
        } catch (error) {
            void 0;
        }
    }

    // API pública para configuración
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
        this.adaptCacheStrategy();
        void 0;
    }

    getAnalytics() {
        return {
            ...this.analytics,
            cacheEfficiency: this.analytics.cachePerformance.totalRequests > 0 ?
                this.analytics.cachePerformance.hits / this.analytics.cachePerformance.totalRequests : 0,
            topResources: Object.entries(this.analytics.resourceAccess)
                .sort(([,a], [,b]) => b.count - a.count)
                .slice(0, 10)
        };
    }

    async getCacheInfo() {
        try {
            const cacheNames = await caches.keys();
            const bgeCaches = cacheNames.filter(name => name.startsWith(this.cachePrefix));

            const info = {
                totalCaches: bgeCaches.length,
                cacheNames: bgeCaches,
                estimatedSize: 0
            };

            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                info.usage = estimate.usage;
                info.quota = estimate.quota;
                info.usagePercentage = estimate.quota ? (estimate.usage / estimate.quota * 100).toFixed(1) : 0;
            }

            return info;
        } catch (error) {
            console.error('❌ [INTELLIGENT-CACHE] Error obteniendo info de caché:', error);
            return null;
        }
    }
}

// Inicializar sistema automáticamente
let bgeIntelligentCache;

document.addEventListener('DOMContentLoaded', () => {
    bgeIntelligentCache = new BGEIntelligentCacheSystem();

    // Hacer disponible globalmente
    window.bgeIntelligentCache = bgeIntelligentCache;
});

void 0;