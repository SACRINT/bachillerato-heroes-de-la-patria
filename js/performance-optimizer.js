/**
 * 🚀 OPTIMIZADOR DE PERFORMANCE
 * Sistema avanzado de optimización de carga y rendimiento
 */

class PerformanceOptimizer {
    constructor() {
        this.loadedModules = new Set();
        this.observers = {};
        this.performanceMetrics = {};
        this.resourceCache = new Map();
        
        this.init();
    }

    init() {
        this.measureInitialMetrics();
        this.setupLazyLoading();
        this.optimizeImages();
        this.setupResourcePreloading();
        this.initIntersectionObserver();
        this.setupPerformanceMonitoring();
    }

    // ============================================
    // MÉTRICAS DE PERFORMANCE
    // ============================================

    measureInitialMetrics() {
        const startTime = performance.now();
        
        // Métricas de navegación
        if (performance.navigation) {
            this.performanceMetrics.navigation = {
                type: performance.navigation.type,
                redirectCount: performance.navigation.redirectCount
            };
        }

        // Timing de carga
        window.addEventListener('load', () => {
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.loadTime = loadTime;
            
            // Web Vitals
            this.measureWebVitals();
            
            console.log(`⚡ Página cargada en ${loadTime.toFixed(2)}ms`);
        });
    }

    measureWebVitals() {
        // First Contentful Paint (FCP)
        if (performance.getEntriesByType) {
            const paintMetrics = performance.getEntriesByType('paint');
            paintMetrics.forEach(metric => {
                this.performanceMetrics[metric.name] = metric.startTime;
            });
        }

        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.performanceMetrics.lcp = lastEntry.startTime;
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (error) {
                console.warn('LCP observer no soportado:', error);
            }
        }

        // Cumulative Layout Shift (CLS)
        this.measureCLS();
    }

    measureCLS() {
        let clsValue = 0;
        let clsEntries = [];

        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            clsEntries.push(entry);
                        }
                    }
                    this.performanceMetrics.cls = clsValue;
                });
                observer.observe({ entryTypes: ['layout-shift'] });
            } catch (error) {
                console.warn('CLS observer no soportado:', error);
            }
        }
    }

    // ============================================
    // LAZY LOADING
    // ============================================

    setupLazyLoading() {
        // Lazy loading para imágenes
        this.lazyLoadImages();
        
        // Lazy loading para scripts
        this.lazyLoadScripts();
        
        // Lazy loading para secciones
        this.lazyLoadSections();
    }

    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback para navegadores sin IntersectionObserver
            images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            });
        }
    }

    lazyLoadScripts() {
        const scriptsToLoad = [
            {
                id: 'chart-js',
                src: 'https://cdn.jsdelivr.net/npm/chart.js',
                condition: () => document.querySelector('.chart-container'),
                callback: () => this.initCharts()
            },
            {
                id: 'aos',
                src: 'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js',
                condition: () => document.querySelector('[data-aos]'),
                callback: () => {
                    if (typeof AOS !== 'undefined') {
                        AOS.init({
                            duration: 800,
                            offset: 100,
                            once: true
                        });
                    }
                }
            }
        ];

        scriptsToLoad.forEach(script => {
            if (script.condition()) {
                this.loadScript(script.src, script.callback, script.id);
            }
        });
    }

    lazyLoadSections() {
        const heavySections = document.querySelectorAll('.heavy-section');
        
        if ('IntersectionObserver' in window) {
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadSectionContent(entry.target);
                        sectionObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '200px 0px'
            });

            heavySections.forEach(section => sectionObserver.observe(section));
        }
    }

    async loadSectionContent(section) {
        const contentUrl = section.dataset.contentUrl;
        if (contentUrl && !section.dataset.loaded) {
            try {
                const response = await fetch(contentUrl);
                const content = await response.text();
                section.innerHTML = content;
                section.dataset.loaded = 'true';
                
                // Trigger animations if available
                if (typeof AOS !== 'undefined') {
                    AOS.refreshHard();
                }
            } catch (error) {
                console.warn('Error cargando sección:', error);
            }
        }
    }

    // ============================================
    // OPTIMIZACIÓN DE IMÁGENES
    // ============================================

    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Agregar loading="lazy" nativo
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }

            // Optimizar formato según soporte del navegador
            this.optimizeImageFormat(img);

            // Responsive images
            this.makeImageResponsive(img);
        });
    }

    optimizeImageFormat(img) {
        const supportsWebP = this.supportsWebP();
        const supportsAVIF = this.supportsAVIF();
        
        const originalSrc = img.src || img.dataset.src;
        if (!originalSrc) return;

        // Crear picture element para múltiples formatos
        if ((supportsWebP || supportsAVIF) && !img.closest('picture')) {
            const picture = document.createElement('picture');
            
            if (supportsAVIF) {
                const avifSource = document.createElement('source');
                avifSource.srcset = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.avif');
                avifSource.type = 'image/avif';
                picture.appendChild(avifSource);
            }
            
            if (supportsWebP) {
                const webpSource = document.createElement('source');
                webpSource.srcset = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                webpSource.type = 'image/webp';
                picture.appendChild(webpSource);
            }
            
            img.parentNode.insertBefore(picture, img);
            picture.appendChild(img);
        }
    }

    makeImageResponsive(img) {
        if (!img.hasAttribute('srcset') && img.src) {
            // Generar srcset automático basado en dimensiones comunes
            const baseSrc = img.src;
            const srcset = [
                `${baseSrc} 1x`,
                `${baseSrc.replace(/(\.[^.]+)$/, '@2x$1')} 2x`
            ].join(', ');
            
            img.srcset = srcset;
        }
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    supportsAVIF() {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }

    // ============================================
    // RESOURCE PRELOADING
    // ============================================

    setupResourcePreloading() {
        // Preload críticos
        this.preloadCriticalResources();
        
        // Prefetch para navegación probable
        this.setupPrefetching();
    }

    preloadCriticalResources() {
        const criticalResources = [
            {
                href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
                as: 'style'
            },
            {
                href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
                as: 'style'
            }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    setupPrefetching() {
        // Prefetch páginas probables basado en hover/focus
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"]');
        
        internalLinks.forEach(link => {
            let hoverTimer;
            
            link.addEventListener('mouseenter', () => {
                hoverTimer = setTimeout(() => {
                    this.prefetchPage(link.href);
                }, 200); // Delay para evitar prefetch innecesarios
            });
            
            link.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimer);
            });
            
            link.addEventListener('focus', () => {
                this.prefetchPage(link.href);
            });
        });
    }

    prefetchPage(url) {
        if (this.resourceCache.has(url)) return;
        
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        
        this.resourceCache.set(url, true);
    }

    // ============================================
    // INTERSECTION OBSERVER UTILITIES
    // ============================================

    initIntersectionObserver() {
        // Observer para animaciones
        if ('IntersectionObserver' in window) {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        animationObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            // Observar elementos animables
            document.querySelectorAll('.animate-on-scroll').forEach(el => {
                animationObserver.observe(el);
            });
        }
    }

    // ============================================
    // MONITORING CONTINUO
    // ============================================

    setupPerformanceMonitoring() {
        // Monitorear Long Tasks
        if ('PerformanceObserver' in window) {
            try {
                const longTaskObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        console.warn(`⚠️ Long Task detectada: ${entry.duration.toFixed(2)}ms`);
                    }
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                console.warn('Long Task observer no soportado');
            }
        }

        // Monitorear Memory (Chrome)
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                this.performanceMetrics.memory = {
                    used: Math.round(memory.usedJSHeapSize / 1048576),
                    total: Math.round(memory.totalJSHeapSize / 1048576),
                    limit: Math.round(memory.jsHeapSizeLimit / 1048576)
                };
            }, 30000); // Cada 30 segundos
        }
    }

    // ============================================
    // UTILITIES
    // ============================================

    loadScript(src, callback, id) {
        if (id && this.loadedModules.has(id)) {
            if (callback) callback();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        script.onload = () => {
            if (id) this.loadedModules.add(id);
            if (callback) callback();
            console.log(`✅ Script cargado: ${src}`);
        };
        
        script.onerror = () => {
            console.error(`❌ Error cargando script: ${src}`);
        };
        
        document.head.appendChild(script);
    }

    initCharts() {
        // Inicializar gráficos cuando Chart.js esté disponible
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            if (!container.dataset.chartInitialized) {
                // Lógica para inicializar gráficos específicos
                container.dataset.chartInitialized = 'true';
            }
        });
    }

    getPerformanceMetrics() {
        return this.performanceMetrics;
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    optimizePage() {
        // Ejecutar todas las optimizaciones manualmente
        this.optimizeImages();
        this.setupLazyLoading();
        console.log('🚀 Optimizaciones aplicadas');
    }

    printPerformanceReport() {
        console.group('📊 Performance Report');
        console.table(this.performanceMetrics);
        console.groupEnd();
    }
}

// Inicializar optimizador automáticamente
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
    console.log('🚀 Performance Optimizer inicializado');
});

// Agregar estilos para animaciones y lazy loading
const performanceStyles = document.createElement('style');
performanceStyles.textContent = `
    /* Lazy loading styles */
    img.lazy {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    img.loaded {
        opacity: 1;
    }
    
    /* Animation styles */
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .animate-on-scroll.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    /* Loading skeleton */
    .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
    }
    
    @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    
    /* Performance indicators */
    .perf-indicator {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 0.8rem;
        z-index: 9999;
        display: none;
    }
    
    .perf-indicator.show {
        display: block;
    }
`;

document.head.appendChild(performanceStyles);