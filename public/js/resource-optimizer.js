/**
 * 🔧 RESOURCE OPTIMIZER - FASE 4.1
 * Sistema de optimización de recursos CSS/JS para BGE Héroes de la Patria
 * Minificación dinámica y compresión de recursos
 */

class ResourceOptimizer {
    constructor() {
        this.compressionCache = new Map();
        this.loadedResources = new Set();
        this.criticalResources = new Set();
        this.deferredResources = new Set();

        this.config = {
            enableCompression: true,
            enableMinification: true,
            enableCriticalCSS: true,
            enableAsyncLoading: true,
            cacheExpiry: 24 * 60 * 60 * 1000 // 24 horas
        };

        this.init();
    }

    init() {
        this.identifyCriticalResources();
        this.setupAsyncLoading();
        this.optimizeExistingResources();
        this.setupResourcePreloading();
        this.monitorResourceLoading();

        console.log('🔧 Resource Optimizer inicializado');
    }

    identifyCriticalResources() {
        // Recursos críticos para el primer renderizado
        this.criticalResources.add('css/style.css');
        this.criticalResources.add('js/script.js');
        this.criticalResources.add('js/google-auth-integration.js');

        // Recursos que se pueden diferir
        this.deferredResources.add('js/chatbot.js');
        this.deferredResources.add('js/image-optimizer.js');
        this.deferredResources.add('js/advanced-lazy-loader.js');
    }

    setupAsyncLoading() {
        // Cargar recursos no críticos de forma asíncrona
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadDeferredResources());
        } else {
            this.loadDeferredResources();
        }

        // Cargar recursos adicionales cuando la página esté completamente cargada
        window.addEventListener('load', () => {
            setTimeout(() => this.loadEnhancementResources(), 100);
        });
    }

    async loadDeferredResources() {
        const deferredScripts = [
            'js/chatbot.js',
            'js/stats-counter.js',
            'js/interactive-calendar.js'
        ];

        for (const script of deferredScripts) {
            this.loadScriptAsync(script);
        }
    }

    async loadEnhancementResources() {
        const enhancementScripts = [
            'js/image-optimizer.js',
            'js/pwa-advanced.js',
            'js/security-manager.js'
        ];

        for (const script of enhancementScripts) {
            this.loadScriptAsync(script, { priority: 'low' });
        }
    }

    loadScriptAsync(src, options = {}) {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (this.loadedResources.has(src)) {
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
                this.loadedResources.add(src);
                console.log(`✅ Script cargado: ${src}`);
                resolve();
            };

            script.onerror = () => {
                console.warn(`⚠️ Error cargando script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    optimizeExistingResources() {
        // Optimizar links CSS existentes
        this.optimizeCSS();

        // Optimizar scripts existentes
        this.optimizeJS();

        // Precargar recursos críticos
        this.preloadCriticalResources();
    }

    optimizeCSS() {
        const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');

        cssLinks.forEach(link => {
            const href = link.href;

            // Agregar preload hint para CSS crítico
            if (this.isCriticalResource(href)) {
                this.addPreloadHint(href, 'style');
            }

            // Agregar versioning para cache busting
            if (!href.includes('?v=')) {
                link.href = href + '?v=' + this.getCacheVersion();
            }
        });
    }

    optimizeJS() {
        const scripts = document.querySelectorAll('script[src]');

        scripts.forEach(script => {
            const src = script.src;

            // Agregar async/defer a scripts no críticos
            if (!this.isCriticalResource(src) && !script.async && !script.defer) {
                script.async = true;
            }

            // Agregar versioning
            if (!src.includes('?v=')) {
                script.src = src + '?v=' + this.getCacheVersion();
            }
        });
    }

    preloadCriticalResources() {
        const criticalAssets = [
            { href: 'images/logo-bachillerato-HDLP.webp', as: 'image' },
            { href: 'css/style.css', as: 'style' },
            { href: 'js/script.js', as: 'script' }
        ];

        criticalAssets.forEach(asset => {
            this.addPreloadHint(asset.href, asset.as);
        });
    }

    addPreloadHint(href, asType) {
        // Verificar que no exista ya
        const existing = document.querySelector(`link[rel="preload"][href*="${href}"]`);
        if (existing) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = asType;

        if (asType === 'style') {
            link.onload = function() {
                this.onload = null;
                this.rel = 'stylesheet';
            };
        }

        document.head.appendChild(link);
        console.log(`🔗 Preload agregado: ${href} (${asType})`);
    }

    setupResourcePreloading() {
        // Precargar recursos para la siguiente navegación
        this.preloadNextPageResources();

        // Prefetch de recursos de páginas populares
        this.prefetchPopularPages();
    }

    preloadNextPageResources() {
        // Observar links para precargar recursos de páginas visitadas frecuentemente
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');

        const linkObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const link = entry.target;
                    this.prefetchPage(link.href);
                    linkObserver.unobserve(link);
                }
            });
        }, { rootMargin: '200px' });

        internalLinks.forEach(link => {
            linkObserver.observe(link);
        });
    }

    prefetchPopularPages() {
        const popularPages = [
            'conocenos.html',
            'oferta-educativa.html',
            'servicios.html',
            'estudiantes.html'
        ];

        // Prefetch después de 2 segundos para no interferir con la carga inicial
        setTimeout(() => {
            popularPages.forEach(page => {
                this.addPrefetchHint(page);
            });
        }, 2000);
    }

    prefetchPage(href) {
        try {
            const url = new URL(href, window.location.origin);
            if (url.origin === window.location.origin) {
                this.addPrefetchHint(url.pathname);
            }
        } catch (error) {
            console.warn('Error prefetching page:', error);
        }
    }

    addPrefetchHint(href) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);

        console.log(`⚡ Prefetch agregado: ${href}`);
    }

    monitorResourceLoading() {
        // Monitorear performance de recursos
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > 1000) { // Recursos que tardan más de 1 segundo
                        console.warn(`🐌 Recurso lento detectado: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
                    }
                });
            });

            resourceObserver.observe({ entryTypes: ['resource'] });
        }
    }

    isCriticalResource(url) {
        return Array.from(this.criticalResources).some(resource => url.includes(resource));
    }

    getCacheVersion() {
        // Usar timestamp del día para cache busting diario
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        return today;
    }

    // Método para comprimir contenido dinámicamente
    async compressContent(content, type = 'text') {
        const cacheKey = this.generateCacheKey(content);

        // Verificar cache
        if (this.compressionCache.has(cacheKey)) {
            return this.compressionCache.get(cacheKey);
        }

        try {
            let compressed = content;

            if (type === 'css') {
                compressed = this.minifyCSS(content);
            } else if (type === 'js') {
                compressed = this.minifyJS(content);
            }

            // Guardar en cache
            this.compressionCache.set(cacheKey, compressed);

            return compressed;
        } catch (error) {
            console.warn('Error comprimiendo contenido:', error);
            return content;
        }
    }

    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios
            .replace(/\s+/g, ' ') // Colapsar espacios
            .replace(/;\s*}/g, '}') // Remover último punto y coma
            .replace(/\s*{\s*/g, '{') // Limpiar llaves
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*;\s*/g, ';')
            .replace(/\s*:\s*/g, ':')
            .trim();
    }

    minifyJS(js) {
        return js
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios multilinea
            .replace(/\/\/.*$/gm, '') // Remover comentarios de línea
            .replace(/\s+/g, ' ') // Colapsar espacios
            .replace(/\s*([{}();,:])\s*/g, '$1') // Limpiar espacios alrededor de operadores
            .trim();
    }

    generateCacheKey(content) {
        // Generar hash simple del contenido
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32-bit integer
        }
        return hash.toString(36);
    }

    // API pública para obtener estadísticas
    getOptimizationStats() {
        return {
            loadedResources: this.loadedResources.size,
            cachedItems: this.compressionCache.size,
            criticalResources: this.criticalResources.size,
            deferredResources: this.deferredResources.size
        };
    }

    // Método para limpiar cache
    clearCache() {
        this.compressionCache.clear();
        console.log('🧹 Cache de optimización limpiado');
    }

    // Método para forzar optimización de todos los recursos
    forceOptimizeAll() {
        this.optimizeExistingResources();
        this.loadDeferredResources();
        console.log('🚀 Optimización forzada de todos los recursos');
    }
}

// CSS para indicadores de carga
const optimizerStyles = document.createElement('style');
optimizerStyles.textContent = `
    .resource-loading {
        position: relative;
    }

    .resource-loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #007bff, transparent);
        animation: loadingShimmer 1.5s infinite;
    }

    @keyframes loadingShimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .resource-loaded {
        transition: opacity 0.3s ease;
    }

    .resource-error {
        opacity: 0.5;
        filter: grayscale(50%);
    }
`;
document.head.appendChild(optimizerStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.resourceOptimizer = new ResourceOptimizer();
});

// Exponer globalmente
window.ResourceOptimizer = ResourceOptimizer;