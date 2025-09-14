/**
 * 📊 PERFORMANCE MONITOR - FASE 2 OPTIMIZACIÓN
 * Sistema de monitoreo de rendimiento en tiempo real
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: {},
            resources: {},
            userInteraction: {},
            vitals: {},
            errors: []
        };
        
        this.observers = {};
        this.thresholds = {
            fcp: 1800, // First Contentful Paint
            lcp: 2500, // Largest Contentful Paint
            fid: 100,  // First Input Delay
            cls: 0.1   // Cumulative Layout Shift
        };
        
        this.init();
    }

    init() {
        //console.log('📊 Inicializando Performance Monitor...');
        
        // Métricas de carga de página
        this.measurePageLoad();
        
        // Web Vitals
        this.measureWebVitals();
        
        // Performance Observer para recursos
        this.setupResourceObserver();
        
        // Long Tasks Observer
        this.setupLongTaskObserver();
        
        // Layout Shift Observer
        this.setupLayoutShiftObserver();
        
        // User Interaction Metrics
        this.setupUserInteractionTracking();
        
        // Error Tracking
        this.setupErrorTracking();
        
        // Auto-reporting
        this.setupAutoReporting();
        
        //console.log('✅ Performance Monitor inicializado');
    }

    measurePageLoad() {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation) {
            this.metrics.pageLoad = {
                dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                connection: navigation.connectEnd - navigation.connectStart,
                request: navigation.responseStart - navigation.requestStart,
                response: navigation.responseEnd - navigation.responseStart,
                domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
                domReady: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                fullLoad: navigation.loadEventEnd - navigation.navigationStart,
                transferSize: navigation.transferSize || 0,
                decodedBodySize: navigation.decodedBodySize || 0
            };
        }
    }

    measureWebVitals() {
        // First Contentful Paint
        this.observePerformanceEntry('paint', (entry) => {
            if (entry.name === 'first-contentful-paint') {
                this.metrics.vitals.fcp = entry.startTime;
                this.evaluateMetric('fcp', entry.startTime);
            }
        });

        // Largest Contentful Paint
        this.observePerformanceEntry('largest-contentful-paint', (entry) => {
            this.metrics.vitals.lcp = entry.startTime;
            this.evaluateMetric('lcp', entry.startTime);
        });

        // First Input Delay (se mide en la primera interacción)
        this.setupFirstInputDelay();

        // Cumulative Layout Shift
        let clsScore = 0;
        this.observePerformanceEntry('layout-shift', (entry) => {
            if (!entry.hadRecentInput) {
                clsScore += entry.value;
                this.metrics.vitals.cls = clsScore;
                this.evaluateMetric('cls', clsScore);
            }
        });
    }

    observePerformanceEntry(entryType, callback) {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(callback);
                });
                observer.observe({ entryTypes: [entryType] });
                this.observers[entryType] = observer;
            } catch (error) {
                console.warn(`No se pudo observar ${entryType}:`, error);
            }
        }
    }

    setupFirstInputDelay() {
        let firstInputProcessed = false;
        
        ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                if (!firstInputProcessed) {
                    const inputDelay = performance.now() - event.timeStamp;
                    this.metrics.vitals.fid = inputDelay;
                    this.evaluateMetric('fid', inputDelay);
                    firstInputProcessed = true;
                }
            }, { once: true, passive: true });
        });
    }

    setupResourceObserver() {
        this.observePerformanceEntry('resource', (entry) => {
            const resourceType = entry.initiatorType || 'other';
            
            if (!this.metrics.resources[resourceType]) {
                this.metrics.resources[resourceType] = {
                    count: 0,
                    totalSize: 0,
                    totalDuration: 0,
                    slowest: 0
                };
            }

            const resource = this.metrics.resources[resourceType];
            resource.count++;
            resource.totalSize += entry.transferSize || 0;
            resource.totalDuration += entry.duration;
            resource.slowest = Math.max(resource.slowest, entry.duration);

            // Alertar sobre recursos lentos
            if (entry.duration > 1000) {
                console.warn(`🐌 Recurso lento detectado: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
                this.metrics.errors.push({
                    type: 'slow_resource',
                    resource: entry.name,
                    duration: entry.duration,
                    timestamp: Date.now()
                });
            }
        });
    }

    setupLongTaskObserver() {
        this.observePerformanceEntry('longtask', (entry) => {
            console.warn(`⏰ Long Task detectada: ${entry.duration.toFixed(2)}ms`);
            
            this.metrics.errors.push({
                type: 'long_task',
                duration: entry.duration,
                startTime: entry.startTime,
                timestamp: Date.now()
            });
        });
    }

    setupLayoutShiftObserver() {
        this.observePerformanceEntry('layout-shift', (entry) => {
            if (entry.value > 0.1) {
                console.warn(`📐 Layout Shift significativo: ${entry.value.toFixed(4)}`);
            }
        });
    }

    setupUserInteractionTracking() {
        let interactions = 0;
        let totalInteractionDelay = 0;

        ['click', 'keypress', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                const interactionStart = performance.now();
                
                requestAnimationFrame(() => {
                    const interactionDelay = performance.now() - interactionStart;
                    interactions++;
                    totalInteractionDelay += interactionDelay;
                    
                    this.metrics.userInteraction = {
                        totalInteractions: interactions,
                        averageDelay: totalInteractionDelay / interactions,
                        lastInteractionDelay: interactionDelay
                    };
                });
            }, { passive: true });
        });
    }

    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.metrics.errors.push({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now()
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.metrics.errors.push({
                type: 'promise_rejection',
                reason: event.reason,
                timestamp: Date.now()
            });
        });
    }

    evaluateMetric(metric, value) {
        const threshold = this.thresholds[metric];
        if (!threshold) return;

        let status = 'good';
        let color = '🟢';

        if (metric === 'cls') {
            if (value > 0.25) {
                status = 'poor';
                color = '🔴';
            } else if (value > 0.1) {
                status = 'needs-improvement';
                color = '🟡';
            }
        } else {
            if (value > threshold * 1.5) {
                status = 'poor';
                color = '🔴';
            } else if (value > threshold) {
                status = 'needs-improvement';
                color = '🟡';
            }
        }

        //console.log(`${color} ${metric.toUpperCase()}: ${value.toFixed(2)}${metric === 'cls' ? '' : 'ms'} (${status})`);
        
        // Disparar eventos para métricas críticas
        if (status === 'poor') {
            this.triggerPerformanceAlert(metric, value, status);
        }
    }

    triggerPerformanceAlert(metric, value, status) {
        const alertEvent = new CustomEvent('performance-alert', {
            detail: { metric, value, status }
        });
        document.dispatchEvent(alertEvent);
        
        // Log para debugging
        console.warn(`⚠️ Alerta de rendimiento: ${metric} = ${value} (${status})`);
    }

    setupAutoReporting() {
        // Reportar métricas cada 30 segundos
        setInterval(() => {
            this.reportMetrics();
        }, 30000);

        // Reportar al salir de la página
        window.addEventListener('beforeunload', () => {
            this.reportMetrics(true);
        });

        // Reportar cuando la página se oculta
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.reportMetrics();
            }
        });
    }

    reportMetrics(isFinal = false) {
        const report = {
            ...this.metrics,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connectionType: navigator.connection?.effectiveType || 'unknown',
            isFinal
        };

        // Enviar al endpoint de analytics
        if (window.analyticsTracker) {
            window.analyticsTracker.track('performance_metrics', report);
        }

        // Enviar al servidor si hay endpoint disponible
        this.sendToServer(report);

        if (isFinal) {
            //console.log('📊 Reporte final de rendimiento enviado');
        }

        return report;
    }

    async sendToServer(report) {
        try {
            if ('sendBeacon' in navigator) {
                // Usar sendBeacon para envío confiable
                navigator.sendBeacon('/api/analytics/performance', JSON.stringify(report));
            } else {
                // Fallback a fetch
                await fetch('/api/analytics/performance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(report)
                });
            }
        } catch (error) {
            console.warn('No se pudo enviar métricas al servidor:', error);
        }
    }

    getPerformanceScore() {
        const vitals = this.metrics.vitals;
        let score = 100;

        // Penalizar métricas pobres
        if (vitals.fcp > this.thresholds.fcp * 1.5) score -= 20;
        else if (vitals.fcp > this.thresholds.fcp) score -= 10;

        if (vitals.lcp > this.thresholds.lcp * 1.5) score -= 25;
        else if (vitals.lcp > this.thresholds.lcp) score -= 15;

        if (vitals.fid > this.thresholds.fid * 1.5) score -= 20;
        else if (vitals.fid > this.thresholds.fid) score -= 10;

        if (vitals.cls > this.thresholds.cls * 2.5) score -= 25;
        else if (vitals.cls > this.thresholds.cls) score -= 15;

        // Penalizar errores
        score -= Math.min(this.metrics.errors.length * 5, 30);

        return Math.max(0, score);
    }

    getRecommendations() {
        const recommendations = [];
        const vitals = this.metrics.vitals;

        if (vitals.fcp > this.thresholds.fcp) {
            recommendations.push('Optimizar First Contentful Paint: reducir tamaño de CSS crítico');
        }

        if (vitals.lcp > this.thresholds.lcp) {
            recommendations.push('Optimizar Largest Contentful Paint: optimizar imágenes principales');
        }

        if (vitals.fid > this.thresholds.fid) {
            recommendations.push('Mejorar First Input Delay: reducir JavaScript bloqueante');
        }

        if (vitals.cls > this.thresholds.cls) {
            recommendations.push('Reducir Layout Shift: definir dimensiones de imágenes y elementos');
        }

        if (this.metrics.errors.length > 5) {
            recommendations.push('Revisar y corregir errores JavaScript frecuentes');
        }

        return recommendations;
    }

    // API pública para obtener métricas actuales
    getCurrentMetrics() {
        return {
            ...this.metrics,
            score: this.getPerformanceScore(),
            recommendations: this.getRecommendations()
        };
    }

    // Crear dashboard de métricas en consola
    showPerformanceDashboard() {
        const metrics = this.getCurrentMetrics();
        
        console.group('📊 Performance Dashboard');
        //console.log(`Score: ${metrics.score}/100`);
        //console.log('Web Vitals:', metrics.vitals);
        //console.log('Page Load:', metrics.pageLoad);
        //console.log('Resources:', metrics.resources);
        //console.log('Errors:', metrics.errors.length);
        
        if (metrics.recommendations.length > 0) {
            console.group('💡 Recomendaciones:');
            metrics.recommendations.forEach(rec => //console.log(`• ${rec}`));
            console.groupEnd();
        }
        
        console.groupEnd();
        
        return metrics;
    }
}

// Inicializar automáticamente
let performanceMonitor;

document.addEventListener('DOMContentLoaded', () => {
    performanceMonitor = new PerformanceMonitor();
    
    // Comando para ver dashboard en consola
    window.showPerformance = () => performanceMonitor.showPerformanceDashboard();
    
    // Hacer accesible globalmente
    window.performanceMonitor = performanceMonitor;
});

// Exponer la clase
window.PerformanceMonitor = PerformanceMonitor;