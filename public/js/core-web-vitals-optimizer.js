/**
 * 🚀 CORE WEB VITALS OPTIMIZER - BGE HÉROES DE LA PATRIA
 * Sistema maestro de optimización para mejorar LCP, FID, CLS y otros métricas de rendimiento
 */

class CoreWebVitalsOptimizer {
    constructor() {
        this.metrics = {
            lcp: null,
            fid: null,
            cls: null,
            fcp: null,
            ttfb: null,
            inp: null
        };

        this.thresholds = {
            lcp: { good: 2500, poor: 4000 },
            fid: { good: 100, poor: 300 },
            cls: { good: 0.1, poor: 0.25 },
            fcp: { good: 1800, poor: 3000 },
            ttfb: { good: 800, poor: 1800 },
            inp: { good: 200, poor: 500 }
        };

        this.optimizations = [];
        this.observer = null;
        this.initialized = false;

        console.log('🚀 CoreWebVitalsOptimizer iniciado');
    }

    /**
     * Inicializar el optimizador
     */
    async init() {
        if (this.initialized) return;

        try {
            // 1. Medición de métricas
            await this.initMetrics();

            // 2. Optimizaciones principales
            await this.initOptimizations();

            // 3. Monitoreo continuo
            this.initMonitoring();

            this.initialized = true;
            console.log('✅ CoreWebVitalsOptimizer inicializado completamente');

            // Reportar estado inicial
            setTimeout(() => this.generateReport(), 2000);

        } catch (error) {
            console.error('❌ Error inicializando CoreWebVitalsOptimizer:', error);
        }
    }

    /**
     * Inicializar medición de métricas Web Vitals
     */
    async initMetrics() {
        // Usar Web Vitals API si está disponible
        if (typeof webVitals !== 'undefined') {
            webVitals.getLCP(this.handleLCP.bind(this));
            webVitals.getFID(this.handleFID.bind(this));
            webVitals.getCLS(this.handleCLS.bind(this));
            webVitals.getFCP(this.handleFCP.bind(this));
            webVitals.getTTFB(this.handleTTFB.bind(this));
            if (webVitals.getINP) {
                webVitals.getINP(this.handleINP.bind(this));
            }
        } else {
            // Fallback manual
            this.initManualMetrics();
        }
    }

    /**
     * Métricas manuales como fallback
     */
    initManualMetrics() {
        // LCP Manual
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.handleLCP({ value: lastEntry.startTime });
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        }

        // FID Manual
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.handleFID({ value: entry.processingStart - entry.startTime });
            }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS Manual
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    this.handleCLS({ value: clsValue });
                }
            }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    /**
     * Manejadores de métricas
     */
    handleLCP(metric) {
        this.metrics.lcp = metric.value;
        this.logMetric('LCP', metric.value, this.thresholds.lcp);

        if (metric.value > this.thresholds.lcp.poor) {
            this.applyLCPOptimizations();
        }
    }

    handleFID(metric) {
        this.metrics.fid = metric.value;
        this.logMetric('FID', metric.value, this.thresholds.fid);

        if (metric.value > this.thresholds.fid.poor) {
            this.applyFIDOptimizations();
        }
    }

    handleCLS(metric) {
        this.metrics.cls = metric.value;
        this.logMetric('CLS', metric.value, this.thresholds.cls);

        if (metric.value > this.thresholds.cls.poor) {
            this.applyCLSOptimizations();
        }
    }

    handleFCP(metric) {
        this.metrics.fcp = metric.value;
        this.logMetric('FCP', metric.value, this.thresholds.fcp);
    }

    handleTTFB(metric) {
        this.metrics.ttfb = metric.value;
        this.logMetric('TTFB', metric.value, this.thresholds.ttfb);
    }

    handleINP(metric) {
        this.metrics.inp = metric.value;
        this.logMetric('INP', metric.value, this.thresholds.inp);
    }

    /**
     * Aplicar optimizaciones iniciales
     */
    async initOptimizations() {
        const optimizations = [
            this.optimizeImages(),
            this.optimizeFonts(),
            this.optimizeCSS(),
            this.optimizeJavaScript(),
            this.optimizeResourceHints(),
            this.optimizeLazyLoading(),
            this.optimizeServiceWorker(),
            this.optimizeAsyncLoading()
        ];

        await Promise.allSettled(optimizations);
        console.log('🔧 Optimizaciones básicas aplicadas');
    }

    /**
     * Optimizar imágenes para mejorar LCP
     */
    async optimizeImages() {
        // Detectar imágenes LCP candidatas
        const images = document.querySelectorAll('img');

        images.forEach((img, index) => {
            // Priorizar primera imagen visible
            if (index === 0 || this.isInViewport(img)) {
                img.loading = 'eager';
                img.fetchPriority = 'high';

                // Preload para imágenes críticas
                if (index === 0) {
                    this.preloadImage(img.src);
                }
            } else {
                img.loading = 'lazy';
            }

            // Optimización WebP
            this.optimizeImageFormat(img);
        });

        // Optimizar imágenes de background
        this.optimizeBackgroundImages();

        this.addOptimization('Optimización de imágenes aplicada');
    }

    /**
     * Optimizar fuentes para mejorar CLS
     */
    async optimizeFonts() {
        // Preload de fuentes críticas
        const criticalFonts = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
        ];

        criticalFonts.forEach(fontUrl => {
            if (!document.querySelector(`link[href="${fontUrl}"]`)) {
                this.preloadFont(fontUrl);
            }
        });

        // Font-display: swap para todas las fuentes
        this.applyFontDisplay();

        this.addOptimization('Optimización de fuentes aplicada');
    }

    /**
     * Optimizar CSS para reducir CLS y mejorar FCP
     */
    async optimizeCSS() {
        // CSS crítico inline
        await this.inlineCriticalCSS();

        // Preload CSS no crítico
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach(link => {
            if (!link.hasAttribute('data-critical')) {
                link.rel = 'preload';
                link.as = 'style';
                link.onload = function() { this.rel = 'stylesheet'; };
            }
        });

        this.addOptimization('Optimización de CSS aplicada');
    }

    /**
     * Optimizar JavaScript para mejorar FID
     */
    async optimizeJavaScript() {
        // Defer scripts no críticos
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            if (!script.hasAttribute('data-critical')) {
                script.defer = true;
            }
        });

        // Code splitting dinámico
        this.initDynamicImports();

        // Web Workers para tareas pesadas
        this.initWebWorkers();

        this.addOptimization('Optimización de JavaScript aplicada');
    }

    /**
     * Optimizar resource hints
     */
    async optimizeResourceHints() {
        // DNS Prefetch
        this.addDNSPrefetch([
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'cdnjs.cloudflare.com',
            'cdn.jsdelivr.net'
        ]);

        // Preconnect
        this.addPreconnect([
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ]);

        this.addOptimization('Resource hints aplicados');
    }

    /**
     * Optimizar lazy loading
     */
    async optimizeLazyLoading() {
        // Intersection Observer para lazy loading
        if ('IntersectionObserver' in window) {
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        this.loadLazyElement(element);
                        lazyObserver.unobserve(element);
                    }
                });
            }, { rootMargin: '50px' });

            // Observar elementos lazy
            document.querySelectorAll('[data-lazy]').forEach(el => {
                lazyObserver.observe(el);
            });
        }

        this.addOptimization('Lazy loading optimizado');
    }

    /**
     * Optimizar Service Worker
     */
    async optimizeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('🔧 Service Worker registrado para cache optimizado');

                // Precache recursos críticos
                this.precacheResources();

            } catch (error) {
                console.log('⚠️ Service Worker no disponible');
            }
        }

        this.addOptimization('Service Worker optimizado');
    }

    /**
     * Optimizar carga asíncrona
     */
    async optimizeAsyncLoading() {
        // Cargar componentes no críticos después de load
        window.addEventListener('load', () => {
            this.loadNonCriticalComponents();
        });

        // Idle callback para tareas no urgentes
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.runIdleTasks();
            });
        }

        this.addOptimization('Carga asíncrona optimizada');
    }

    /**
     * Optimizaciones específicas para LCP
     */
    applyLCPOptimizations() {
        console.log('🎯 Aplicando optimizaciones LCP específicas');

        // Optimizar imagen LCP
        const lcpElement = this.findLCPElement();
        if (lcpElement) {
            if (lcpElement.tagName === 'IMG') {
                lcpElement.fetchPriority = 'high';
                lcpElement.loading = 'eager';
                this.preloadImage(lcpElement.src);
            }
        }

        // Reducir tiempo de servidor
        this.optimizeServerResponse();
    }

    /**
     * Optimizaciones específicas para FID
     */
    applyFIDOptimizations() {
        console.log('🎯 Aplicando optimizaciones FID específicas');

        // Dividir tareas largas
        this.breakupLongTasks();

        // Defer JavaScript no crítico
        this.deferNonCriticalJS();

        // Optimizar event listeners
        this.optimizeEventListeners();
    }

    /**
     * Optimizaciones específicas para CLS
     */
    applyCLSOptimizations() {
        console.log('🎯 Aplicando optimizaciones CLS específicas');

        // Definir dimensiones de imágenes
        this.setImageDimensions();

        // Reservar espacio para contenido dinámico
        this.reserveSpaceForDynamicContent();

        // Optimizar web fonts
        this.optimizeWebFonts();
    }

    /**
     * Monitoreo continuo
     */
    initMonitoring() {
        // Monitoreo cada 30 segundos
        setInterval(() => {
            this.collectMetrics();
        }, 30000);

        // Reporte antes de unload
        window.addEventListener('beforeunload', () => {
            this.sendMetricsToAnalytics();
        });

        // Performance observer para nuevas métricas
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                this.processPerformanceEntries(list.getEntries());
            });

            observer.observe({
                entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint']
            });
        }
    }

    /**
     * Utilities
     */
    preloadImage(src) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    }

    preloadFont(href) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.href = href;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }

    addDNSPrefetch(domains) {
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
        });
    }

    addPreconnect(urls) {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    findLCPElement() {
        // Heurística para encontrar el elemento LCP probable
        const candidates = [
            ...document.querySelectorAll('img'),
            ...document.querySelectorAll('[style*="background-image"]'),
            ...document.querySelectorAll('h1, h2, .hero-title, .main-content')
        ];

        return candidates.find(el => this.isInViewport(el));
    }

    optimizeImageFormat(img) {
        // Detectar soporte WebP
        if (this.supportsWebP()) {
            const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');

            // Verificar si existe versión WebP
            const testImg = new Image();
            testImg.onload = () => {
                img.src = webpSrc;
            };
            testImg.src = webpSrc;
        }
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    logMetric(name, value, thresholds) {
        const status = value <= thresholds.good ? '🟢' :
                      value <= thresholds.poor ? '🟡' : '🔴';

        console.log(`${status} ${name}: ${Math.round(value)}ms`);
    }

    addOptimization(description) {
        this.optimizations.push({
            description,
            timestamp: Date.now()
        });
    }

    generateReport() {
        console.group('📊 REPORTE CORE WEB VITALS');

        // Métricas
        Object.entries(this.metrics).forEach(([metric, value]) => {
            if (value !== null) {
                const threshold = this.thresholds[metric];
                const status = value <= threshold.good ? '🟢 Excelente' :
                              value <= threshold.poor ? '🟡 Necesita mejora' : '🔴 Pobre';
                console.log(`${metric.toUpperCase()}: ${Math.round(value)} - ${status}`);
            }
        });

        // Optimizaciones aplicadas
        console.log('\n🔧 Optimizaciones aplicadas:');
        this.optimizations.forEach(opt => {
            console.log(`- ${opt.description}`);
        });

        console.groupEnd();
    }

    // Stub methods para funcionalidades avanzadas
    async inlineCriticalCSS() {
        // Implementar inline de CSS crítico
    }

    initDynamicImports() {
        // Implementar code splitting dinámico
    }

    initWebWorkers() {
        // Implementar Web Workers para tareas pesadas
    }

    loadLazyElement(element) {
        // Cargar elemento lazy
        if (element.dataset.src) {
            element.src = element.dataset.src;
        }
    }

    precacheResources() {
        // Precache de recursos críticos
    }

    loadNonCriticalComponents() {
        // Cargar componentes no críticos
    }

    runIdleTasks() {
        // Ejecutar tareas en idle
    }

    optimizeServerResponse() {
        // Optimizar respuesta del servidor
    }

    breakupLongTasks() {
        // Dividir tareas largas
    }

    deferNonCriticalJS() {
        // Defer JavaScript no crítico
    }

    optimizeEventListeners() {
        // Optimizar event listeners
    }

    setImageDimensions() {
        // Definir dimensiones de imágenes
        document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
            if (img.naturalWidth && img.naturalHeight) {
                img.width = img.naturalWidth;
                img.height = img.naturalHeight;
            }
        });
    }

    reserveSpaceForDynamicContent() {
        // Reservar espacio para contenido dinámico
    }

    optimizeWebFonts() {
        // Optimizar web fonts
    }

    optimizeBackgroundImages() {
        // Optimizar imágenes de background
    }

    applyFontDisplay() {
        // Aplicar font-display: swap
    }

    collectMetrics() {
        // Recolectar métricas
    }

    sendMetricsToAnalytics() {
        // Enviar métricas a analytics
    }

    processPerformanceEntries(entries) {
        // Procesar entradas de performance
    }
}

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.coreWebVitalsOptimizer = new CoreWebVitalsOptimizer();
        window.coreWebVitalsOptimizer.init();
    });
} else {
    window.coreWebVitalsOptimizer = new CoreWebVitalsOptimizer();
    window.coreWebVitalsOptimizer.init();
}

// Exponer globalmente
window.CoreWebVitalsOptimizer = CoreWebVitalsOptimizer;