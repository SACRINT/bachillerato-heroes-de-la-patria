/**
 * 📱 MOBILE PERFORMANCE OPTIMIZER - FASE 2 OPTIMIZACIÓN
 * Sistema avanzado de optimización específica para dispositivos móviles
 */

class MobilePerformanceOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.deviceInfo = this.getDeviceInfo();
        this.networkInfo = this.getNetworkInfo();
        this.batteryInfo = null;
        this.performanceMode = 'auto';
        
        this.optimizations = {
            applied: new Set(),
            active: new Map(),
            metrics: {
                memoryReduced: 0,
                requestsMinimized: 0,
                renderOptimized: 0
            }
        };
        
        this.init();
    }

    init() {
        //console.log('📱 Inicializando Mobile Performance Optimizer...');
        
        if (this.isMobile) {
            this.detectBatteryStatus();
            this.optimizeForMobile();
            this.setupMobileSpecificOptimizations();
            this.monitorMobilePerformance();
            
            //console.log('✅ Mobile Performance Optimizer activado');
            //console.log('📊 Dispositivo:', this.deviceInfo);
        }
    }

    detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768 ||
               'ontouchstart' in window;
    }

    getDeviceInfo() {
        const ua = navigator.userAgent;
        const memory = navigator.deviceMemory || 4; // GB
        const cores = navigator.hardwareConcurrency || 4;
        
        return {
            memory: memory + 'GB',
            cores,
            pixelRatio: window.devicePixelRatio || 1,
            isLowEnd: memory <= 2 || cores <= 2,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            userAgent: ua
        };
    }

    getNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                saveData: connection.saveData,
                isSlowNetwork: connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g'
            };
        }
        
        return { effectiveType: 'unknown', isSlowNetwork: false };
    }

    async detectBatteryStatus() {
        try {
            if ('getBattery' in navigator) {
                this.batteryInfo = await navigator.getBattery();
                this.batteryInfo.addEventListener('levelchange', () => {
                    this.adjustPerformanceByBattery();
                });
                this.batteryInfo.addEventListener('chargingchange', () => {
                    this.adjustPerformanceByBattery();
                });
            }
        } catch (error) {
            //console.log('Battery API no disponible');
        }
    }

    adjustPerformanceByBattery() {
        if (!this.batteryInfo) return;
        
        const batteryLevel = this.batteryInfo.level;
        const isCharging = this.batteryInfo.charging;
        
        if (batteryLevel < 0.2 && !isCharging) {
            this.enableBatterySavingMode();
        } else if (batteryLevel > 0.5 || isCharging) {
            this.disableBatterySavingMode();
        }
    }

    enableBatterySavingMode() {
        //console.log('🔋 Activando modo ahorro de batería');
        this.performanceMode = 'battery-saving';
        
        // Reducir animaciones
        document.documentElement.style.setProperty('--animation-duration', '0s');
        document.body.classList.add('reduce-animations');
        
        // Pausar elementos no críticos
        this.pauseNonCriticalElements();
        
        // Reducir frecuencia de monitoreo
        this.reduceMonitoringFrequency();
        
        this.optimizations.applied.add('battery-saving');
    }

    disableBatterySavingMode() {
        if (this.performanceMode === 'battery-saving') {
            //console.log('🔋 Desactivando modo ahorro de batería');
            this.performanceMode = 'auto';
            
            document.documentElement.style.removeProperty('--animation-duration');
            document.body.classList.remove('reduce-animations');
            
            this.resumeNonCriticalElements();
            this.normalizeMonitoringFrequency();
            
            this.optimizations.applied.delete('battery-saving');
        }
    }

    optimizeForMobile() {
        // Optimizaciones específicas según tipo de dispositivo
        if (this.deviceInfo.isLowEnd) {
            this.enableLowEndOptimizations();
        }
        
        if (this.networkInfo.isSlowNetwork || this.networkInfo.saveData) {
            this.enableDataSavingOptimizations();
        }
        
        // Optimizaciones generales de móvil
        this.optimizeTouchTargets();
        this.optimizeViewportRendering();
        this.setupMobileImageOptimization();
        this.optimizeScrollPerformance();
    }

    enableLowEndOptimizations() {
        //console.log('📱 Aplicando optimizaciones para dispositivos de gama baja');
        
        // Reducir calidad de imágenes
        this.optimizeImagesForLowEnd();
        
        // Limitar animaciones
        document.body.classList.add('low-end-device');
        
        // Reducir JavaScript intensivo
        this.throttleJavaScriptExecution();
        
        // Minimizar DOM operations
        this.optimizeDOMOperations();
        
        this.optimizations.applied.add('low-end');
    }

    enableDataSavingOptimizations() {
        //console.log('📊 Aplicando optimizaciones para ahorro de datos');
        
        // Cargar imágenes de menor calidad
        this.loadLowQualityImages();
        
        // Diferir recursos no críticos
        this.deferNonCriticalResources();
        
        // Comprimir datos de analytics
        this.compressAnalyticsData();
        
        this.optimizations.applied.add('data-saving');
    }

    optimizeTouchTargets() {
        // Asegurar que todos los elementos táctiles tengan el tamaño mínimo recomendado (44px)
        const touchElements = document.querySelectorAll('button, a, input, [role="button"]');
        
        touchElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                element.style.minWidth = '44px';
                element.style.minHeight = '44px';
                element.style.padding = '8px';
            }
        });
        
        this.optimizations.metrics.renderOptimized++;
    }

    optimizeViewportRendering() {
        // Optimizar el renderizado del viewport
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
            // Asegurar configuración óptima del viewport
            metaViewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no';
        }
        
        // Activar compositing acelerado por hardware para elementos clave
        const keyElements = document.querySelectorAll('.navbar, .hero, .card');
        keyElements.forEach(element => {
            element.style.transform = 'translateZ(0)';
            element.style.willChange = 'transform';
        });
    }

    setupMobileImageOptimization() {
        // Optimización específica de imágenes para móvil
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Aplicar loading lazy si no está en el viewport
            if (!this.isInViewport(img)) {
                img.loading = 'lazy';
            }
            
            // Optimizar dimensiones para móvil
            if (this.deviceInfo.viewport.width <= 768) {
                this.optimizeImageForMobile(img);
            }
        });
    }

    optimizeImageForMobile(img) {
        const maxMobileWidth = Math.min(this.deviceInfo.viewport.width, 800);
        
        // Si la imagen es muy grande, reducir sus dimensiones
        if (img.naturalWidth > maxMobileWidth) {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            
            // Si soporta srcset, añadir versiones responsivas
            if (img.hasAttribute('src') && !img.hasAttribute('srcset')) {
                const src = img.src;
                if (src.includes('/images/')) {
                    // Intentar cargar versión móvil si existe
                    const mobileSrc = src.replace(/\.(jpg|jpeg|png)$/i, '-mobile.$1');
                    this.preloadImage(mobileSrc).then(() => {
                        img.src = mobileSrc;
                    }).catch(() => {
                        // Si no existe versión móvil, mantener original
                    });
                }
            }
        }
    }

    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
        });
    }

    optimizeScrollPerformance() {
        // Optimizar el rendimiento del scroll en móvil
        let scrollTimeout;
        let isScrolling = false;
        
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                document.body.classList.add('scrolling');
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                document.body.classList.remove('scrolling');
            }, 150);
        }, { passive: true });
        
        // Mejorar el scroll momentum en iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.body.style.webkitOverflowScrolling = 'touch';
        }
    }

    optimizeImagesForLowEnd() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Reducir calidad de imagen para dispositivos de gama baja
            img.style.imageRendering = 'optimizeSpeed';
            
            // Convertir a WebP si es posible
            if (this.supportsWebP() && img.src.includes('.jpg')) {
                const webpSrc = img.src.replace(/\.jpg$/i, '.webp');
                this.preloadImage(webpSrc).then(() => {
                    img.src = webpSrc;
                }).catch(() => {
                    // Mantener JPG si WebP no está disponible
                });
            }
        });
        
        this.optimizations.metrics.memoryReduced++;
    }

    throttleJavaScriptExecution() {
        // Limitar la ejecución de JavaScript intensivo
        if (window.requestIdleCallback) {
            const heavyOperations = ['analytics', 'tracking', 'animations'];
            
            heavyOperations.forEach(operation => {
                if (window[operation + 'Queue']) {
                    window.requestIdleCallback(() => {
                        window[operation + 'Queue'].process();
                    }, { timeout: 5000 });
                }
            });
        }
    }

    optimizeDOMOperations() {
        // Usar Document Fragment para operaciones DOM masivas
        const originalAppendChild = Element.prototype.appendChild;
        const originalInsertBefore = Element.prototype.insertBefore;
        
        Element.prototype.appendChild = function(child) {
            if (this.domOptimizationPending) {
                this.pendingChildren = this.pendingChildren || [];
                this.pendingChildren.push(child);
                return child;
            }
            return originalAppendChild.call(this, child);
        };
        
        // Método para procesar operaciones pendientes
        Element.prototype.flushPendingChildren = function() {
            if (this.pendingChildren && this.pendingChildren.length > 0) {
                const fragment = document.createDocumentFragment();
                this.pendingChildren.forEach(child => fragment.appendChild(child));
                originalAppendChild.call(this, fragment);
                this.pendingChildren = [];
            }
        };
    }

    loadLowQualityImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        images.forEach(img => {
            const highQualitySrc = img.dataset.src;
            const lowQualitySrc = highQualitySrc.replace(/\.(jpg|jpeg)$/i, '-low.$1');
            
            // Intentar cargar versión de baja calidad primero
            this.preloadImage(lowQualitySrc).then(() => {
                img.src = lowQualitySrc;
                img.classList.add('low-quality');
                
                // Cargar versión de alta calidad en background
                if (!this.networkInfo.saveData) {
                    setTimeout(() => {
                        this.preloadImage(highQualitySrc).then(() => {
                            img.src = highQualitySrc;
                            img.classList.remove('low-quality');
                        });
                    }, 2000);
                }
            }).catch(() => {
                // Si no hay versión de baja calidad, usar la normal
                img.src = highQualitySrc;
            });
        });
    }

    deferNonCriticalResources() {
        // Diferir carga de recursos no críticos
        const nonCriticalScripts = document.querySelectorAll('script[src*="analytics"], script[src*="tracking"], script[src*="social"]');
        
        nonCriticalScripts.forEach(script => {
            script.defer = true;
            script.loading = 'lazy';
        });
        
        this.optimizations.metrics.requestsMinimized++;
    }

    compressAnalyticsData() {
        // Comprimir datos de analytics antes de enviar
        if (window.analyticsQueue) {
            const originalPush = window.analyticsQueue.push;
            window.analyticsQueue.push = function(data) {
                // Simplificar datos para móvil
                const compressedData = {
                    ...data,
                    userAgent: 'mobile', // Simplificar UA
                    timestamp: Math.floor(Date.now() / 1000) // Reducir precisión
                };
                return originalPush.call(this, compressedData);
            };
        }
    }

    pauseNonCriticalElements() {
        // Pausar animaciones y elementos no críticos
        const nonCriticalElements = document.querySelectorAll('.carousel, .animation, [data-aos]');
        
        nonCriticalElements.forEach(element => {
            element.style.animationPlayState = 'paused';
            element.classList.add('paused-for-battery');
        });
    }

    resumeNonCriticalElements() {
        const pausedElements = document.querySelectorAll('.paused-for-battery');
        
        pausedElements.forEach(element => {
            element.style.animationPlayState = 'running';
            element.classList.remove('paused-for-battery');
        });
    }

    reduceMonitoringFrequency() {
        // Reducir frecuencia de monitoreo de performance
        if (window.performanceMonitor) {
            window.performanceMonitor.setUpdateInterval(60000); // 1 minuto
        }
    }

    normalizeMonitoringFrequency() {
        if (window.performanceMonitor) {
            window.performanceMonitor.setUpdateInterval(30000); // 30 segundos
        }
    }

    setupMobileSpecificOptimizations() {
        // Optimizaciones específicas del entorno móvil
        this.setupTouchOptimizations();
        this.optimizeForSmallScreens();
        this.setupMobileKeyboardHandling();
    }

    setupTouchOptimizations() {
        // Optimizar respuesta táctil
        document.body.style.touchAction = 'manipulation';
        
        // Mejorar responsividad de toques
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, { passive: true });
            
            element.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.classList.remove('touch-active');
                }, 150);
            }, { passive: true });
        });
    }

    optimizeForSmallScreens() {
        // Ajustar elementos para pantallas pequeñas
        if (this.deviceInfo.viewport.width <= 480) {
            document.body.classList.add('small-screen');
            
            // Reducir márgenes y paddings
            const style = document.createElement('style');
            style.textContent = `
                .small-screen .container { padding-left: 10px; padding-right: 10px; }
                .small-screen .card { margin-bottom: 1rem; }
                .small-screen h1 { font-size: 1.5rem; }
                .small-screen h2 { font-size: 1.3rem; }
            `;
            document.head.appendChild(style);
        }
    }

    setupMobileKeyboardHandling() {
        // Manejar aparición/desaparición del teclado virtual
        let initialViewportHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            if (heightDifference > 150) {
                // Teclado probablemente visible
                document.body.classList.add('keyboard-visible');
            } else {
                // Teclado probablemente oculto
                document.body.classList.remove('keyboard-visible');
            }
        });
    }

    monitorMobilePerformance() {
        // Monitorear métricas específicas de móvil
        setInterval(() => {
            const metrics = this.getMobilePerformanceMetrics();
            
            if (metrics.memoryUsage > 0.8) {
                this.enableMemoryOptimizations();
            }
            
            if (metrics.fps < 30) {
                this.enableFrameRateOptimizations();
            }
            
        }, 30000);
    }

    getMobilePerformanceMetrics() {
        const memory = performance.memory || {};
        
        return {
            memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit || 0,
            fps: this.calculateFPS(),
            batteryLevel: this.batteryInfo ? this.batteryInfo.level : 1,
            networkType: this.networkInfo.effectiveType,
            optimizationsActive: this.optimizations.applied.size
        };
    }

    calculateFPS() {
        // Cálculo simplificado de FPS
        if (!this.fpsCounter) {
            this.fpsCounter = { frames: 0, lastTime: performance.now() };
        }
        
        this.fpsCounter.frames++;
        const now = performance.now();
        const elapsed = now - this.fpsCounter.lastTime;
        
        if (elapsed >= 1000) {
            const fps = (this.fpsCounter.frames * 1000) / elapsed;
            this.fpsCounter.frames = 0;
            this.fpsCounter.lastTime = now;
            return fps;
        }
        
        return 60; // Valor por defecto
    }

    enableMemoryOptimizations() {
        //console.log('🧠 Aplicando optimizaciones de memoria');
        
        // Limpiar caches innecesarios
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name.includes('old') || name.includes('temp')) {
                        caches.delete(name);
                    }
                });
            });
        }
        
        // Reducir elementos DOM no visibles
        this.hideOffscreenElements();
    }

    enableFrameRateOptimizations() {
        //console.log('🎯 Aplicando optimizaciones de frame rate');
        
        // Reducir animaciones complejas
        document.documentElement.style.setProperty('--animation-duration', '0.2s');
        
        // Pausar elementos no críticos
        this.pauseNonCriticalAnimations();
    }

    hideOffscreenElements() {
        const elements = document.querySelectorAll('.card, .row, section');
        
        elements.forEach(element => {
            if (!this.isInViewport(element) && !this.isNearViewport(element)) {
                element.style.visibility = 'hidden';
                element.setAttribute('data-hidden-for-performance', 'true');
            }
        });
    }

    pauseNonCriticalAnimations() {
        const animations = document.querySelectorAll('[data-aos], .animate__animated');
        
        animations.forEach(element => {
            element.style.animationPlayState = 'paused';
        });
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

    isNearViewport(element, threshold = 100) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= -threshold &&
            rect.left >= -threshold &&
            rect.bottom <= (window.innerHeight + threshold) &&
            rect.right <= (window.innerWidth + threshold)
        );
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // API pública para obtener información
    getOptimizationStatus() {
        return {
            isMobile: this.isMobile,
            deviceInfo: this.deviceInfo,
            networkInfo: this.networkInfo,
            performanceMode: this.performanceMode,
            optimizationsApplied: Array.from(this.optimizations.applied),
            metrics: this.optimizations.metrics,
            mobileMetrics: this.getMobilePerformanceMetrics()
        };
    }
}

// CSS para optimizaciones móviles
const mobileOptimizationCSS = `
    /* Optimizaciones para dispositivos de gama baja */
    .low-end-device * {
        animation-duration: 0.2s !important;
        transition-duration: 0.2s !important;
    }
    
    .low-end-device .carousel-item {
        transition: none !important;
    }
    
    /* Reducción de animaciones por batería */
    .reduce-animations * {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
    }
    
    /* Optimizaciones para pantallas pequeñas */
    .small-screen {
        font-size: 14px;
    }
    
    /* Estados de toque */
    .touch-active {
        opacity: 0.7;
        transform: scale(0.95);
        transition: all 0.1s ease;
    }
    
    /* Teclado virtual visible */
    .keyboard-visible {
        padding-bottom: 0;
    }
    
    /* Scroll optimizado */
    .scrolling {
        pointer-events: none;
    }
    
    .scrolling * {
        animation-play-state: paused !important;
    }
    
    /* Imágenes de baja calidad */
    .low-quality {
        filter: contrast(1.1) brightness(1.05);
    }
`;

// Inyectar CSS
const mobileStyle = document.createElement('style');
mobileStyle.textContent = mobileOptimizationCSS;
document.head.appendChild(mobileStyle);

// Inicializar automáticamente
let mobilePerformanceOptimizer;

document.addEventListener('DOMContentLoaded', () => {
    mobilePerformanceOptimizer = new MobilePerformanceOptimizer();
    
    // Comando para ver estado de optimización
    window.showMobileOptimizations = () => mobilePerformanceOptimizer.getOptimizationStatus();
    
    // Hacer accesible globalmente
    window.mobilePerformanceOptimizer = mobilePerformanceOptimizer;
});

// Exponer la clase
window.MobilePerformanceOptimizer = MobilePerformanceOptimizer;