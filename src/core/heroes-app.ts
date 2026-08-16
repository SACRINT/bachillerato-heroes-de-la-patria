
/**
 * src/core/heroes-app.ts
 * Lógica principal de la aplicación BGE Héroes de la Patria.
 * Migrado desde public/js/script.js
 */

declare const bootstrap: any;
declare const DOMPurify: any;

// Definición de tipos para APP_CONFIG
interface IAppConfig {
    partials: {
        header: string;
        footer: string;
    };
    selectors: {
        header: string;
        footer: string;
        backToTop: string;
        darkModeToggle: string;
        pwaInstallBanner: string;
        pwaInstallBtn: string;
        pwaCloseBtn: string;
    };
    classes: {
        darkMode: string;
        navbarScrolled: string;
        visible: string;
    };
    storage: {
        darkMode: string;
        pwaInstallDismissed: string;
    };
}

// Configuración por defecto
export const MOUNT_CONFIG: IAppConfig = {
    partials: {
        header: 'partials/header.html',
        footer: 'partials/footer.html'
    },
    selectors: {
        header: '#main-header',
        footer: '#main-footer',
        backToTop: '#back-to-top',
        darkModeToggle: '#darkModeToggle',
        pwaInstallBanner: '#pwa-install-banner',
        pwaInstallBtn: '#pwa-install-btn',
        pwaCloseBtn: '#pwa-close-btn'
    },
    classes: {
        darkMode: 'dark-mode',
        navbarScrolled: 'scrolled',
        visible: 'visible'
    },
    storage: {
        darkMode: 'heroesPatria_darkMode',
        pwaInstallDismissed: 'heroesPatria_pwaInstallDismissed'
    }
};

export class HeroesPatriaApp {
    private deferredPrompt: any;
    private config: IAppConfig;

    constructor(config: IAppConfig = MOUNT_CONFIG) {
        this.config = config;
        this.deferredPrompt = null;
    }

    public async init(): Promise<void> {
        try {
            

            // 1. Cargar HTML partials primero
            await this.loadPartials();

            // 2. Inicializar funcionalidades core
            this.initNavbar();
            this.initScrollEffects();
            this.initDarkMode();
            this.initPWA();
            this.initBootstrapComponents();
            this.initAccessibility();
            this.initIntersectionObserver();

            // 3. Establecer año actual
            this.setCurrentYear();

            

        } catch (error) {
            console.error('❌ Error initializing app:', error);
        }
    }

    // === PARTIALS LOADING ===
    private async loadPartials(): Promise<void> {
        try {
            await Promise.all([
                this.loadPartial(this.config.selectors.header, this.config.partials.header),
                this.loadPartial(this.config.selectors.footer, this.config.partials.footer)
            ]);

            // Después de cargar header, inicializar navbar enhanced
            this.initNavbarEnhanced();

            // Inicializar búsqueda simple
            setTimeout(() => {
                if (typeof (window as any).initSimpleSearch === 'function') {
                    (window as any).initSimpleSearch();
                }
            }, 200);

            // Re-inicializar dark mode por si el toggle estaba en el header
            setTimeout(() => {
                this.initDarkMode();
            }, 500);

            // Inicializar auth segura si existe
            setTimeout(() => {
                if (typeof (window as any).initSecureAuthSystem === 'function') {
                    if (!(window as any).secureAdminAuth) {
                        (window as any).initSecureAuthSystem();
                    }
                }
            }, 800);

        } catch (error) {
            console.error('Error loading partials:', error);
        }
    }

    private async loadPartial(selector: string, path: string): Promise<void> {
        const element = document.querySelector(selector);
        if (!element) return;

        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Failed to load ${path}`);

            const html = await response.text();
            // Usar DOMPurify si está disponible, sino insertar directo (pero con warning)
            if (typeof DOMPurify !== 'undefined') {
                element.innerHTML = DOMPurify.sanitize(html);
            } else {
                
                element.innerHTML = html;
            }

        } catch (error) {
            
            // Fallback content para header
            if (selector === this.config.selectors.header) {
                const fallback = '<nav class="navbar navbar-light bg-light"><div class="container"><a class="navbar-brand" href="index.html">BGE Héroes de la Patria</a></div></nav>';
                element.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(fallback) : fallback;
            }
        }
    }

    // === NAVBAR FUNCTIONALITY ===
    private initNavbar(): void {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        let isScrolled = false;
        window.addEventListener('scroll', () => {
            const shouldScroll = window.scrollY > 50;
            if (shouldScroll !== isScrolled) {
                isScrolled = shouldScroll;
                navbar.classList.toggle(this.config.classes.navbarScrolled, isScrolled);
            }
        });
    }

    private initNavbarEnhanced(): void {
        this.setActiveNavItem();
        this.initSmoothScroll();
        this.initDropdownEnhancements();
        this.initResponsiveNavbar();
    }

    private setActiveNavItem(): void {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes(currentPage)) {
                link.classList.add('active');
            }
        });
    }

    private initSmoothScroll(): void {
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a[href^="#"]');
            if (!link) return;

            e.preventDefault();
            const href = link.getAttribute('href');
            if (!href) return;

            const targetId = href.slice(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                history.pushState(null, '', `#${targetId}`);
            }
        });
    }

    private initDropdownEnhancements(): void {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('keydown', (e: any) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (typeof bootstrap !== 'undefined') {
                        const dropdown = bootstrap.Dropdown.getOrCreateInstance(toggle);
                        dropdown.toggle();
                    }
                }
            });
        });
    }

    private initResponsiveNavbar(): void {
        const checkAndRun = () => {
            const navbar = document.querySelector('#mainNavList');
            const masDropdown = document.querySelector('#masDropdownContainer');
            const masDropdownMenu = document.querySelector('#masDropdownMenu');

            if (!navbar || !masDropdown || !masDropdownMenu) {
                setTimeout(checkAndRun, 100);
                return;
            }

            const handleNavbarResize = () => {
                const secondaryItems = document.querySelectorAll('.nav-secondary');
                const screenWidth = window.innerWidth;

                const existingDynamicItems = masDropdownMenu.querySelectorAll('.nav-secondary-in-dropdown, .nav-secondary-separator');
                existingDynamicItems.forEach((item) => item.remove());

                if (screenWidth < 1200 && screenWidth >= 992) {
                    const dropdownSeparator = document.createElement('li');
                    dropdownSeparator.className = 'nav-secondary-separator';
                    dropdownSeparator.innerHTML = '<hr class="dropdown-divider">'; // Asumiendo sanitize luego si necesario

                    const firstStaticItem = masDropdownMenu.querySelector('li:first-child');
                    if (firstStaticItem) {
                        masDropdownMenu.insertBefore(dropdownSeparator, firstStaticItem);
                    }

                    secondaryItems.forEach((item) => {
                        const link = item.querySelector('a');
                        if (!link) return;

                        const isDropdown = item.classList.contains('dropdown');

                        if (isDropdown) {
                            const headerItem = document.createElement('li');
                            headerItem.className = 'nav-secondary-in-dropdown';
                            headerItem.innerHTML = `<h6 class="dropdown-header">${link.textContent}</h6>`;
                            masDropdownMenu.insertBefore(headerItem, firstStaticItem);

                            const submenu = item.querySelector('.dropdown-menu');
                            const submenuItems = submenu ? submenu.querySelectorAll('li a') : [];

                            submenuItems.forEach((subLink: any) => {
                                const subDropdownItem = document.createElement('li');
                                subDropdownItem.className = 'nav-secondary-in-dropdown';
                                subDropdownItem.innerHTML = `<a class="dropdown-item" href="${subLink.href}">${subLink.innerHTML}</a>`;
                                masDropdownMenu.insertBefore(subDropdownItem, firstStaticItem);
                            });

                        } else {
                            const dropdownItem = document.createElement('li');
                            dropdownItem.className = 'nav-secondary-in-dropdown';
                            dropdownItem.innerHTML = `<a class="dropdown-item" href="${link.href}">${link.innerHTML}</a>`;
                            masDropdownMenu.insertBefore(dropdownItem, firstStaticItem);
                        }
                    });
                }
            };

            setTimeout(handleNavbarResize, 100);

            let resizeTimeout: any;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(handleNavbarResize, 150);
            });
        };

        checkAndRun();
    }

    // === SCROLL EFFECTS ===
    private initScrollEffects(): void {
        this.initBackToTop();
        this.initScrollReveal();
    }

    private initBackToTop(): void {
        const backToTopBtn = document.querySelector(this.config.selectors.backToTop);
        if (!backToTopBtn) return;

        let isVisible = false;
        window.addEventListener('scroll', () => {
            const shouldShow = window.scrollY > 300;
            if (shouldShow !== isVisible) {
                isVisible = shouldShow;
                backToTopBtn.classList.toggle('d-none', !isVisible);
            }
        });

        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    private initScrollReveal(): void {
        const animatedElements = document.querySelectorAll('[data-aos], .hover-lift, .card');
        if (animatedElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const target = entry.target as HTMLElement;
                if (entry.isIntersecting) {
                    target.style.animationDelay = '0.1s';
                    target.style.animation = 'fadeInUp 0.6s ease forwards';
                    observer.unobserve(target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach((el) => {
            const element = el as HTMLElement;
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            observer.observe(element);
        });
    }

    // === DARK MODE ===
    private initDarkMode(): void {
        let toggle = document.querySelector(this.config.selectors.darkModeToggle);

        if (!toggle) {
            const floatingToggle = document.querySelector('.dark-mode-toggle');
            if (floatingToggle) {
                toggle = floatingToggle;
            } else {
                toggle = this.createDarkModeToggle();
                if (!toggle) return;
            }
        }

        const isDarkMode = localStorage.getItem(this.config.storage.darkMode) === 'true';
        if (isDarkMode) {
            document.body.classList.add(this.config.classes.darkMode);
        } else {
            document.body.classList.remove(this.config.classes.darkMode);
        }

        this.updateDarkModeIcon(toggle, isDarkMode);

        // Recrear nodo para limpiar listeners previos
        const newToggle = toggle.cloneNode(true) as Element;
        toggle.parentNode?.replaceChild(newToggle, toggle);
        toggle = newToggle;

        toggle.addEventListener('click', () => {
            const isCurrentlyDark = document.body.classList.contains(this.config.classes.darkMode);
            const newDarkState = !isCurrentlyDark;

            document.body.classList.toggle(this.config.classes.darkMode, newDarkState);
            localStorage.setItem(this.config.storage.darkMode, newDarkState.toString());
            this.updateDarkModeIcon(newToggle, newDarkState);

            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        });
    }

    private createDarkModeToggle(): Element | null {
        const navbar = document.querySelector('.navbar-nav');
        if (!navbar) return null;

        const li = document.createElement('li');
        li.className = 'nav-item';

        const button = document.createElement('button');
        button.className = 'nav-link btn btn-link border-0 bg-transparent';
        button.id = 'darkModeToggle';
        button.setAttribute('aria-label', 'Alternar modo oscuro');

        const icon = document.createElement('i');
        icon.className = 'fas fa-moon';
        icon.id = 'darkModeIcon';

        button.appendChild(icon);
        li.appendChild(button);

        const lastItem = navbar.lastElementChild;
        if (lastItem) {
            navbar.insertBefore(li, lastItem);
        } else {
            navbar.appendChild(li);
        }

        // Listener inicial para el botón recién creado
        button.addEventListener('click', () => {
            const isCurrentlyDark = document.body.classList.contains(this.config.classes.darkMode);
            const newDarkState = !isCurrentlyDark;
            document.body.classList.toggle(this.config.classes.darkMode, newDarkState);
            localStorage.setItem(this.config.storage.darkMode, newDarkState.toString());
            this.updateDarkModeIcon(button, newDarkState);
        });

        return button;
    }

    private updateDarkModeIcon(toggle: Element, isDark: boolean): void {
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        toggle.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
    }

    // === PWA ===
    private initPWA(): void {
        this.initInstallPrompt();
    }

    private initInstallPrompt(): void {
        const banner = document.querySelector(this.config.selectors.pwaInstallBanner);
        const installBtn = document.querySelector(this.config.selectors.pwaInstallBtn);
        const closeBtn = document.querySelector(this.config.selectors.pwaCloseBtn);

        if (!banner) return;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;

            const dismissed = localStorage.getItem(this.config.storage.pwaInstallDismissed);
            if (!dismissed) {
                setTimeout(() => {
                    banner.classList.remove('d-none');
                }, 3000);
            }
        });

        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (!this.deferredPrompt) return;

                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;

                if (outcome === 'accepted') {
                    
                }

                this.deferredPrompt = null;
                banner.classList.add('d-none');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                banner.classList.add('d-none');
                localStorage.setItem(this.config.storage.pwaInstallDismissed, 'true');
            });
        }

        window.addEventListener('appinstalled', () => {
            banner.classList.add('d-none');
        });
    }

    // === BOOTSTRAP ===
    private initBootstrapComponents(): void {
        if (typeof bootstrap === 'undefined') return;

        // Tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach((tooltipTriggerEl) => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.forEach((popoverTriggerEl) => {
            new bootstrap.Popover(popoverTriggerEl);
        });

        // Carousels
        const carousels = document.querySelectorAll('.carousel');
        carousels.forEach((carousel) => {
            new bootstrap.Carousel(carousel, {
                interval: 5000,
                pause: 'hover'
            });
        });

        this.initModals();
    }

    private initModals(): void {
        if (typeof bootstrap === 'undefined') return;

        const hash = window.location.hash;
        if (hash && hash.startsWith('#modal-')) {
            const modalId = hash.substring(1);
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        }
    }

    // === ACCESSIBILITY ===
    private initAccessibility(): void {
        // Skip link
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = skipLink.getAttribute('href');
                if (targetId) {
                    const target = document.querySelector(targetId) as HTMLElement;
                    if (target) {
                        target.focus();
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        }

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (typeof bootstrap !== 'undefined') {
                    const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
                    openDropdowns.forEach(dropdown => {
                        const toggle = dropdown.previousElementSibling;
                        if (toggle) {
                            bootstrap.Dropdown.getInstance(toggle)?.hide();
                        }
                    });
                }
            }
        });

        // Focus management
        const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.classList.add('focused');
            });
            element.addEventListener('blur', () => {
                element.classList.remove('focused');
            });
        });

        // Aria labels
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        buttons.forEach(button => {
            const text = button.textContent?.trim();
            if (text) {
                button.setAttribute('aria-label', text);
            }
        });
    }

    // === INTERSECTION OBSERVER ===
    private initIntersectionObserver(): void {
        const images = document.querySelectorAll('img[data-src]');
        if (images.length === 0) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const target = entry.target as HTMLElement; // Asegurarse que es HTMLElement pero es img
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    img.src = img.dataset.src || '';
                    img.classList.add('fade-in');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // === UTILITIES ===
    private setCurrentYear(): void {
        const yearElements = document.querySelectorAll('[data-current-year], .current-year');
        const currentYear = new Date().getFullYear();
        yearElements.forEach(element => {
            element.textContent = currentYear.toString();
        });
    }

    // Public API
    public showNotification(message: string, type: string = 'info', duration: number = 5000): void {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }

    public updatePageTitle(title: string): void {
        const suffix = ' - Bachillerato General Estatal "Héroes de la Patria"';
        document.title = `${title}${suffix}`;
    }
}
