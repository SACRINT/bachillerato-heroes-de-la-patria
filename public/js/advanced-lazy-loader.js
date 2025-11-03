/**
 * 🚀 ADVANCED LAZY LOADER - FASE 4.1
 * Sistema de carga diferida inteligente para BGE Héroes de la Patria
 * Optimización de performance y Core Web Vitals
 */

class AdvancedLazyLoader {
    constructor() {
        this.observerOptions = {
            root: null,
            rootMargin: '50px 0px 50px 0px', // Precargar 50px antes de entrar al viewport
            threshold: [0, 0.25, 0.5, 0.75, 1.0]
        };

        this.imageObserver = null;
        this.contentObserver = null;
        this.loadedImages = new Set();
        this.loadQueue = new Map();
        this.performanceMetrics = {
            imagesLoaded: 0,
            totalLoadTime: 0,
            averageLoadTime: 0,
            failedLoads: 0
        };

        this.init();
    }

    init() {
        this.createObservers();
        this.setupImageLazyLoading();
        this.setupContentLazyLoading();
        this.setupPerformanceTracking();
        this.logInitialization();
    }

    createObservers() {
        // Observer para imágenes
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver(
                this.handleImageIntersection.bind(this),
                this.observerOptions
            );

            // Observer para contenido dinámico
            this.contentObserver = new IntersectionObserver(
                this.handleContentIntersection.bind(this),
                { ...this.observerOptions, rootMargin: '100px 0px' }
            );
        } else {
            console.warn('⚠️ IntersectionObserver no soportado, cargando todas las imágenes');
            this.fallbackLoading();
        }
    }

    setupImageLazyLoading() {
        // Buscar todas las imágenes con data-src
        const lazyImages = document.querySelectorAll('img[data-src]');

        lazyImages.forEach(img => {
            // Agregar placeholder mientras carga
            if (!img.src) {
                img.src = this.generatePlaceholder(img);
            }

            // Agregar clase para animaciones
            img.classList.add('lazy-loading');

            // Observar la imagen
            if (this.imageObserver) {
                this.imageObserver.observe(img);
            }
        });

        console.log(`🖼️ Configuradas ${lazyImages.length} imágenes para lazy loading`);
    }

    setupContentLazyLoading() {
        // Buscar contenido con data-lazy-content
        const lazyContent = document.querySelectorAll('[data-lazy-content]');

        lazyContent.forEach(element => {
            if (this.contentObserver) {
                this.contentObserver.observe(element);
            }
        });

        console.log(`📄 Configurados ${lazyContent.length} elementos de contenido para lazy loading`);
    }

    handleImageIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.imageObserver.unobserve(img);
            }
        });
    }

    handleContentIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                this.loadContent(element);
                this.contentObserver.unobserve(element);
            }
        });
    }

    async loadImage(img) {
        const startTime = performance.now();
        const dataSrc = img.getAttribute('data-src');

        if (!dataSrc || this.loadedImages.has(dataSrc)) {
            return;
        }

        try {
            // Crear nueva imagen para precargar
            const newImage = new Image();

            // Configurar eventos de carga
            newImage.onload = () => {
                const loadTime = performance.now() - startTime;
                this.onImageLoadSuccess(img, newImage, loadTime);
            };

            newImage.onerror = () => {
                this.onImageLoadError(img, dataSrc);
            };

            // Optimización: Cargar versión WebP si es soportada
            const optimizedSrc = this.getOptimizedImageSrc(dataSrc);
            newImage.src = optimizedSrc;

        } catch (error) {
            console.error('❌ Error cargando imagen:', error);
            this.onImageLoadError(img, dataSrc);
        }
    }

    onImageLoadSuccess(img, newImage, loadTime) {
        // Actualizar src de la imagen original
        img.src = newImage.src;
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');

        // Remover data-src
        img.removeAttribute('data-src');

        // Marcar como cargada
        this.loadedImages.add(newImage.src);

        // Actualizar métricas
        this.updatePerformanceMetrics(loadTime);

        // Animación de entrada suave
        this.animateImageEntry(img);

        console.log(`✅ Imagen cargada en ${loadTime.toFixed(2)}ms:`, newImage.src);
    }

    onImageLoadError(img, src) {
        // Cargar imagen de fallback
        img.src = this.getFallbackImage();
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');

        this.performanceMetrics.failedLoads++;
        console.warn('⚠️ Error cargando imagen:', src);
    }

    async loadContent(element) {
        const contentType = element.getAttribute('data-lazy-content');

        try {
            switch (contentType) {
                case 'noticias':
                    await this.loadNoticias(element);
                    break;
                case 'eventos':
                    await this.loadEventos(element);
                    break;
                case 'testimonios':
                    await this.loadTestimonios(element);
                    break;
                default:
                    await this.loadGenericContent(element);
            }
        } catch (error) {
            console.error('❌ Error cargando contenido:', error);
            element.innerHTML = '<p class="text-muted">Error cargando contenido</p>';
        }
    }

    async loadNoticias(element) {
        try {
            const response = await fetch('data/noticias.json');
            const noticias = await response.json();

            element.innerHTML = this.renderNoticias(noticias.slice(0, 3));
            element.classList.add('content-loaded');

        } catch (error) {
            throw new Error('Error cargando noticias: ' + error.message);
        }
    }

    async loadEventos(element) {
        try {
            const response = await fetch('data/eventos.json');
            const eventos = await response.json();

            element.innerHTML = this.renderEventos(eventos.slice(0, 3));
            element.classList.add('content-loaded');

        } catch (error) {
            throw new Error('Error cargando eventos: ' + error.message);
        }
    }

    generatePlaceholder(img) {
        const width = img.getAttribute('width') || '300';
        const height = img.getAttribute('height') || '200';

        // Placeholder SVG con gradiente elegante
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#e9ecef;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#dee2e6;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad)"/>
                <text x="50%" y="50%" font-family="system-ui" font-size="14"
                      fill="#6c757d" text-anchor="middle" dy=".3em">
                    Cargando...
                </text>
            </svg>
        `)}`;
    }

    getOptimizedImageSrc(src) {
        // Verificar soporte WebP
        if (this.supportsWebP()) {
            // Reemplazar extensión por .webp si existe
            const webpSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');
            return webpSrc;
        }
        return src;
    }

    supportsWebP() {
        // Cache del resultado
        if (this.webpSupport !== undefined) {
            return this.webpSupport;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;

        this.webpSupport = canvas.toDataURL('image/webp').indexOf('webp') !== -1;
        return this.webpSupport;
    }

    getFallbackImage() {
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23f8f9fa"/><text x="50%" y="50%" font-family="system-ui" font-size="14" fill="%236c757d" text-anchor="middle">Imagen no disponible</text></svg>';
    }

    animateImageEntry(img) {
        // Animación CSS suave para la entrada
        img.style.opacity = '0';
        img.style.transform = 'scale(0.95)';
        img.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        // Trigger de animación
        setTimeout(() => {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
        }, 50);
    }

    updatePerformanceMetrics(loadTime) {
        this.performanceMetrics.imagesLoaded++;
        this.performanceMetrics.totalLoadTime += loadTime;
        this.performanceMetrics.averageLoadTime =
            this.performanceMetrics.totalLoadTime / this.performanceMetrics.imagesLoaded;
    }

    setupPerformanceTracking() {
        // Monitorear Core Web Vitals
        if ('web-vitals' in window) {
            // LCP - Largest Contentful Paint
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('📊 LCP:', lastEntry.startTime.toFixed(2) + 'ms');
            }).observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }

    fallbackLoading() {
        // Carga inmediata para navegadores sin soporte
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
    }

    renderNoticias(noticias) {
        return noticias.map(noticia => `
            <div class="card mb-3">
                <div class="card-body">
                    <h6 class="card-title">${noticia.titulo}</h6>
                    <p class="card-text">${noticia.resumen}</p>
                    <small class="text-muted">${new Date(noticia.fecha).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }

    renderEventos(eventos) {
        return eventos.map(evento => `
            <div class="card mb-3">
                <div class="card-body">
                    <h6 class="card-title">${evento.titulo}</h6>
                    <p class="card-text">${evento.descripcion}</p>
                    <small class="text-muted">${new Date(evento.fecha).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }

    logInitialization() {
        console.log(`
🚀 Advanced Lazy Loader Inicializado
📊 Métricas de Performance:
   - Soporte WebP: ${this.supportsWebP() ? '✅' : '❌'}
   - IntersectionObserver: ${this.imageObserver ? '✅' : '❌'}
   - Imágenes detectadas: ${document.querySelectorAll('img[data-src]').length}
        `);
    }

    // API Pública para estadísticas
    getPerformanceStats() {
        return {
            ...this.performanceMetrics,
            webpSupported: this.supportsWebP(),
            totalImages: this.loadedImages.size
        };
    }

    // Método para forzar carga de todas las imágenes restantes
    loadAllRemaining() {
        const remainingImages = document.querySelectorAll('img[data-src]');
        remainingImages.forEach(img => this.loadImage(img));

        const remainingContent = document.querySelectorAll('[data-lazy-content]');
        remainingContent.forEach(element => this.loadContent(element));
    }
}

// CSS para animaciones
const lazyLoaderStyles = document.createElement('style');
lazyLoaderStyles.textContent = `
    .lazy-loading {
        filter: blur(2px);
        transition: filter 0.3s ease;
    }

    .lazy-loaded {
        filter: blur(0);
    }

    .lazy-error {
        opacity: 0.7;
        filter: grayscale(100%);
    }

    .content-loaded {
        animation: fadeInUp 0.5s ease forwards;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(lazyLoaderStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.advancedLazyLoader = new AdvancedLazyLoader();
});

// Exponer globalmente
window.AdvancedLazyLoader = AdvancedLazyLoader;