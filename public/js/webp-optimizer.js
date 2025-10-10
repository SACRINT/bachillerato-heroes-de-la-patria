/**
 * 🖼️ WEBP OPTIMIZER - FASE 4.1
 * Sistema de optimización y conversión automática a WebP para BGE Héroes de la Patria
 * Detección de soporte, conversión dinámica y fallbacks
 */

class WebPOptimizer {
    constructor() {
        this.webpSupported = null;
        this.conversionQueue = [];
        this.convertedImages = new Map();
        this.fallbackImages = new Map();
        this.compressionQuality = 0.85;

        this.config = {
            enableAutoConversion: true,
            enableFallback: true,
            enableProgressiveLoading: true,
            enableRetinaOptimization: true,
            maxWidth: 1920,
            maxHeight: 1080
        };

        this.init();
    }

    async init() {
        await this.detectWebPSupport();
        this.setupImageOptimization();
        this.createWebPVersions();
        this.setupResponsiveImages();
        this.optimizeExistingImages();

        console.log(`🖼️ WebP Optimizer inicializado - Soporte: ${this.webpSupported ? '✅' : '❌'}`);
    }

    async detectWebPSupport() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                this.webpSupported = (webP.height === 2);
                resolve(this.webpSupported);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    setupImageOptimization() {
        // Optimizar todas las imágenes existentes
        const images = document.querySelectorAll('img');
        images.forEach(img => this.optimizeImage(img));

        // Observer para nuevas imágenes
        const imageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const newImages = node.querySelectorAll ? node.querySelectorAll('img') : [];
                        newImages.forEach(img => this.optimizeImage(img));

                        if (node.tagName === 'IMG') {
                            this.optimizeImage(node);
                        }
                    }
                });
            });
        });

        imageObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async optimizeImage(img) {
        if (img.dataset.optimized) return;

        const originalSrc = img.src || img.dataset.src;
        if (!originalSrc) return;

        try {
            // Marcar como en proceso
            img.dataset.optimized = 'processing';

            // Optimizar basado en soporte WebP
            if (this.webpSupported) {
                await this.convertToWebP(img, originalSrc);
            } else {
                await this.optimizeNonWebP(img, originalSrc);
            }

            // Aplicar lazy loading si no está presente
            this.setupLazyLoading(img);

            // Configurar responsive loading
            this.setupResponsiveLoading(img);

            img.dataset.optimized = 'complete';

        } catch (error) {
            console.warn('Error optimizando imagen:', error);
            img.dataset.optimized = 'error';
        }
    }

    async convertToWebP(img, originalSrc) {
        // Verificar si ya tenemos una versión WebP
        const webpSrc = this.getWebPSrc(originalSrc);

        // Intentar cargar versión WebP existente
        const webpExists = await this.checkImageExists(webpSrc);

        if (webpExists) {
            this.replaceImageSrc(img, webpSrc, originalSrc);
        } else {
            // Convertir dinámicamente si es posible
            await this.dynamicWebPConversion(img, originalSrc);
        }
    }

    async optimizeNonWebP(img, originalSrc) {
        // Optimizaciones para navegadores sin soporte WebP
        this.setupProgressiveLoading(img);
        this.optimizeImageSize(img);
    }

    getWebPSrc(originalSrc) {
        // Reemplazar extensión con .webp
        return originalSrc.replace(/\.(jpe?g|png)(\?.*)?$/i, '.webp$2');
    }

    async checkImageExists(src) {
        return new Promise((resolve) => {
            // Validar que la URL no sea data: malformada
            if (src.startsWith('data:') && src.includes('==-')) {
                console.warn('⚠️ Data URL malformada detectada:', src.substring(0, 100) + '...');
                resolve(false);
                return;
            }

            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => {
                // Silenciar errores de imágenes WebP que no existen (es normal en desarrollo)
                // console.warn('❌ Error cargando imagen:', src.substring(0, 100) + '...');
                resolve(false);
            };
            img.src = src;
        });
    }

    replaceImageSrc(img, webpSrc, fallbackSrc) {
        // Configurar picture element para fallback
        if (img.parentNode.tagName !== 'PICTURE') {
            this.wrapInPicture(img, webpSrc, fallbackSrc);
        } else {
            img.src = webpSrc;
        }
    }

    wrapInPicture(img, webpSrc, fallbackSrc) {
        const picture = document.createElement('picture');

        // Source para WebP
        const webpSource = document.createElement('source');
        webpSource.srcset = webpSrc;
        webpSource.type = 'image/webp';

        // Mantener imagen original como fallback
        img.src = fallbackSrc;

        // Reemplazar en DOM
        img.parentNode.insertBefore(picture, img);
        picture.appendChild(webpSource);
        picture.appendChild(img);

        console.log(`✅ WebP aplicado: ${webpSrc}`);
    }

    async dynamicWebPConversion(img, originalSrc) {
        try {
            // Cargar imagen original
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const originalImg = new Image();

            originalImg.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                originalImg.onload = resolve;
                originalImg.onerror = reject;
                originalImg.src = originalSrc;
            });

            // Configurar canvas
            canvas.width = originalImg.naturalWidth;
            canvas.height = originalImg.naturalHeight;

            // Dibujar imagen
            ctx.drawImage(originalImg, 0, 0);

            // Convertir a WebP
            const webpDataUrl = canvas.toDataURL('image/webp', this.compressionQuality);

            // Aplicar imagen convertida
            img.src = webpDataUrl;
            this.convertedImages.set(originalSrc, webpDataUrl);

            console.log(`🔄 Conversión dinámica a WebP: ${originalSrc}`);

        } catch (error) {
            // Usar imagen original como fallback silenciosamente (sin mostrar error)
            if (img && originalSrc) {
                img.src = originalSrc;
            }
        }
    }

    setupLazyLoading(img) {
        if (img.loading !== 'lazy' && !this.isInViewport(img)) {
            img.loading = 'lazy';
        }
    }

    setupResponsiveLoading(img) {
        // Temporarily disabled to prevent 404 errors on non-existent responsive images
        // This feature requires pre-generated responsive image files (-sm, -md, -lg variants)
        console.log('📱 Responsive loading disabled for:', img.src?.substring(0, 50) + '...');
        return;
    }

    async validateAndApplySrcset(img, srcset) {
        const sources = srcset.split(', ');
        const validSources = [];

        for (const source of sources) {
            const [url] = source.split(' ');
            if (await this.checkImageExists(url)) {
                validSources.push(source);
            }
        }

        if (validSources.length > 1) {
            img.srcset = validSources.join(', ');
            img.sizes = '(max-width: 480px) 480px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, 1920px';
        }
    }

    setupProgressiveLoading(img) {
        // Crear placeholder de baja calidad
        if (!img.dataset.placeholder) {
            const placeholder = this.generateLowQualityPlaceholder(img);
            img.dataset.placeholder = placeholder;

            // Mostrar placeholder primero
            const originalSrc = img.src;
            img.src = placeholder;
            img.classList.add('loading-placeholder');

            // Cargar imagen real en background
            const realImg = new Image();
            realImg.onload = () => {
                img.src = originalSrc;
                img.classList.remove('loading-placeholder');
                img.classList.add('loaded');
            };
            realImg.src = originalSrc;
        }
    }

    generateLowQualityPlaceholder(img) {
        const width = img.width || 300;
        const height = img.height || 200;

        // Crear SVG placeholder con gradiente
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#e9ecef;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#dee2e6;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#gradient)"/>
                <circle cx="50%" cy="40%" r="15" fill="#6c757d" opacity="0.3"/>
                <rect x="20%" y="60%" width="60%" height="5" fill="#6c757d" opacity="0.3" rx="2"/>
                <rect x="20%" y="70%" width="40%" height="5" fill="#6c757d" opacity="0.2" rx="2"/>
            </svg>
        `;

        return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }

    optimizeImageSize(img) {
        // Optimizar tamaño basado en container
        const rect = img.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        if (containerWidth > 0 && containerHeight > 0) {
            // Ajustar resolución basada en densidad de pantalla
            const pixelRatio = window.devicePixelRatio || 1;
            const optimalWidth = Math.min(containerWidth * pixelRatio, this.config.maxWidth);
            const optimalHeight = Math.min(containerHeight * pixelRatio, this.config.maxHeight);

            // Aplicar optimización de tamaño si es necesario
            if (img.naturalWidth > optimalWidth || img.naturalHeight > optimalHeight) {
                this.requestOptimizedSize(img, optimalWidth, optimalHeight);
            }
        }
    }

    requestOptimizedSize(img, width, height) {
        const originalSrc = img.src;
        const optimizedSrc = this.buildOptimizedUrl(originalSrc, width, height);

        // Verificar si existe versión optimizada
        this.checkImageExists(optimizedSrc).then(exists => {
            if (exists) {
                img.src = optimizedSrc;
                console.log(`📐 Tamaño optimizado aplicado: ${width}x${height}`);
            }
        });
    }

    buildOptimizedUrl(src, width, height) {
        // Construir URL con parámetros de redimensionamiento
        const url = new URL(src, window.location.origin);
        url.searchParams.set('w', width);
        url.searchParams.set('h', height);
        url.searchParams.set('q', Math.round(this.compressionQuality * 100));
        return url.toString();
    }

    createWebPVersions() {
        // Solo si tenemos capacidades de procesamiento del lado del servidor
        if (this.hasServerProcessing()) {
            this.requestWebPGeneration();
        }
    }

    hasServerProcessing() {
        // Verificar si el servidor puede procesar imágenes
        return false; // Por ahora, deshabilitado para cliente estático
    }

    setupResponsiveImages() {
        // Configurar imágenes responsive para diferentes breakpoints
        const images = document.querySelectorAll('img:not([srcset])');

        images.forEach(img => {
            this.addResponsiveBehavior(img);
        });
    }

    addResponsiveBehavior(img) {
        // Cambiar imagen basado en tamaño de viewport
        const resizeHandler = () => {
            this.updateImageForViewport(img);
        };

        window.addEventListener('resize', resizeHandler);
        this.updateImageForViewport(img); // Aplicar inmediatamente
    }

    updateImageForViewport(img) {
        const viewport = this.getViewportSize();
        const originalSrc = img.dataset.originalSrc || img.src;

        // Guardar src original si no existe
        if (!img.dataset.originalSrc) {
            img.dataset.originalSrc = originalSrc;
        }

        let targetSrc = originalSrc;

        // Seleccionar versión apropiada basada en viewport
        if (viewport === 'mobile') {
            targetSrc = this.getMobileVersion(originalSrc);
        } else if (viewport === 'tablet') {
            targetSrc = this.getTabletVersion(originalSrc);
        }

        if (targetSrc !== img.src) {
            this.checkImageExists(targetSrc).then(exists => {
                if (exists) {
                    img.src = targetSrc;
                }
            });
        }
    }

    getViewportSize() {
        const width = window.innerWidth;
        if (width <= 480) return 'mobile';
        if (width <= 768) return 'tablet';
        return 'desktop';
    }

    getMobileVersion(src) {
        return src.replace(/(\.[^.]+)$/, '-mobile$1');
    }

    getTabletVersion(src) {
        return src.replace(/(\.[^.]+)$/, '-tablet$1');
    }

    getOriginalExtension(src) {
        const match = src.match(/\.(jpe?g|png|gif)(\?.*)?$/i);
        return match ? `.${match[1]}` : '.jpg';
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

    optimizeExistingImages() {
        // Optimizar imágenes ya cargadas
        const loadedImages = document.querySelectorAll('img:not([data-optimized])');

        loadedImages.forEach(img => {
            if (img.complete && img.naturalHeight > 0) {
                this.optimizeImage(img);
            }
        });
    }

    // API pública
    async convertImageToWebP(imageElement) {
        if (!this.webpSupported) {
            console.warn('WebP no soportado en este navegador');
            return false;
        }

        try {
            await this.optimizeImage(imageElement);
            return true;
        } catch (error) {
            console.error('Error convirtiendo imagen:', error);
            return false;
        }
    }

    getOptimizationStats() {
        return {
            webpSupported: this.webpSupported,
            convertedImages: this.convertedImages.size,
            optimizedImages: document.querySelectorAll('img[data-optimized="complete"]').length,
            totalImages: document.querySelectorAll('img').length
        };
    }

    // Configuración dinámica
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 Configuración WebP actualizada:', this.config);
    }
}

// CSS para efectos de carga
const webpStyles = document.createElement('style');
webpStyles.textContent = `
    .loading-placeholder {
        filter: blur(2px);
        transition: filter 0.3s ease;
    }

    .loaded {
        filter: blur(0);
    }

    img[data-optimized="processing"] {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }

    /* Optimización para conexiones lentas */
    .slow-connection img {
        image-rendering: auto;
        image-rendering: crisp-edges;
        image-rendering: pixelated;
    }
`;
document.head.appendChild(webpStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.webpOptimizer = new WebPOptimizer();
});

// Exponer globalmente
window.WebPOptimizer = WebPOptimizer;