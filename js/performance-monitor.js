/**
 * 📊 PERFORMANCE MONITOR - FASE 4.3
 * Sistema de monitoreo de Core Web Vitals y performance para BGE Héroes de la Patria
 * Seguimiento de métricas críticas de usuario y optimización automática
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            lcp: null, // Largest Contentful Paint
            fid: null, // First Input Delay
            cls: null, // Cumulative Layout Shift
            fcp: null, // First Contentful Paint
            ttfb: null, // Time to First Byte
            tti: null  // Time to Interactive
        };

        this.performanceEntries = [];
        this.resourceTimings = [];
        this.userInteractions = [];
        this.sessionStart = performance.now();
        this.pageLoadComplete = false;

        this.init();
    }

    init() {
        this.setupCoreWebVitals();
        this.setupResourceMonitoring();
        this.setupUserInteractionTracking();
        this.setupNetworkMonitoring();
        this.setupAutomaticOptimization();
        this.startPerformanceLogging();

        console.log('📊 Performance Monitor inicializado');
    }

    setupCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.startTime;
                this.evaluateLCP(lastEntry.startTime);
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay (FID)
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                    this.evaluateFID(this.metrics.fid);
                });
            }).observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift (CLS)
            let clsValue = 0;
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        this.metrics.cls = clsValue;
                        this.evaluateCLS(clsValue);
                    }
                });
            }).observe({ entryTypes: ['layout-shift'] });

            // First Contentful Paint (FCP)
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.fcp = entry.startTime;
                        this.evaluateFCP(entry.startTime);
                    }
                });
            }).observe({ entryTypes: ['paint'] });

            // Recursos
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.analyzeResourceTiming(entry);
                });
            }).observe({ entryTypes: ['resource'] });
        }

        // TTFB y tiempo de navegación
        this.measureNavigationTiming();
    }

    measureNavigationTiming() {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];

            if (perfData) {
                // Time to First Byte
                this.metrics.ttfb = perfData.responseStart - perfData.requestStart;

                // Métricas adicionales
                const metrics = {
                    dns: perfData.domainLookupEnd - perfData.domainLookupStart,
                    tcp: perfData.connectEnd - perfData.connectStart,
                    request: perfData.responseStart - perfData.requestStart,
                    response: perfData.responseEnd - perfData.responseStart,
                    dom: perfData.domContentLoadedEventStart - perfData.responseEnd,
                    load: perfData.loadEventStart - perfData.domContentLoadedEventStart
                };

                this.analyzeNavigationMetrics(metrics);
                this.pageLoadComplete = true;
            }
        });
    }

    setupResourceMonitoring() {
        // Monitorear recursos lentos
        const slowResourceThreshold = 1000; // 1 segundo

        if ('PerformanceObserver' in window) {
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > slowResourceThreshold) {
                        this.reportSlowResource(entry);
                    }
                    this.resourceTimings.push({
                        name: entry.name,
                        duration: entry.duration,
                        size: entry.transferSize,
                        type: this.getResourceType(entry.name)
                    });
                });
            }).observe({ entryTypes: ['resource'] });
        }
    }

    setupUserInteractionTracking() {
        // Rastrear interacciones del usuario
        const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart'];

        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.trackUserInteraction(eventType, event);
            }, { passive: true });
        });

        // Monitorear tiempo de respuesta a interacciones
        this.setupInputResponsiveness();
    }

    setupInputResponsiveness() {
        let interactionStart = null;

        document.addEventListener('pointerdown', () => {
            interactionStart = performance.now();
        });

        document.addEventListener('pointerup', () => {
            if (interactionStart) {
                const responsiveness = performance.now() - interactionStart;
                this.trackResponsiveness(responsiveness);
                interactionStart = null;
            }
        });
    }

    setupNetworkMonitoring() {
        // Monitorear tipo de conexión
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.logNetworkInfo({
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            });

            // Escuchar cambios de conexión
            connection.addEventListener('change', () => {
                this.handleConnectionChange(connection);
            });
        }
    }

    setupAutomaticOptimization() {
        // Optimizaciones automáticas basadas en métricas
        setTimeout(() => {
            this.applyAutomaticOptimizations();
        }, 5000); // Después de 5 segundos de carga
    }

    // Evaluadores de métricas
    evaluateLCP(lcp) {
        let status = 'good';
        if (lcp > 4000) status = 'poor';
        else if (lcp > 2500) status = 'needs-improvement';

        this.logMetric('LCP', lcp, status);

        if (status !== 'good') {
            this.suggestLCPOptimizations(lcp);
        }
    }

    evaluateFID(fid) {
        let status = 'good';
        if (fid > 300) status = 'poor';
        else if (fid > 100) status = 'needs-improvement';

        this.logMetric('FID', fid, status);

        if (status !== 'good') {
            this.suggestFIDOptimizations(fid);
        }
    }

    evaluateCLS(cls) {
        let status = 'good';
        if (cls > 0.25) status = 'poor';
        else if (cls > 0.1) status = 'needs-improvement';

        this.logMetric('CLS', cls, status);

        if (status !== 'good') {
            this.suggestCLSOptimizations(cls);
        }
    }

    evaluateFCP(fcp) {
        let status = 'good';
        if (fcp > 3000) status = 'poor';
        else if (fcp > 1800) status = 'needs-improvement';

        this.logMetric('FCP', fcp, status);
    }

    // Analizadores específicos
    analyzeResourceTiming(entry) {
        const analysis = {
            name: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize || 0,
            type: this.getResourceType(entry.name),
            cached: entry.transferSize === 0 && entry.duration < 50
        };

        // Detectar recursos problemáticos (silenciado en desarrollo)
        if (analysis.duration > 2000 && !window.location.hostname.includes('localhost')) {
            console.warn(`🐌 Recurso lento detectado: ${entry.name} (${analysis.duration.toFixed(2)}ms)`);
        }

        if (analysis.transferSize > 1024 * 1024) { // 1MB
            console.warn(`📦 Recurso grande detectado: ${entry.name} (${(analysis.transferSize / 1024 / 1024).toFixed(2)}MB)`);
        }

        return analysis;
    }

    analyzeNavigationMetrics(metrics) {
        console.log('📊 Métricas de navegación:', {
            DNS: `${metrics.dns.toFixed(2)}ms`,
            TCP: `${metrics.tcp.toFixed(2)}ms`,
            Request: `${metrics.request.toFixed(2)}ms`,
            Response: `${metrics.response.toFixed(2)}ms`,
            DOM: `${metrics.dom.toFixed(2)}ms`,
            Load: `${metrics.load.toFixed(2)}ms`,
            TTFB: `${this.metrics.ttfb.toFixed(2)}ms`
        });

        // Identificar cuellos de botella
        if (metrics.dns > 100) {
            console.warn('⚠️ DNS lento detectado');
        }
        if (this.metrics.ttfb > 600) {
            console.warn('⚠️ TTFB alto detectado');
        }
    }

    trackUserInteraction(type, event) {
        this.userInteractions.push({
            type,
            timestamp: performance.now(),
            target: event.target.tagName,
            session: this.getSessionTime()
        });

        // Limpiar interacciones antiguas (últimos 5 minutos)
        const fiveMinutesAgo = performance.now() - (5 * 60 * 1000);
        this.userInteractions = this.userInteractions.filter(
            interaction => interaction.timestamp > fiveMinutesAgo
        );
    }

    trackResponsiveness(responsiveness) {
        if (responsiveness > 100) {
            console.warn(`🐌 Respuesta lenta a interacción: ${responsiveness.toFixed(2)}ms`);
        }
    }

    // Optimizaciones automáticas
    applyAutomaticOptimizations() {
        const optimizations = [];

        // Optimización basada en LCP
        if (this.metrics.lcp > 2500) {
            this.optimizeForLCP();
            optimizations.push('LCP');
        }

        // Optimización basada en recursos lentos
        const slowResources = this.resourceTimings.filter(r => r.duration > 1000);
        if (slowResources.length > 0) {
            this.optimizeSlowResources(slowResources);
            optimizations.push('Recursos');
        }

        // Optimización basada en tipo de conexión
        if (this.isSlowConnection()) {
            this.optimizeForSlowConnection();
            optimizations.push('Conexión');
        }

        if (optimizations.length > 0) {
            console.log(`🚀 Optimizaciones aplicadas: ${optimizations.join(', ')}`);
        }
    }

    optimizeForLCP() {
        // Precargar imagen LCP si es detectable
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (this.isInViewport(img)) {
                img.loading = 'eager';
                img.fetchPriority = 'high';
            }
        });
    }

    optimizeSlowResources(slowResources) {
        // Sugerir lazy loading para recursos lentos
        slowResources.forEach(resource => {
            if (resource.type === 'image') {
                console.log(`💡 Sugerencia: Aplicar lazy loading a ${resource.name}`);
            }
        });
    }

    optimizeForSlowConnection() {
        // Reducir calidad de imágenes para conexiones lentas
        document.documentElement.classList.add('slow-connection');

        // Deshabilitar animaciones no esenciales
        const style = document.createElement('style');
        style.textContent = `
            .slow-connection * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);

        console.log('🐌 Modo conexión lenta activado');
    }

    // Sugerencias de optimización
    suggestLCPOptimizations(lcp) {
        const suggestions = [
            'Precargar imagen principal',
            'Optimizar servidor (TTFB)',
            'Reducir JavaScript bloqueante',
            'Usar CDN para recursos estáticos'
        ];

        console.warn(`⚠️ LCP alto (${lcp.toFixed(2)}ms). Sugerencias:`, suggestions);
    }

    suggestFIDOptimizations(fid) {
        const suggestions = [
            'Diferir JavaScript no crítico',
            'Usar Web Workers para tareas pesadas',
            'Optimizar event listeners',
            'Reducir trabajo en main thread'
        ];

        console.warn(`⚠️ FID alto (${fid.toFixed(2)}ms). Sugerencias:`, suggestions);
    }

    suggestCLSOptimizations(cls) {
        const suggestions = [
            'Definir dimensiones de imágenes',
            'Reservar espacio para anuncios',
            'Evitar inyección de contenido dinámico',
            'Usar transform en lugar de cambiar layout'
        ];

        // Advertencias CLS deshabilitadas en desarrollo para reducir ruido en consola
        // console.warn(`⚠️ CLS alto (${cls.toFixed(4)}). Sugerencias:`, suggestions);
    }

    // Utilidades
    getResourceType(url) {
        if (url.match(/\.(css)(\?|$)/)) return 'stylesheet';
        if (url.match(/\.(js)(\?|$)/)) return 'script';
        if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|eot)(\?|$)/)) return 'font';
        return 'other';
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    }

    isSlowConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return connection.effectiveType === 'slow-2g' ||
                   connection.effectiveType === '2g' ||
                   (connection.downlink && connection.downlink < 1.5);
        }
        return false;
    }

    getSessionTime() {
        return performance.now() - this.sessionStart;
    }

    logMetric(name, value, status) {
        const colors = {
            good: '#00C851',
            'needs-improvement': '#ffbb33',
            poor: '#ff4444'
        };

        console.log(
            `%c📊 ${name}: ${value.toFixed(2)}ms (${status})`,
            `color: ${colors[status]}; font-weight: bold;`
        );
    }

    logNetworkInfo(info) {
        console.log('🌐 Información de red:', info);
    }

    handleConnectionChange(connection) {
        console.log('🔄 Cambio de conexión:', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink
        });

        if (this.isSlowConnection()) {
            this.optimizeForSlowConnection();
        }
    }

    reportSlowResource(entry) {
        // Silenciar en desarrollo
        if (!window.location.hostname.includes('localhost')) {
            console.warn(`🐌 Recurso lento: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
        }
    }

    startPerformanceLogging() {
        // Log periódico de métricas (cada 30 segundos)
        setInterval(() => {
            this.logPerformanceSummary();
        }, 30000);
    }

    logPerformanceSummary() {
        if (!this.pageLoadComplete) return;

        const summary = {
            'Tiempo de sesión': `${(this.getSessionTime() / 1000).toFixed(1)}s`,
            'Recursos cargados': this.resourceTimings.length,
            'Interacciones': this.userInteractions.length,
            'LCP': this.metrics.lcp ? `${this.metrics.lcp.toFixed(2)}ms` : 'N/A',
            'FID': this.metrics.fid ? `${this.metrics.fid.toFixed(2)}ms` : 'N/A',
            'CLS': this.metrics.cls ? this.metrics.cls.toFixed(4) : 'N/A'
        };

        console.group('📊 Resumen de Performance');
        Object.entries(summary).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });
        console.groupEnd();
    }

    // API pública
    getPerformanceReport() {
        return {
            metrics: { ...this.metrics },
            resourceCount: this.resourceTimings.length,
            interactionCount: this.userInteractions.length,
            sessionTime: this.getSessionTime(),
            slowResources: this.resourceTimings.filter(r => r.duration > 1000),
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.metrics.lcp > 2500) {
            recommendations.push('Optimizar Largest Contentful Paint');
        }
        if (this.metrics.fid > 100) {
            recommendations.push('Reducir First Input Delay');
        }
        if (this.metrics.cls > 0.1) {
            recommendations.push('Minimizar Cumulative Layout Shift');
        }

        return recommendations;
    }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.performanceMonitor = new PerformanceMonitor();
});

// Exponer globalmente
window.PerformanceMonitor = PerformanceMonitor;