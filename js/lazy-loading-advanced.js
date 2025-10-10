/**
 * 🚀 SISTEMA DE LAZY LOADING AVANZADO PARA BGE
 * Carga bajo demanda con Intersection Observer y optimizaciones
 */

class AdvancedLazyLoader {
    constructor(options = {}) {
        this.config = {
            // Selector para elementos a cargar lazily
            imageSelector: 'img[data-src], img[loading="lazy"]',
            contentSelector: '[data-lazy-content]',

            // Opciones del Intersection Observer
            rootMargin: '50px',
            threshold: 0.1,

            // Configuración de rendimiento
            enablePreload: true,
            enableBlur: true,
            enableSkeleton: true,
            enableFadeIn: true,

            // CSS Classes
            loadingClass: 'lazy-loading',
            loadedClass: 'lazy-loaded',
            errorClass: 'lazy-error',
            skeletonClass: 'lazy-skeleton',

            // Callbacks
            onLoad: null,
            onError: null,
            onIntersect: null,

            ...options
        };

        this.observer = null;
        this.stats = {
            imagesProcessed: 0,
            contentLoaded: 0,
            errors: 0,
            startTime: Date.now()
        };

        this.log('🚀 Inicializando Lazy Loading Avanzado...');
        this.init();
    }

    log(message) {
        console.log(`[LazyLoader] ${message}`);
    }

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    init() {
        if (!this.isSupported()) {
            this.log('⚠️ Intersection Observer no soportado, usando fallback');
            this.fallbackInit();
            return;
        }

        this.createObserver();
        this.setupStyles();
        this.observeElements();
        this.setupPerformanceOptimizations();

        this.log(`✅ Lazy loading configurado con éxito`);
    }

    isSupported() {
        return 'IntersectionObserver' in window &&
               'IntersectionObserverEntry' in window &&
               'intersectionRatio' in window.IntersectionObserverEntry.prototype;
    }

    createObserver() {
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                root: null,
                rootMargin: this.config.rootMargin,
                threshold: this.config.threshold
            }
        );
    }

    // ==========================================
    // ESTILOS Y CSS
    // ==========================================

    setupStyles() {
        if (document.getElementById('lazy-loading-styles')) return;

        const styles = `
            <style id="lazy-loading-styles">
                /* Lazy Loading Styles */
                .lazy-loading {
                    opacity: 0.6;
                    transition: opacity 0.3s ease;
                }

                .lazy-loaded {
                    opacity: 1;
                    animation: fadeIn 0.5s ease;
                }

                .lazy-error {
                    background: #f8f9fa;
                    border: 2px dashed #dee2e6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100px;
                    color: #6c757d;
                }

                .lazy-skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                    min-height: 100px;
                }

                .lazy-blur {
                    filter: blur(5px);
                    transition: filter 0.3s ease;
                }

                .lazy-blur.lazy-loaded {
                    filter: blur(0px);
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* Responsive images */
                .lazy-img {
                    width: 100%;
                    height: auto;
                    display: block;
                }

                /* Loading spinner */
                .lazy-spinner {
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #007bff;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // ==========================================
    // OBSERVACIÓN DE ELEMENTOS
    // ==========================================

    observeElements() {
        // Observar imágenes
        const images = document.querySelectorAll(this.config.imageSelector);
        images.forEach(img => {
            this.prepareImage(img);
            this.observer.observe(img);
        });

        // Observar contenido lazy
        const contentElements = document.querySelectorAll(this.config.contentSelector);
        contentElements.forEach(element => {
            this.prepareContent(element);
            this.observer.observe(element);
        });

        this.log(`👀 Observando ${images.length} imágenes y ${contentElements.length} elementos de contenido`);
    }

    prepareImage(img) {
        // Agregar clase de loading
        img.classList.add(this.config.loadingClass);

        // Configurar skeleton si está habilitado
        if (this.config.enableSkeleton && !img.src) {
            img.classList.add(this.config.skeletonClass);
        }

        // Configurar blur effect si está habilitado
        if (this.config.enableBlur && img.src) {
            img.classList.add('lazy-blur');
        }

        // Configurar placeholder si no hay src
        if (!img.src && !img.dataset.src) {
            img.src = this.generatePlaceholder(img);
        }
    }

    prepareContent(element) {
        element.classList.add(this.config.loadingClass);

        // Crear skeleton loader para contenido
        if (this.config.enableSkeleton) {
            const skeleton = document.createElement('div');
            skeleton.className = `${this.config.skeletonClass} lazy-content-skeleton`;
            skeleton.innerHTML = '<div class="lazy-spinner"></div>';
            element.appendChild(skeleton);
        }
    }

    // ==========================================
    // MANEJO DE INTERSECCIONES
    // ==========================================

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;

                if (element.tagName === 'IMG') {
                    this.loadImage(element);
                } else {
                    this.loadContent(element);
                }

                this.observer.unobserve(element);

                // Callback personalizado
                if (this.config.onIntersect) {
                    this.config.onIntersect(element);
                }
            }
        });
    }

    async loadImage(img) {
        try {
            const src = img.dataset.src || img.src;

            if (!src) {
                throw new Error('No source specified');
            }

            // Precargar imagen
            const imageLoader = new Image();

            const loadPromise = new Promise((resolve, reject) => {
                imageLoader.onload = resolve;
                imageLoader.onerror = reject;
                imageLoader.src = src;
            });

            await loadPromise;

            // Aplicar imagen cargada
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }

            // Aplicar estilos de éxito
            img.classList.remove(this.config.loadingClass, this.config.skeletonClass);
            img.classList.add(this.config.loadedClass);

            this.stats.imagesProcessed++;

            // Callback personalizado
            if (this.config.onLoad) {
                this.config.onLoad(img);
            }

            this.log(`✅ Imagen cargada: ${src.substring(0, 50)}...`);

        } catch (error) {
            this.handleImageError(img, error);
        }
    }

    async loadContent(element) {
        try {
            const contentUrl = element.dataset.lazyContent;

            if (contentUrl) {
                const response = await fetch(contentUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const content = await response.text();
                element.innerHTML = content;
            }

            // Remover skeleton
            const skeleton = element.querySelector('.lazy-content-skeleton');
            if (skeleton) {
                skeleton.remove();
            }

            element.classList.remove(this.config.loadingClass);
            element.classList.add(this.config.loadedClass);

            this.stats.contentLoaded++;
            this.log(`✅ Contenido cargado para elemento`);

        } catch (error) {
            this.handleContentError(element, error);
        }
    }

    // ==========================================
    // MANEJO DE ERRORES
    // ==========================================

    handleImageError(img, error) {
        img.classList.remove(this.config.loadingClass, this.config.skeletonClass);
        img.classList.add(this.config.errorClass);

        // Crear placeholder de error
        const wrapper = document.createElement('div');
        wrapper.className = 'lazy-error';
        wrapper.innerHTML = `
            <div class="text-center">
                <i class="fas fa-image text-muted mb-2"></i>
                <div class="small text-muted">Error al cargar imagen</div>
            </div>
        `;

        img.parentNode.replaceChild(wrapper, img);

        this.stats.errors++;

        if (this.config.onError) {
            this.config.onError(img, error);
        }

        this.log(`❌ Error cargando imagen: ${error.message}`);
    }

    handleContentError(element, error) {
        element.classList.remove(this.config.loadingClass);
        element.classList.add(this.config.errorClass);

        element.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                Error al cargar contenido
            </div>
        `;

        this.stats.errors++;
        this.log(`❌ Error cargando contenido: ${error.message}`);
    }

    // ==========================================
    // OPTIMIZACIONES DE RENDIMIENTO
    // ==========================================

    setupPerformanceOptimizations() {
        // Preload de imágenes críticas
        if (this.config.enablePreload) {
            this.preloadCriticalImages();
        }

        // Optimization para conexiones lentas
        if ('connection' in navigator) {
            this.optimizeForConnection();
        }

        // Priority Hints (experimental)
        this.setupPriorityHints();
    }

    preloadCriticalImages() {
        // Precargar imágenes above-the-fold
        const criticalImages = document.querySelectorAll('img[data-critical="true"]');

        criticalImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.dataset.src || img.src;
            document.head.appendChild(link);
        });

        if (criticalImages.length > 0) {
            this.log(`🚀 Precargando ${criticalImages.length} imágenes críticas`);
        }
    }

    optimizeForConnection() {
        const connection = navigator.connection;

        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            // Conexión lenta: aumentar threshold y reducir calidad
            this.config.threshold = 0.3;
            this.config.rootMargin = '20px';
            this.log('📶 Optimizando para conexión lenta');
        } else if (connection.effectiveType === '4g') {
            // Conexión rápida: precargar más agresivamente
            this.config.rootMargin = '100px';
            this.log('📶 Optimizando para conexión rápida');
        }
    }

    setupPriorityHints() {
        // Experimental: Priority Hints API
        const highPriorityImages = document.querySelectorAll('img[data-priority="high"]');
        highPriorityImages.forEach(img => {
            if ('importance' in img) {
                img.importance = 'high';
            }
        });
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    generatePlaceholder(img) {
        const width = img.width || 300;
        const height = img.height || 200;

        return `data:image/svg+xml;base64,${btoa(`
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f8f9fa"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6c757d">
                    Cargando...
                </text>
            </svg>
        `)}`;
    }

    // ==========================================
    // FALLBACK PARA NAVEGADORES ANTIGUOS
    // ==========================================

    fallbackInit() {
        this.log('🔄 Usando fallback para navegadores antiguos');

        // Cargar todas las imágenes inmediatamente
        const images = document.querySelectorAll(this.config.imageSelector);
        images.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            img.classList.add(this.config.loadedClass);
        });

        // Cargar todo el contenido lazy
        const contentElements = document.querySelectorAll(this.config.contentSelector);
        contentElements.forEach(element => {
            this.loadContent(element);
        });
    }

    // ==========================================
    // API PÚBLICA
    // ==========================================

    refresh() {
        // Re-observar nuevos elementos
        this.observeElements();
        this.log('🔄 Lazy loader actualizado');
    }

    getStats() {
        const elapsed = (Date.now() - this.stats.startTime) / 1000;
        return {
            ...this.stats,
            elapsedTime: elapsed,
            avgLoadTime: this.stats.imagesProcessed > 0 ? elapsed / this.stats.imagesProcessed : 0
        };
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // Remover estilos
        const styles = document.getElementById('lazy-loading-styles');
        if (styles) {
            styles.remove();
        }

        this.log('🗑️ Lazy loader destruido');
    }
}

// ==========================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyLoader);
} else {
    initLazyLoader();
}

function initLazyLoader() {
    // Configuración específica para BGE
    window.lazyLoader = new AdvancedLazyLoader({
        imageSelector: 'img[data-src], img[loading="lazy"], .lazy-img',
        contentSelector: '[data-lazy-content]',
        rootMargin: '75px',
        threshold: 0.1,
        enablePreload: true,
        enableBlur: false, // Deshabilitado para mejor UX en educativo
        enableSkeleton: true,
        enableFadeIn: true,

        onLoad: function(element) {
            // Callback personalizado para tracking
            if (window.gtag) {
                gtag('event', 'lazy_load', {
                    event_category: 'performance',
                    event_label: element.src || element.dataset.lazyContent
                });
            }
        },

        onError: function(element, error) {
            console.warn('[BGE] Error en lazy loading:', error);
        }
    });

    // Exponer estadísticas en consola
    setTimeout(() => {
        const stats = window.lazyLoader.getStats();
        console.log(`[BGE] Lazy Loading Stats:`, stats);
    }, 5000);
}

// ==========================================
// EXPORTAR PARA USO MODULAR
// ==========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedLazyLoader;
}