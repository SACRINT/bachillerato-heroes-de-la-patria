/**
 * 🚀 UNIFIED PERFORMANCE OPTIMIZER - v2.0 
 * Sistema unificado que consolida optimización general + móvil
 * Reemplaza: performance-optimizer.js + mobile-performance-optimizer.js
 */

class UnifiedPerformanceOptimizer {
    constructor() {
        // Detección de dispositivo
        this.isMobile = this.detectMobile();
        this.deviceInfo = this.getDeviceInfo();
        this.networkInfo = this.getNetworkInfo();
        
        // Métricas centralizadas
        this.performanceMetrics = {
            loadTime: 0,
            resourcesOptimized: 0,
            memoryReduced: 0,
            requestsMinimized: 0,
            renderOptimized: 0
        };
        
        // Caches y observers
        this.loadedModules = new Set();
        this.observers = {};
        this.resourceCache = new Map();
        this.optimizations = {
            applied: new Set(),
            active: new Map()
        };
        
        this.init();
    }

    init() {
        //console.log('🚀 Iniciando Unified Performance Optimizer...');
        
        this.measureInitialMetrics();
        this.setupLazyLoading();
        this.optimizeImages();
        this.setupResourcePreloading();
        
        // Optimizaciones específicas para móvil
        if (this.isMobile) {
            this.applyMobileOptimizations();
        }
        
        // Monitoreo continuo
        this.startPerformanceMonitoring();
        
        //console.log('✅ Unified Performance Optimizer inicializado');
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: screen.width,
            screenHeight: screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }

    getNetworkInfo() {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            return {
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
                saveData: connection.saveData || false
            };
        }
        return { effectiveType: 'unknown', downlink: 0, rtt: 0, saveData: false };
    }

    measureInitialMetrics() {
        this.performanceMetrics.loadTime = performance.now();
        
        // Medir métricas de Lighthouse
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                //console.log('📊 LCP:', lastEntry.startTime.toFixed(2), 'ms');
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                let clsValue = 0;
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                //console.log('📊 CLS:', clsValue.toFixed(4));
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                            this.performanceMetrics.resourcesOptimized++;
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                observer.observe(img);
            });
        }
    }

    optimizeImages() {
        document.querySelectorAll('img').forEach(img => {
            // Agregar loading="lazy" si no existe
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }

            // Optimización específica para móvil
            if (this.isMobile && img.srcset) {
                // Usar imagen más pequeña en móvil
                const srcset = img.srcset.split(',');
                const smallestSrc = srcset[0].trim().split(' ')[0];
                img.src = smallestSrc;
            }
        });
    }

    setupResourcePreloading() {
        // Preload de recursos críticos
        const criticalResources = [
            { href: 'css/style.css', as: 'style' },
            { href: 'js/config.js', as: 'script' },
            { href: 'js/script.js', as: 'script' }
        ];

        criticalResources.forEach(resource => {
            const existingLink = document.querySelector(`link[href="${resource.href}"]`);
            if (!existingLink) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource.href;
                link.as = resource.as;
                document.head.appendChild(link);
            }
        });
    }

    applyMobileOptimizations() {
        //console.log('📱 Aplicando optimizaciones móviles...');
        
        // Reducir animaciones en conexiones lentas
        if (this.networkInfo.effectiveType === '2g' || this.networkInfo.effectiveType === 'slow-2g') {
            document.body.classList.add('reduced-motion');
            this.addCSS(`
                .reduced-motion *, 
                .reduced-motion *::before, 
                .reduced-motion *::after { 
                    animation-duration: 0.01ms !important; 
                    animation-iteration-count: 1 !important; 
                    transition-duration: 0.01ms !important; 
                }
            `);
        }

        // Optimización de viewport para móvil
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
            document.head.appendChild(viewport);
        }

        // Preconnect a dominios críticos en móvil
        const mobilePreconnects = [
            'https://fonts.googleapis.com',
            'https://cdn.jsdelivr.net'
        ];
        
        mobilePreconnects.forEach(domain => {
            if (!document.querySelector(`link[href="${domain}"]`)) {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                document.head.appendChild(link);
            }
        });

        this.optimizations.applied.add('mobile-optimizations');
    }

    addCSS(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    startPerformanceMonitoring() {
        // Monitoreo cada 30 segundos
        setInterval(() => {
            this.checkMemoryUsage();
            this.logPerformanceMetrics();
        }, 30000);

        // Monitoreo de Network changes
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.networkInfo = this.getNetworkInfo();
                //console.log('📡 Red cambió:', this.networkInfo.effectiveType);
                
                // Re-aplicar optimizaciones si la red mejoró/empeoró
                if (this.isMobile) {
                    this.applyMobileOptimizations();
                }
            });
        }
    }

    checkMemoryUsage() {
        if ('memory' in performance) {
            const memInfo = performance.memory;
            const memUsage = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit * 100).toFixed(2);
            
            if (memUsage > 80) {
                console.warn('⚠️ Uso de memoria alto:', memUsage + '%');
                this.freeMemory();
            }
        }
    }

    freeMemory() {
        // Limpiar caché de recursos antiguos
        this.resourceCache.clear();
        
        // Garbage collection hint (si está disponible)
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
        
        this.performanceMetrics.memoryReduced++;
        //console.log('🧹 Memoria liberada');
    }

    logPerformanceMetrics() {
        const currentTime = performance.now();
        const totalTime = (currentTime - this.performanceMetrics.loadTime).toFixed(2);
        
        //console.log('📊 Métricas de Performance:', {
            tiempoTotal: totalTime + 'ms',
            recursosOptimizados: this.performanceMetrics.resourcesOptimized,
            memoriaLiberada: this.performanceMetrics.memoryReduced,
            solicitudesMinimizadas: this.performanceMetrics.requestsMinimized,
            dispositivo: this.isMobile ? 'Móvil' : 'Desktop',
            red: this.networkInfo.effectiveType
        });
    }

    // Método público para obtener métricas
    getMetrics() {
        return {
            ...this.performanceMetrics,
            device: this.deviceInfo,
            network: this.networkInfo,
            optimizations: Array.from(this.optimizations.applied)
        };
    }
}

// Auto-inicialización
let unifiedPerformanceOptimizer;

document.addEventListener('DOMContentLoaded', () => {
    unifiedPerformanceOptimizer = new UnifiedPerformanceOptimizer();
    
    // Hacer disponible globalmente para debug
    window.performanceOptimizer = unifiedPerformanceOptimizer;
});

// Exponer la clase
window.UnifiedPerformanceOptimizer = UnifiedPerformanceOptimizer;