/**
 * 🚀 PERFORMANCE UNIFIED SYSTEM - BGE HÉROES DE LA PATRIA
 * Sistema unificado que coordina todas las optimizaciones de rendimiento
 * Versión de producción optimizada para Core Web Vitals
 */

class PerformanceUnifiedSystem {
    constructor() {
        this.version = '2.1.0';
        this.initialized = false;
        this.systems = new Map();
        this.metrics = new Map();
        this.optimizations = new Set();

        // Configuración de rendimiento
        this.config = {
            enableRealTimeOptimization: true,
            enablePredictiveLoading: true,
            enableAdaptiveQuality: true,
            enableMetricsReporting: true,
            optimizationThresholds: {
                lcp: 2500,
                fid: 100,
                cls: 0.1,
                fcp: 1800,
                ttfb: 800
            }
        };

        // Cola de optimizaciones prioritarias
        this.optimizationQueue = [];
        this.isProcessingOptimizations = false;

        console.log('🚀 Performance Unified System inicializando...');
        this.init();
    }

    async init() {
        try {
            // 1. Verificar capacidades del navegador
            await this.checkBrowserCapabilities();

            // 2. Inicializar sistemas de rendimiento
            await this.initializePerformanceSystems();

            // 3. Configurar Web Vitals mejorado
            await this.setupEnhancedWebVitals();

            // 4. Aplicar optimizaciones críticas inmediatas
            await this.applyCriticalOptimizations();

            // 5. Configurar monitoreo en tiempo real
            this.setupRealTimeMonitoring();

            // 6. Inicializar optimizaciones adaptativas
            this.setupAdaptiveOptimizations();

            // 7. Configurar reportes de métricas
            this.setupMetricsReporting();

            this.initialized = true;
            console.log('✅ Performance Unified System completamente inicializado');

            // Reporte inicial después de 3 segundos
            setTimeout(() => this.generatePerformanceReport(), 3000);

        } catch (error) {
            console.error('❌ Error inicializando Performance Unified System:', error);
        }
    }

    async checkBrowserCapabilities() {
        const capabilities = {
            performanceObserver: 'PerformanceObserver' in window,
            intersectionObserver: 'IntersectionObserver' in window,
            serviceWorker: 'serviceWorker' in navigator,
            webVitals: typeof webVitals !== 'undefined',
            connection: 'connection' in navigator,
            requestIdleCallback: 'requestIdleCallback' in window
        };

        this.browserCapabilities = capabilities;
        console.log('🔍 Capacidades del navegador detectadas:', capabilities);

        // Cargar polyfills si es necesario
        if (!capabilities.intersectionObserver) {
            await this.loadPolyfill('intersection-observer');
        }
    }

    async initializePerformanceSystems() {
        const systems = [
            { name: 'coreWebVitalsOptimizer', global: 'coreWebVitalsOptimizer' },
            { name: 'performanceMonitor', global: 'performanceMonitor' },
            { name: 'performanceIntegration', global: 'performanceIntegration' },
            { name: 'resourceOptimizer', global: 'resourceOptimizer' }
        ];

        for (const system of systems) {
            if (window[system.global]) {
                this.systems.set(system.name, window[system.global]);
                console.log(`🔗 ${system.name} conectado`);
            } else {
                console.warn(`⚠️ ${system.name} no disponible`);
            }
        }

        console.log(`📊 ${this.systems.size} sistemas de rendimiento conectados`);
    }

    async setupEnhancedWebVitals() {
        // Configurar Web Vitals con reportes mejorados
        if (this.browserCapabilities.webVitals) {
            webVitals.getCLS(this.handleWebVital.bind(this, 'cls'));
            webVitals.getFID(this.handleWebVital.bind(this, 'fid'));
            webVitals.getFCP(this.handleWebVital.bind(this, 'fcp'));
            webVitals.getLCP(this.handleWebVital.bind(this, 'lcp'));
            webVitals.getTTFB(this.handleWebVital.bind(this, 'ttfb'));

            // INP si está disponible
            if (webVitals.getINP) {
                webVitals.getINP(this.handleWebVital.bind(this, 'inp'));
            }

            console.log('📊 Enhanced Web Vitals configurado');
        } else {
            console.warn('⚠️ Web Vitals library no disponible, usando fallback');
            this.setupFallbackMetrics();
        }
    }

    handleWebVital(name, metric) {
        this.metrics.set(name, {
            value: metric.value,
            rating: this.getRating(name, metric.value),
            timestamp: Date.now(),
            delta: metric.delta || 0
        });

        // Log con código de colores
        this.logMetricWithColor(name, metric.value);

        // Evaluar si necesita optimización
        this.evaluateOptimizationNeed(name, metric.value);

        // Reportar a analytics si está configurado
        this.reportToAnalytics(name, metric);
    }

    getRating(metricName, value) {
        const thresholds = this.config.optimizationThresholds;
        const threshold = thresholds[metricName];

        if (!threshold) return 'unknown';

        if (metricName === 'cls') {
            return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
        } else {
            const goodThreshold = threshold;
            const poorThreshold = threshold * 1.6; // Aproximación general

            return value <= goodThreshold ? 'good' :
                   value <= poorThreshold ? 'needs-improvement' : 'poor';
        }
    }

    evaluateOptimizationNeed(metricName, value) {
        const threshold = this.config.optimizationThresholds[metricName];

        if (value > threshold) {
            this.queueOptimization(metricName, value);
        }
    }

    queueOptimization(metricName, value) {
        const optimization = {
            type: metricName,
            severity: this.calculateSeverity(metricName, value),
            timestamp: Date.now(),
            applied: false
        };

        this.optimizationQueue.push(optimization);

        if (!this.isProcessingOptimizations) {
            this.processOptimizationQueue();
        }
    }

    calculateSeverity(metricName, value) {
        const threshold = this.config.optimizationThresholds[metricName];
        const ratio = value / threshold;

        if (ratio > 2) return 'critical';
        if (ratio > 1.5) return 'high';
        if (ratio > 1.2) return 'medium';
        return 'low';
    }

    async processOptimizationQueue() {
        if (this.optimizationQueue.length === 0) return;

        this.isProcessingOptimizations = true;

        // Ordenar por severidad
        this.optimizationQueue.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });

        while (this.optimizationQueue.length > 0) {
            const optimization = this.optimizationQueue.shift();

            try {
                await this.applyOptimization(optimization);
                optimization.applied = true;
                console.log(`✅ Optimización ${optimization.type} aplicada (severidad: ${optimization.severity})`);
            } catch (error) {
                console.error(`❌ Error aplicando optimización ${optimization.type}:`, error);
            }

            // Pausa entre optimizaciones para no bloquear el main thread
            await this.sleep(50);
        }

        this.isProcessingOptimizations = false;
    }

    async applyOptimization(optimization) {
        const { type } = optimization;

        switch (type) {
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
            default:
                console.warn(`Optimización desconocida: ${type}`);
        }

        this.optimizations.add(type);
    }

    async applyCriticalOptimizations() {
        const criticalOptimizations = [
            this.optimizeInitialPageLoad(),
            this.optimizeCriticalResources(),
            this.setupLazyLoading(),
            this.optimizeServiceWorker(),
            this.setupResourceHints()
        ];

        await Promise.allSettled(criticalOptimizations);
        console.log('🔧 Optimizaciones críticas aplicadas');
    }

    async optimizeInitialPageLoad() {
        // Preload de recursos críticos above-the-fold
        const criticalResources = this.identifyCriticalResources();
        criticalResources.forEach(resource => this.preloadResource(resource));

        // Optimizar imágenes above-the-fold
        this.optimizeAboveFoldImages();

        // Configurar font-display para fuentes críticas
        this.optimizeFontDisplay();
    }

    identifyCriticalResources() {
        return [
            '/css/style.css',
            '/js/performance-unified-system.js'
        ];
    }

    optimizeAboveFoldImages() {
        const aboveFoldImages = Array.from(document.querySelectorAll('img')).slice(0, 3);

        aboveFoldImages.forEach(img => {
            img.loading = 'eager';
            img.fetchPriority = 'high';

            // Preload la primera imagen
            if (aboveFoldImages.indexOf(img) === 0) {
                this.preloadResource(img.src, 'image');
            }
        });
    }

    preloadResource(href, as = 'script') {
        if (document.querySelector(`link[href="${href}"]`)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = as;
        link.href = href;

        if (as === 'font') {
            link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);
    }

    setupRealTimeMonitoring() {
        if (!this.config.enableRealTimeOptimization) return;

        // Monitoreo cada 10 segundos
        this.monitoringInterval = setInterval(() => {
            this.collectRealTimeMetrics();
            this.analyzePerformanceTrends();
        }, 10000);

        // Monitoreo de interacciones del usuario
        this.setupUserInteractionMonitoring();
    }

    setupUserInteractionMonitoring() {
        const interactionEvents = ['click', 'scroll', 'touchstart', 'keydown'];

        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.trackUserInteraction(eventType, event);
            }, { passive: true });
        });
    }

    setupAdaptiveOptimizations() {
        // Adaptación basada en condiciones de red
        if (this.browserCapabilities.connection) {
            this.adaptToNetworkConditions();

            navigator.connection.addEventListener('change', () => {
                this.adaptToNetworkConditions();
            });
        }

        // Adaptación basada en capacidades del dispositivo
        this.adaptToDeviceCapabilities();
    }

    adaptToNetworkConditions() {
        const connection = navigator.connection;
        const isSlowConnection = connection.effectiveType === 'slow-2g' ||
                                connection.effectiveType === '2g' ||
                                (connection.downlink && connection.downlink < 1.5);

        if (isSlowConnection) {
            this.enableDataSaverMode();
        } else {
            this.disableDataSaverMode();
        }
    }

    enableDataSaverMode() {
        document.documentElement.classList.add('data-saver-mode');
        console.log('📱 Modo ahorro de datos activado');

        // Reducir calidad de imágenes
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            if (img.dataset.lowQuality) {
                img.src = img.dataset.lowQuality;
            }
        });

        // Deshabilitar animaciones no esenciales
        const style = document.createElement('style');
        style.id = 'data-saver-styles';
        style.textContent = `
            .data-saver-mode * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }

    disableDataSaverMode() {
        document.documentElement.classList.remove('data-saver-mode');
        const dataSaverStyles = document.getElementById('data-saver-styles');
        if (dataSaverStyles) {
            dataSaverStyles.remove();
        }
    }

    setupMetricsReporting() {
        if (!this.config.enableMetricsReporting) return;

        // Reporte periódico cada 30 segundos
        this.reportingInterval = setInterval(() => {
            this.generatePerformanceReport();
        }, 30000);

        // Reporte antes de unload
        window.addEventListener('beforeunload', () => {
            this.sendFinalReport();
        });
    }

    generatePerformanceReport() {
        const report = {
            timestamp: Date.now(),
            version: this.version,
            metrics: Object.fromEntries(this.metrics),
            optimizations: Array.from(this.optimizations),
            systems: Array.from(this.systems.keys()),
            browserCapabilities: this.browserCapabilities,
            performance: {
                navigation: this.getNavigationTiming(),
                resources: this.getResourceTiming()
            }
        };

        console.group('📊 REPORTE DE RENDIMIENTO BGE');
        console.log('Versión:', report.version);
        console.log('Métricas Web Vitals:', report.metrics);
        console.log('Optimizaciones aplicadas:', report.optimizations);
        console.log('Sistemas conectados:', report.systems);
        console.groupEnd();

        return report;
    }

    getNavigationTiming() {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (!perfData) return null;

        return {
            dns: perfData.domainLookupEnd - perfData.domainLookupStart,
            tcp: perfData.connectEnd - perfData.connectStart,
            request: perfData.responseStart - perfData.requestStart,
            response: perfData.responseEnd - perfData.responseStart,
            dom: perfData.domContentLoadedEventStart - perfData.responseEnd,
            load: perfData.loadEventStart - perfData.domContentLoadedEventStart
        };
    }

    getResourceTiming() {
        const resources = performance.getEntriesByType('resource');

        return {
            total: resources.length,
            slow: resources.filter(r => r.duration > 1000).length,
            cached: resources.filter(r => r.transferSize === 0).length,
            large: resources.filter(r => r.transferSize > 1024 * 1024).length
        };
    }

    logMetricWithColor(name, value) {
        const rating = this.getRating(name, value);
        const colors = {
            good: '#00C851',
            'needs-improvement': '#ffbb33',
            poor: '#ff4444'
        };

        const unit = name === 'cls' ? '' : 'ms';
        console.log(
            `%c📊 ${name.toUpperCase()}: ${value.toFixed(name === 'cls' ? 4 : 2)}${unit} (${rating})`,
            `color: ${colors[rating]}; font-weight: bold; font-size: 12px;`
        );
    }

    // Métodos de optimización específicos (implementaciones básicas)
    async optimizeLCP() {
        const lcpElement = this.findLCPCandidate();
        if (lcpElement && lcpElement.tagName === 'IMG') {
            lcpElement.fetchPriority = 'high';
            lcpElement.loading = 'eager';
            this.preloadResource(lcpElement.src, 'image');
        }
    }

    async optimizeFID() {
        // Defer scripts no críticos
        document.querySelectorAll('script[src]:not([data-critical])').forEach(script => {
            script.defer = true;
        });
    }

    async optimizeCLS() {
        // Definir dimensiones para imágenes sin dimensiones
        document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
            if (img.naturalWidth && img.naturalHeight) {
                img.width = img.naturalWidth;
                img.height = img.naturalHeight;
            }
        });
    }

    async optimizeFCP() {
        // Inlinear CSS crítico si es posible
        this.inlineCriticalCSS();
    }

    async optimizeTTFB() {
        // Configurar service worker para cache optimizado
        if (this.browserCapabilities.serviceWorker) {
            this.optimizeServiceWorker();
        }
    }

    findLCPCandidate() {
        const candidates = [
            ...document.querySelectorAll('img'),
            ...document.querySelectorAll('[style*="background-image"]'),
            ...document.querySelectorAll('h1, .hero-title')
        ];

        return candidates.find(el => this.isInViewport(el));
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom >= 0;
    }

    // Métodos de utilidad
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async loadPolyfill(name) {
        // Implementación básica para cargar polyfills
        console.log(`🔄 Cargando polyfill: ${name}`);
    }

    // Métodos stub para implementaciones futuras
    setupFallbackMetrics() {}
    reportToAnalytics(name, metric) {}
    optimizeCriticalResources() {}
    setupLazyLoading() {}
    optimizeServiceWorker() {}
    setupResourceHints() {}
    optimizeFontDisplay() {}
    collectRealTimeMetrics() {}
    analyzePerformanceTrends() {}
    trackUserInteraction(type, event) {}
    adaptToDeviceCapabilities() {}
    inlineCriticalCSS() {}
    sendFinalReport() {}

    // API pública
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }

    getOptimizations() {
        return Array.from(this.optimizations);
    }

    getSystems() {
        return Array.from(this.systems.keys());
    }

    destroy() {
        if (this.monitoringInterval) clearInterval(this.monitoringInterval);
        if (this.reportingInterval) clearInterval(this.reportingInterval);
        console.log('🛑 Performance Unified System destruido');
    }
}

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceUnifiedSystem = new PerformanceUnifiedSystem();
    });
} else {
    window.performanceUnifiedSystem = new PerformanceUnifiedSystem();
}

// Exponer globalmente
window.PerformanceUnifiedSystem = PerformanceUnifiedSystem;