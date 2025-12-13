/**
 * 📱 MOBILE UX MANAGER - TypeScript
 * Mejoras de experiencia móvil avanzadas para BGE
 *
 * Features:
 * - Animaciones avanzadas del menú hamburguesa
 * - Bottom navigation para móvil
 * - Haptic feedback
 * - Scroll behavior mejorado
 * - Mejoras de formularios para móvil
 *
 * Migrado a TypeScript: 13 Diciembre 2025
 */

import { bgeContext } from './context-manager';

export interface MobileUXConfig {
    animationDuration: number;
    easing: string;
    hamburgerTransition: string;
}

export interface MobileMenuState {
    isOpen: boolean;
    isAnimating: boolean;
    hasGestures: boolean;
}

export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'double';

export class MobileUXManager {
    private static instance: MobileUXManager;

    // Configuración
    private config: MobileUXConfig = {
        animationDuration: 300,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        hamburgerTransition: 'all 0.3s ease-in-out'
    };

    // Estado
    public isMobile: boolean;
    public isTablet: boolean;
    public isTouch: boolean;
    public menuState: MobileMenuState = {
        isOpen: false,
        isAnimating: false,
        hasGestures: false
    };

    // Referencias DOM
    private navbar: HTMLElement | null = null;
    private navbarToggler: HTMLElement | null = null;
    private navbarCollapse: HTMLElement | null = null;
    private bottomNav: HTMLElement | null = null;
    private menuOverlay: HTMLElement | null = null;

    private constructor() {
        console.log('📱 [MOBILE-UX] Inicializando Mobile UX Manager (TS)...');

        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

        this.init();
    }

    /**
     * Singleton pattern
     */
    static getInstance(): MobileUXManager {
        if (!MobileUXManager.instance) {
            MobileUXManager.instance = new MobileUXManager();
        }
        return MobileUXManager.instance;
    }

    private init(): void {
        if (typeof document === 'undefined') return;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    private setup(): void {
        try {
            this.getDOMReferences();

            if (this.isMobile || this.isTablet) {
                this.enhanceHamburgerMenu();
                this.createBottomNavigation();
                this.setupHapticFeedback();
                this.enhanceScrollBehavior();
                this.optimizeForms();
                console.log('✅ [MOBILE-UX] Mobile UX Manager inicializado correctamente');
            } else {
                this.enhanceDesktopBehavior();
            }
        } catch (error) {
            console.error('❌ [MOBILE-UX] Error inicializando Mobile UX Manager:', error);
        }
    }

    private getDOMReferences(): void {
        this.navbar = document.querySelector('.navbar');
        this.navbarToggler = document.querySelector('.navbar-toggler');
        this.navbarCollapse = document.querySelector('.navbar-collapse');
    }

    // ==========================================
    // MENU HAMBURGUESA
    // ==========================================

    private enhanceHamburgerMenu(): void {
        if (!this.navbarToggler || !this.navbarCollapse) return;

        this.enhanceHamburgerIcon();
        this.addMenuAnimations();
        this.addMenuGestures();
        this.improveAccessibility();
    }

    private enhanceHamburgerIcon(): void {
        if (!this.navbarToggler) return;

        const togglerIcon = this.navbarToggler.querySelector('.navbar-toggler-icon');
        if (!togglerIcon) return;

        // Reemplazar con icono animado
        togglerIcon.innerHTML = `
            <div class="hamburger-lines">
                <span class="line line1"></span>
                <span class="line line2"></span>
                <span class="line line3"></span>
            </div>
        `;

        this.addHamburgerStyles();

        this.navbarToggler.addEventListener('click', () => {
            this.toggleMenu();
        });
    }

    private addHamburgerStyles(): void {
        const styleId = 'mobile-ux-hamburger-styles';
        if (document.getElementById(styleId)) return;

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .hamburger-lines {
                width: 20px; height: 15px; position: relative;
                display: flex; flex-direction: column; justify-content: space-between;
            }
            .hamburger-lines .line {
                display: block; height: 2px; width: 100%;
                background-color: var(--navbar-text, #333);
                border-radius: 2px;
                transition: ${this.config.hamburgerTransition};
                transform-origin: center;
            }
            .navbar-toggler[aria-expanded="true"] .line1 { transform: rotate(45deg) translate(5px, 5px); }
            .navbar-toggler[aria-expanded="true"] .line2 { opacity: 0; transform: scaleX(0); }
            .navbar-toggler[aria-expanded="true"] .line3 { transform: rotate(-45deg) translate(7px, -6px); }
            
            .mobile-menu-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.5); z-index: 1040;
                opacity: 0; pointer-events: none;
                transition: opacity ${this.config.animationDuration}ms ${this.config.easing};
            }
            .mobile-menu-overlay.active { opacity: 1; pointer-events: all; }
            
            .navbar-collapse { transition: all ${this.config.animationDuration}ms ${this.config.easing}; }
            
            .bottom-nav {
                position: fixed; bottom: 0; left: 0; right: 0;
                background: var(--bg-navbar, #ffffff);
                border-top: 1px solid var(--border-primary, #dee2e6);
                z-index: 1030; display: flex; justify-content: space-around;
                padding: 8px 0; box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                transform: translateY(100%); transition: transform 0.3s ease-in-out;
            }
            .bottom-nav.active { transform: translateY(0); }
            
            .bottom-nav-item {
                display: flex; flex-direction: column; align-items: center;
                padding: 8px 12px; text-decoration: none;
                color: var(--text-secondary, #6c757d);
                font-size: 0.75rem; transition: all 0.2s ease;
                border-radius: 8px; min-width: 60px;
            }
            .bottom-nav-item:hover, .bottom-nav-item.active {
                color: var(--color-primary, #007bff);
                background-color: rgba(0, 123, 255, 0.1);
                text-decoration: none;
            }
            .bottom-nav-item i { font-size: 1.2rem; margin-bottom: 2px; }

            .haptic-feedback { animation: hapticPulse 0.15s ease-out; }
            @keyframes hapticPulse {
                0% { transform: scale(1); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(styles);
    }

    private addMenuAnimations(): void {
        if (!this.navbarCollapse) return;

        this.createMenuOverlay();

        const observer = new MutationObserver(() => {
            this.updateMenuState();
        });

        observer.observe(this.navbarCollapse, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    private createMenuOverlay(): void {
        let overlay = document.querySelector('.mobile-menu-overlay') as HTMLElement;
        if (overlay) {
            this.menuOverlay = overlay;
            return;
        }

        overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.addEventListener('click', () => this.closeMenu());

        document.body.appendChild(overlay);
        this.menuOverlay = overlay;
    }

    private updateMenuState(): void {
        if (!this.navbarCollapse) return;

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

    private onMenuOpen(): void {
        document.body.classList.add('menu-open');
        if (this.menuOverlay) {
            this.menuOverlay.classList.add('active');
        }
        this.triggerHaptic('light');
    }

    private onMenuClose(): void {
        document.body.classList.remove('menu-open');
        if (this.menuOverlay) {
            this.menuOverlay.classList.remove('active');
        }
        this.triggerHaptic('light');
    }

    public toggleMenu(): void {
        if (this.menuState.isAnimating) return;
        this.menuState.isAnimating = true;

        setTimeout(() => {
            this.menuState.isAnimating = false;
        }, this.config.animationDuration);
    }

    public closeMenu(): void {
        if (this.navbarCollapse && this.navbarCollapse.classList.contains('show')) {
            if (this.navbarToggler) this.navbarToggler.click();
        }
    }

    private addMenuGestures(): void {
        if (!this.navbarCollapse) return;

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
    }

    // ==========================================
    // BOTTOM NAVIGATION
    // ==========================================

    private createBottomNavigation(): void {
        if (!this.isMobile || this.bottomNav) return;

        const bottomNav = document.createElement('nav');
        bottomNav.className = 'bottom-nav';
        bottomNav.innerHTML = `
            <a href="/" class="bottom-nav-item" data-page="home">
                <i class="fas fa-home"></i><span>Inicio</span>
            </a>
            <a href="/conocenos.html" class="bottom-nav-item" data-page="about">
                <i class="fas fa-users"></i><span>Nosotros</span>
            </a>
            <a href="/estudiantes.html" class="bottom-nav-item" data-page="students">
                <i class="fas fa-graduation-cap"></i><span>Estudiantes</span>
            </a>
            <a href="/contacto.html" class="bottom-nav-item" data-page="contact">
                <i class="fas fa-envelope"></i><span>Contacto</span>
            </a>
        `;

        document.body.appendChild(bottomNav);
        this.bottomNav = bottomNav;

        setTimeout(() => {
            bottomNav.classList.add('active');
            this.highlightActiveNavItem();
        }, 500);

        this.setupBottomNavigation();
    }

    private highlightActiveNavItem(): void {
        if (!this.bottomNav) return;

        const path = window.location.pathname;
        const page = path === '/' || path === '/index.html' ? 'home' :
            path.includes('conocenos') ? 'about' :
                path.includes('estudiantes') ? 'students' :
                    path.includes('contacto') ? 'contact' : null;

        if (page) {
            const item = this.bottomNav.querySelector(`[data-page="${page}"]`);
            if (item) item.classList.add('active');
        }
    }

    private setupBottomNavigation(): void {
        if (!this.bottomNav) return;

        const items = this.bottomNav.querySelectorAll('.bottom-nav-item');

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                // Haptic feedback
                this.triggerHaptic('medium');

                // Active state
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    // ==========================================
    // HAPTIC FEEDBACK
    // ==========================================

    private setupHapticFeedback(): void {
        if (!this.isTouch) return;

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

    public triggerHaptic(intensity: HapticIntensity = 'light'): void {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            const patterns: Record<HapticIntensity, number[]> = {
                light: [10],
                medium: [20],
                heavy: [30],
                double: [10, 10, 10]
            };
            navigator.vibrate(patterns[intensity] || patterns.light);
        }
    }

    // ==========================================
    // SCROLL & FORMS
    // ==========================================

    private enhanceScrollBehavior(): void {
        if (!this.isMobile) return;

        let lastScrollY = window.pageYOffset;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.pageYOffset;

            // Auto-hide bottom nav
            if (this.bottomNav) {
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    this.bottomNav.style.transform = 'translateY(100%)';
                } else {
                    this.bottomNav.style.transform = 'translateY(0)';
                }
            }
            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    private optimizeForms(): void {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');

            inputs.forEach(input => {
                this.optimizeInputForMobile(input as HTMLInputElement);

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
    }

    private optimizeInputForMobile(input: HTMLInputElement): void {
        const type = input.type;

        switch (type) {
            case 'email':
                input.autocapitalize = 'none';
                input.spellcheck = false;
                break;
            case 'tel':
                input.pattern = '[0-9]*';
                input.inputMode = 'numeric';
                break;
            case 'url':
                input.autocapitalize = 'none';
                input.spellcheck = false;
                break;
            case 'search':
                input.autocapitalize = 'sentences';
                break;
        }
    }

    private improveAccessibility(): void {
        if (!this.navbarToggler) return;

        this.navbarToggler.setAttribute('aria-label', 'Alternar menú de navegación');

        const updateAriaLabel = () => {
            const isExpanded = this.navbarToggler?.getAttribute('aria-expanded') === 'true';
            this.navbarToggler?.setAttribute('aria-label', isExpanded ? 'Cerrar menú' : 'Abrir menú');
        };

        const observer = new MutationObserver(updateAriaLabel);
        observer.observe(this.navbarToggler, {
            attributes: true,
            attributeFilter: ['aria-expanded']
        });
    }

    private enhanceDesktopBehavior(): void {
        if (this.isTouch) {
            this.setupHapticFeedback();
        }
    }

    // ==========================================
    // UTILS
    // ==========================================

    private detectMobile(): boolean {
        if (typeof window === 'undefined') return false;
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth <= 768;
    }

    private detectTablet(): boolean {
        if (typeof window === 'undefined') return false;
        return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) ||
            (window.innerWidth >= 768 && window.innerWidth <= 1024);
    }
}

// Singleton instance
export const mobileUXManager = MobileUXManager.getInstance();

// Expose globally
if (typeof window !== 'undefined') {
    (window as any).mobileUXManager = mobileUXManager;
    (window as any).MobileUXManager = MobileUXManager;

    // Register with Context Manager if available
    if ((window as any).BGEContext) {
        (window as any).BGEContext.registerScript('MobileUXManager', () => {
            // Already initialized via singleton
        }, { features: ['hasNavbar'] });
    }
}

export default mobileUXManager;
