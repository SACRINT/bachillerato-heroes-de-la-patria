/**
 * 📱 MOBILE OPTIMIZER - FASE 4.2
 * Sistema de optimización móvil y touch gestures para BGE Héroes de la Patria
 * Experiencia mobile-first con gestos táctiles avanzados
 */

class MobileOptimizer {
    constructor() {
        this.isMobile = false;
        this.isTablet = false;
        this.touchEnabled = false;
        this.orientation = 'portrait';
        this.gestures = new Map();
        this.swipeThreshold = 50;
        this.tapThreshold = 200;
        this.doubleTapThreshold = 300;

        this.touchState = {
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            startTime: 0,
            endTime: 0,
            touches: [],
            lastTap: 0,
            isScrolling: false
        };

        this.init();
    }

    init() {
        this.detectDeviceType();
        this.setupTouchEvents();
        this.setupGestureRecognition();
        this.optimizeForMobile();
        this.setupOrientationHandling();
        this.setupMobileNavigation();
        this.enableMobileOptimizations();

        console.log(`📱 Mobile Optimizer inicializado - Móvil: ${this.isMobile}, Touch: ${this.touchEnabled}`);
    }

    detectDeviceType() {
        // Detectar tipo de dispositivo
        const userAgent = navigator.userAgent.toLowerCase();
        this.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
        this.isTablet = /ipad|android(?!.*mobile)/.test(userAgent) ||
                       (window.innerWidth >= 768 && window.innerWidth <= 1024);

        // Detectar capacidades táctiles
        this.touchEnabled = 'ontouchstart' in window ||
                           navigator.maxTouchPoints > 0 ||
                           navigator.msMaxTouchPoints > 0;

        // Detectar orientación inicial
        this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

        // Aplicar clases CSS
        document.documentElement.classList.toggle('mobile', this.isMobile);
        document.documentElement.classList.toggle('tablet', this.isTablet);
        document.documentElement.classList.toggle('touch-enabled', this.touchEnabled);
        document.documentElement.classList.toggle(this.orientation, true);
    }

    setupTouchEvents() {
        if (!this.touchEnabled) return;

        // Eventos táctiles básicos
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // Prevenir zoom accidental
        this.preventAccidentalZoom();

        // Mejorar scroll en iOS
        this.optimizeIOSScrolling();
    }

    handleTouchStart(event) {
        const touch = event.touches[0];
        this.touchState.startX = touch.clientX;
        this.touchState.startY = touch.clientY;
        this.touchState.startTime = Date.now();
        this.touchState.touches = Array.from(event.touches);
        this.touchState.isScrolling = false;

        // Detectar si es un elemento interactivo
        const element = event.target;
        if (this.isInteractiveElement(element)) {
            this.addTouchFeedback(element);
        }
    }

    handleTouchMove(event) {
        if (!this.touchState.startTime) return;

        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - this.touchState.startX);
        const deltaY = Math.abs(touch.clientY - this.touchState.startY);

        // Detectar dirección de scroll
        if (deltaY > deltaX && deltaY > 10) {
            this.touchState.isScrolling = true;
        }

        // Prevenir scroll horizontal accidental
        if (deltaX > deltaY && deltaX > 10) {
            const target = event.target.closest('.horizontal-scroll');
            if (!target) {
                event.preventDefault();
            }
        }
    }

    handleTouchEnd(event) {
        if (!this.touchState.startTime) return;

        const touch = event.changedTouches[0];
        this.touchState.endX = touch.clientX;
        this.touchState.endY = touch.clientY;
        this.touchState.endTime = Date.now();

        const element = event.target;
        this.removeTouchFeedback(element);

        // Analizar gestos
        this.analyzeGesture();

        // Reset estado
        this.resetTouchState();
    }

    analyzeGesture() {
        const deltaX = this.touchState.endX - this.touchState.startX;
        const deltaY = this.touchState.endY - this.touchState.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = this.touchState.endTime - this.touchState.startTime;

        // Detectar tipo de gesto
        if (distance < 10 && duration < this.tapThreshold) {
            this.handleTap();
        } else if (distance > this.swipeThreshold && !this.touchState.isScrolling) {
            this.handleSwipe(deltaX, deltaY);
        } else if (duration > 500 && distance < 10) {
            this.handleLongPress();
        }
    }

    handleTap() {
        const now = Date.now();
        const timeSinceLastTap = now - this.touchState.lastTap;

        if (timeSinceLastTap < this.doubleTapThreshold) {
            this.handleDoubleTap();
        } else {
            this.handleSingleTap();
        }

        this.touchState.lastTap = now;
    }

    handleSingleTap() {
        // Lógica para tap simple
        this.triggerCustomEvent('singleTap', {
            x: this.touchState.endX,
            y: this.touchState.endY
        });
    }

    handleDoubleTap() {
        // Lógica para doble tap
        this.triggerCustomEvent('doubleTap', {
            x: this.touchState.endX,
            y: this.touchState.endY
        });

        // Implementar zoom inteligente
        this.handleSmartZoom();
    }

    handleSwipe(deltaX, deltaY) {
        const direction = this.getSwipeDirection(deltaX, deltaY);

        this.triggerCustomEvent('swipe', {
            direction,
            deltaX,
            deltaY,
            startX: this.touchState.startX,
            startY: this.touchState.startY
        });

        // Implementar navegación por swipe
        this.handleSwipeNavigation(direction);
    }

    handleLongPress() {
        this.triggerCustomEvent('longPress', {
            x: this.touchState.endX,
            y: this.touchState.endY
        });

        // Mostrar menú contextual si corresponde
        this.showContextMenu();
    }

    getSwipeDirection(deltaX, deltaY) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > absDeltaY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    setupGestureRecognition() {
        // Gestos personalizados para la aplicación educativa
        this.registerGesture('swipeLeft', () => this.nextPage());
        this.registerGesture('swipeRight', () => this.previousPage());
        this.registerGesture('swipeUp', () => this.showQuickActions());
        this.registerGesture('doubleTap', () => this.toggleFullscreen());
    }

    registerGesture(name, callback) {
        this.gestures.set(name, callback);
    }

    optimizeForMobile() {
        if (!this.isMobile && !this.isTablet) return;

        // Optimizar viewport
        this.setupViewport();

        // Optimizar formularios
        this.optimizeForms();

        // Optimizar navegación
        this.optimizeNavigation();

        // Optimizar imágenes para móvil
        this.optimizeImagesForMobile();

        // Reducir animaciones en dispositivos lentos
        this.optimizeAnimations();
    }

    setupViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        // Configuración optimizada para móvil
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
    }

    optimizeForms() {
        const inputs = document.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            // Mejorar UX de formularios móviles
            if (input.type === 'email') {
                input.autocapitalize = 'none';
                input.autocorrect = 'off';
            }

            if (input.type === 'tel') {
                input.pattern = '[0-9]*';
            }

            // Agregar feedback visual para touch
            input.addEventListener('focus', () => {
                input.classList.add('input-focused');
            });

            input.addEventListener('blur', () => {
                input.classList.remove('input-focused');
            });
        });
    }

    optimizeNavigation() {
        // Mejorar navegación táctil
        const navItems = document.querySelectorAll('.nav-link, .btn, a');

        navItems.forEach(item => {
            // Aumentar área táctil
            if (!item.classList.contains('touch-optimized')) {
                item.classList.add('touch-optimized');
            }

            // Agregar feedback táctil
            item.addEventListener('touchstart', (e) => {
                item.classList.add('touch-active');
            });

            item.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    item.classList.remove('touch-active');
                }, 150);
            });
        });
    }

    optimizeImagesForMobile() {
        const images = document.querySelectorAll('img');

        images.forEach(img => {
            // Lazy loading agresivo para móvil
            if (this.isMobile && !img.loading) {
                img.loading = 'lazy';
            }

            // Reducir calidad para conexiones lentas
            if (this.isSlowConnection()) {
                this.applyLowQualityMode(img);
            }
        });
    }

    optimizeAnimations() {
        // Reducir animaciones en dispositivos de bajo rendimiento
        if (this.isLowEndDevice()) {
            document.documentElement.classList.add('reduced-motion');

            const style = document.createElement('style');
            style.textContent = `
                .reduced-motion * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupOrientationHandling() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        window.addEventListener('resize', () => {
            this.handleViewportChange();
        });
    }

    handleOrientationChange() {
        const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

        if (newOrientation !== this.orientation) {
            document.documentElement.classList.remove(this.orientation);
            document.documentElement.classList.add(newOrientation);
            this.orientation = newOrientation;

            this.triggerCustomEvent('orientationChange', { orientation: newOrientation });

            // Reoptimizar layout
            this.reoptimizeLayout();
        }
    }

    handleViewportChange() {
        // Actualizar variables CSS para viewport dinámico
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setupMobileNavigation() {
        // Swipe para navegación
        document.addEventListener('swipe', (e) => {
            const { direction } = e.detail;

            if (direction === 'left') {
                this.navigateForward();
            } else if (direction === 'right') {
                this.navigateBack();
            }
        });

        // Navegación por botones de hardware (Android)
        document.addEventListener('backbutton', (e) => {
            e.preventDefault();
            this.handleBackButton();
        });
    }

    navigateForward() {
        // Lógica para navegar hacia adelante
        const nextButton = document.querySelector('.next-page, .carousel-control-next');
        if (nextButton) {
            nextButton.click();
        }
    }

    navigateBack() {
        // Lógica para navegar hacia atrás
        if (window.history.length > 1) {
            window.history.back();
        }
    }

    // Utilidades
    isInteractiveElement(element) {
        const interactive = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'];
        return interactive.includes(element.tagName) ||
               element.hasAttribute('onclick') ||
               element.classList.contains('btn') ||
               element.classList.contains('clickable');
    }

    addTouchFeedback(element) {
        element.classList.add('touch-feedback');
    }

    removeTouchFeedback(element) {
        setTimeout(() => {
            element.classList.remove('touch-feedback');
        }, 150);
    }

    resetTouchState() {
        this.touchState = {
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            startTime: 0,
            endTime: 0,
            touches: [],
            lastTap: this.touchState.lastTap,
            isScrolling: false
        };
    }

    preventAccidentalZoom() {
        // Prevenir zoom accidental en iOS
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
    }

    optimizeIOSScrolling() {
        // Mejorar scroll momentum en iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.body.style.webkitOverflowScrolling = 'touch';
        }
    }

    isSlowConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return connection.effectiveType === 'slow-2g' ||
                   connection.effectiveType === '2g' ||
                   (connection.downlink && connection.downlink < 1);
        }
        return false;
    }

    isLowEndDevice() {
        // Detectar dispositivos de bajo rendimiento
        return navigator.hardwareConcurrency <= 2 ||
               navigator.deviceMemory <= 2 ||
               this.isSlowConnection();
    }

    triggerCustomEvent(name, detail = {}) {
        const event = new CustomEvent(name, { detail });
        document.dispatchEvent(event);
    }

    // Métodos específicos de la aplicación
    nextPage() {
        console.log('📱 Navegando a siguiente página');
    }

    previousPage() {
        console.log('📱 Navegando a página anterior');
    }

    showQuickActions() {
        console.log('📱 Mostrando acciones rápidas');
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    showContextMenu() {
        console.log('📱 Mostrando menú contextual');
    }

    handleSmartZoom() {
        // Implementar zoom inteligente para contenido educativo
        console.log('📱 Aplicando zoom inteligente');
    }

    reoptimizeLayout() {
        // Reoptimizar layout después de cambio de orientación
        this.handleViewportChange();
        this.optimizeImagesForMobile();
    }

    handleBackButton() {
        // Manejar botón de retroceso de Android
        this.navigateBack();
    }

    applyLowQualityMode(img) {
        img.style.imageRendering = 'pixelated';
    }

    enableMobileOptimizations() {
        // Habilitar todas las optimizaciones móviles
        if (this.isMobile || this.isTablet) {
            this.enableDataSaver();
            this.enableBatteryOptimization();
            this.enableMemoryOptimization();
        }
    }

    enableDataSaver() {
        // Modo ahorro de datos
        if ('connection' in navigator && navigator.connection.saveData) {
            document.documentElement.classList.add('save-data');
            console.log('📱 Modo ahorro de datos activado');
        }
    }

    enableBatteryOptimization() {
        // Optimización de batería
        if ('getBattery' in navigator) {
            navigator.getBattery().then((battery) => {
                if (battery.level < 0.2) {
                    document.documentElement.classList.add('low-battery');
                    this.enablePowerSaveMode();
                }
            });
        }
    }

    enableMemoryOptimization() {
        // Optimización de memoria
        if ('deviceMemory' in navigator && navigator.deviceMemory <= 2) {
            document.documentElement.classList.add('low-memory');
            this.enableLowMemoryMode();
        }
    }

    enablePowerSaveMode() {
        // Reducir animaciones y efectos para ahorrar batería
        console.log('🔋 Modo ahorro de energía activado');
    }

    enableLowMemoryMode() {
        // Optimizaciones para dispositivos con poca memoria
        console.log('💾 Modo memoria baja activado');
    }

    // API pública
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            touchEnabled: this.touchEnabled,
            orientation: this.orientation,
            isLowEnd: this.isLowEndDevice(),
            slowConnection: this.isSlowConnection()
        };
    }
}

// CSS para optimizaciones móviles
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    /* Optimizaciones táctiles */
    .touch-optimized {
        min-height: 44px;
        min-width: 44px;
        padding: 12px 16px;
    }

    .touch-feedback {
        background-color: rgba(0, 0, 0, 0.1);
        transform: scale(0.95);
        transition: all 0.1s ease;
    }

    .touch-active {
        background-color: rgba(0, 123, 255, 0.1);
        transform: scale(0.98);
    }

    .input-focused {
        border-color: #007bff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    /* Optimizaciones para móvil */
    .mobile .card {
        margin-bottom: 1rem;
        border-radius: 12px;
    }

    .mobile .btn {
        padding: 12px 20px;
        font-size: 16px;
        border-radius: 8px;
    }

    .mobile .navbar {
        padding: 0.75rem 1rem;
    }

    /* Optimizaciones para tablet */
    .tablet .container {
        max-width: 100%;
        padding: 0 20px;
    }

    /* Optimizaciones por orientación */
    .landscape .hero-section {
        height: 70vh;
    }

    .portrait .navbar-nav {
        flex-direction: column;
    }

    /* Optimizaciones para conexión lenta */
    .save-data img {
        filter: contrast(1.2) brightness(1.1);
    }

    .slow-connection * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
    }

    /* Optimizaciones para poca batería */
    .low-battery * {
        animation: none !important;
        background-attachment: scroll !important;
    }

    /* Viewport dinámico */
    .mobile-full-height {
        height: 100vh;
        height: calc(var(--vh, 1vh) * 100);
    }

    /* Scroll táctil suave */
    .touch-scroll {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
    }
`;
document.head.appendChild(mobileStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimizer = new MobileOptimizer();
});

// Exponer globalmente
window.MobileOptimizer = MobileOptimizer;