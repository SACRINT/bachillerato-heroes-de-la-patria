/**
 * MAIN SCRIPT - BACHILLERATO HÉROES DE LA PATRIA
 * Refactorizado para arquitectura multi-página con Bootstrap 5
 * Incluye inyección dinámica de header/footer y APIs nativas de Bootstrap
 */

// === CONFIGURATION & CONSTANTS ===
const APP_CONFIG = {
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

// === MAIN APPLICATION CLASS ===
class HeroesPatriaApp {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    async init() {
        try {
            // 1. Load HTML partials first
            await this.loadPartials();
            
            // 2. Initialize core functionality
            this.initNavbar();
            this.initScrollEffects();
            // this.initDarkMode(); // Moved to after header loads
            this.initPWA();
            this.initBootstrapComponents();
            this.initAccessibility();
            this.initIntersectionObserver();
            
            // 3. Set current year
            this.setCurrentYear();
            
            console.log('✅ Heroes Patria App initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing app:', error);
        }
    }

    // === PARTIALS LOADING ===
    async loadPartials() {
        try {
            await Promise.all([
                this.loadPartial(APP_CONFIG.selectors.header, APP_CONFIG.partials.header),
                this.loadPartial(APP_CONFIG.selectors.footer, APP_CONFIG.partials.footer)
            ]);
            
            // After loading header, initialize navbar functionality
            this.initNavbarEnhanced();
            
            // Initialize simple search functionality after header loads
            setTimeout(() => {
                if (typeof window.initSimpleSearch === 'function') {
                    console.log('🔍 Initializing simple search...');
                    window.initSimpleSearch();
                }
            }, 200);
            
            // Re-initialize dark mode after header is loaded
            setTimeout(() => {
                console.log('🌙 Initializing dark mode...');
                // this.initDarkMode(); // DESHABILITADO - usando implementación individual en cada página
            }, 500);
            
            // Initialize admin authentication after partials are loaded
            setTimeout(() => {
                console.log('🔐 Initializing admin authentication...');
                initAdminPanelAuth();
            }, 600);
            
        } catch (error) {
            console.error('Error loading partials:', error);
        }
    }

    async loadPartial(selector, path) {
        const element = document.querySelector(selector);
        if (!element) return;

        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Failed to load ${path}`);
            
            const html = await response.text();
            element.innerHTML = html;
            
            console.log(`✅ Loaded partial: ${path}`);
            
        } catch (error) {
            console.warn(`⚠️ Could not load ${path}:`, error);
            // Fallback content
            if (selector === APP_CONFIG.selectors.header) {
                element.innerHTML = '<nav class="navbar navbar-light bg-light"><div class="container"><a class="navbar-brand" href="index.html">Héroes de la Patria</a></div></nav>';
            }
        }
    }

    // === NAVBAR FUNCTIONALITY ===
    initNavbar() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        // Scroll effect for navbar
        let isScrolled = false;
        window.addEventListener('scroll', () => {
            const shouldScroll = window.scrollY > 50;
            if (shouldScroll !== isScrolled) {
                isScrolled = shouldScroll;
                navbar.classList.toggle(APP_CONFIG.classes.navbarScrolled, isScrolled);
            }
        });
    }

    initNavbarEnhanced() {
        // Mark active page in navigation
        this.setActiveNavItem();
        
        // Smooth scroll for anchor links
        this.initSmoothScroll();
        
        // Enhanced dropdown behavior
        this.initDropdownEnhancements();
    }

    setActiveNavItem() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes(currentPage)) {
                link.classList.add('active');
            }
        });
    }

    initSmoothScroll() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without jumping
                history.pushState(null, null, `#${targetId}`);
            }
        });
    }

    initDropdownEnhancements() {
        // Add keyboard navigation for dropdowns
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const dropdown = bootstrap.Dropdown.getOrCreateInstance(toggle);
                    dropdown.toggle();
                }
            });
        });
    }

    initResponsiveNavbar() {
        // Wait for DOM to be fully loaded
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
                
                // Clean up existing dynamic items first
                const existingDynamicItems = masDropdownMenu.querySelectorAll('.nav-secondary-in-dropdown, .nav-secondary-separator');
                existingDynamicItems.forEach(item => item.remove());
                
                // For screens between 992px and 1199px, move secondary items to dropdown
                if (screenWidth < 1200 && screenWidth >= 992) {
                    // Add separator
                    const dropdownSeparator = document.createElement('li');
                    dropdownSeparator.className = 'nav-secondary-separator';
                    dropdownSeparator.innerHTML = '<hr class="dropdown-divider">';
                    
                    // Find the first static item in mas dropdown
                    const firstStaticItem = masDropdownMenu.querySelector('li:first-child');
                    if (firstStaticItem) {
                        masDropdownMenu.insertBefore(dropdownSeparator, firstStaticItem);
                    }
                    
                    // Move secondary nav items to dropdown
                    secondaryItems.forEach((item) => {
                        const link = item.querySelector('a');
                        if (!link) return;
                        
                        const isDropdown = item.classList.contains('dropdown');
                        
                        if (isDropdown) {
                            // Handle dropdown items
                            const submenu = item.querySelector('.dropdown-menu');
                            const submenuItems = submenu ? submenu.querySelectorAll('li a') : [];
                            
                            // Add main dropdown title as header
                            const headerItem = document.createElement('li');
                            headerItem.className = 'nav-secondary-in-dropdown';
                            headerItem.innerHTML = `<h6 class="dropdown-header">${link.textContent}</h6>`;
                            masDropdownMenu.insertBefore(headerItem, firstStaticItem);
                            
                            // Add submenu items
                            submenuItems.forEach(subLink => {
                                const subDropdownItem = document.createElement('li');
                                subDropdownItem.className = 'nav-secondary-in-dropdown';
                                subDropdownItem.innerHTML = `<a class="dropdown-item" href="${subLink.href}">${subLink.innerHTML}</a>`;
                                masDropdownMenu.insertBefore(subDropdownItem, firstStaticItem);
                            });
                        } else {
                            // Handle regular items
                            const dropdownItem = document.createElement('li');
                            dropdownItem.className = 'nav-secondary-in-dropdown';
                            dropdownItem.innerHTML = `<a class="dropdown-item" href="${link.href}">${link.innerHTML}</a>`;
                            masDropdownMenu.insertBefore(dropdownItem, firstStaticItem);
                        }
                    });
                }
            };

            // Initial check
            setTimeout(handleNavbarResize, 100);
            
            // Handle window resize with debouncing
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(handleNavbarResize, 150);
            });
        };

        checkAndRun();
    }

    // === SCROLL EFFECTS ===
    initScrollEffects() {
        this.initBackToTop();
        this.initScrollReveal();
    }

    initBackToTop() {
        const backToTopBtn = document.querySelector(APP_CONFIG.selectors.backToTop);
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

    initScrollReveal() {
        // Animate elements on scroll
        const animatedElements = document.querySelectorAll('[data-aos], .hover-lift, .card');
        
        if (animatedElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = '0.1s';
                    entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            observer.observe(el);
        });
    }

    // === DARK MODE ===
    initDarkMode() {
        console.log('🔍 Looking for dark mode toggle...');
        let toggle = document.querySelector(APP_CONFIG.selectors.darkModeToggle);
        console.log('Toggle found:', toggle);
        
        // If toggle doesn't exist, create it
        if (!toggle) {
            console.log('❌ No toggle found, creating one...');
            toggle = this.createDarkModeToggle();
            console.log('✅ Toggle created:', toggle);
            if (!toggle) {
                console.log('❌ Failed to create toggle');
                return; // If creation failed, abort
            }
        }

        // Load saved preference
        const isDarkMode = localStorage.getItem(APP_CONFIG.storage.darkMode) === 'true';
        if (isDarkMode) {
            document.body.classList.add(APP_CONFIG.classes.darkMode);
            this.updateDarkModeIcon(toggle, true);
        }

        // Toggle event
        toggle.addEventListener('click', () => {
            const isCurrentlyDark = document.body.classList.contains(APP_CONFIG.classes.darkMode);
            const newDarkState = !isCurrentlyDark;
            
            document.body.classList.toggle(APP_CONFIG.classes.darkMode, newDarkState);
            localStorage.setItem(APP_CONFIG.storage.darkMode, newDarkState.toString());
            this.updateDarkModeIcon(toggle, newDarkState);
            
            // Smooth transition
            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        });
    }

    createDarkModeToggle() {
        const navbar = document.querySelector('.navbar-nav');
        if (!navbar) return null;
        
        // Create list item
        const li = document.createElement('li');
        li.className = 'nav-item';
        
        // Create button
        const button = document.createElement('button');
        button.className = 'nav-link btn btn-link border-0 bg-transparent';
        button.id = 'darkModeToggle';
        button.setAttribute('aria-label', 'Alternar modo oscuro');
        
        // Create icon
        const icon = document.createElement('i');
        icon.className = 'fas fa-moon';
        icon.id = 'darkModeIcon';
        
        button.appendChild(icon);
        li.appendChild(button);
        
        // Insert at the end of navbar
        navbar.appendChild(li);
        
        // Add event listener to the newly created button
        const self = this;
        button.addEventListener('click', function() {
            const isCurrentlyDark = document.body.classList.contains(APP_CONFIG.classes.darkMode);
            const newDarkState = !isCurrentlyDark;
            
            document.body.classList.toggle(APP_CONFIG.classes.darkMode, newDarkState);
            localStorage.setItem(APP_CONFIG.storage.darkMode, newDarkState.toString());
            self.updateDarkModeIcon(button, newDarkState);
            
            // Smooth transition
            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        });
        
        return button;
    }

    updateDarkModeIcon(toggle, isDark) {
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        toggle.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
    }

    // === PWA FUNCTIONALITY ===
    initPWA() {
        this.initInstallPrompt();
        this.initServiceWorker();
    }

    initInstallPrompt() {
        const banner = document.querySelector(APP_CONFIG.selectors.pwaInstallBanner);
        const installBtn = document.querySelector(APP_CONFIG.selectors.pwaInstallBtn);
        const closeBtn = document.querySelector(APP_CONFIG.selectors.pwaCloseBtn);
        
        if (!banner) return;

        // Listen for PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Show install banner if not dismissed
            const dismissed = localStorage.getItem(APP_CONFIG.storage.pwaInstallDismissed);
            if (!dismissed) {
                setTimeout(() => {
                    banner.classList.remove('d-none');
                }, 3000);
            }
        });

        // Install button
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (!this.deferredPrompt) return;
                
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('PWA installed successfully');
                }
                
                this.deferredPrompt = null;
                banner.classList.add('d-none');
            });
        }

        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                banner.classList.add('d-none');
                localStorage.setItem(APP_CONFIG.storage.pwaInstallDismissed, 'true');
            });
        }

        // Hide after successful installation
        window.addEventListener('appinstalled', () => {
            banner.classList.add('d-none');
            console.log('PWA installed successfully');
        });
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('./sw-offline-first.js');
                    console.log('ServiceWorker registered successfully:', registration.scope);
                    
                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    this.showUpdateNotification();
                                }
                            });
                        }
                    });
                    
                } catch (error) {
                    console.warn('ServiceWorker registration failed:', error);
                }
            });
        }
    }

    showUpdateNotification() {
        // Create update notification
        const notification = document.createElement('div');
        notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        notification.innerHTML = `
            <strong>¡Actualización disponible!</strong>
            <br>Recarga la página para obtener la última versión.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto dismiss after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    // === BOOTSTRAP COMPONENTS ===
    initBootstrapComponents() {
        this.initTooltips();
        this.initPopovers();
        this.initCarousels();
        this.initModals();
    }

    initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    initPopovers() {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.forEach(popoverTriggerEl => {
            new bootstrap.Popover(popoverTriggerEl);
        });
    }

    initCarousels() {
        const carousels = document.querySelectorAll('.carousel');
        carousels.forEach(carousel => {
            new bootstrap.Carousel(carousel, {
                interval: 5000,
                pause: 'hover'
            });
        });
    }

    initModals() {
        // Auto-open modal based on URL fragment
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
    initAccessibility() {
        this.initKeyboardNavigation();
        this.initFocusManagement();
        this.initAriaLabels();
    }

    initKeyboardNavigation() {
        // Skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // ESC key to close modals, dropdowns, etc.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open dropdowns
                const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
                openDropdowns.forEach(dropdown => {
                    const toggle = dropdown.previousElementSibling;
                    if (toggle) {
                        bootstrap.Dropdown.getInstance(toggle)?.hide();
                    }
                });
            }
        });
    }

    initFocusManagement() {
        // Improve focus visibility
        const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.classList.add('focused');
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('focused');
            });
        });
    }

    initAriaLabels() {
        // Auto-generate aria-labels for buttons without them
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        buttons.forEach(button => {
            const text = button.textContent?.trim();
            if (text) {
                button.setAttribute('aria-label', text);
            }
        });
    }

    // === INTERSECTION OBSERVER ===
    initIntersectionObserver() {
        // Lazy loading for images
        const images = document.querySelectorAll('img[data-src]');
        if (images.length === 0) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('fade-in');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // === UTILITY METHODS ===
    setCurrentYear() {
        const yearElements = document.querySelectorAll('[data-current-year], .current-year');
        const currentYear = new Date().getFullYear();
        
        yearElements.forEach(element => {
            element.textContent = currentYear;
        });
    }

    // === PUBLIC METHODS ===
    showNotification(message, type = 'info', duration = 5000) {
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

    updatePageTitle(title) {
        document.title = `${title} - Bachillerato General Estatal "Héroes de la Patria"`;
    }
}

// === INITIALIZE APP ===
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new HeroesPatriaApp();
    
    // Asegurar que las funciones globales estén disponibles
    window.showAdminPanelAuth = showAdminPanelAuth;
    window.initAdminPanelAuth = initAdminPanelAuth;
});

// === GLOBAL UTILITIES ===
window.HeroesPatria = {
    showNotification: (message, type, duration) => app?.showNotification(message, type, duration),
    updatePageTitle: (title) => app?.updatePageTitle(title)
};

// === ADD FADE IN ANIMATION CSS ===
if (!document.getElementById('dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .fade-in {
            animation: fadeInUp 0.6s ease forwards;
        }
        
        .focused {
            outline: 2px solid var(--bs-primary) !important;
            outline-offset: 2px !important;
        }
        
        /* Smooth transitions for dynamic content */
        .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
            transform: translateY(-5px);
        }
    `;
    document.head.appendChild(style);
}

// === ADMIN PANEL AUTHENTICATION SYSTEM ===
class AdminPanelAuth {
    constructor() {
        // Configuración de autenticación
        this.config = {
            password: 'admin2025', // Contraseña para el panel
            sessionDuration: 2 * 60 * 60 * 1000, // 2 horas en milisegundos
            storageKey: 'heroesPatria_adminPanelAuth',
            maxAttempts: 3,
            lockoutTime: 15 * 60 * 1000 // 15 minutos de bloqueo
        };
        
        // No inicializar automáticamente - se llamará manualmente después de cargar partials
        this.setupEventListeners();
    }

    initializeAuth() {
        // Intentar inicializar inmediatamente si el DOM ya está listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            // Si el DOM ya está cargado, usar un pequeño delay para que los partials se carguen
            setTimeout(() => this.setupEventListeners(), 100);
        }
    }

    setupEventListeners() {
        const authForm = document.getElementById('adminPanelAuthForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
            console.log('Admin panel form event listener attached');
        } else {
            // Si el formulario aún no existe, reintentarlo después de un delay
            console.warn('Admin panel form not found, retrying...');
            setTimeout(() => this.setupEventListeners(), 500);
        }
        
        // Inicializar indicador de sesión basado en el estado actual
        this.updateSessionIndicator(this.isAuthenticated());
    }

    // Mostrar modal de autenticación
    showAuthModal() {
        // Verificar si ya está autenticado
        if (this.isAuthenticated()) {
            this.openAdminPanel();
            return;
        }

        // Verificar si está bloqueado por intentos fallidos
        if (this.isLockedOut()) {
            this.showLockoutMessage();
            return;
        }

        // Limpiar formulario
        this.clearAuthForm();
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('adminPanelAuthModal'));
        modal.show();
        
        // Focus en el campo de contraseña
        setTimeout(() => {
            document.getElementById('adminPanelPassword').focus();
        }, 500);
    }

    // Manejar envío del formulario
    handleAuthSubmit(e) {
        e.preventDefault();
        
        const password = document.getElementById('adminPanelPassword').value;
        
        if (this.validatePassword(password)) {
            this.grantAccess();
        } else {
            this.denyAccess();
        }
    }

    // Validar contraseña
    validatePassword(password) {
        return password === this.config.password;
    }

    // Conceder acceso
    grantAccess() {
        // Guardar sesión
        const authData = {
            authenticated: true,
            timestamp: Date.now(),
            expires: Date.now() + this.config.sessionDuration
        };
        
        localStorage.setItem(this.config.storageKey, JSON.stringify(authData));
        
        // Limpiar intentos fallidos
        localStorage.removeItem(this.config.storageKey + '_attempts');
        
        // Actualizar indicador de sesión
        this.updateSessionIndicator(true);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('adminPanelAuthModal'));
        modal.hide();
        
        // Mostrar mensaje de éxito
        this.showSuccessMessage('Acceso concedido. Abriendo Panel de Administración...');
        
        // Abrir panel después de un breve delay
        setTimeout(() => {
            this.openAdminPanel();
        }, 1500);
    }

    // Denegar acceso
    denyAccess() {
        // Incrementar contador de intentos
        const attempts = this.getFailedAttempts() + 1;
        const attemptsData = {
            count: attempts,
            lastAttempt: Date.now()
        };
        
        localStorage.setItem(this.config.storageKey + '_attempts', JSON.stringify(attemptsData));
        
        // Mostrar error
        const errorDiv = document.getElementById('adminPanelAuthError');
        const errorText = document.getElementById('adminPanelAuthErrorText');
        
        if (attempts >= this.config.maxAttempts) {
            // Bloquear acceso
            const lockoutData = {
                lockedOut: true,
                lockoutTime: Date.now(),
                unlockTime: Date.now() + this.config.lockoutTime
            };
            
            localStorage.setItem(this.config.storageKey + '_lockout', JSON.stringify(lockoutData));
            
            errorText.textContent = `Demasiados intentos fallidos. Acceso bloqueado por 15 minutos.`;
            
            // Cerrar modal después de mostrar el error
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('adminPanelAuthModal'));
                modal.hide();
                this.showLockoutMessage();
            }, 3000);
        } else {
            const remainingAttempts = this.config.maxAttempts - attempts;
            errorText.textContent = `Contraseña incorrecta. Te quedan ${remainingAttempts} intento(s).`;
        }
        
        errorDiv.classList.remove('d-none');
        
        // Limpiar campo de contraseña
        document.getElementById('adminPanelPassword').value = '';
        document.getElementById('adminPanelPassword').focus();
    }

    // Verificar si está autenticado
    isAuthenticated() {
        const authData = localStorage.getItem(this.config.storageKey);
        if (!authData) return false;
        
        try {
            const data = JSON.parse(authData);
            if (data.authenticated && Date.now() < data.expires) {
                return true;
            } else {
                // Sesión expirada
                localStorage.removeItem(this.config.storageKey);
                return false;
            }
        } catch (error) {
            localStorage.removeItem(this.config.storageKey);
            return false;
        }
    }

    // Verificar si está bloqueado
    isLockedOut() {
        const lockoutData = localStorage.getItem(this.config.storageKey + '_lockout');
        if (!lockoutData) return false;
        
        try {
            const data = JSON.parse(lockoutData);
            if (data.lockedOut && Date.now() < data.unlockTime) {
                return true;
            } else {
                // Bloqueo expirado
                localStorage.removeItem(this.config.storageKey + '_lockout');
                localStorage.removeItem(this.config.storageKey + '_attempts');
                return false;
            }
        } catch (error) {
            localStorage.removeItem(this.config.storageKey + '_lockout');
            return false;
        }
    }

    // Obtener número de intentos fallidos
    getFailedAttempts() {
        const attemptsData = localStorage.getItem(this.config.storageKey + '_attempts');
        if (!attemptsData) return 0;
        
        try {
            const data = JSON.parse(attemptsData);
            return data.count || 0;
        } catch (error) {
            return 0;
        }
    }

    // Mostrar mensaje de bloqueo
    showLockoutMessage() {
        const lockoutData = JSON.parse(localStorage.getItem(this.config.storageKey + '_lockout') || '{}');
        const remainingTime = Math.ceil((lockoutData.unlockTime - Date.now()) / (60 * 1000));
        
        this.showErrorMessage(`Acceso bloqueado por seguridad. Intenta nuevamente en ${remainingTime} minuto(s).`);
    }

    // Abrir panel de administración
    openAdminPanel() {
        try {
            const popup = window.open('admin/manual.html', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no');
            
            if (popup === null || typeof(popup) === 'undefined') {
                // Popup bloqueado, abrir en la misma ventana
                this.showErrorMessage('Popup bloqueado. Abriendo en nueva pestaña...');
                setTimeout(() => {
                    window.open('admin/manual.html', '_blank');
                }, 1000);
            } else {
                popup.focus();
            }
        } catch (error) {
            console.error('Error abriendo panel:', error);
            // Fallback: abrir en nueva pestaña
            window.open('admin/manual.html', '_blank');
        }
    }

    // Limpiar formulario
    clearAuthForm() {
        document.getElementById('adminPanelPassword').value = '';
        document.getElementById('adminPanelAuthError').classList.add('d-none');
    }

    // Mostrar mensaje de éxito
    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    // Mostrar mensaje de error
    showErrorMessage(message) {
        this.showToast(message, 'danger');
    }

    // Mostrar toast notification
    showToast(message, type = 'info') {
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        const toastElement = document.createElement('div');
        toastElement.className = `toast align-items-center text-bg-${type} border-0`;
        toastElement.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toastElement);
        
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        toast.show();

        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // Actualizar indicador de sesión en el menú
    updateSessionIndicator(isAuthenticated) {
        const statusBadge = document.getElementById('adminPanelSessionStatus');
        const logoutOption = document.getElementById('adminPanelLogoutOption');
        const menuLink = document.getElementById('adminPanelMenuLink');
        
        if (isAuthenticated) {
            if (statusBadge) statusBadge.classList.remove('d-none');
            if (logoutOption) logoutOption.classList.remove('d-none');
            if (menuLink) menuLink.innerHTML = '<i class="fas fa-edit me-2"></i>Abrir Panel <span class="badge bg-success ms-2">Sesión Activa</span>';
        } else {
            if (statusBadge) statusBadge.classList.add('d-none');
            if (logoutOption) logoutOption.classList.add('d-none');
            if (menuLink) menuLink.innerHTML = '<i class="fas fa-edit me-2"></i>Panel de Administración';
        }
    }

    // Cerrar sesión
    logout() {
        localStorage.removeItem(this.config.storageKey);
        this.updateSessionIndicator(false);
        this.showSuccessMessage('Sesión cerrada correctamente.');
    }
}

// === GLOBAL FUNCTIONS ===
// Instanciar sistema de autenticación
let adminPanelAuth = null;

// Función para inicializar el sistema de autenticación
function initAdminPanelAuth() {
    if (!adminPanelAuth) {
        adminPanelAuth = new AdminPanelAuth();
        window.adminPanelAuth = adminPanelAuth;
        console.log('✅ Admin Panel Auth initialized');
    }
}

// Función global para mostrar modal de autenticación (llamada desde el menú)
function showAdminPanelAuth() {
    if (!adminPanelAuth) {
        initAdminPanelAuth();
    }
    adminPanelAuth.showAuthModal();
}

// Función global para cerrar sesión
function logoutAdminPanel() {
    adminPanelAuth.logout();
}