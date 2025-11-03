/**
 * MOBILE UX MANAGER - MEJORAS DE EXPERIENCIA MÓVIL AVANZADAS
 * BGE Héroes de la Patria - Fase A: Optimización Móvil Avanzada
 *
 * Mejoras específicas de UX móvil:
 * - Animaciones avanzadas del menú hamburguesa
 * - Bottom navigation para móvil
 * - Haptic feedback
 * - Scroll behavior mejorado
 * - Mejoras de formularios para móvil
 */

class MobileUXManager {
    constructor() {
        console.log('📱 [MOBILE-UX] Inicializando Mobile UX Manager...');

        // Configuración
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.isTouch = 'ontouchstart' in window;

        // Estado del menú
        this.menuState = {
            isOpen: false,
            isAnimating: false,
            hasGestures: false
        };

        // Referencias DOM
        this.navbar = null;
        this.navbarToggler = null;
        this.navbarCollapse = null;
        this.bottomNav = null;

        // Configuración de animaciones
        this.animationConfig = {
            duration: 300,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            hamburgerTransition: 'all 0.3s ease-in-out'
        };

        // Inicializar
        this.init();
    }

    /**
     * Inicialización del sistema
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Configuración principal
     */
    setup() {
        try {
            // Obtener referencias DOM
            this.getDOMReferences();

            if (this.isMobile || this.isTablet) {
                // Mejorar menú hamburguesa
                this.enhanceHamburgerMenu();

                // Crear bottom navigation
                this.createBottomNavigation();

                // Configurar haptic feedback
                this.setupHapticFeedback();

                // Mejorar scroll behavior
                this.enhanceScrollBehavior();

                // Optimizar formularios
                this.optimizeForms();

                console.log('✅ [MOBILE-UX] Mobile UX Manager inicializado correctamente');
            } else {
                console.log('📱 [MOBILE-UX] Dispositivo no móvil, aplicando mejoras básicas');
                // Aplicar mejoras básicas para desktop
                this.enhanceDesktopBehavior();
            }

        } catch (error) {
            console.error('❌ [MOBILE-UX] Error inicializando Mobile UX Manager:', error);
        }
    }

    /**
     * Obtiene referencias DOM necesarias
     */
    getDOMReferences() {
        this.navbar = document.querySelector('.navbar');
        this.navbarToggler = document.querySelector('.navbar-toggler');
        this.navbarCollapse = document.querySelector('.navbar-collapse');

        console.log('🔍 [MOBILE-UX] Referencias DOM obtenidas:', {
            navbar: !!this.navbar,
            toggler: !!this.navbarToggler,
            collapse: !!this.navbarCollapse
        });
    }

    /**
     * Mejora el menú hamburguesa con animaciones avanzadas
     */
    enhanceHamburgerMenu() {
        if (!this.navbarToggler || !this.navbarCollapse) {
            return; // Salir silenciosamente si no hay navbar
        }

        console.log('🍔 [MOBILE-UX] Mejorando menú hamburguesa...');

        // Mejorar el icono hamburguesa
        this.enhanceHamburgerIcon();

        // Añadir animaciones de apertura/cierre
        this.addMenuAnimations();

        // Añadir gestos para cerrar menú
        this.addMenuGestures();

        // Mejorar accesibilidad
        this.improveAccessibility();
    }

    /**
     * Mejora el icono del hamburger con animación
     */
    enhanceHamburgerIcon() {
        const togglerIcon = this.navbarToggler.querySelector('.navbar-toggler-icon');
        if (!togglerIcon) return;

        // Reemplazar con icono animado personalizado
        togglerIcon.innerHTML = `
            <div class="hamburger-lines">
                <span class="line line1"></span>
                <span class="line line2"></span>
                <span class="line line3"></span>
            </div>
        `;

        // Añadir estilos CSS dinámicamente
        this.addHamburgerStyles();

        // Listener para toggle
        this.navbarToggler.addEventListener('click', () => {
            this.toggleMenu();
        });
    }

    /**
     * Añade estilos CSS para el hamburger animado
     */
    addHamburgerStyles() {
        const styleId = 'mobile-ux-hamburger-styles';
        if (document.getElementById(styleId)) return;

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .hamburger-lines {
                width: 20px;
                height: 15px;
                position: relative;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            .hamburger-lines .line {
                display: block;
                height: 2px;
                width: 100%;
                background-color: var(--navbar-text, #333);
                border-radius: 2px;
                transition: ${this.animationConfig.hamburgerTransition};
                transform-origin: center;
            }

            .navbar-toggler[aria-expanded="true"] .line1 {
                transform: rotate(45deg) translate(5px, 5px);
            }

            .navbar-toggler[aria-expanded="true"] .line2 {
                opacity: 0;
                transform: scaleX(0);
            }

            .navbar-toggler[aria-expanded="true"] .line3 {
                transform: rotate(-45deg) translate(7px, -6px);
            }

            .mobile-menu-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1040;
                opacity: 0;
                pointer-events: none;
                transition: opacity ${this.animationConfig.duration}ms ${this.animationConfig.easing};
            }

            .mobile-menu-overlay.active {
                opacity: 1;
                pointer-events: all;
            }

            .navbar-collapse {
                transition: all ${this.animationConfig.duration}ms ${this.animationConfig.easing};
            }

            .bottom-nav {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--bg-navbar, #ffffff);
                border-top: 1px solid var(--border-primary, #dee2e6);
                z-index: 1030;
                display: flex;
                justify-content: space-around;
                padding: 8px 0;
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                transform: translateY(100%);
                transition: transform 0.3s ease-in-out;
            }

            .bottom-nav.active {
                transform: translateY(0);
            }

            .bottom-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px 12px;
                text-decoration: none;
                color: var(--text-secondary, #6c757d);
                font-size: 0.75rem;
                transition: all 0.2s ease;
                border-radius: 8px;
                min-width: 60px;
            }

            .bottom-nav-item:hover,
            .bottom-nav-item.active {
                color: var(--color-primary, #007bff);
                background-color: rgba(0, 123, 255, 0.1);
                text-decoration: none;
            }

            .bottom-nav-item i {
                font-size: 1.2rem;
                margin-bottom: 2px;
            }

            @media (max-width: 768px) {
                body.menu-open {
                    overflow: hidden;
                }

                .navbar-collapse.show {
                    animation: slideDown ${this.animationConfig.duration}ms ${this.animationConfig.easing};
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            }

            /* Haptic feedback visual */
            .haptic-feedback {
                animation: hapticPulse 0.15s ease-out;
            }

            @keyframes hapticPulse {
                0% { transform: scale(1); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            }
        `;

        document.head.appendChild(styles);
        console.log('🎨 [MOBILE-UX] Estilos del hamburger aplicados');
    }

    /**
     * Añade animaciones de apertura/cierre del menú
     */
    addMenuAnimations() {
        // Crear overlay
        this.createMenuOverlay();

        // Observer para cambios en el menú
        const observer = new MutationObserver(() => {
            this.updateMenuState();
        });

        observer.observe(this.navbarCollapse, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    /**
     * Crea overlay para el menú móvil
     */
    createMenuOverlay() {
        let overlay = document.querySelector('.mobile-menu-overlay');
        if (overlay) return;

        overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.addEventListener('click', () => {
            this.closeMenu();
        });

        document.body.appendChild(overlay);
        this.menuOverlay = overlay;
    }

    /**
     * Actualiza el estado del menú
     */
    updateMenuState() {
        const isOpen = this.navbarCollapse.classList.contains('show');

        if (isOpen !== this.menuState.isOpen) {
            this.menuState.isOpen = isOpen;

            if (isOpen) {
                this.onMenuOpen();
            } else {
                this.onMenuClose();
            }
        }
    }

    /**
     * Acciones al abrir el menú
     */
    onMenuOpen() {
        console.log('📱 [MOBILE-UX] Menú abierto');

        document.body.classList.add('menu-open');
        if (this.menuOverlay) {
            this.menuOverlay.classList.add('active');
        }

        // Haptic feedback
        this.triggerHaptic('light');
    }

    /**
     * Acciones al cerrar el menú
     */
    onMenuClose() {
        console.log('📱 [MOBILE-UX] Menú cerrado');

        document.body.classList.remove('menu-open');
        if (this.menuOverlay) {
            this.menuOverlay.classList.remove('active');
        }

        // Haptic feedback
        this.triggerHaptic('light');
    }

    /**
     * Toggle del menú con animaciones
     */
    toggleMenu() {
        if (this.menuState.isAnimating) return;

        this.menuState.isAnimating = true;

        // Bootstrap se encarga del toggle básico
        // Nosotros manejamos las animaciones adicionales

        setTimeout(() => {
            this.menuState.isAnimating = false;
        }, this.animationConfig.duration);
    }

    /**
     * Cierra el menú programáticamente
     */
    closeMenu() {
        if (this.navbarCollapse.classList.contains('show')) {
            this.navbarToggler.click();
        }
    }

    /**
     * Añade gestos para cerrar el menú
     */
    addMenuGestures() {
        let startY = 0;
        let currentY = 0;

        this.navbarCollapse.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });

        this.navbarCollapse.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
        }, { passive: true });

        this.navbarCollapse.addEventListener('touchend', () => {
            const deltaY = startY - currentY;

            // Si desliza hacia arriba más de 50px, cerrar menú
            if (deltaY > 50) {
                this.closeMenu();
            }
        }, { passive: true });

        this.menuState.hasGestures = true;
        console.log('👆 [MOBILE-UX] Gestos del menú configurados');
    }

    /**
     * Crea navegación inferior para móvil
     */
    createBottomNavigation() {
        if (!this.isMobile) return;

        console.log('📍 [MOBILE-UX] Creando bottom navigation...');

        const bottomNav = document.createElement('nav');
        bottomNav.className = 'bottom-nav';
        bottomNav.innerHTML = `
            <a href="#" class="bottom-nav-item active" data-page="home">
                <i class="fas fa-home"></i>
                <span>Inicio</span>
            </a>
            <a href="#conocenos" class="bottom-nav-item" data-page="about">
                <i class="fas fa-users"></i>
                <span>Nosotros</span>
            </a>
            <a href="#estudiantes" class="bottom-nav-item" data-page="students">
                <i class="fas fa-graduation-cap"></i>
                <span>Estudiantes</span>
            </a>
            <a href="#contacto" class="bottom-nav-item" data-page="contact">
                <i class="fas fa-envelope"></i>
                <span>Contacto</span>
            </a>
        `;

        document.body.appendChild(bottomNav);
        this.bottomNav = bottomNav;

        // Activar después de un delay
        setTimeout(() => {
            bottomNav.classList.add('active');
        }, 500);

        // Añadir funcionalidad
        this.setupBottomNavigation();
    }

    /**
     * Configura la funcionalidad de la navegación inferior
     */
    setupBottomNavigation() {
        if (!this.bottomNav) return;

        const items = this.bottomNav.querySelectorAll('.bottom-nav-item');

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();

                // Haptic feedback
                this.triggerHaptic('medium');

                // Actualizar estado activo
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Scroll a la sección correspondiente
                const href = item.getAttribute('href');
                if (href && href !== '#') {
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    } else {
                        // Si no es una sección, navegar a la página
                        window.location.href = href;
                    }
                }
            });
        });

        console.log('📱 [MOBILE-UX] Bottom navigation configurada');
    }

    /**
     * Configurar haptic feedback
     */
    setupHapticFeedback() {
        if (!this.isTouch) return;

        console.log('📳 [MOBILE-UX] Configurando haptic feedback...');

        // Añadir haptic feedback a elementos interactivos
        const interactiveElements = document.querySelectorAll(
            'button, .btn, .nav-link, .card, [role="button"], .dark-mode-toggle'
        );

        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                this.triggerHaptic('light');
                element.classList.add('haptic-feedback');

                setTimeout(() => {
                    element.classList.remove('haptic-feedback');
                }, 150);
            }, { passive: true });
        });
    }

    /**
     * Dispara haptic feedback
     */
    triggerHaptic(intensity = 'light') {
        if (!navigator.vibrate) return;

        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            double: [10, 10, 10]
        };

        navigator.vibrate(patterns[intensity] || patterns.light);
    }

    /**
     * Mejora el comportamiento de scroll
     */
    enhanceScrollBehavior() {
        if (!this.isMobile) return;

        console.log('📜 [MOBILE-UX] Mejorando scroll behavior...');

        const isScrolling = false;
        let lastScrollY = window.pageYOffset;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.pageYOffset;

            // Auto-hide bottom nav al hacer scroll hacia abajo
            if (this.bottomNav) {
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    // Scrolling down
                    this.bottomNav.style.transform = 'translateY(100%)';
                } else {
                    // Scrolling up
                    this.bottomNav.style.transform = 'translateY(0)';
                }
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    /**
     * Optimiza formularios para móvil
     */
    optimizeForms() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            // Mejoras de inputs
            const inputs = form.querySelectorAll('input, textarea, select');

            inputs.forEach(input => {
                // Añadir atributos para mejor teclado móvil
                this.optimizeInputForMobile(input);

                // Focus mejorado
                input.addEventListener('focus', () => {
                    this.triggerHaptic('light');

                    if (this.bottomNav) {
                        this.bottomNav.style.transform = 'translateY(100%)';
                    }
                });

                input.addEventListener('blur', () => {
                    if (this.bottomNav) {
                        setTimeout(() => {
                            this.bottomNav.style.transform = 'translateY(0)';
                        }, 300);
                    }
                });
            });
        });

        console.log('📝 [MOBILE-UX] Formularios optimizados para móvil');
    }

    /**
     * Optimiza un input específico para móvil
     */
    optimizeInputForMobile(input) {
        const type = input.type || input.tagName.toLowerCase();

        switch (type) {
            case 'email':
                input.autocapitalize = 'none';
                input.autocorrect = 'off';
                input.spellcheck = false;
                break;
            case 'tel':
                input.pattern = '[0-9]*';
                input.inputMode = 'numeric';
                break;
            case 'url':
                input.autocapitalize = 'none';
                input.autocorrect = 'off';
                input.spellcheck = false;
                break;
            case 'search':
                input.autocapitalize = 'sentences';
                break;
        }
    }

    /**
     * Mejora accesibilidad del menú
     */
    improveAccessibility() {
        if (!this.navbarToggler) return;

        // Mejorar atributos ARIA
        this.navbarToggler.setAttribute('aria-label', 'Alternar menú de navegación');

        // Añadir indicadores de estado
        const updateAriaLabel = () => {
            const isExpanded = this.navbarToggler.getAttribute('aria-expanded') === 'true';
            const label = isExpanded ? 'Cerrar menú de navegación' : 'Abrir menú de navegación';
            this.navbarToggler.setAttribute('aria-label', label);
        };

        // Observer para cambios en aria-expanded
        const observer = new MutationObserver(updateAriaLabel);
        observer.observe(this.navbarToggler, {
            attributes: true,
            attributeFilter: ['aria-expanded']
        });

        console.log('♿ [MOBILE-UX] Accesibilidad mejorada');
    }

    /**
     * Mejoras básicas para desktop
     */
    enhanceDesktopBehavior() {
        // Aplicar haptic feedback básico para trackpads
        if ('ontouchstart' in window) {
            this.setupHapticFeedback();
        }

        console.log('🖥️ [MOBILE-UX] Mejoras de desktop aplicadas');
    }

    /**
     * Detecta si es dispositivo móvil
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    /**
     * Detecta si es tablet
     */
    detectTablet() {
        return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) ||
               (window.innerWidth >= 768 && window.innerWidth <= 1024);
    }

    /**
     * API pública para obtener información del dispositivo
     */
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isTouch: this.isTouch,
            menuState: this.menuState
        };
    }

    /**
     * Método para debugging
     */
    debug() {
        console.group('🐛 [MOBILE-UX] Debug Info');
        console.log('Device info:', this.getDeviceInfo());
        console.log('DOM references:', {
            navbar: !!this.navbar,
            toggler: !!this.navbarToggler,
            collapse: !!this.navbarCollapse,
            bottomNav: !!this.bottomNav
        });
        console.groupEnd();
    }
}

// ==============================================
// INICIALIZACIÓN AUTOMÁTICA
// ==============================================

// Inicialización condicional usando context manager
function initMobileUXManager() {
    if (!window.mobileUXManager) {
        window.mobileUXManager = new MobileUXManager();
        console.log('📱 [MOBILE-UX] Mobile UX Manager disponible globalmente');
    }
}

// Esperar a que BGEContext esté disponible
if (window.BGEContext) {
    window.BGEContext.registerScript('MobileUXManager', initMobileUXManager, {
        features: ['hasNavbar'],
        critical: false
    });
} else {
    // Fallback si BGEContext no está disponible
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.navbar')) {
            initMobileUXManager();
        }
    });
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileUXManager;
}

console.log('📁 [MOBILE-UX] mobile-ux-manager.js cargado exitosamente');