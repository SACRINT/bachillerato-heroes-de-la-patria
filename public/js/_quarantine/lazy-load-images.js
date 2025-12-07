/**
 * 🖼️ LAZY LOAD IMAGES - SEMANA 2
 * Implementación de lazy loading para imágenes
 * Reduce tiempo de carga inicial y bandwidth
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================

    const CONFIG = {
        rootMargin: '50px',     // Cargar 50px antes de que sea visible
        threshold: 0.01,         // Trigger cuando 1% es visible
        loadDelay: 100,          // Delay de 100ms para evitar thrashing
        placeholderClass: 'lazy-loading',
        loadedClass: 'lazy-loaded',
        errorClass: 'lazy-error'
    };

    // ============================================
    // LAZY IMAGE LOADER
    // ============================================

    class LazyImageLoader {
        constructor() {
            this.images = [];
            this.observer = null;
            this.stats = {
                total: 0,
                loaded: 0,
                failed: 0,
                savings: 0
            };
            this.init();
        }

        init() {
            console.log('[LazyImages] Initializing lazy image loader...');

            // Verificar si el browser soporta loading="lazy" nativo
            if ('loading' in HTMLImageElement.prototype) {
                console.log('[LazyImages] Native lazy loading supported, using native implementation');
                this.useNativeLazyLoading();
                return;
            }

            // Fallback a IntersectionObserver para browsers antiguos
            console.log('[LazyImages] Using IntersectionObserver polyfill');
            this.setupIntersectionObserver();
            this.findAndObserveLazyImages();
        }

        useNativeLazyLoading() {
            // Para browsers modernos, solo agregar loading="lazy"
            const images = document.querySelectorAll('img:not([loading])');
            images.forEach(img => {
                if (!this.isAboveFold(img)) {
                    img.loading = 'lazy';
                    this.stats.total++;
                }
            });

            console.log(`[LazyImages] Applied native lazy loading to ${this.stats.total} images`);
        }

        setupIntersectionObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Delay para evitar cargar demasiadas imágenes a la vez
                        setTimeout(() => {
                            this.loadImage(entry.target);
                        }, CONFIG.loadDelay);
                    }
                });
            }, {
                rootMargin: CONFIG.rootMargin,
                threshold: CONFIG.threshold
            });
        }

        findAndObserveLazyImages() {
            // Buscar todas las imágenes con data-src o loading="lazy"
            const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');

            images.forEach(img => {
                // Skip si ya está cargada
                if (img.complete && img.naturalHeight !== 0) {
                    return;
                }

                // Agregar a lista de imágenes
                this.images.push(img);
                this.stats.total++;

                // Observar para lazy loading
                if (!this.isAboveFold(img)) {
                    img.classList.add(CONFIG.placeholderClass);
                    this.observer.observe(img);
                } else {
                    // Si está above-the-fold, cargar inmediatamente
                    this.loadImage(img);
                }
            });

            console.log(`[LazyImages] Found ${this.stats.total} images for lazy loading`);
        }

        isAboveFold(img) {
            const rect = img.getBoundingClientRect();
            return rect.top < window.innerHeight;
        }

        loadImage(img) {
            // Si ya está cargada, skip
            if (img.classList.contains(CONFIG.loadedClass)) {
                return;
            }

            console.log(`[LazyImages] Loading: ${img.dataset.src || img.src}`);

            // Obtener URL de la imagen
            const src = img.dataset.src || img.src;
            const srcset = img.dataset.srcset || img.srcset;

            // Pre-cargar en Image object para mejor UX
            const tempImg = new Image();

            tempImg.onload = () => {
                // Aplicar src y srcset
                img.src = src;
                if (srcset) {
                    img.srcset = srcset;
                }

                // Remover placeholder y agregar loaded class
                img.classList.remove(CONFIG.placeholderClass);
                img.classList.add(CONFIG.loadedClass);

                // Remover del observer
                if (this.observer) {
                    this.observer.unobserve(img);
                }

                // Actualizar stats
                this.stats.loaded++;
                console.log(`[LazyImages] ✓ Loaded (${this.stats.loaded}/${this.stats.total}): ${src}`);

                // Disparar evento
                img.dispatchEvent(new CustomEvent('lazyLoaded', {
                    detail: { src }
                }));
            };

            tempImg.onerror = () => {
                console.error(`[LazyImages] ✗ Failed to load: ${src}`);
                img.classList.remove(CONFIG.placeholderClass);
                img.classList.add(CONFIG.errorClass);

                // Actualizar stats
                this.stats.failed++;

                // Disparar evento
                img.dispatchEvent(new CustomEvent('lazyLoadError', {
                    detail: { src }
                }));
            };

            // Iniciar carga
            tempImg.src = src;
            if (srcset) {
                tempImg.srcset = srcset;
            }
        }

        // API pública para forzar carga de una imagen
        forceLoad(img) {
            if (typeof img === 'string') {
                img = document.querySelector(img);
            }

            if (img && img.tagName === 'IMG') {
                this.loadImage(img);
            }
        }

        // API pública para obtener estadísticas
        getStats() {
            return { ...this.stats };
        }
    }

    // ============================================
    // CSS PARA PLACEHOLDERS
    // ============================================

    const style = document.createElement('style');
    style.textContent = `
        img.lazy-loading {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            min-height: 100px;
        }

        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        img.lazy-loaded {
            animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        img.lazy-error {
            border: 2px solid #ff0000;
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.lazyImageLoader = new LazyImageLoader();
        });
    } else {
        window.lazyImageLoader = new LazyImageLoader();
    }

    // Exponer API global
    window.lazyLoadImage = (img) => {
        if (window.lazyImageLoader) {
            window.lazyImageLoader.forceLoad(img);
        }
    };

})();
