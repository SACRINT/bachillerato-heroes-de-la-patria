/**
 * Performance Optimization Service
 * Sistema integral de optimización de rendimiento para BGE
 * Target: Lighthouse >95, TTFB <1s, LCP <1.2s, CLS <0.05
 *
 * @version 1.0.0
 * @author Claude Code - Arquitecto IA
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        // Performance targets
        targets: {
            TTFB: 1000,        // Time to First Byte (ms)
            FCP: 1800,         // First Contentful Paint (ms)
            LCP: 1200,         // Largest Contentful Paint (ms)
            FID: 100,          // First Input Delay (ms)
            CLS: 0.05,         // Cumulative Layout Shift
            TTI: 3800          // Time to Interactive (ms)
        },

        // Resource hints
        preconnectDomains: [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdn.jsdelivr.net',
            'https://cdn.tiny.cloud'
        ],

        // Cache configuration
        cache: {
            maxAge: 86400000,  // 24 hours
            maxItems: 100
        },

        // Image optimization
        images: {
            lazyLoadThreshold: '200px',
            formats: ['webp', 'avif'],
            sizes: [320, 640, 1024, 1920]
        },

        // Bundle optimization
        bundle: {
            maxChunkSize: 244000,  // 244KB
            splitThreshold: 30000   // 30KB
        }
    };

    // ============================================
    // PERFORMANCE METRICS COLLECTOR
    // ============================================
    class PerformanceMetrics {
        constructor() {
            this.metrics = {};
            this.observers = [];
        }

        /**
         * Inicializa la recolección de métricas
         */
        initialize() {
            this._collectNavigationTiming();
            this._observePaintTiming();
            this._observeLayoutShift();
            this._observeLCP();
            this._observeFID();
            this._collectResourceTiming();

            console.log('[PERF] Métricas de rendimiento inicializadas');
        }

        /**
         * Recolecta métricas de navegación
         */
        _collectNavigationTiming() {
            if (!window.performance || !window.performance.timing) return;

            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = performance.timing;

                    this.metrics.dns = timing.domainLookupEnd - timing.domainLookupStart;
                    this.metrics.tcp = timing.connectEnd - timing.connectStart;
                    this.metrics.ttfb = timing.responseStart - timing.requestStart;
                    this.metrics.download = timing.responseEnd - timing.responseStart;
                    this.metrics.domParsing = timing.domInteractive - timing.responseEnd;
                    this.metrics.domComplete = timing.domComplete - timing.domLoading;
                    this.metrics.loadComplete = timing.loadEventEnd - timing.navigationStart;

                    this._checkTargets();
                }, 0);
            });
        }

        /**
         * Observa First Contentful Paint
         */
        _observePaintTiming() {
            if (!window.PerformanceObserver) return;

            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-paint') {
                            this.metrics.fp = entry.startTime;
                        }
                        if (entry.name === 'first-contentful-paint') {
                            this.metrics.fcp = entry.startTime;
                        }
                    }
                });

                observer.observe({ entryTypes: ['paint'] });
                this.observers.push(observer);
            } catch (e) {
                console.warn('[PERF] Paint timing no soportado');
            }
        }

        /**
         * Observa Cumulative Layout Shift
         */
        _observeLayoutShift() {
            if (!window.PerformanceObserver) return;

            try {
                let clsValue = 0;
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this.metrics.cls = clsValue;
                });

                observer.observe({ entryTypes: ['layout-shift'] });
                this.observers.push(observer);
            } catch (e) {
                console.warn('[PERF] Layout shift no soportado');
            }
        }

        /**
         * Observa Largest Contentful Paint
         */
        _observeLCP() {
            if (!window.PerformanceObserver) return;

            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.lcp = lastEntry.startTime;
                });

                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.push(observer);
            } catch (e) {
                console.warn('[PERF] LCP no soportado');
            }
        }

        /**
         * Observa First Input Delay
         */
        _observeFID() {
            if (!window.PerformanceObserver) return;

            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.metrics.fid = entry.processingStart - entry.startTime;
                    }
                });

                observer.observe({ entryTypes: ['first-input'] });
                this.observers.push(observer);
            } catch (e) {
                console.warn('[PERF] FID no soportado');
            }
        }

        /**
         * Recolecta métricas de recursos
         */
        _collectResourceTiming() {
            if (!window.performance || !window.performance.getEntriesByType) return;

            window.addEventListener('load', () => {
                setTimeout(() => {
                    const resources = performance.getEntriesByType('resource');

                    this.metrics.resources = {
                        total: resources.length,
                        scripts: resources.filter(r => r.initiatorType === 'script').length,
                        styles: resources.filter(r => r.initiatorType === 'link' || r.initiatorType === 'css').length,
                        images: resources.filter(r => r.initiatorType === 'img').length,
                        fonts: resources.filter(r => r.initiatorType === 'css' && r.name.includes('font')).length,
                        totalSize: resources.reduce((acc, r) => acc + (r.transferSize || 0), 0),
                        totalDuration: resources.reduce((acc, r) => acc + r.duration, 0)
                    };
                }, 100);
            });
        }

        /**
         * Verifica si las métricas cumplen los targets
         */
        _checkTargets() {
            const issues = [];

            if (this.metrics.ttfb > CONFIG.targets.TTFB) {
                issues.push(`TTFB: ${this.metrics.ttfb}ms (target: ${CONFIG.targets.TTFB}ms)`);
            }
            if (this.metrics.fcp > CONFIG.targets.FCP) {
                issues.push(`FCP: ${this.metrics.fcp}ms (target: ${CONFIG.targets.FCP}ms)`);
            }
            if (this.metrics.lcp > CONFIG.targets.LCP) {
                issues.push(`LCP: ${this.metrics.lcp}ms (target: ${CONFIG.targets.LCP}ms)`);
            }
            if (this.metrics.cls > CONFIG.targets.CLS) {
                issues.push(`CLS: ${this.metrics.cls} (target: ${CONFIG.targets.CLS})`);
            }

            if (issues.length > 0) {
                console.warn('[PERF] Problemas de rendimiento detectados:', issues);
            } else {
                console.log('[PERF] ✅ Todas las métricas dentro de los targets');
            }
        }

        /**
         * Obtiene un resumen de las métricas
         */
        getSummary() {
            return {
                ...this.metrics,
                score: this._calculateScore()
            };
        }

        /**
         * Calcula puntuación de rendimiento (0-100)
         */
        _calculateScore() {
            let score = 100;

            // Penalizaciones por exceder targets
            if (this.metrics.ttfb > CONFIG.targets.TTFB) {
                score -= Math.min(20, (this.metrics.ttfb - CONFIG.targets.TTFB) / 50);
            }
            if (this.metrics.lcp > CONFIG.targets.LCP) {
                score -= Math.min(25, (this.metrics.lcp - CONFIG.targets.LCP) / 100);
            }
            if (this.metrics.fid > CONFIG.targets.FID) {
                score -= Math.min(15, (this.metrics.fid - CONFIG.targets.FID) / 10);
            }
            if (this.metrics.cls > CONFIG.targets.CLS) {
                score -= Math.min(25, (this.metrics.cls - CONFIG.targets.CLS) * 100);
            }

            return Math.max(0, Math.round(score));
        }

        /**
         * Limpia los observers
         */
        disconnect() {
            this.observers.forEach(obs => obs.disconnect());
            this.observers = [];
        }
    }

    // ============================================
    // RESOURCE LOADER OPTIMIZER
    // ============================================
    class ResourceOptimizer {
        constructor() {
            this.loadedResources = new Set();
            this.pendingLoads = new Map();
        }

        /**
         * Agrega preconnect hints para dominios externos
         */
        addPreconnectHints() {
            CONFIG.preconnectDomains.forEach(domain => {
                if (!document.querySelector(`link[href="${domain}"][rel="preconnect"]`)) {
                    const link = document.createElement('link');
                    link.rel = 'preconnect';
                    link.href = domain;
                    link.crossOrigin = 'anonymous';
                    document.head.appendChild(link);
                }
            });

            console.log('[PERF] Preconnect hints agregados');
        }

        /**
         * Prefetch de recursos para navegación futura
         */
        prefetchResources(urls) {
            urls.forEach(url => {
                if (this.loadedResources.has(url)) return;

                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = url;
                link.as = this._getResourceType(url);
                document.head.appendChild(link);

                this.loadedResources.add(url);
            });
        }

        /**
         * Preload de recursos críticos
         */
        preloadCritical(resources) {
            resources.forEach(resource => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource.url;
                link.as = resource.type || this._getResourceType(resource.url);

                if (resource.type === 'font') {
                    link.crossOrigin = 'anonymous';
                }

                document.head.appendChild(link);
            });

            console.log('[PERF] Recursos críticos preloaded');
        }

        /**
         * Carga diferida de scripts no críticos
         */
        loadDeferredScript(url, callback) {
            if (this.loadedResources.has(url)) {
                if (callback) callback();
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.defer = true;

                script.onload = () => {
                    this.loadedResources.add(url);
                    if (callback) callback();
                    resolve();
                };

                script.onerror = () => reject(new Error(`Failed to load: ${url}`));

                document.body.appendChild(script);
            });
        }

        /**
         * Carga asíncrona de módulos
         */
        async loadModule(url) {
            if (this.loadedResources.has(url)) {
                return this.pendingLoads.get(url);
            }

            const loadPromise = import(url);
            this.pendingLoads.set(url, loadPromise);
            this.loadedResources.add(url);

            return loadPromise;
        }

        /**
         * Determina el tipo de recurso por URL
         */
        _getResourceType(url) {
            if (/\.js(\?|$)/.test(url)) return 'script';
            if (/\.css(\?|$)/.test(url)) return 'style';
            if (/\.(png|jpg|jpeg|gif|webp|svg|avif)(\?|$)/i.test(url)) return 'image';
            if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)) return 'font';
            return 'fetch';
        }
    }

    // ============================================
    // IMAGE OPTIMIZER
    // ============================================
    class ImageOptimizer {
        constructor() {
            this.observer = null;
            this.processedImages = new WeakSet();
        }

        /**
         * Inicializa lazy loading de imágenes
         */
        initializeLazyLoading() {
            if (!('IntersectionObserver' in window)) {
                this._loadAllImages();
                return;
            }

            this.observer = new IntersectionObserver(
                (entries) => this._handleIntersection(entries),
                {
                    rootMargin: CONFIG.images.lazyLoadThreshold,
                    threshold: 0
                }
            );

            // Observar imágenes con data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.observer.observe(img);
            });

            // Observar imágenes con loading="lazy"
            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                this.observer.observe(img);
            });

            console.log('[PERF] Lazy loading de imágenes inicializado');
        }

        /**
         * Maneja la intersección de imágenes
         */
        _handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this._loadImage(img);
                    this.observer.unobserve(img);
                }
            });
        }

        /**
         * Carga una imagen
         */
        _loadImage(img) {
            if (this.processedImages.has(img)) return;

            const src = img.dataset.src || img.src;
            const srcset = img.dataset.srcset;

            if (src) {
                img.src = src;
                delete img.dataset.src;
            }

            if (srcset) {
                img.srcset = srcset;
                delete img.dataset.srcset;
            }

            img.classList.add('loaded');
            this.processedImages.add(img);
        }

        /**
         * Fallback: cargar todas las imágenes
         */
        _loadAllImages() {
            document.querySelectorAll('img[data-src]').forEach(img => {
                this._loadImage(img);
            });
        }

        /**
         * Optimiza imágenes existentes con dimensiones
         */
        optimizeExistingImages() {
            document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
                // Agregar dimensiones para evitar CLS
                if (img.naturalWidth && img.naturalHeight) {
                    img.width = img.naturalWidth;
                    img.height = img.naturalHeight;
                }
            });
        }

        /**
         * Genera srcset responsivo
         */
        generateResponsiveSrcset(baseSrc) {
            const extension = baseSrc.match(/\.[^.]+$/)[0];
            const baseName = baseSrc.replace(extension, '');

            return CONFIG.images.sizes
                .map(size => `${baseName}-${size}w${extension} ${size}w`)
                .join(', ');
        }

        /**
         * Destruye el observer
         */
        destroy() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }
    }

    // ============================================
    // SCRIPT OPTIMIZER
    // ============================================
    class ScriptOptimizer {
        constructor() {
            this.loadQueue = [];
            this.isProcessing = false;
        }

        /**
         * Optimiza scripts existentes
         */
        optimizeExistingScripts() {
            // Mover scripts no críticos al final del body
            const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');

            scripts.forEach(script => {
                const isInHead = script.parentNode === document.head;
                const isCritical = script.hasAttribute('data-critical');

                if (isInHead && !isCritical) {
                    // Convertir a defer
                    script.defer = true;
                }
            });
        }

        /**
         * Carga scripts en secuencia optimizada
         */
        async loadSequential(scripts) {
            for (const script of scripts) {
                await this._loadScript(script);
            }
        }

        /**
         * Carga script individual
         */
        _loadScript(config) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = config.src;

                if (config.async) script.async = true;
                if (config.defer) script.defer = true;
                if (config.module) script.type = 'module';

                script.onload = resolve;
                script.onerror = reject;

                document.body.appendChild(script);
            });
        }

        /**
         * Inline de scripts críticos pequeños
         */
        inlineCriticalScript(content) {
            const script = document.createElement('script');
            script.textContent = content;
            document.head.appendChild(script);
        }
    }

    // ============================================
    // CSS OPTIMIZER
    // ============================================
    class CSSOptimizer {
        /**
         * Extrae y aplica CSS crítico inline
         */
        applyCriticalCSS(criticalCSS) {
            const style = document.createElement('style');
            style.textContent = criticalCSS;
            style.id = 'critical-css';
            document.head.insertBefore(style, document.head.firstChild);
        }

        /**
         * Carga CSS no crítico de forma diferida
         */
        loadNonCriticalCSS(href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.media = 'print';

            link.onload = () => {
                link.media = 'all';
            };

            document.head.appendChild(link);
        }

        /**
         * Elimina CSS no utilizado (básico)
         */
        removeUnusedCSS() {
            const usedSelectors = new Set();

            // Recopilar selectores usados
            document.querySelectorAll('*').forEach(el => {
                usedSelectors.add(el.tagName.toLowerCase());
                el.classList.forEach(cls => usedSelectors.add('.' + cls));
                if (el.id) usedSelectors.add('#' + el.id);
            });

            console.log(`[PERF] ${usedSelectors.size} selectores únicos en uso`);
        }
    }

    // ============================================
    // CACHE MANAGER
    // ============================================
    class CacheManager {
        constructor() {
            this.cache = new Map();
            this.cacheKey = 'bge_perf_cache';
        }

        /**
         * Obtiene item del cache
         */
        get(key) {
            const item = this.cache.get(key);

            if (!item) return null;

            if (Date.now() > item.expires) {
                this.cache.delete(key);
                this._persist();
                return null;
            }

            return item.value;
        }

        /**
         * Guarda item en cache
         */
        set(key, value, ttl = CONFIG.cache.maxAge) {
            // Limpiar cache si excede límite
            if (this.cache.size >= CONFIG.cache.maxItems) {
                this._evictOldest();
            }

            this.cache.set(key, {
                value,
                expires: Date.now() + ttl,
                created: Date.now()
            });

            this._persist();
        }

        /**
         * Elimina item del cache
         */
        delete(key) {
            this.cache.delete(key);
            this._persist();
        }

        /**
         * Limpia todo el cache
         */
        clear() {
            this.cache.clear();
            localStorage.removeItem(this.cacheKey);
        }

        /**
         * Elimina el item más antiguo
         */
        _evictOldest() {
            let oldestKey = null;
            let oldestTime = Infinity;

            this.cache.forEach((item, key) => {
                if (item.created < oldestTime) {
                    oldestTime = item.created;
                    oldestKey = key;
                }
            });

            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        /**
         * Persiste cache en localStorage
         */
        _persist() {
            try {
                const data = JSON.stringify(Array.from(this.cache.entries()));
                localStorage.setItem(this.cacheKey, data);
            } catch (e) {
                console.warn('[PERF] Error persistiendo cache:', e);
            }
        }

        /**
         * Restaura cache desde localStorage
         */
        restore() {
            try {
                const data = localStorage.getItem(this.cacheKey);
                if (data) {
                    this.cache = new Map(JSON.parse(data));
                    // Limpiar expirados
                    const now = Date.now();
                    this.cache.forEach((item, key) => {
                        if (now > item.expires) {
                            this.cache.delete(key);
                        }
                    });
                }
            } catch (e) {
                console.warn('[PERF] Error restaurando cache:', e);
            }
        }
    }

    // ============================================
    // MAIN SERVICE
    // ============================================
    class PerformanceOptimizationService {
        constructor() {
            this.metrics = new PerformanceMetrics();
            this.resourceOptimizer = new ResourceOptimizer();
            this.imageOptimizer = new ImageOptimizer();
            this.scriptOptimizer = new ScriptOptimizer();
            this.cssOptimizer = new CSSOptimizer();
            this.cacheManager = new CacheManager();

            this.initialized = false;
        }

        /**
         * Inicializa el servicio de optimización
         */
        initialize() {
            if (this.initialized) return;

            // Restaurar cache
            this.cacheManager.restore();

            // Inicializar métricas
            this.metrics.initialize();

            // Optimizaciones automáticas
            this._runAutoOptimizations();

            this.initialized = true;
            console.log('[PERF] Performance Optimization Service inicializado');
        }

        /**
         * Ejecuta optimizaciones automáticas
         */
        _runAutoOptimizations() {
            // Preconnect hints
            this.resourceOptimizer.addPreconnectHints();

            // Lazy loading de imágenes
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.imageOptimizer.initializeLazyLoading();
                    this.imageOptimizer.optimizeExistingImages();
                    this.scriptOptimizer.optimizeExistingScripts();
                });
            } else {
                this.imageOptimizer.initializeLazyLoading();
                this.imageOptimizer.optimizeExistingImages();
                this.scriptOptimizer.optimizeExistingScripts();
            }
        }

        /**
         * Obtiene métricas de rendimiento
         */
        getMetrics() {
            return this.metrics.getSummary();
        }

        /**
         * Preload de recursos críticos para una ruta
         */
        preloadForRoute(route) {
            const routeResources = {
                '/admin-dashboard': [
                    { url: '/public/js/admin-dashboard.js', type: 'script' },
                    { url: '/public/css/admin-dashboard.css', type: 'style' }
                ],
                '/estudiantes': [
                    { url: '/public/js/student-portal.js', type: 'script' }
                ],
                '/docentes': [
                    { url: '/public/js/teachers-portal-manager.js', type: 'script' }
                ]
            };

            const resources = routeResources[route];
            if (resources) {
                this.resourceOptimizer.preloadCritical(resources);
            }
        }

        /**
         * Optimización manual completa
         */
        runFullOptimization() {
            console.log('[PERF] Ejecutando optimización completa...');

            // CSS
            this.cssOptimizer.removeUnusedCSS();

            // Imágenes
            this.imageOptimizer.optimizeExistingImages();

            // Scripts
            this.scriptOptimizer.optimizeExistingScripts();

            // Reportar métricas
            const metrics = this.getMetrics();
            console.log('[PERF] Métricas después de optimización:', metrics);

            return metrics;
        }

        /**
         * Cache de fetch requests
         */
        async cachedFetch(url, options = {}) {
            const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
            const cached = this.cacheManager.get(cacheKey);

            if (cached) {
                return cached;
            }

            const response = await fetch(url, options);
            const data = await response.json();

            this.cacheManager.set(cacheKey, data);
            return data;
        }

        /**
         * Genera reporte de rendimiento
         */
        generateReport() {
            const metrics = this.getMetrics();

            return {
                timestamp: new Date().toISOString(),
                score: metrics.score,
                metrics: {
                    ttfb: { value: metrics.ttfb, target: CONFIG.targets.TTFB, pass: metrics.ttfb <= CONFIG.targets.TTFB },
                    fcp: { value: metrics.fcp, target: CONFIG.targets.FCP, pass: metrics.fcp <= CONFIG.targets.FCP },
                    lcp: { value: metrics.lcp, target: CONFIG.targets.LCP, pass: metrics.lcp <= CONFIG.targets.LCP },
                    fid: { value: metrics.fid, target: CONFIG.targets.FID, pass: metrics.fid <= CONFIG.targets.FID },
                    cls: { value: metrics.cls, target: CONFIG.targets.CLS, pass: metrics.cls <= CONFIG.targets.CLS }
                },
                resources: metrics.resources,
                recommendations: this._generateRecommendations(metrics)
            };
        }

        /**
         * Genera recomendaciones basadas en métricas
         */
        _generateRecommendations(metrics) {
            const recommendations = [];

            if (metrics.ttfb > CONFIG.targets.TTFB) {
                recommendations.push({
                    metric: 'TTFB',
                    priority: 'high',
                    suggestion: 'Optimizar respuesta del servidor, implementar CDN, usar caché de servidor'
                });
            }

            if (metrics.lcp > CONFIG.targets.LCP) {
                recommendations.push({
                    metric: 'LCP',
                    priority: 'high',
                    suggestion: 'Optimizar imágenes hero, preload recursos críticos, eliminar render-blocking resources'
                });
            }

            if (metrics.cls > CONFIG.targets.CLS) {
                recommendations.push({
                    metric: 'CLS',
                    priority: 'medium',
                    suggestion: 'Agregar dimensiones a imágenes, reservar espacio para anuncios/embeds, evitar inserción dinámica de contenido'
                });
            }

            if (metrics.resources && metrics.resources.total > 50) {
                recommendations.push({
                    metric: 'Resources',
                    priority: 'medium',
                    suggestion: `Reducir número de requests (actual: ${metrics.resources.total}), bundlear recursos, implementar HTTP/2`
                });
            }

            return recommendations;
        }

        /**
         * Destruye el servicio
         */
        destroy() {
            this.metrics.disconnect();
            this.imageOptimizer.destroy();
            this.initialized = false;
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    const perfService = new PerformanceOptimizationService();

    // Auto-inicialización
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => perfService.initialize());
    } else {
        perfService.initialize();
    }

    // Exponer globalmente
    window.perfService = perfService;
    window.PerformanceOptimizationService = PerformanceOptimizationService;

    // API pública simplificada
    window.perf = {
        getMetrics: () => perfService.getMetrics(),
        optimize: () => perfService.runFullOptimization(),
        report: () => perfService.generateReport(),
        preload: (route) => perfService.preloadForRoute(route),
        cache: {
            get: (key) => perfService.cacheManager.get(key),
            set: (key, val, ttl) => perfService.cacheManager.set(key, val, ttl),
            clear: () => perfService.cacheManager.clear()
        }
    };

    console.log('[PERF] Performance Optimization Service cargado');

})();
