/**
 * 🚀 LAZY LOADING OPTIMIZER - FASE 2 OPTIMIZACIÓN
 * Sistema avanzado de carga perezosa para mejorar el rendimiento
 */

class LazyLoadingOptimizer {
    constructor() {
        this.imageObserver = null;
        this.loadedImages = new Set();
        this.imageQueue = [];
        this.isLoading = false;
        this.connectionSpeed = 'fast'; // fast, slow, 2g, 3g, 4g
        
        this.init();
    }

    init() {
        //console.log('🚀 Inicializando Lazy Loading Optimizer...');
        
        // Detectar velocidad de conexión
        this.detectConnectionSpeed();
        
        // Configurar Intersection Observer
        this.setupIntersectionObserver();
        
        // Procesar imágenes existentes
        this.processExistingImages();
        
        // Observar nuevas imágenes añadidas dinámicamente
        this.observeNewImages();
        
        //console.log('✅ Lazy Loading Optimizer inicializado');
    }

    detectConnectionSpeed() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.connectionSpeed = connection.effectiveType || 'fast';
            
            //console.log(`📶 Conexión detectada: ${this.connectionSpeed}`);
            
            // Ajustar estrategia según velocidad
            if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
                this.connectionSpeed = 'slow';
            }
        }
    }

    setupIntersectionObserver() {
        const options = {
            // Ajustar rootMargin según velocidad de conexión
            rootMargin: this.connectionSpeed === 'slow' ? '50px' : '200px',
            threshold: 0.1
        };

        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, options);
    }

    processExistingImages() {
        // Procesar todas las imágenes existentes
        const images = document.querySelectorAll('img[data-src], img[src]');
        
        images.forEach(img => {
            this.prepareImageForLazyLoading(img);
        });
        
        //console.log(`📸 ${images.length} imágenes preparadas para lazy loading`);
    }

    prepareImageForLazyLoading(img) {
        // Si la imagen ya tiene src y no data-src, convertirla
        if (img.src && !img.dataset.src && !this.isAboveTheFold(img)) {
            img.dataset.src = img.src;
            img.src = this.generatePlaceholder(img);
            img.classList.add('lazy-image');
        }
        
        // Si ya tiene data-src, está lista para lazy loading
        if (img.dataset.src) {
            img.classList.add('lazy-image');
            this.imageObserver.observe(img);
        }
    }

    isAboveTheFold(img) {
        const rect = img.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }

    generatePlaceholder(img) {
        const width = img.offsetWidth || 300;
        const height = img.offsetHeight || 200;
        
        // Generar placeholder SVG con el color promedio
        return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='%23f0f0f0' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='14' fill='%23999'%3ECargando...%3C/text%3E%3C/svg%3E`;
    }

    async loadImage(img) {
        if (this.loadedImages.has(img) || !img.dataset.src) return;
        
        this.loadedImages.add(img);
        this.imageObserver.unobserve(img);
        
        try {
            // Precargar la imagen
            const fullImg = new Image();
            
            // Añadir efecto de carga
            img.classList.add('loading');
            
            fullImg.onload = () => {
                // Usar WebP si está soportado
                const finalSrc = this.getOptimalImageFormat(img.dataset.src);
                
                img.src = finalSrc;
                img.classList.remove('loading');
                img.classList.add('loaded');
                
                // Efecto de fade-in
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    img.style.opacity = '1';
                }, 10);
                
                //console.log(`✅ Imagen cargada: ${finalSrc}`);
            };
            
            fullImg.onerror = () => {
                img.classList.remove('loading');
                img.classList.add('error');
                console.warn(`❌ Error cargando imagen: ${img.dataset.src}`);
            };
            
            fullImg.src = img.dataset.src;
            
        } catch (error) {
            console.error('Error en lazy loading:', error);
        }
    }

    getOptimalImageFormat(src) {
        // Si el navegador soporta WebP, intentar usar la versión WebP
        if (this.supportsWebP() && src.includes('.jpg')) {
            const webpSrc = src.replace(/\.(jpg|jpeg)$/i, '.webp');
            return webpSrc;
        }
        return src;
    }

    supportsWebP() {
        if (this.webpSupport !== undefined) return this.webpSupport;
        
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        this.webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        
        return this.webpSupport;
    }

    observeNewImages() {
        // Observar cuando se añaden nuevas imágenes al DOM
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        const images = node.querySelectorAll ? 
                            node.querySelectorAll('img') : 
                            (node.tagName === 'IMG' ? [node] : []);
                        
                        images.forEach(img => {
                            this.prepareImageForLazyLoading(img);
                        });
                    }
                });
            });
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Método público para forzar la carga de todas las imágenes
    loadAllImages() {
        const lazyImages = document.querySelectorAll('img.lazy-image');
        lazyImages.forEach(img => {
            this.loadImage(img);
        });
    }

    // Precargar imágenes críticas
    preloadCriticalImages() {
        const criticalImages = document.querySelectorAll('img[data-critical="true"]');
        
        criticalImages.forEach(img => {
            if (img.dataset.src) {
                this.loadImage(img);
            }
        });
    }

    // Estadísticas de rendimiento
    getPerformanceStats() {
        const lazyImages = document.querySelectorAll('img.lazy-image');
        const loadedImages = document.querySelectorAll('img.loaded');
        
        return {
            totalImages: lazyImages.length,
            loadedImages: loadedImages.length,
            pendingImages: lazyImages.length - loadedImages.length,
            connectionSpeed: this.connectionSpeed,
            webpSupport: this.supportsWebP()
        };
    }
}

// CSS para efectos de lazy loading
const lazyLoadingCSS = `
    .lazy-image {
        transition: opacity 0.3s ease;
    }
    
    .lazy-image.loading {
        opacity: 0.7;
        filter: blur(2px);
    }
    
    .lazy-image.loaded {
        opacity: 1;
        filter: none;
    }
    
    .lazy-image.error {
        opacity: 0.5;
        filter: grayscale(100%);
    }
    
    /* Placeholder animation */
    .lazy-image:not(.loaded) {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
`;

// Inyectar CSS
const style = document.createElement('style');
style.textContent = lazyLoadingCSS;
document.head.appendChild(style);

// Inicializar automáticamente
let lazyLoadingOptimizer;

document.addEventListener('DOMContentLoaded', () => {
    lazyLoadingOptimizer = new LazyLoadingOptimizer();
    
    // Hacer accesible globalmente
    window.lazyLoadingOptimizer = lazyLoadingOptimizer;
});

// Exponer la clase para uso manual
window.LazyLoadingOptimizer = LazyLoadingOptimizer;