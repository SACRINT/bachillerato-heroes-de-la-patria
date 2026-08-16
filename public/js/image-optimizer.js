/**
 * 🖼️ IMAGE OPTIMIZER - Optimización Avanzada de Imágenes
 * Bachillerato General Estatal "Héroes de la Patria"
 * Sistema completo de optimización, compresión y gestión de imágenes
 */

// Verificar si ya existe para evitar declaraciones duplicadas
if (typeof ImageOptimizer === 'undefined') {
class ImageOptimizer {
    constructor() {
        this.supportedFormats = {
            webp: this.supportsWebP(),
            avif: this.supportsAVIF(),
            jpeg2000: this.supportsJPEG2000(),
            jpegXL: this.supportsJPEGXL()
        };
        
        this.compressionQualities = {
            high: 0.85,
            medium: 0.7,
            low: 0.5,
            adaptive: 'auto'
        };
        
        this.viewportSizes = {
            mobile: 480,
            tablet: 768,
            desktop: 1200,
            xl: 1920
        };
        
        this.metrics = {
            imagesOptimized: 0,
            bytesReduced: 0,
            loadTimeImproved: 0,
            lazyLoadApplied: 0,
            formatUpgrades: 0
        };
        
        this.imageCache = new Map();
        this.compressionWorkers = [];
        this.observedImages = new Set();
        
        this.init();
    }

    init() {
        //void 0;
        
        this.setupLazyLoading();
        this.optimizeExistingImages();
        this.setupResponsiveImages();
        this.setupImageCompression();
        this.setupPerformanceMonitoring();
        // DESHABILITADO - CSP bloquea Web Workers (evita violaciones CSP)
        // this.setupWebWorkers();
        
        //void 0;
        //void 0;
    }

    // ============================================
    // DETECCIÓN DE SOPORTE DE FORMATOS
    // ============================================

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    supportsAVIF() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }

    supportsJPEG2000() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/jp2').indexOf('data:image/jp2') === 0;
    }

    supportsJPEGXL() {
        // JPEG XL support is limited, but we can check
        return 'createImageBitmap' in window && 'ImageDecoder' in window;
    }

    // ============================================
    // LAZY LOADING AVANZADO
    // ============================================

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });

            // Observar imágenes con data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                observer.observe(img);
                this.observedImages.add(img);
            });

            // Observar nuevas imágenes dinámicamente
            this.setupDynamicImageObserver(observer);
        } else {
            // Fallback para navegadores sin IntersectionObserver
            this.loadAllImages();
        }
    }

    setupDynamicImageObserver(observer) {
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        const images = node.tagName === 'IMG' ? [node] : 
                                     node.querySelectorAll ? Array.from(node.querySelectorAll('img[data-src]')) : [];
                        
                        images.forEach(img => {
                            if (!this.observedImages.has(img)) {
                                observer.observe(img);
                                this.observedImages.add(img);
                            }
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

    async loadImage(img) {
        const dataSrc = img.dataset.src;
        if (!dataSrc) return;

        try {
            img.classList.add('loading');
            
            // Seleccionar el mejor formato disponible
            const optimizedSrc = this.selectBestFormat(dataSrc);
            
            // Precargar la imagen
            const preloadImg = new Image();
            preloadImg.onload = () => {
                img.src = optimizedSrc;
                img.removeAttribute('data-src');
                img.classList.remove('loading');
                img.classList.add('loaded');
                
                this.metrics.lazyLoadApplied++;
                this.checkImageOptimization(img);
            };
            
            preloadImg.onerror = () => {
                // Fallback to original source
                img.src = dataSrc;
                img.removeAttribute('data-src');
                img.classList.remove('loading');
                img.classList.add('error');
            };
            
            preloadImg.src = optimizedSrc;
            
        } catch (error) {
            void 0;
            img.src = dataSrc;
            img.classList.remove('loading');
            img.classList.add('error');
        }
    }

    loadAllImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.loadImage(img);
        });
    }

    // ============================================
    // SELECCIÓN DE FORMATO ÓPTIMO
    // ============================================

    selectBestFormat(originalSrc) {
        const extension = originalSrc.split('.').pop().toLowerCase();
        const baseName = originalSrc.replace(/\.[^/.]+$/, "");
        
        // Priority order: AVIF > WebP > JPEG 2000 > Original
        if (this.supportedFormats.avif && this.isCompatibleForAVIF(extension)) {
            const avifSrc = `${baseName}.avif`;
            this.metrics.formatUpgrades++;
            return avifSrc;
        }
        
        if (this.supportedFormats.webp && this.isCompatibleForWebP(extension)) {
            const webpSrc = `${baseName}.webp`;
            this.metrics.formatUpgrades++;
            return webpSrc;
        }
        
        return originalSrc;
    }

    isCompatibleForWebP(extension) {
        return ['jpg', 'jpeg', 'png'].includes(extension);
    }

    isCompatibleForAVIF(extension) {
        return ['jpg', 'jpeg', 'png', 'webp'].includes(extension);
    }

    // ============================================
    // OPTIMIZACIÓN DE IMÁGENES EXISTENTES
    // ============================================

    optimizeExistingImages() {
        const images = document.querySelectorAll('img:not([data-src])');
        
        images.forEach(img => {
            this.optimizeImage(img);
        });
    }

    optimizeImage(img) {
        // LITE MODE - Only basic optimizations to avoid 404 errors
        
        // Agregar loading="lazy" si no existe
        if (!img.hasAttribute('loading') && !img.hasAttribute('data-src')) {
            img.setAttribute('loading', 'lazy');
        }

        // Skip advanced optimizations that require backend/missing images
        // this.optimizeImageSources(img);
        // this.wrapWithPictureElement(img);
        // this.applyAdaptiveCompression(img);
        
        //void 0;
        this.metrics.imagesOptimized++;
    }

    optimizeImageSources(img) {
        const originalSrc = img.src;
        if (!originalSrc) return;

        // Generar srcset automático
        if (!img.hasAttribute('srcset')) {
            const srcset = this.generateSrcSet(originalSrc);
            if (srcset) {
                img.srcset = srcset;
            }
        }

        // Agregar sizes automático
        if (!img.hasAttribute('sizes')) {
            const sizes = this.generateSizes(img);
            img.sizes = sizes;
        }
    }

    generateSrcSet(originalSrc) {
        const baseName = originalSrc.replace(/\.[^/.]+$/, "");
        const extension = originalSrc.split('.').pop();
        
        const srcsetEntries = [];
        
        // Generar múltiples tamaños
        Object.entries(this.viewportSizes).forEach(([size, width]) => {
            srcsetEntries.push(`${baseName}-${width}w.${extension} ${width}w`);
        });
        
        // Agregar el original como fallback
        const img = new Image();
        img.onload = () => {
            srcsetEntries.push(`${originalSrc} ${img.naturalWidth}w`);
        };
        img.src = originalSrc;
        
        return srcsetEntries.join(', ');
    }

    generateSizes(img) {
        // Detectar el ancho actual de la imagen
        const computedStyle = window.getComputedStyle(img);
        const containerWidth = img.parentElement ? img.parentElement.offsetWidth : window.innerWidth;
        
        // Generar sizes responsivo
        return `(max-width: ${this.viewportSizes.mobile}px) 100vw, ` +
               `(max-width: ${this.viewportSizes.tablet}px) 50vw, ` +
               `(max-width: ${this.viewportSizes.desktop}px) 33vw, ` +
               `25vw`;
    }

    wrapWithPictureElement(img) {
        // Solo si el navegador soporta formatos modernos y la imagen no está ya en un picture
        if (img.closest('picture') || !this.shouldWrapWithPicture(img)) {
            return;
        }

        const picture = document.createElement('picture');
        const originalSrc = img.src;
        const baseName = originalSrc.replace(/\.[^/.]+$/, "");
        
        // Agregar sources para formatos modernos
        if (this.supportedFormats.avif) {
            const avifSource = document.createElement('source');
            avifSource.srcset = `${baseName}.avif`;
            avifSource.type = 'image/avif';
            picture.appendChild(avifSource);
        }
        
        if (this.supportedFormats.webp) {
            const webpSource = document.createElement('source');
            webpSource.srcset = `${baseName}.webp`;
            webpSource.type = 'image/webp';
            picture.appendChild(webpSource);
        }
        
        // Insertar picture y mover img dentro
        img.parentNode.insertBefore(picture, img);
        picture.appendChild(img);
    }

    shouldWrapWithPicture(img) {
        const src = img.src || img.dataset.src;
        return src && (this.supportedFormats.webp || this.supportedFormats.avif);
    }

    // ============================================
    // COMPRESIÓN ADAPTIVA
    // ============================================

    applyAdaptiveCompression(img) {
        // Detectar conexión de red
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const slowConnection = connection && (
            connection.effectiveType === '2g' || 
            connection.effectiveType === 'slow-2g' ||
            connection.saveData
        );

        if (slowConnection) {
            this.applyLowQualityMode(img);
        } else {
            this.applyHighQualityMode(img);
        }
    }

    applyLowQualityMode(img) {
        // Usar versiones comprimidas para conexiones lentas
        const src = img.src || img.dataset.src;
        if (src && !src.includes('-compressed')) {
            const compressedSrc = src.replace(/(\.[^.]+)$/, '-compressed$1');
            if (img.dataset.src) {
                img.dataset.src = compressedSrc;
            } else {
                img.src = compressedSrc;
            }
        }
    }

    applyHighQualityMode(img) {
        // Mantener calidad original para conexiones rápidas
        // Esto es el comportamiento por defecto
    }

    // ============================================
    // RESPONSIVE IMAGES
    // ============================================

    setupResponsiveImages() {
        // Listener para cambios de viewport
        window.addEventListener('resize', this.debounce(() => {
            this.updateResponsiveImages();
        }, 250));

        // Listener para cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateResponsiveImages();
            }, 100);
        });
    }

    updateResponsiveImages() {
        const images = document.querySelectorAll('img[srcset]');
        
        images.forEach(img => {
            // El navegador maneja automáticamente srcset, pero podemos optimizar más
            this.checkImageOptimization(img);
        });
    }

    // ============================================
    // COMPRESIÓN EN TIEMPO REAL
    // ============================================

    setupImageCompression() {
        // Interceptar carga de imágenes para compresión en tiempo real
        this.interceptImageLoading();
    }

    interceptImageLoading() {
        const originalSetAttribute = Element.prototype.setAttribute;
        
        Element.prototype.setAttribute = function(name, value) {
            if (this.tagName === 'IMG' && name === 'src') {
                // Procesar imagen antes de cargar
                value = window.imageOptimizer.processImageSrc(value);
            }
            originalSetAttribute.call(this, name, value);
        };
    }

    processImageSrc(src) {
        // Aplicar optimizaciones automáticas al src
        if (this.shouldCompress(src)) {
            return this.generateOptimizedSrc(src);
        }
        return src;
    }

    shouldCompress(src) {
        // No comprimir si ya está optimizado o es muy pequeña
        return !src.includes('-optimized') && 
               !src.includes('data:') && 
               !src.includes('.svg');
    }

    generateOptimizedSrc(src) {
        // Generar URL optimizada basada en viewport y conexión
        const currentViewport = this.getCurrentViewport();
        const connection = this.getConnectionQuality();
        
        const baseName = src.replace(/\.[^/.]+$/, "");
        const extension = src.split('.').pop();
        
        return `${baseName}-${currentViewport}-${connection}.${extension}`;
    }

    getCurrentViewport() {
        const width = window.innerWidth;
        
        if (width <= this.viewportSizes.mobile) return 'mobile';
        if (width <= this.viewportSizes.tablet) return 'tablet';
        if (width <= this.viewportSizes.desktop) return 'desktop';
        return 'xl';
    }

    getConnectionQuality() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (!connection) return 'high';
        
        if (connection.saveData || connection.effectiveType === '2g') return 'low';
        if (connection.effectiveType === '3g') return 'medium';
        return 'high';
    }

    // ============================================
    // WEB WORKERS PARA COMPRESIÓN
    // ============================================

    setupWebWorkers() {
        // Crear workers para compresión en background
        const workerCode = `
            self.onmessage = function(e) {
                const { imageData, quality, format } = e.data;
                
                // Simular compresión (en implementación real usarías librerías como Sharp o similar)
                const compressedData = compressImage(imageData, quality, format);
                
                self.postMessage({
                    compressedData: compressedData,
                    originalSize: imageData.length,
                    compressedSize: compressedData.length
                });
            };
            
            function compressImage(imageData, quality, format) {
                // Implementación simulada de compresión
                // En producción, usarías una librería real de compresión
                return imageData;
            }
        `;
        
        try {
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            
            // Crear múltiples workers para procesamiento paralelo
            for (let i = 0; i < Math.min(navigator.hardwareConcurrency || 2, 4); i++) {
                const worker = new Worker(workerUrl);
                worker.onmessage = this.handleWorkerMessage.bind(this);
                this.compressionWorkers.push(worker);
            }
        } catch (error) {
            void 0;
        }
    }

    handleWorkerMessage(event) {
        const { compressedData, originalSize, compressedSize } = event.data;
        
        // Actualizar métricas
        this.metrics.bytesReduced += originalSize - compressedSize;
        
        //void 0;
    }

    // ============================================
    // MONITOREO DE PERFORMANCE
    // ============================================

    setupPerformanceMonitoring() {
        // Monitorear tiempos de carga de imágenes
        this.monitorImageLoadTimes();
        
        // Monitorear uso de memoria
        this.monitorMemoryUsage();
        
        // Reportar métricas periódicamente
        setInterval(() => {
            this.reportMetrics();
        }, 60000); // Cada minuto
    }

    monitorImageLoadTimes() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.initiatorType === 'img') {
                    this.recordImageLoadTime(entry);
                }
            }
        });
        
        try {
            observer.observe({ entryTypes: ['resource'] });
        } catch (error) {
            void 0;
        }
    }

    recordImageLoadTime(entry) {
        const loadTime = entry.responseEnd - entry.startTime;
        
        // Actualizar métricas de performance
        this.metrics.loadTimeImproved += loadTime < 200 ? 50 : 0; // Bonus por carga rápida
        
        //void 0;
    }

    monitorMemoryUsage() {
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
                
                if (usage > 80) {
                    void 0;
                    this.clearImageCache();
                }
            }, 30000);
        }
    }

    clearImageCache() {
        this.imageCache.clear();
        
        // Forzar garbage collection si está disponible
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    checkImageOptimization(img) {
        // Verificar si la imagen está realmente optimizada
        const src = img.currentSrc || img.src;
        
        if (src) {
            const isOptimized = src.includes('.webp') || 
                              src.includes('.avif') || 
                              img.closest('picture');
            
            if (isOptimized) {
                img.classList.add('optimized');
            }
        }
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    // Optimizar una imagen específica
    optimizeSpecificImage(img) {
        if (img.tagName === 'IMG') {
            this.optimizeImage(img);
        }
    }

    // Optimizar todas las imágenes de un contenedor
    optimizeContainer(container) {
        const images = container.querySelectorAll('img');
        images.forEach(img => this.optimizeImage(img));
    }

    // Obtener métricas de optimización
    getMetrics() {
        return {
            ...this.metrics,
            totalImagesOnPage: document.querySelectorAll('img').length,
            supportedFormats: this.supportedFormats,
            cacheSize: this.imageCache.size
        };
    }

    // Forzar reoptimización de todas las imágenes
    reoptimizeAll() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.classList.remove('optimized');
            this.optimizeImage(img);
        });
    }

    // Configurar calidad de compresión
    setCompressionQuality(quality) {
        if (typeof quality === 'number' && quality >= 0 && quality <= 1) {
            this.compressionQualities.adaptive = quality;
        }
    }

    reportMetrics() {
        console.group('🖼️ Image Optimizer Metrics');
        console.table(this.getMetrics());
        console.groupEnd();
    }
}

// Auto-inicialización
let imageOptimizer;

document.addEventListener('DOMContentLoaded', () => {
    imageOptimizer = new ImageOptimizer();
    
    // Hacer disponible globalmente para debug
    window.imageOptimizer = imageOptimizer;
});

// Agregar estilos para loading states
const imageOptimizerStyles = document.createElement('style');
imageOptimizerStyles.textContent = `
    /* Image loading states */
    img.loading {
        opacity: 0.5;
        filter: blur(2px);
        transition: opacity 0.3s ease, filter 0.3s ease;
    }
    
    img.loaded {
        opacity: 1;
        filter: none;
    }
    
    img.error {
        opacity: 0.7;
        filter: grayscale(100%);
    }
    
    img.optimized {
        position: relative;
    }
    
    /* Skeleton loading for images */
    img[data-src] {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        min-height: 100px;
    }
    
    @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    
    /* Responsive image containers */
    .responsive-image-container {
        position: relative;
        overflow: hidden;
    }
    
    .responsive-image-container img {
        width: 100%;
        height: auto;
        object-fit: cover;
    }
    
    /* Optimization indicator */
    .optimized::after {
        content: '🚀';
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 10px;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .optimized:hover::after {
        opacity: 1;
    }
`;

document.head.appendChild(imageOptimizerStyles);

// Exponer la clase
window.ImageOptimizer = ImageOptimizer;

//void 0;
}