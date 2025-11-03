/**
 * 🚀 PERFORMANCE INTEGRATION - BGE HÉROES DE LA PATRIA
 * Integración completa de sistemas de optimización de rendimiento
 * Coordina Core Web Vitals, Performance Monitor y optimizaciones automáticas
 */

class PerformanceIntegration {
    constructor() {
        this.systems = {
            coreWebVitals: null,
            performanceMonitor: null,
            resourceOptimizer: null
        };

        this.metrics = {
            realUserMetrics: {},
            syntheticMetrics: {},
            businessMetrics: {}
        };

        this.optimizationQueue = [];
        this.isOptimizing = false;
        this.config = {
            enableRealTimeOptimization: true,
            enablePredictiveOptimization: true,
            enableAdaptiveLoading: true
        };

        console.log('🚀 Performance Integration iniciado');
        this.init();
    }

    async init() {
        try {
            // 1. Inicializar sistemas base
            await this.initializeSystems();

            // 2. Configurar Web Vitals Library
            await this.setupWebVitalsLibrary();

            // 3. Implementar optimizaciones críticas inmediatas
            await this.applyCriticalOptimizations();

            // 4. Configurar monitoreo en tiempo real
            this.setupRealTimeMonitoring();

            // 5. Implementar optimizaciones adaptativas
            this.setupAdaptiveOptimizations();

            // 6. Configurar métricas de negocio
            this.setupBusinessMetrics();

            console.log('✅ Performance Integration completamente inicializado');

        } catch (error) {
            console.error('❌ Error inicializando Performance Integration:', error);
        }
    }

    async initializeSystems() {
        // Verificar y conectar con sistemas existentes
        if (window.coreWebVitalsOptimizer) {
            this.systems.coreWebVitals = window.coreWebVitalsOptimizer;
            console.log('🔗 Core Web Vitals Optimizer conectado');
        }

        if (window.performanceMonitor) {
            this.systems.performanceMonitor = window.performanceMonitor;
            console.log('🔗 Performance Monitor conectado');
        }

        if (window.resourceOptimizer) {
            this.systems.resourceOptimizer = window.resourceOptimizer;
            console.log('🔗 Resource Optimizer conectado');
        }
    }

    async setupWebVitalsLibrary() {
        // Cargar Web Vitals library si no está disponible
        if (typeof webVitals === 'undefined') {
            try {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js';
                script.onload = () => {
                    this.initWebVitalsTracking();
                };
                document.head.appendChild(script);
            } catch (error) {
                console.warn('⚠️ No se pudo cargar Web Vitals library, usando fallback');
                this.initFallbackMetrics();
            }
        } else {
            this.initWebVitalsTracking();
        }
    }

    initWebVitalsTracking() {
        // Configurar tracking de Web Vitals con reportes automáticos
        webVitals.getCLS(this.handleCLS.bind(this));
        webVitals.getFID(this.handleFID.bind(this));
        webVitals.getFCP(this.handleFCP.bind(this));
        webVitals.getLCP(this.handleLCP.bind(this));
        webVitals.getTTFB(this.handleTTFB.bind(this));

        // INP si está disponible (nueva métrica)
        if (webVitals.getINP) {
            webVitals.getINP(this.handleINP.bind(this));
        }

        console.log('📊 Web Vitals tracking activado');
    }

    initFallbackMetrics() {
        // Implementación fallback usando Performance Observer
        if ('PerformanceObserver' in window) {
            // LCP fallback
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.handleLCP({ value: lastEntry.startTime });
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // FID fallback
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.handleFID({ value: entry.processingStart - entry.startTime });
                });
            }).observe({ entryTypes: ['first-input'] });

            console.log('📊 Fallback metrics activadas');
        }
    }

    async applyCriticalOptimizations() {
        const optimizations = [
            this.optimizeCriticalResourceLoading(),
            this.implementPreloadStrategy(),
            this.optimizeRenderBlocking(),
            this.setupIntersectionObserver(),
            this.optimizeImageLoading(),
            this.implementServiceWorkerOptimizations()
        ];

        await Promise.allSettled(optimizations);
        console.log('🔧 Optimizaciones críticas aplicadas');
    }

    async optimizeCriticalResourceLoading() {
        // Identificar y optimizar recursos críticos
        const criticalResources = [
            'css/style.css',
            'js/main.js',
            'images/hero/fachada1.jpg'
        ];

        criticalResources.forEach(resource => {
            if (!document.querySelector(`link[href*="${resource}"], script[src*="${resource}"]`)) {
                this.preloadResource(resource);
            }
        });

        // Optimizar fuentes críticas
        this.optimizeCriticalFonts();
    }

    optimizeCriticalFonts() {
        const criticalFonts = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        ];

        criticalFonts.forEach(fontUrl => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = fontUrl;
            link.onload = function() { this.rel = 'stylesheet'; };
            document.head.appendChild(link);
        });
    }

    async implementPreloadStrategy() {
        // Estrategia inteligente de preload basada en patrones de usuario
        const userBehaviorData = this.analyzeUserBehavior();

        if (userBehaviorData.likelyNextPage) {
            this.preloadPage(userBehaviorData.likelyNextPage);
        }

        // Preload de recursos críticos above-the-fold
        this.preloadAboveFoldResources();
    }

    async optimizeRenderBlocking() {
        // Eliminar CSS y JS que bloquea el render
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');

        stylesheets.forEach((link, index) => {
            if (index > 0) { // Mantener solo el CSS crítico como bloqueante
                link.rel = 'preload';
                link.as = 'style';
                link.onload = function() { this.rel = 'stylesheet'; };
            }
        });

        // Defer scripts no críticos
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            if (!script.hasAttribute('data-critical')) {
                script.defer = true;
            }
        });
    }

    setupIntersectionObserver() {
        // Observer optimizado para lazy loading
        if ('IntersectionObserver' in window) {
            const observerOptions = {
                rootMargin: '50px 0px',
                threshold: 0.01
            };

            this.lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyContent(entry.target);
                        this.lazyObserver.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            // Observar elementos lazy
            document.querySelectorAll('[data-lazy], img[loading="lazy"]').forEach(el => {
                this.lazyObserver.observe(el);
            });
        }
    }

    async optimizeImageLoading() {
        const images = document.querySelectorAll('img');

        images.forEach((img, index) => {
            // Primera imagen: máxima prioridad
            if (index === 0) {
                img.loading = 'eager';
                img.fetchPriority = 'high';
                this.preloadResource(img.src);
            }
            // Imágenes above-the-fold: alta prioridad
            else if (this.isAboveFold(img)) {
                img.loading = 'eager';
                img.fetchPriority = 'high';
            }
            // Resto: lazy loading
            else {
                img.loading = 'lazy';
                img.fetchPriority = 'low';
            }

            // Añadir dimensiones si no las tiene (prevenir CLS)
            if (!img.width && !img.height && img.naturalWidth) {
                img.width = img.naturalWidth;
                img.height = img.naturalHeight;
            }
        });
    }

    async implementServiceWorkerOptimizations() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');

                // Configurar estrategias de cache optimizadas
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'CONFIGURE_CACHE_STRATEGY',
                        config: {
                            enablePredictivePrefetch: true,
                            enableIntelligentCache: true,
                            cacheStrategy: 'networkFirst'
                        }
                    });
                }

                console.log('📦 Service Worker optimizado configurado');
            } catch (error) {
                console.warn('⚠️ Service Worker no disponible');
            }
        }
    }

    setupRealTimeMonitoring() {
        // Monitoreo continuo de métricas en tiempo real
        this.metricsInterval = setInterval(() => {
            this.collectRealTimeMetrics();
            this.analyzePerformanceTrends();
            this.applyAdaptiveOptimizations();
        }, 5000);

        // Monitoreo de eventos de usuario
        this.setupUserInteractionTracking();
    }

    setupUserInteractionTracking() {
        const interactionEvents = ['click', 'scroll', 'touch', 'keydown'];

        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.trackUserInteraction(eventType, event);
            }, { passive: true });
        });
    }

    setupAdaptiveOptimizations() {
        // Optimizaciones que se adaptan en tiempo real
        this.adaptiveOptimizationInterval = setInterval(() => {
            if (this.config.enableAdaptiveLoading) {
                this.adaptToNetworkConditions();
                this.adaptToDeviceCapabilities();
                this.adaptToUserBehavior();
            }
        }, 10000);
    }

    setupBusinessMetrics() {
        // Métricas de negocio relacionadas con performance
        this.businessMetrics = {
            pageLoadTime: null,
            timeToInteractive: null,
            userEngagementScore: 0,
            conversionFunnelPerformance: {}
        };

        this.trackBusinessMetrics();
    }

    // Handlers para Web Vitals
    handleCLS(metric) {
        this.metrics.realUserMetrics.cls = metric.value;
        this.logMetric('CLS', metric.value, metric.value <= 0.1 ? 'good' : metric.value <= 0.25 ? 'needs-improvement' : 'poor');

        if (metric.value > 0.1) {
            this.queueOptimization('cls', () => this.optimizeCLS());
        }
    }

    handleFID(metric) {
        this.metrics.realUserMetrics.fid = metric.value;
        this.logMetric('FID', metric.value, metric.value <= 100 ? 'good' : metric.value <= 300 ? 'needs-improvement' : 'poor');

        if (metric.value > 100) {
            this.queueOptimization('fid', () => this.optimizeFID());
        }
    }

    handleFCP(metric) {
        this.metrics.realUserMetrics.fcp = metric.value;
        this.logMetric('FCP', metric.value, metric.value <= 1800 ? 'good' : metric.value <= 3000 ? 'needs-improvement' : 'poor');
    }

    handleLCP(metric) {
        this.metrics.realUserMetrics.lcp = metric.value;
        this.logMetric('LCP', metric.value, metric.value <= 2500 ? 'good' : metric.value <= 4000 ? 'needs-improvement' : 'poor');

        if (metric.value > 2500) {
            this.queueOptimization('lcp', () => this.optimizeLCP());
        }
    }

    handleTTFB(metric) {
        this.metrics.realUserMetrics.ttfb = metric.value;
        this.logMetric('TTFB', metric.value, metric.value <= 800 ? 'good' : metric.value <= 1800 ? 'needs-improvement' : 'poor');
    }

    handleINP(metric) {
        this.metrics.realUserMetrics.inp = metric.value;
        this.logMetric('INP', metric.value, metric.value <= 200 ? 'good' : metric.value <= 500 ? 'needs-improvement' : 'poor');
    }

    // Optimizaciones específicas
    queueOptimization(type, optimizationFn) {
        this.optimizationQueue.push({ type, fn: optimizationFn, timestamp: Date.now() });

        if (!this.isOptimizing) {
            this.processOptimizationQueue();
        }
    }

    async processOptimizationQueue() {
        if (this.optimizationQueue.length === 0) return;

        this.isOptimizing = true;

        while (this.optimizationQueue.length > 0) {
            const optimization = this.optimizationQueue.shift();

            try {
                await optimization.fn();
                console.log(`✅ Optimización ${optimization.type} aplicada`);
            } catch (error) {
                console.error(`❌ Error en optimización ${optimization.type}:`, error);
            }

            // Pausa entre optimizaciones para no bloquear el main thread
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.isOptimizing = false;
    }

    async optimizeCLS() {
        // Optimizaciones específicas para CLS
        document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
            if (img.naturalWidth && img.naturalHeight) {
                img.width = img.naturalWidth;
                img.height = img.naturalHeight;
            }
        });

        // Reservar espacio para contenido dinámico
        this.reserveSpaceForDynamicContent();
    }

    async optimizeFID() {
        // Diferir scripts no críticos
        this.deferNonCriticalScripts();

        // Dividir tareas largas
        this.breakUpLongTasks();
    }

    async optimizeLCP() {
        // Optimizar imagen LCP
        const lcpElement = this.findLCPCandidate();
        if (lcpElement && lcpElement.tagName === 'IMG') {
            lcpElement.fetchPriority = 'high';
            lcpElement.loading = 'eager';
            this.preloadResource(lcpElement.src);
        }
    }

    // Métodos de utilidad
    preloadResource(href, as = 'image') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = as;
        link.href = href;
        document.head.appendChild(link);
    }

    isAboveFold(element) {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom >= 0;
    }

    findLCPCandidate() {
        const candidates = [
            ...document.querySelectorAll('img'),
            ...document.querySelectorAll('[style*="background-image"]'),
            ...document.querySelectorAll('h1, .hero-title')
        ];

        return candidates.find(el => this.isAboveFold(el));
    }

    logMetric(name, value, status) {
        const colors = {
            good: '#00C851',
            'needs-improvement': '#ffbb33',
            poor: '#ff4444'
        };

        console.log(
            `%c📊 ${name}: ${typeof value === 'number' ? value.toFixed(2) : value}${typeof value === 'number' ? 'ms' : ''} (${status})`,
            `color: ${colors[status]}; font-weight: bold;`
        );
    }

    // Métodos stub para implementaciones futuras
    analyzeUserBehavior() { return { likelyNextPage: null }; }
    preloadPage(page) { console.log(`🔮 Preloading ${page}`); }
    preloadAboveFoldResources() {}
    loadLazyContent(element) {
        if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
        }
    }
    collectRealTimeMetrics() {}
    analyzePerformanceTrends() {}
    applyAdaptiveOptimizations() {}
    trackUserInteraction(type, event) {}
    adaptToNetworkConditions() {}
    adaptToDeviceCapabilities() {}
    adaptToUserBehavior() {}
    trackBusinessMetrics() {}
    reserveSpaceForDynamicContent() {}
    deferNonCriticalScripts() {}
    breakUpLongTasks() {}

    // API pública
    getPerformanceReport() {
        return {
            metrics: this.metrics,
            optimizationsApplied: this.optimizationQueue.length,
            systemsConnected: Object.values(this.systems).filter(Boolean).length,
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        const { realUserMetrics } = this.metrics;

        if (realUserMetrics.lcp > 2500) {
            recommendations.push('Optimizar Largest Contentful Paint');
        }
        if (realUserMetrics.fid > 100) {
            recommendations.push('Reducir First Input Delay');
        }
        if (realUserMetrics.cls > 0.1) {
            recommendations.push('Minimizar Cumulative Layout Shift');
        }

        return recommendations;
    }
}

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.performanceIntegration = new PerformanceIntegration();
});

// Exponer globalmente
window.PerformanceIntegration = PerformanceIntegration;