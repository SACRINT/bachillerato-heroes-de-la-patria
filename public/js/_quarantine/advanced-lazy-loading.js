/**
 * Sistema de Lazy Loading Avanzado BGE
 * Versión: 1.0
 * Fecha: 21-09-2025
 */

class BGEAdvancedLazyLoading {
    constructor() {
        this.observers = new Map();
        this.loadedResources = new Set();
        this.preloadQueue = [];
        this.isProcessingQueue = false;
        this.config = this.loadConfig();
        this.performance = {
            totalImages: 0,
            loadedImages: 0,
            failedImages: 0,
            averageLoadTime: 0,
            bandwidth: 'unknown'
        };

        console.log('🚀 [ADVANCED-LAZY] Sistema iniciado');
        this.init();
    }

    loadConfig() {
        const stored = localStorage.getItem('bge_lazy_config');
        const defaultConfig = {
            rootMargin: '100px',
            threshold: 0.1,
            enablePreloading: true,
            maxPreloadDistance: 3,
            adaptiveThreshold: true,
            webpSupport: this.supportsWebP(),
            avifSupport: this.supportsAVIF(),
            enableBlurPlaceholder: true,
            enableProgressiveLoading: true,
            retryAttempts: 2,
            lazyVideos: true,
            lazyIframes: true,
            lazyBackgrounds: true
        };

        return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    }

    supportsWebP() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            return canvas.toDataURL('image/webp').indexOf('webp') > -1;
        } catch (e) {
            return false;
        }
    }

    supportsAVIF() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            return canvas.toDataURL('image/avif').indexOf('avif') > -1;
        } catch (e) {
            return false;
        }
    }

    init() {
        this.estimateBandwidth();
        this.adaptConfiguration();
        this.setupObservers();
        this.processExistingElements();
        this.setupMutationObserver();
        this.setupPerformanceMonitoring();
    }

    async estimateBandwidth() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.performance.bandwidth = connection.effectiveType || 'unknown';

            // Adaptar configuración basada en conexión
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.config.rootMargin = '50px';
                this.config.maxPreloadDistance = 1;
                this.config.enablePreloading = false;
            } else if (connection.effectiveType === '3g') {
                this.config.rootMargin = '75px';
                this.config.maxPreloadDistance = 2;
            }

            console.log(`📡 [ADVANCED-LAZY] Conexión detectada: ${connection.effectiveType}`);
        }

        // Test de velocidad básico
        try {
            const start = performance.now();
            await fetch('/favicon.ico?' + Date.now(), {
                method: 'HEAD',
                cache: 'no-cache'
            });
            const responseTime = performance.now() - start;

            if (responseTime > 1000) {
                this.config.enablePreloading = false;
                this.config.rootMargin = '25px';
            }
        } catch (error) {
            console.warn('⚠️ [ADVANCED-LAZY] No se pudo estimar velocidad');
        }
    }

    adaptConfiguration() {
        // Adaptar basado en capacidades del dispositivo
        const deviceMemory = navigator.deviceMemory || 4;
        const hardwareConcurrency = navigator.hardwareConcurrency || 4;

        if (deviceMemory < 2 || hardwareConcurrency < 2) {
            this.config.enablePreloading = false;
            this.config.enableProgressiveLoading = false;
            this.config.maxPreloadDistance = 1;
        }

        this.saveConfig();
    }

    setupObservers() {
        // Observer principal para imágenes
        this.observers.set('images', new IntersectionObserver(
            this.handleImageIntersection.bind(this),
            {
                rootMargin: this.config.rootMargin,
                threshold: this.config.threshold
            }
        ));

        // Observer para videos
        if (this.config.lazyVideos) {
            this.observers.set('videos', new IntersectionObserver(
                this.handleVideoIntersection.bind(this),
                {
                    rootMargin: '50px',
                    threshold: 0.25
                }
            ));
        }

        // Observer para iframes
        if (this.config.lazyIframes) {
            this.observers.set('iframes', new IntersectionObserver(
                this.handleIframeIntersection.bind(this),
                {
                    rootMargin: '100px',
                    threshold: 0.1
                }
            ));
        }

        // Observer para backgrounds
        if (this.config.lazyBackgrounds) {
            this.observers.set('backgrounds', new IntersectionObserver(
                this.handleBackgroundIntersection.bind(this),
                {
                    rootMargin: this.config.rootMargin,
                    threshold: 0.1
                }
            ));
        }
    }

    processExistingElements() {
        // Procesar imágenes existentes
        this.processImages();

        if (this.config.lazyVideos) {
            this.processVideos();
        }

        if (this.config.lazyIframes) {
            this.processIframes();
        }

        if (this.config.lazyBackgrounds) {
            this.processBackgrounds();
        }
    }

    processImages() {
        const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        this.performance.totalImages = images.length;

        images.forEach((img, index) => {
            this.prepareImage(img, index);
            this.observers.get('images')?.observe(img);
        });

        console.log(`🖼️ [ADVANCED-LAZY] ${images.length} imágenes preparadas para lazy loading`);
    }

    prepareImage(img, index) {
        // Agregar placeholder si no existe
        if (!img.src && this.config.enableBlurPlaceholder) {
            img.src = this.generatePlaceholder(img);
        }

        // Agregar clases de estado
        img.classList.add('lazy-loading');

        // Agregar atributos de rendimiento
        img.setAttribute('data-lazy-index', index);
        img.setAttribute('data-lazy-prepared', 'true');

        // Configurar aspectos de accesibilidad
        if (!img.alt) {
            img.alt = 'Imagen cargando...';
        }
    }

    generatePlaceholder(img) {
        const width = img.dataset.width || img.width || 400;
        const height = img.dataset.height || img.height || 300;

        // SVG placeholder con blur effect
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad)"/>
                <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="middle" dominant-baseline="middle">Cargando...</text>
            </svg>
        `;

        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    handleImageIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.schedulePreload(entry.target);
            }
        });
    }

    async loadImage(img) {
        if (this.loadedResources.has(img)) return;

        const startTime = performance.now();
        img.classList.add('lazy-loading');

        try {
            // Obtener la mejor fuente disponible
            const src = this.getBestImageSource(img);

            // Precargar imagen
            const preloadImage = new Image();

            // Configurar eventos
            preloadImage.onload = () => {
                this.handleImageLoad(img, src, startTime);
            };

            preloadImage.onerror = () => {
                this.handleImageError(img, src);
            };

            // Iniciar carga
            preloadImage.src = src;

        } catch (error) {
            this.handleImageError(img, img.dataset.src);
        }
    }

    getBestImageSource(img) {
        const originalSrc = img.dataset.src || img.src;

        // Detectar si hay fuentes alternativas
        const webpSrc = img.dataset.webp;
        const avifSrc = img.dataset.avif;

        // Seleccionar la mejor fuente disponible
        if (this.config.avifSupport && avifSrc) {
            return avifSrc;
        }

        if (this.config.webpSupport && webpSrc) {
            return webpSrc;
        }

        return originalSrc;
    }

    handleImageLoad(img, src, startTime) {
        const loadTime = performance.now() - startTime;

        // Actualizar imagen
        img.src = src;
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');

        // Actualizar alt text
        if (img.alt === 'Imagen cargando...') {
            img.alt = img.dataset.alt || 'Imagen';
        }

        // Aplicar efecto de fade-in
        if (this.config.enableProgressiveLoading) {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';

            // Triggear fade in después de que la imagen esté lista
            img.onload = () => {
                img.style.opacity = '1';
            };
        }

        // Actualizar estadísticas
        this.performance.loadedImages++;
        this.updateAverageLoadTime(loadTime);

        // Marcar como cargada
        this.loadedResources.add(img);

        // Dejar de observar
        this.observers.get('images')?.unobserve(img);

        console.log(`✅ [ADVANCED-LAZY] Imagen cargada: ${src} (${loadTime.toFixed(2)}ms)`);

        // Notificar al sistema de caché inteligente
        if (window.bgeIntelligentCache) {
            window.bgeIntelligentCache.recordResourceAccess(src, 'lazy-load');
        }
    }

    handleImageError(img, src) {
        const retryCount = parseInt(img.dataset.retryCount || '0');

        if (retryCount < this.config.retryAttempts) {
            // Intentar de nuevo después de un delay
            setTimeout(() => {
                img.dataset.retryCount = (retryCount + 1).toString();
                this.loadImage(img);
            }, 1000 * (retryCount + 1));

            console.warn(`⚠️ [ADVANCED-LAZY] Reintentando carga: ${src} (intento ${retryCount + 1})`);
        } else {
            // Mostrar imagen de error
            img.src = this.generateErrorPlaceholder();
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-error');
            img.alt = 'Error al cargar imagen';

            this.performance.failedImages++;
            this.observers.get('images')?.unobserve(img);

            console.error(`❌ [ADVANCED-LAZY] Error cargando imagen: ${src}`);
        }
    }

    generateErrorPlaceholder() {
        const svg = `
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
                <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle">⚠️</text>
                <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="12" fill="#6c757d" text-anchor="middle">Error al cargar</text>
            </svg>
        `;

        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    schedulePreload(currentImg) {
        if (!this.config.enablePreloading) return;

        const container = currentImg.closest('.carousel, .gallery, .row, .grid');
        if (!container) return;

        const allImages = container.querySelectorAll('img[data-src]');
        const currentIndex = Array.from(allImages).indexOf(currentImg);

        // Precargar las siguientes imágenes
        for (let i = 1; i <= this.config.maxPreloadDistance; i++) {
            const nextImg = allImages[currentIndex + i];
            if (nextImg && !this.loadedResources.has(nextImg)) {
                this.addToPreloadQueue(nextImg, i);
            }
        }

        this.processPreloadQueue();
    }

    addToPreloadQueue(img, priority) {
        if (!this.preloadQueue.find(item => item.img === img)) {
            this.preloadQueue.push({
                img,
                priority,
                src: this.getBestImageSource(img)
            });
        }
    }

    async processPreloadQueue() {
        if (this.isProcessingQueue || this.preloadQueue.length === 0) return;

        this.isProcessingQueue = true;

        // Ordenar por prioridad (menor número = mayor prioridad)
        this.preloadQueue.sort((a, b) => a.priority - b.priority);

        while (this.preloadQueue.length > 0) {
            const item = this.preloadQueue.shift();

            try {
                await this.preloadImage(item.src);
                console.log(`🔄 [ADVANCED-LAZY] Precargada: ${item.src}`);
            } catch (error) {
                console.warn(`⚠️ [ADVANCED-LAZY] Error precargando: ${item.src}`);
            }

            // Pequeño delay para no bloquear el hilo principal
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        this.isProcessingQueue = false;
    }

    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
        });
    }

    processVideos() {
        const videos = document.querySelectorAll('video[data-src], video[data-poster]');

        videos.forEach(video => {
            this.observers.get('videos')?.observe(video);
        });

        console.log(`🎥 [ADVANCED-LAZY] ${videos.length} videos preparados para lazy loading`);
    }

    handleVideoIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadVideo(entry.target);
            }
        });
    }

    loadVideo(video) {
        const src = video.dataset.src;
        const poster = video.dataset.poster;

        if (src && !video.src) {
            video.src = src;
        }

        if (poster && !video.poster) {
            video.poster = poster;
        }

        video.classList.add('lazy-loaded');
        this.observers.get('videos')?.unobserve(video);

        console.log(`▶️ [ADVANCED-LAZY] Video cargado: ${src}`);
    }

    processIframes() {
        const iframes = document.querySelectorAll('iframe[data-src]');

        iframes.forEach(iframe => {
            this.observers.get('iframes')?.observe(iframe);
        });

        console.log(`📄 [ADVANCED-LAZY] ${iframes.length} iframes preparados para lazy loading`);
    }

    handleIframeIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadIframe(entry.target);
            }
        });
    }

    loadIframe(iframe) {
        const src = iframe.dataset.src;

        if (src && !iframe.src) {
            iframe.src = src;
            iframe.classList.add('lazy-loaded');
            this.observers.get('iframes')?.unobserve(iframe);

            console.log(`📄 [ADVANCED-LAZY] Iframe cargado: ${src}`);
        }
    }

    processBackgrounds() {
        const elements = document.querySelectorAll('[data-bg], [data-bg-webp], [data-bg-avif]');

        elements.forEach(element => {
            this.observers.get('backgrounds')?.observe(element);
        });

        console.log(`🎨 [ADVANCED-LAZY] ${elements.length} backgrounds preparados para lazy loading`);
    }

    handleBackgroundIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadBackground(entry.target);
            }
        });
    }

    loadBackground(element) {
        const bg = element.dataset.bg;
        const bgWebp = element.dataset.bgWebp;
        const bgAvif = element.dataset.bgAvif;

        let selectedBg = bg;

        if (this.config.avifSupport && bgAvif) {
            selectedBg = bgAvif;
        } else if (this.config.webpSupport && bgWebp) {
            selectedBg = bgWebp;
        }

        if (selectedBg) {
            element.style.backgroundImage = `url('${selectedBg}')`;
            element.classList.add('lazy-loaded');
            this.observers.get('backgrounds')?.unobserve(element);

            console.log(`🎨 [ADVANCED-LAZY] Background cargado: ${selectedBg}`);
        }
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldReprocess = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (this.shouldProcessElement(node)) {
                                shouldReprocess = true;
                            }
                        }
                    });
                }
            });

            if (shouldReprocess) {
                // Delay para permitir que el DOM se estabilice
                setTimeout(() => {
                    this.processExistingElements();
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    shouldProcessElement(element) {
        return element.matches && (
            element.matches('img[data-src]') ||
            element.matches('video[data-src]') ||
            element.matches('iframe[data-src]') ||
            element.matches('[data-bg]') ||
            element.querySelector('img[data-src], video[data-src], iframe[data-src], [data-bg]')
        );
    }

    setupPerformanceMonitoring() {
        // Reportar estadísticas periódicamente
        setInterval(() => {
            this.reportPerformanceStats();
        }, 30000); // Cada 30 segundos
    }

    reportPerformanceStats() {
        const stats = this.getPerformanceStats();
        console.log('📊 [ADVANCED-LAZY] Estadísticas:', stats);

        // Enviar a analytics si está disponible
        if (window.gtag) {
            window.gtag('event', 'lazy_loading_performance', {
                custom_parameter_1: stats.loadedPercentage,
                custom_parameter_2: stats.averageLoadTime,
                custom_parameter_3: stats.failureRate
            });
        }
    }

    updateAverageLoadTime(newTime) {
        const total = this.performance.loadedImages;
        const currentAvg = this.performance.averageLoadTime;

        this.performance.averageLoadTime = ((currentAvg * (total - 1)) + newTime) / total;
    }

    getPerformanceStats() {
        return {
            totalImages: this.performance.totalImages,
            loadedImages: this.performance.loadedImages,
            failedImages: this.performance.failedImages,
            loadedPercentage: this.performance.totalImages > 0 ?
                (this.performance.loadedImages / this.performance.totalImages * 100).toFixed(1) : 0,
            averageLoadTime: this.performance.averageLoadTime.toFixed(2),
            failureRate: this.performance.totalImages > 0 ?
                (this.performance.failedImages / this.performance.totalImages * 100).toFixed(1) : 0,
            bandwidth: this.performance.bandwidth,
            preloadQueueSize: this.preloadQueue.length
        };
    }

    saveConfig() {
        try {
            localStorage.setItem('bge_lazy_config', JSON.stringify(this.config));
        } catch (error) {
            console.warn('⚠️ [ADVANCED-LAZY] Error guardando configuración:', error);
        }
    }

    // API pública
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();

        // Reconfigurar observadores si es necesario
        this.adaptConfiguration();

        console.log('⚙️ [ADVANCED-LAZY] Configuración actualizada:', newConfig);
    }

    forceLoadAll() {
        console.log('🚀 [ADVANCED-LAZY] Forzando carga de todos los elementos');

        const allLazyElements = document.querySelectorAll(
            'img[data-src], video[data-src], iframe[data-src], [data-bg]'
        );

        allLazyElements.forEach(element => {
            if (element.tagName === 'IMG') {
                this.loadImage(element);
            } else if (element.tagName === 'VIDEO') {
                this.loadVideo(element);
            } else if (element.tagName === 'IFRAME') {
                this.loadIframe(element);
            } else if (element.dataset.bg) {
                this.loadBackground(element);
            }
        });
    }

    destroy() {
        // Limpiar observadores
        this.observers.forEach(observer => {
            observer.disconnect();
        });

        this.observers.clear();
        this.loadedResources.clear();
        this.preloadQueue = [];

        console.log('🗑️ [ADVANCED-LAZY] Sistema destruido');
    }
}

// CSS para animaciones y efectos
const lazyStyles = `
    .lazy-loading {
        opacity: 0.7;
        filter: blur(2px);
        transition: all 0.3s ease;
    }

    .lazy-loaded {
        opacity: 1;
        filter: none;
    }

    .lazy-error {
        opacity: 0.5;
        filter: grayscale(1);
    }

    img[data-src] {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
    }

    @media (prefers-reduced-motion: reduce) {
        .lazy-loading {
            transition: none;
        }
    }
`;

// Inyectar estilos
const lazyLoadingStyleSheet = document.createElement('style');
lazyLoadingStyleSheet.textContent = lazyStyles;
document.head.appendChild(lazyLoadingStyleSheet);

// Inicializar sistema automáticamente
let bgeAdvancedLazy;

document.addEventListener('DOMContentLoaded', () => {
    bgeAdvancedLazy = new BGEAdvancedLazyLoading();

    // Hacer disponible globalmente
    window.bgeAdvancedLazy = bgeAdvancedLazy;
});

console.log('✅ [COMPLETE] advanced-lazy-loading.js cargado - Sistema de lazy loading avanzado BGE v1.0');