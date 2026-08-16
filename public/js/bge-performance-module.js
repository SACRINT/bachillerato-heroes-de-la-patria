/**
 * 📊 BGE PERFORMANCE MODULE - BACHILLERATO GENERAL ESTATAL "HÉROES DE LA PATRIA"
 * Módulo unificado de optimización de rendimiento y Core Web Vitals
 *
 * CONSOLIDA:
 * - performance-monitor.js (Monitoreo de métricas)
 * - core-web-vitals-optimizer.js (Optimización Web Vitals)
 * - resource-optimizer.js (Optimización de recursos)
 * - performance-integration.js (Integración de sistemas)
 * - performance-unified-system.js (Sistema unificado)
 *
 * Versión: 1.0.0
 * Fecha: 27 de Septiembre, 2025
 * Reducción: 5 archivos → 1 módulo (-80% archivos)
 */

class BGEPerformanceModule extends BGEModule {
    constructor(framework) {
        super(framework);
        this.version = '1.0.0';
        this.name = 'performance';

        // Métricas Core Web Vitals
        this.metrics = {
            lcp: null, // Largest Contentful Paint
            fid: null, // First Input Delay
            cls: null, // Cumulative Layout Shift
            fcp: null, // First Contentful Paint
            ttfb: null, // Time to First Byte
            tti: null,  // Time to Interactive
            inp: null   // Interaction to Next Paint
        };

        // Umbrales de rendimiento óptimo
        this.thresholds = {
            lcp: { good: 2500, poor: 4000 },
            fid: { good: 100, poor: 300 },
            cls: { good: 0.1, poor: 0.25 },
            fcp: { good: 1800, poor: 3000 },
            ttfb: { good: 800, poor: 1800 },
            inp: { good: 200, poor: 500 }
        };

        // Sistema de optimización de recursos
        this.resourceOptimizer = {
            compressionCache: new Map(),
            loadedResources: new Set(),
            criticalResources: new Set([
                'css/style.css',
                'js/script.js',
                'js/bge-framework-core.js'
            ]),
            deferredResources: new Set([
                // stats-counter.js REMOVED - deprecated, replaced by admin-dashboard-stats.js
            ])
        };

        // Configuración del módulo
        this.config = {
            enableRealTimeOptimization: true,
            enablePredictiveLoading: true,
            enableAdaptiveQuality: true,
            enableMetricsReporting: true,
            enableResourceOptimization: true,
            enableWebVitalsTracking: true,
            monitoringInterval: 30000, // 30 segundos
            cacheExpiry: 24 * 60 * 60 * 1000 // 24 horas
        };

        // Estado interno
        this.observers = new Map();
        this.optimizationQueue = [];
        this.isOptimizing = false;
        this.sessionStart = performance.now();
        this.browserCapabilities = {};
    }

    async initialize() {
        await super.initialize();

        try {
            this.log('Inicializando BGE Performance Module...');

            // 1. Verificar capacidades del navegador
            await this.checkBrowserCapabilities();

            // 2. Configurar Web Vitals tracking
            await this.setupWebVitalsTracking();

            // 3. Inicializar optimización de recursos
            await this.initResourceOptimization();

            // 4. Configurar monitoreo en tiempo real
            this.setupRealTimeMonitoring();

            // 5. Aplicar optimizaciones críticas
            await this.applyCriticalOptimizations();

            // 6. Configurar reportes automáticos
            this.setupAutomaticReporting();

            this.log('✅ BGE Performance Module inicializado correctamente');

            // Generar reporte inicial después de 3 segundos
            setTimeout(() => this.generateInitialReport(), 3000);

        } catch (error) {
            this.error('Error inicializando Performance Module:', error);
        }
    }

    /**
     * 🔍 Verificar capacidades del navegador
     */
    async checkBrowserCapabilities() {
        this.browserCapabilities = {
            performanceObserver: 'PerformanceObserver' in window,
            intersectionObserver: 'IntersectionObserver' in window,
            serviceWorker: 'serviceWorker' in navigator,
            webVitals: typeof webVitals !== 'undefined',
            connection: 'connection' in navigator,
            requestIdleCallback: 'requestIdleCallback' in window,
            memoryAPI: 'memory' in performance
        };

        this.log('Capacidades del navegador:', this.browserCapabilities);

        // Cargar Web Vitals library si no está disponible
        if (!this.browserCapabilities.webVitals) {
            await this.loadWebVitalsLibrary();
        }
    }

    /**
     * 📊 Configurar tracking de Web Vitals
     */
    async setupWebVitalsTracking() {
        if (!this.browserCapabilities.performanceObserver) {
            this.log('⚠️ PerformanceObserver no disponible, usando fallback');
            return this.setupFallbackMetrics();
        }

        try {
            // Largest Contentful Paint (LCP)
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.updateMetric('lcp', lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.set('lcp', lcpObserver);

            // First Input Delay (FID)
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    const fid = entry.processingStart - entry.startTime;
                    this.updateMetric('fid', fid);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.set('fid', fidObserver);

            // Cumulative Layout Shift (CLS)
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        this.updateMetric('cls', clsValue);
                    }
                });
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('cls', clsObserver);

            // First Contentful Paint (FCP)
            const fcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (entry.name === 'first-contentful-paint') {
                        this.updateMetric('fcp', entry.startTime);
                    }
                });
            });
            fcpObserver.observe({ entryTypes: ['paint'] });
            this.observers.set('fcp', fcpObserver);

            // Navigation Timing para TTFB
            this.measureNavigationTiming();

            this.log('✅ Web Vitals tracking configurado');

        } catch (error) {
            this.error('Error configurando Web Vitals:', error);
            this.setupFallbackMetrics();
        }
    }

    /**
     * 📈 Actualizar métrica y evaluar rendimiento
     */
    updateMetric(metricName, value) {
        this.metrics[metricName] = value;

        // Evaluar si la métrica está en rango óptimo
        const threshold = this.thresholds[metricName];
        if (threshold) {
            let status = 'good';
            if (value > threshold.poor) status = 'poor';
            else if (value > threshold.good) status = 'needs-improvement';

            this.log(`📊 ${metricName.toUpperCase()}: ${value.toFixed(2)}ms (${status})`);

            // Aplicar optimizaciones automáticas si es necesario
            if (status !== 'good' && this.config.enableRealTimeOptimization) {
                this.queueOptimization(metricName, value, status);
            }
        }

        // Notificar al framework
        this.framework.dispatchEvent('metricUpdated', {
            metric: metricName,
            value: value,
            timestamp: performance.now()
        });
    }

    /**
     * ⚡ Inicializar optimización de recursos
     */
    async initResourceOptimization() {
        this.log('Inicializando optimización de recursos...');

        // Configurar carga asíncrona de recursos no críticos
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadDeferredResources());
        } else {
            this.loadDeferredResources();
        }

        // Precargar recursos críticos
        this.preloadCriticalResources();

        // Optimizar imágenes existentes
        this.optimizeExistingImages();

        // Configurar lazy loading
        this.setupLazyLoading();
    }

    /**
     * 🔄 Cargar recursos diferidos de forma asíncrona
     */
    async loadDeferredResources() {
        const deferredScripts = Array.from(this.resourceOptimizer.deferredResources);

        for (const script of deferredScripts) {
            if (!this.resourceOptimizer.loadedResources.has(script)) {
                await this.loadScriptAsync(script);
            }
        }
    }

    /**
     * 📦 Cargar script de forma asíncrona
     */
    loadScriptAsync(src, options = {}) {
        return new Promise((resolve, reject) => {
            if (this.resourceOptimizer.loadedResources.has(src)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src + '?v=' + this.getCacheVersion();
            script.async = true;

            if (options.priority === 'low') {
                script.loading = 'lazy';
            }

            script.onload = () => {
                this.resourceOptimizer.loadedResources.add(src);
                resolve();
            };

            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * 🚀 Precargar recursos críticos
     */
    preloadCriticalResources() {
        this.resourceOptimizer.criticalResources.forEach(resource => {
            if (!document.querySelector(`link[href="${resource}"]`)) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource;

                if (resource.endsWith('.css')) {
                    link.as = 'style';
                } else if (resource.endsWith('.js')) {
                    link.as = 'script';
                }

                document.head.appendChild(link);
            }
        });
    }

    /**
     * 🖼️ Configurar lazy loading para imágenes
     */
    setupLazyLoading() {
        if (this.browserCapabilities.intersectionObserver) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            // Observar imágenes con data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });

            this.observers.set('lazyImages', imageObserver);
        }
    }

    /**
     * ⏰ Configurar monitoreo en tiempo real
     */
    setupRealTimeMonitoring() {
        // Monitoreo cada 30 segundos
        setInterval(() => {
            this.collectRealTimeMetrics();
        }, this.config.monitoringInterval);

        // Monitorear cambios de conexión
        if (this.browserCapabilities.connection) {
            navigator.connection.addEventListener('change', () => {
                this.handleConnectionChange();
            });
        }
    }

    /**
     * 📊 Recopilar métricas en tiempo real
     */
    collectRealTimeMetrics() {
        const currentTime = performance.now();
        const uptime = currentTime - this.sessionStart;

        const realTimeData = {
            uptime: uptime,
            metrics: { ...this.metrics },
            memory: this.getMemoryUsage(),
            connection: this.getConnectionInfo(),
            timestamp: Date.now()
        };

        // Reportar al framework
        this.framework.dispatchEvent('realTimeMetrics', realTimeData);

        if (this.framework.config.debug) {
            this.log('📊 Métricas en tiempo real:', realTimeData);
        }
    }

    /**
     * 🧠 Obtener información de memoria
     */
    getMemoryUsage() {
        if (this.browserCapabilities.memoryAPI) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }

    /**
     * 🌐 Obtener información de conexión
     */
    getConnectionInfo() {
        if (this.browserCapabilities.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return null;
    }

    /**
     * ⚡ Aplicar optimizaciones críticas
     */
    async applyCriticalOptimizations() {
        this.log('Aplicando optimizaciones críticas...');

        // 1. Optimizar CSS crítico
        this.optimizeCriticalCSS();

        // 2. Optimizar fuentes
        this.optimizeFonts();

        // 3. Optimizar Service Worker
        this.optimizeServiceWorker();

        // 4. Optimizar imágenes
        this.optimizeImages();

        this.log('✅ Optimizaciones críticas aplicadas');
    }

    /**
     * 🎨 Optimizar CSS crítico
     */
    optimizeCriticalCSS() {
        // Eliminar CSS no utilizado en viewport inicial
        const criticalCSS = document.querySelector('style[data-critical]');
        if (!criticalCSS) {
            // Crear CSS crítico inline para elementos above-the-fold
            const style = document.createElement('style');
            style.setAttribute('data-critical', 'true');
            style.textContent = `
                .hero-section { display: block; }
                .navbar { position: fixed; top: 0; }
                .loading-spinner { animation: spin 1s linear infinite; }
            `;
            document.head.insertBefore(style, document.head.firstChild);
        }
    }

    /**
     * 🔤 Optimizar fuentes
     */
    optimizeFonts() {
        const fontPreloads = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        ];

        fontPreloads.forEach(font => {
            if (!document.querySelector(`link[href="${font}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = font;
                document.head.appendChild(link);
            }
        });
    }

    /**
     * 📈 Generar reporte inicial de rendimiento
     */
    generateInitialReport() {
        const report = this.generatePerformanceReport();
        this.log('📊 Reporte inicial de rendimiento:', report);

        // Notificar al framework
        this.framework.dispatchEvent('performanceReport', report);
    }

    /**
     * 📋 Generar reporte completo de rendimiento
     */
    generatePerformanceReport() {
        const currentTime = performance.now();

        return {
            version: this.version,
            timestamp: Date.now(),
            uptime: currentTime - this.sessionStart,
            metrics: { ...this.metrics },
            scores: this.calculatePerformanceScores(),
            optimizations: this.optimizationQueue.length,
            resources: {
                loaded: this.resourceOptimizer.loadedResources.size,
                critical: this.resourceOptimizer.criticalResources.size,
                deferred: this.resourceOptimizer.deferredResources.size
            },
            browser: this.browserCapabilities,
            memory: this.getMemoryUsage(),
            connection: this.getConnectionInfo()
        };
    }

    /**
     * 🏆 Calcular puntuaciones de rendimiento
     */
    calculatePerformanceScores() {
        const scores = {};

        Object.keys(this.thresholds).forEach(metric => {
            if (this.metrics[metric] !== null) {
                const value = this.metrics[metric];
                const threshold = this.thresholds[metric];

                let score = 100;
                if (value > threshold.good) {
                    score = Math.max(0, 100 - ((value - threshold.good) / (threshold.poor - threshold.good)) * 50);
                }

                scores[metric] = Math.round(score);
            }
        });

        return scores;
    }

    /**
     * 🔧 Medir Navigation Timing para TTFB
     */
    measureNavigationTiming() {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                const ttfb = perfData.responseStart - perfData.requestStart;
                this.updateMetric('ttfb', ttfb);

                // También capturar TTI estimado
                const tti = perfData.domInteractive - perfData.navigationStart;
                this.updateMetric('tti', tti);
            }
        });
    }

    /**
     * 🔄 Configurar métricas de fallback
     */
    setupFallbackMetrics() {
        this.log('⚠️ Configurando métricas de fallback');

        // Fallback simple para navegadores antiguos
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.updateMetric('fcp', navigation.domContentLoadedEventStart);
                this.updateMetric('ttfb', navigation.responseStart - navigation.requestStart);
            }
        });
    }

    /**
     * 📦 Cargar Web Vitals library
     */
    async loadWebVitalsLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/web-vitals@3.5.2/dist/web-vitals.iife.js';
            script.onload = () => {
                this.browserCapabilities.webVitals = true;
                this.log('✅ Web Vitals library cargada');
                resolve();
            };
            script.onerror = () => {
                this.log('⚠️ No se pudo cargar Web Vitals library');
                reject();
            };
            document.head.appendChild(script);
        });
    }

    /**
     * 📊 Encolar optimización automática
     */
    queueOptimization(metric, value, status) {
        this.optimizationQueue.push({
            metric,
            value,
            status,
            timestamp: performance.now()
        });

        if (!this.isOptimizing) {
            this.processOptimizationQueue();
        }
    }

    /**
     * ⚙️ Procesar cola de optimizaciones
     */
    async processOptimizationQueue() {
        if (this.isOptimizing || this.optimizationQueue.length === 0) return;

        this.isOptimizing = true;

        while (this.optimizationQueue.length > 0) {
            const optimization = this.optimizationQueue.shift();
            await this.applyOptimization(optimization);
        }

        this.isOptimizing = false;
    }

    /**
     * 🎯 Aplicar optimización específica
     */
    async applyOptimization(optimization) {
        const { metric, value, status } = optimization;

        this.log(`🔧 Aplicando optimización para ${metric}: ${value} (${status})`);

        switch (metric) {
            case 'lcp':
                await this.optimizeLCP();
                break;
            case 'fid':
                await this.optimizeFID();
                break;
            case 'cls':
                await this.optimizeCLS();
                break;
            case 'fcp':
                await this.optimizeFCP();
                break;
            case 'ttfb':
                await this.optimizeTTFB();
                break;
        }
    }

    /**
     * 🖼️ Optimizar Largest Contentful Paint
     */
    async optimizeLCP() {
        // Precargar imágenes hero
        const heroImages = document.querySelectorAll('.hero img, .banner img');
        heroImages.forEach(img => {
            if (!img.loading) img.loading = 'eager';
        });

        // Optimizar fuentes críticas
        this.optimizeFonts();
    }

    /**
     * ⚡ Optimizar First Input Delay
     */
    async optimizeFID() {
        // Diferir scripts no críticos
        const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
        scripts.forEach(script => {
            if (!this.resourceOptimizer.criticalResources.has(script.src)) {
                script.defer = true;
            }
        });
    }

    /**
     * 📐 Optimizar Cumulative Layout Shift
     */
    async optimizeCLS() {
        // Agregar dimensiones a imágenes sin ellas
        const images = document.querySelectorAll('img:not([width]):not([height])');
        images.forEach(img => {
            if (img.naturalWidth && img.naturalHeight) {
                img.width = img.naturalWidth;
                img.height = img.naturalHeight;
            }
        });
    }

    /**
     * 🎨 Optimizar First Contentful Paint
     */
    async optimizeFCP() {
        // Inline critical CSS
        this.optimizeCriticalCSS();

        // Precargar recursos críticos
        this.preloadCriticalResources();
    }

    /**
     * 🌐 Optimizar Time to First Byte
     */
    async optimizeTTFB() {
        // Activar Service Worker si no está activo
        if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                this.log('✅ Service Worker registrado para mejorar TTFB');
            } catch (error) {
                this.log('⚠️ No se pudo registrar Service Worker');
            }
        }
    }

    /**
     * 🔄 Manejar cambios de conexión
     */
    handleConnectionChange() {
        const connection = this.getConnectionInfo();
        this.log('🌐 Conexión cambiada:', connection);

        // Ajustar calidad según conexión
        if (connection && connection.saveData) {
            this.enableDataSaver();
        }
    }

    /**
     * 💾 Habilitar modo ahorro de datos
     */
    enableDataSaver() {
        this.log('💾 Modo ahorro de datos habilitado');

        // Reducir calidad de imágenes
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.dataset.lowres) {
                img.src = img.dataset.lowres;
            }
        });

        // Pausar videos
        const videos = document.querySelectorAll('video');
        videos.forEach(video => video.pause());
    }

    /**
     * 🔧 Configurar reportes automáticos
     */
    setupAutomaticReporting() {
        // Reporte cada 5 minutos
        setInterval(() => {
            const report = this.generatePerformanceReport();
            this.framework.dispatchEvent('performanceReport', report);
        }, 5 * 60 * 1000);
    }

    /**
     * 🖼️ Optimizar imágenes existentes
     */
    optimizeExistingImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Agregar loading lazy por defecto
            if (!img.loading && !img.classList.contains('hero-img')) {
                img.loading = 'lazy';
            }

            // Agregar decoding async
            if (!img.decoding) {
                img.decoding = 'async';
            }
        });
    }

    /**
     * ⚡ Optimizar Service Worker
     */
    optimizeServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Verificar si hay actualizaciones del SW
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
            });
        }
    }

    /**
     * 🔖 Obtener versión de caché
     */
    getCacheVersion() {
        return Date.now().toString(36);
    }

    /**
     * 🖼️ Optimizar imágenes con WebP
     */
    optimizeImages() {
        // Convertir JPG/PNG a WebP si el navegador lo soporta
        if (this.supportsWebP()) {
            const images = document.querySelectorAll('img[src$=".jpg"], img[src$=".png"]');
            images.forEach(img => {
                if (!img.dataset.optimized) {
                    const webpSrc = img.src.replace(/\.(jpg|png)$/, '.webp');

                    // Verificar si existe la versión WebP (simulado)
                    // En producción esto requeriría verificar que el archivo existe
                    // img.src = webpSrc;
                    img.dataset.optimized = 'true';
                }
            });
        }
    }

    /**
     * 🔍 Verificar soporte WebP
     */
    supportsWebP() {
        const elem = document.createElement('canvas');
        if (!!(elem.getContext && elem.getContext('2d'))) {
            return elem.toDataURL('image/webp').indexOf('data:image/webp') == 0;
        }
        return false;
    }
}

// Registrar módulo en el framework
if (window.BGEFramework) {
    // No necesitamos instanciar aquí, el framework lo hará
    // window.BGEPerformanceModule = BGEPerformanceModule;
}

// Exportar clase para el framework
window.BGEPerformanceModule = BGEPerformanceModule;