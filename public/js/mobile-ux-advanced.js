/**
 * 📱 MOBILE UX ADVANCED - Sistema Avanzado de Experiencia Móvil
 * Bachillerato General Estatal "Héroes de la Patria"
 * Optimización completa para dispositivos móviles y tablets
 */

class MobileUXAdvanced {
    constructor() {
        this.isMobile = false;
        this.isTablet = false;
        this.orientation = 'portrait';
        this.touchSupport = false;
        this.gestureHandlers = new Map();
        this.swipeThreshold = 50;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isScrolling = false;

        // Configuraciones específicas para móvil
        this.mobileOptimizations = {
            compactNavigation: true,
            touchFriendlyButtons: true,
            gestureNavigation: true,
            optimizedImages: true,
            reducedAnimations: false,
            fastTap: true,
            autoHideAddressBar: true,
            adaptiveKeyboard: true
        };

        this.init();
    }

    init() {
        this.detectDeviceCapabilities();
        this.setupViewport();
        this.optimizeForMobile();
        this.setupGestureHandlers();
        this.setupTouchOptimizations();
        this.setupOrientationHandling();
        this.setupPerformanceOptimizations();
        this.createMobileToolbar();

        console.log('📱 [MOBILE-UX] Sistema inicializado:', {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            orientation: this.orientation,
            touchSupport: this.touchSupport
        });
    }

    detectDeviceCapabilities() {
        const userAgent = navigator.userAgent.toLowerCase();
        const screenWidth = window.innerWidth;

        // Detectar tipo de dispositivo
        this.isMobile = screenWidth <= 768 || /android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        this.isTablet = (screenWidth > 768 && screenWidth <= 1024) || /ipad|tablet/i.test(userAgent);

        // Detectar soporte táctil
        this.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Detectar orientación
        this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

        // Agregar clases CSS al body
        document.body.classList.toggle('mobile-device', this.isMobile);
        document.body.classList.toggle('tablet-device', this.isTablet);
        document.body.classList.toggle('touch-device', this.touchSupport);
        document.body.classList.add(`orientation-${this.orientation}`);
    }

    setupViewport() {
        // Configurar viewport para móviles
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

        // Prevenir zoom en inputs (iOS)
        if (this.isMobile) {
            const style = document.createElement('style');
            style.textContent = `
                @media screen and (max-width: 768px) {
                    input[type="text"],
                    input[type="email"],
                    input[type="tel"],
                    input[type="password"],
                    textarea,
                    select {
                        font-size: 16px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    optimizeForMobile() {
        if (!this.isMobile && !this.isTablet) return;

        // Crear estilos móviles
        const mobileStyles = document.createElement('style');
        mobileStyles.id = 'mobile-ux-styles';
        mobileStyles.textContent = `
            /* Optimizaciones generales para móvil */
            @media screen and (max-width: 768px) {
                body {
                    font-size: 16px;
                    line-height: 1.5;
                    -webkit-text-size-adjust: 100%;
                }

                /* Navegación compacta */
                .navbar {
                    padding: 0.5rem 1rem !important;
                }

                .navbar-nav .nav-link {
                    padding: 0.75rem 1rem !important;
                    font-size: 16px !important;
                }

                /* Botones táctiles amigables */
                .btn {
                    min-height: 44px;
                    padding: 12px 20px !important;
                    font-size: 16px !important;
                    border-radius: 8px !important;
                }

                /* Formularios optimizados */
                .form-control {
                    min-height: 44px;
                    padding: 12px 16px !important;
                    font-size: 16px !important;
                    border-radius: 8px !important;
                }

                /* Cards con mejor espaciado */
                .card {
                    margin-bottom: 1rem !important;
                    border-radius: 12px !important;
                }

                .card-body {
                    padding: 1.5rem !important;
                }

                /* Modales de pantalla completa en móvil */
                .modal-dialog {
                    margin: 0 !important;
                    height: 100vh !important;
                    max-width: 100% !important;
                }

                .modal-content {
                    height: 100% !important;
                    border-radius: 0 !important;
                }

                /* Tablas responsive */
                .table-responsive {
                    border: none;
                }

                .table {
                    font-size: 14px;
                }

                /* Ocultar elementos no esenciales en móvil */
                .mobile-hidden {
                    display: none !important;
                }

                /* Espaciado mejorado */
                .container, .container-fluid {
                    padding-left: 15px !important;
                    padding-right: 15px !important;
                }
            }

            /* Tablet optimizations */
            @media screen and (min-width: 769px) and (max-width: 1024px) {
                .btn {
                    min-height: 40px;
                    padding: 10px 18px !important;
                }

                .form-control {
                    min-height: 40px;
                    padding: 10px 14px !important;
                }
            }

            /* Touch-friendly improvements */
            .touch-device {
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -khtml-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }

            .touch-device input,
            .touch-device textarea {
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
            }

            /* Swipe indicators */
            .swipe-container {
                position: relative;
                overflow: hidden;
            }

            .swipe-indicator {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0,0,0,0.5);
                color: white;
                padding: 10px;
                border-radius: 50%;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
                z-index: 1000;
            }

            .swipe-indicator.left { left: 20px; }
            .swipe-indicator.right { right: 20px; }
            .swipe-indicator.show { opacity: 1; }

            /* Fast tap optimization */
            .fast-tap {
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
            }

            /* Orientation specific styles */
            .orientation-landscape .mobile-landscape-hide {
                display: none !important;
            }

            .orientation-portrait .mobile-portrait-hide {
                display: none !important;
            }
        `;

        document.head.appendChild(mobileStyles);
    }

    setupGestureHandlers() {
        if (!this.touchSupport) return;

        let startX, startY, startTime;
        let isScrolling = false;

        // Touch start
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
            isScrolling = false;

            // Agregar clase de toque activo
            if (e.target.closest('.btn, .card, .nav-link')) {
                e.target.closest('.btn, .card, .nav-link').classList.add('touching');
            }
        }, { passive: true });

        // Touch move
        document.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(currentY - startY);

            // Detectar si es scroll vertical
            if (diffY > diffX && diffY > 10) {
                isScrolling = true;
            }

            // Mostrar indicadores de swipe
            if (diffX > 30 && !isScrolling) {
                const direction = currentX > startX ? 'right' : 'left';
                this.showSwipeIndicator(direction);
            }
        }, { passive: true });

        // Touch end
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY || isScrolling) {
                this.hideSwipeIndicators();
                this.removeTouchingClass();
                return;
            }

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = endX - startX;
            const diffY = endY - startY;
            const diffTime = Date.now() - startTime;

            // Detectar gestos
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > this.swipeThreshold) {
                const direction = diffX > 0 ? 'right' : 'left';
                this.handleSwipe(direction, e.target);
            }

            // Fast tap para mejor responsividad
            if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10 && diffTime < 200) {
                this.handleFastTap(e.target);
            }

            this.hideSwipeIndicators();
            this.removeTouchingClass();

            // Reset
            startX = startY = startTime = null;
        }, { passive: true });
    }

    setupTouchOptimizations() {
        // Agregar clase fast-tap a elementos interactivos
        const interactiveElements = document.querySelectorAll('button, .btn, .nav-link, .card-header, [onclick]');
        interactiveElements.forEach(el => {
            el.classList.add('fast-tap');
        });

        // Optimización para iOS Safari
        if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
            document.addEventListener('touchstart', () => {}, { passive: true });
        }

        // Prevenir zoom doble tap en elementos específicos
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                // Trigger click manually for better UX
                if (e.target.tagName === 'BUTTON' || e.target.classList.contains('btn')) {
                    e.target.click();
                }
            }
            lastTap = currentTime;
        });
    }

    setupOrientationHandling() {
        const handleOrientationChange = () => {
            setTimeout(() => {
                const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

                if (newOrientation !== this.orientation) {
                    document.body.classList.remove(`orientation-${this.orientation}`);
                    document.body.classList.add(`orientation-${newOrientation}`);
                    this.orientation = newOrientation;

                    // Reajustar layout
                    this.handleOrientationChange(newOrientation);

                    console.log('📱 [MOBILE-UX] Cambio de orientación:', newOrientation);
                }
            }, 100);
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
    }

    handleOrientationChange(orientation) {
        // Cerrar menús abiertos
        const openMenus = document.querySelectorAll('.navbar-collapse.show');
        openMenus.forEach(menu => {
            menu.classList.remove('show');
        });

        // Reajustar modales
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const modalDialog = modal.querySelector('.modal-dialog');
            if (modalDialog) {
                setTimeout(() => {
                    modalDialog.style.transform = 'none';
                    modalDialog.scrollTop = 0;
                }, 100);
            }
        });

        // Ocultar/mostrar elementos según orientación
        if (orientation === 'landscape' && this.isMobile) {
            document.body.classList.add('mobile-landscape');
            this.hideAddressBar();
        } else {
            document.body.classList.remove('mobile-landscape');
        }

        // Notificar a otros componentes
        window.dispatchEvent(new CustomEvent('mobileOrientationChange', {
            detail: { orientation, isMobile: this.isMobile }
        }));
    }

    setupPerformanceOptimizations() {
        if (!this.isMobile) return;

        // Lazy loading para imágenes
        const images = document.querySelectorAll('img[data-src]');
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }

        // Reducir animaciones en dispositivos de baja potencia
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            document.body.classList.add('reduced-motion');
            this.mobileOptimizations.reducedAnimations = true;
        }

        // Optimización de scroll
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    createMobileToolbar() {
        if (!this.isMobile) return;

        const toolbar = document.createElement('div');
        toolbar.id = 'mobile-toolbar';
        toolbar.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(0,0,0,0.1);
            padding: 10px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            z-index: 1000;
            transform: translateY(0);
            transition: transform 0.3s ease;
        `;

        const toolbarActions = [
            { icon: '🏠', label: 'Inicio', action: () => window.location.href = '/' },
            { icon: '📚', label: 'Educativa', action: () => window.location.href = '/oferta-educativa.html' },
            { icon: '📞', label: 'Contacto', action: () => window.location.href = '/contacto.html' },
            { icon: '⚙️', label: 'Menú', action: () => this.toggleMobileMenu() }
        ];

        toolbarActions.forEach(item => {
            const button = document.createElement('button');
            button.style.cssText = `
                background: none;
                border: none;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: #333;
                min-width: 60px;
                transition: background-color 0.2s ease;
            `;

            button.innerHTML = `
                <span style="font-size: 20px;">${item.icon}</span>
                <span>${item.label}</span>
            `;

            button.addEventListener('click', item.action);
            button.addEventListener('touchstart', () => {
                button.style.backgroundColor = 'rgba(0,0,0,0.1)';
            }, { passive: true });
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.backgroundColor = 'transparent';
                }, 150);
            }, { passive: true });

            toolbar.appendChild(button);
        });

        document.body.appendChild(toolbar);

        // Auto-hide toolbar on scroll down
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            if (window.scrollY > lastScrollY && window.scrollY > 100) {
                toolbar.style.transform = 'translateY(100%)';
            } else {
                toolbar.style.transform = 'translateY(0)';
            }
            lastScrollY = window.scrollY;
        }, { passive: true });

        // Add padding to body to prevent content overlap
        document.body.style.paddingBottom = '80px';
    }

    handleSwipe(direction, target) {
        // Navegación por swipe en carruseles
        const carousel = target.closest('.carousel');
        if (carousel) {
            const carouselInstance = bootstrap.Carousel.getOrCreateInstance(carousel);
            if (direction === 'left') {
                carouselInstance.next();
            } else {
                carouselInstance.prev();
            }
            return;
        }

        // Navegación por swipe en tabs
        const tabContent = target.closest('.tab-content');
        if (tabContent) {
            const activeTab = tabContent.querySelector('.tab-pane.active');
            if (activeTab) {
                const tabs = Array.from(tabContent.querySelectorAll('.tab-pane'));
                const currentIndex = tabs.indexOf(activeTab);
                let newIndex;

                if (direction === 'left' && currentIndex < tabs.length - 1) {
                    newIndex = currentIndex + 1;
                } else if (direction === 'right' && currentIndex > 0) {
                    newIndex = currentIndex - 1;
                }

                if (newIndex !== undefined) {
                    const newTabId = tabs[newIndex].id;
                    const newTabTrigger = document.querySelector(`[data-bs-target="#${newTabId}"]`);
                    if (newTabTrigger) {
                        new bootstrap.Tab(newTabTrigger).show();
                    }
                }
            }
            return;
        }

        // Swipe personalizado
        window.dispatchEvent(new CustomEvent('mobileSwipe', {
            detail: { direction, target }
        }));
    }

    handleFastTap(target) {
        // Mejorar responsividad de taps
        if (target.tagName === 'BUTTON' || target.classList.contains('btn')) {
            target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                target.style.transform = 'scale(1)';
            }, 100);
        }
    }

    showSwipeIndicator(direction) {
        let indicator = document.querySelector(`.swipe-indicator.${direction}`);
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = `swipe-indicator ${direction}`;
            indicator.innerHTML = direction === 'left' ? '‹' : '›';
            document.body.appendChild(indicator);
        }
        indicator.classList.add('show');
    }

    hideSwipeIndicators() {
        const indicators = document.querySelectorAll('.swipe-indicator');
        indicators.forEach(indicator => {
            indicator.classList.remove('show');
        });
    }

    removeTouchingClass() {
        const touchingElements = document.querySelectorAll('.touching');
        touchingElements.forEach(el => {
            el.classList.remove('touching');
        });
    }

    hideAddressBar() {
        // Solo en dispositivos móviles y iOS Safari
        if (this.isMobile && /iphone|ipod/i.test(navigator.userAgent)) {
            setTimeout(() => {
                window.scrollTo(0, 1);
            }, 500);
        }
    }

    toggleMobileMenu() {
        const navbar = document.querySelector('.navbar-collapse');
        if (navbar) {
            navbar.classList.toggle('show');
        }
    }

    handleScroll() {
        // Optimizaciones durante scroll
        const scrollY = window.scrollY;

        // Auto-hide/show elements based on scroll direction
        const header = document.querySelector('.navbar');
        if (header && this.isMobile) {
            if (scrollY > 100 && scrollY > (this.lastScrollY || 0)) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        }

        this.lastScrollY = scrollY;
    }

    // API pública
    optimizeElement(element, options = {}) {
        if (!this.isMobile) return;

        const defaults = {
            touchFriendly: true,
            swipeEnabled: false,
            fastTap: true
        };

        const config = { ...defaults, ...options };

        if (config.touchFriendly) {
            element.style.minHeight = '44px';
            element.style.padding = '12px';
        }

        if (config.fastTap) {
            element.classList.add('fast-tap');
        }

        if (config.swipeEnabled) {
            element.classList.add('swipe-container');
        }
    }

    setMobileOptimization(key, value) {
        this.mobileOptimizations[key] = value;

        // Aplicar cambio inmediatamente
        if (key === 'reducedAnimations') {
            document.body.classList.toggle('reduced-motion', value);
        }
    }

    isMobileDevice() {
        return this.isMobile;
    }

    isTabletDevice() {
        return this.isTablet;
    }

    getCurrentOrientation() {
        return this.orientation;
    }
}

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.mobileUX = new MobileUXAdvanced();
});

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileUXAdvanced;
}