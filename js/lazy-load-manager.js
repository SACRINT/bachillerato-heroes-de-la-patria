/**
 * LAZY LOAD MANAGER - Sistema Avanzado de Carga Diferida
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

class LazyLoadManager {
    constructor(options = {}) {
        this.config = {
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.01,
            loadDelay: options.loadDelay || 300,
            enablePlaceholders: options.enablePlaceholders !== false,
            fadeInDuration: options.fadeInDuration || 400
        };

        this.observers = new Map();
        this.loadedResources = new Set();
        this.loadingQueue = [];
        this.init();
    }

    init() {
        // Verificar soporte de IntersectionObserver
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver no soportado, cargando todo inmediatamente');
            this.loadAllImmediate();
            return;
        }

        this.setupImageObserver();
        this.setupIframeObserver();
        this.setupScriptObserver();
        this.setupBackgroundImageObserver();
        this.observeExistingElements();

        console.log('✅ LazyLoadManager inicializado');
    }

    /**
     * Configurar observador para imágenes
     */
    setupImageObserver() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        });

        this.observers.set('images', imageObserver);
    }

    /**
     * Configurar observador para iframes
     */
    setupIframeObserver() {
        const iframeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadIframe(entry.target);
                    iframeObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        });

        this.observers.set('iframes', iframeObserver);
    }

    /**
     * Configurar observador para scripts
     */
    setupScriptObserver() {
        const scriptObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadScript(entry.target);
                    scriptObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        });

        this.observers.set('scripts', scriptObserver);
    }

    /**
     * Configurar observador para background images
     */
    setupBackgroundImageObserver() {
        const bgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadBackgroundImage(entry.target);
                    bgObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        });

        this.observers.set('backgrounds', bgObserver);
    }

    /**
     * Observar elementos existentes en el DOM
     */
    observeExistingElements() {
        // Imágenes con data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.observe(img, 'images');
        });

        // Iframes con data-src
        document.querySelectorAll('iframe[data-src]').forEach(iframe => {
            this.observe(iframe, 'iframes');
        });

        // Scripts con data-src
        document.querySelectorAll('script[data-src]').forEach(script => {
            this.observe(script, 'scripts');
        });

        // Elementos con background-image
        document.querySelectorAll('[data-bg]').forEach(el => {
            this.observe(el, 'backgrounds');
        });
    }

    /**
     * Observar un elemento específico
     */
    observe(element, type) {
        const observer = this.observers.get(type);
        if (observer) {
            observer.observe(element);
        }
    }

    /**
     * Cargar imagen
     */
    async loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (!src || this.loadedResources.has(src)) return;

        // Mostrar placeholder si está habilitado
        if (this.config.enablePlaceholders) {
            img.classList.add('lazy-loading');
        }

        try {
            // Precargar imagen
            const tempImg = new Image();

            if (srcset) {
                tempImg.srcset = srcset;
            }

            tempImg.src = src;

            await new Promise((resolve, reject) => {
                tempImg.onload = resolve;
                tempImg.onerror = reject;
            });

            // Aplicar src
            if (srcset) {
                img.srcset = srcset;
            }
            img.src = src;

            // Animación de fade-in
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');

            this.loadedResources.add(src);
            console.log(`✅ Imagen cargada: ${src}`);

        } catch (error) {
            console.error(`❌ Error cargando imagen: ${src}`, error);
            img.classList.add('lazy-error');
            img.alt = 'Error al cargar imagen';
        }
    }

    /**
     * Cargar iframe
     */
    loadIframe(iframe) {
        const src = iframe.dataset.src;
        if (!src || this.loadedResources.has(src)) return;

        iframe.src = src;
        iframe.classList.add('lazy-loaded');
        this.loadedResources.add(src);

        console.log(`✅ Iframe cargado: ${src}`);
    }

    /**
     * Cargar script de forma asíncrona
     */
    async loadScript(scriptTag) {
        const src = scriptTag.dataset.src;
        if (!src || this.loadedResources.has(src)) return;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            script.onload = () => {
                console.log(`✅ Script cargado: ${src}`);
                this.loadedResources.add(src);
                scriptTag.classList.add('lazy-loaded');
                resolve();
            };

            script.onerror = () => {
                console.error(`❌ Error cargando script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Cargar background image
     */
    loadBackgroundImage(element) {
        const bgUrl = element.dataset.bg;
        if (!bgUrl || this.loadedResources.has(bgUrl)) return;

        // Precargar imagen
        const img = new Image();
        img.onload = () => {
            element.style.backgroundImage = `url(${bgUrl})`;
            element.classList.add('lazy-loaded');
            this.loadedResources.add(bgUrl);
            console.log(`✅ Background cargado: ${bgUrl}`);
        };

        img.onerror = () => {
            console.error(`❌ Error cargando background: ${bgUrl}`);
            element.classList.add('lazy-error');
        };

        img.src = bgUrl;
    }

    /**
     * Cargar módulo JavaScript bajo demanda
     */
    async loadModule(moduleName, modulePath) {
        if (this.loadedResources.has(moduleName)) {
            return window[moduleName];
        }

        try {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = modulePath;

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            this.loadedResources.add(moduleName);
            console.log(`✅ Módulo cargado: ${moduleName}`);
            return window[moduleName];

        } catch (error) {
            console.error(`❌ Error cargando módulo ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Precargar recursos críticos
     */
    preload(urls, type = 'image') {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            link.as = type;
            document.head.appendChild(link);
        });

        console.log(`🚀 Precargados ${urls.length} recursos de tipo ${type}`);
    }

    /**
     * Prefetch para navegación futura
     */
    prefetch(urls) {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        });

        console.log(`🔮 Prefetch de ${urls.length} recursos`);
    }

    /**
     * Cargar todo inmediatamente (fallback)
     */
    loadAllImmediate() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
            }
        });

        document.querySelectorAll('iframe[data-src]').forEach(iframe => {
            iframe.src = iframe.dataset.src;
        });

        document.querySelectorAll('[data-bg]').forEach(el => {
            el.style.backgroundImage = `url(${el.dataset.bg})`;
        });
    }

    /**
     * Limpiar y destruir observadores
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.loadedResources.clear();
        console.log('🗑️ LazyLoadManager destruido');
    }
}

// Auto-inicializar
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.lazyLoadManager = new LazyLoadManager({
            rootMargin: '100px',
            threshold: 0.01,
            enablePlaceholders: true
        });
    });
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyLoadManager;
}
