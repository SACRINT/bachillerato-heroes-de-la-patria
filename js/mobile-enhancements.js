/**
 * 📱 MEJORAS PARA MÓVILES
 * Optimización completa para experiencia móvil de clase mundial
 */

class MobileEnhancements {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.orientation = this.getOrientation();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.swipeMinDistance = 100;
        this.tapTimeout = null;
        this.lastTap = 0;
        
        this.init();
    }

    init() {
        if (this.isMobile || this.isTablet) {
            this.setupMobileOptimizations();
            this.enableTouchGestures();
            this.optimizeMobileInterface();
            this.setupMobileNavigation();
            this.enableMobileFeatures();
            this.setupOrientationHandling();
            this.optimizeMobilePerformance();
            
            console.log('📱 Mobile Enhancements activadas');
        }
    }

    // ============================================
    // DETECCIÓN DE DISPOSITIVOS
    // ============================================

    detectMobile() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = ['mobile', 'iphone', 'ipod', 'android', 'blackberry', 'windows phone', 'opera mini'];
        
        return mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
               window.innerWidth <= 768 ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    detectTablet() {
        const userAgent = navigator.userAgent.toLowerCase();
        return (userAgent.includes('tablet') ||
                userAgent.includes('ipad') ||
                (userAgent.includes('android') && !userAgent.includes('mobile')) ||
                (window.innerWidth > 768 && window.innerWidth <= 1024 && 'ontouchstart' in window));
    }

    getOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    // ============================================
    // OPTIMIZACIONES MÓVILES
    // ============================================

    setupMobileOptimizations() {
        // Viewport meta tag dinámico
        this.setViewportMeta();
        
        // Prevenir zoom en inputs
        this.preventZoomOnInputs();
        
        // Optimizar scroll
        this.optimizeScrolling();
        
        // Mejorar rendimiento táctil
        this.optimizeTouchPerformance();
        
        // Lazy loading agresivo en móvil
        this.enableAggressiveLazyLoading();
    }

    setViewportMeta() {
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        
        // Viewport optimizado para móviles
        const viewportContent = this.isMobile ? 
            'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes' :
            'width=device-width, initial-scale=1.0';
        
        viewportMeta.content = viewportContent;
    }

    preventZoomOnInputs() {
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Aumentar tamaño de fuente para prevenir zoom automático
            if (this.isMobile && window.getComputedStyle(input).fontSize === '16px') {
                input.style.fontSize = '16px';
            }
        });
    }

    optimizeScrolling() {
        // Smooth scrolling nativo
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Optimizar scroll en contenedores
        const scrollContainers = document.querySelectorAll('.scroll-container, .modal-body, .chatbot-messages');
        
        scrollContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
            container.style.overscrollBehavior = 'contain';
        });
    }

    optimizeTouchPerformance() {
        // Optimizar eventos táctiles
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Mejorar feedback táctil
        const touchElements = document.querySelectorAll('button, .btn, a, .card, .clickable');
        touchElements.forEach(element => {
            element.style.webkitTapHighlightColor = 'rgba(0,0,0,0.1)';
            element.style.webkitTouchCallout = 'none';
        });
    }

    enableAggressiveLazyLoading() {
        // Lazy loading más agresivo en móvil
        const images = document.querySelectorAll('img');
        const observerOptions = {
            rootMargin: this.isMobile ? '50px' : '200px',
            threshold: 0.1
        };
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, observerOptions);
        
        images.forEach(img => {
            if (img.dataset.src) {
                imageObserver.observe(img);
            }
        });
    }

    // ============================================
    // GESTOS TÁCTILES
    // ============================================

    enableTouchGestures() {
        this.setupSwipeGestures();
        this.setupPinchGestures();
        this.setupTapGestures();
        this.setupLongPressGestures();
    }

    setupSwipeGestures() {
        let startX, startY, startTime;
        
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const endTime = Date.now();
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;
            
            // Verificar si es un swipe válido
            if (Math.abs(deltaX) > this.swipeMinDistance || Math.abs(deltaY) > this.swipeMinDistance) {
                if (deltaTime < 300) {
                    this.handleSwipe(deltaX, deltaY, e.target);
                }
            }
        }, { passive: true });
    }

    handleSwipe(deltaX, deltaY, target) {
        const direction = Math.abs(deltaX) > Math.abs(deltaY) ?
            (deltaX > 0 ? 'right' : 'left') :
            (deltaY > 0 ? 'down' : 'up');
        
        // Acciones específicas por swipe
        switch (direction) {
            case 'left':
                // Swipe izquierda: siguiente sección o cerrar sidebar
                this.handleLeftSwipe(target);
                break;
            case 'right':
                // Swipe derecha: sección anterior o abrir sidebar
                this.handleRightSwipe(target);
                break;
            case 'up':
                // Swipe arriba: scroll rápido hacia arriba
                this.handleUpSwipe(target);
                break;
            case 'down':
                // Swipe abajo: actualizar contenido o cerrar modales
                this.handleDownSwipe(target);
                break;
        }
    }

    handleLeftSwipe(target) {
        // Cerrar chatbot con swipe izquierda
        if (target.closest('.chatbot-container')) {
            const chatbot = document.querySelector('.chatbot-container');
            if (chatbot && chatbot.classList.contains('active')) {
                chatbot.classList.remove('active');
            }
        }
        
        // Siguiente imagen en carrusel
        const carousel = target.closest('.carousel');
        if (carousel) {
            const nextBtn = carousel.querySelector('.carousel-control-next');
            if (nextBtn) nextBtn.click();
        }
    }

    handleRightSwipe(target) {
        // Imagen anterior en carrusel
        const carousel = target.closest('.carousel');
        if (carousel) {
            const prevBtn = carousel.querySelector('.carousel-control-prev');
            if (prevBtn) prevBtn.click();
        }
        
        // Abrir menú lateral si existe
        const sidebar = document.querySelector('.sidebar, .offcanvas');
        if (sidebar && !sidebar.classList.contains('show')) {
            const toggleBtn = document.querySelector('[data-bs-toggle="offcanvas"]');
            if (toggleBtn) toggleBtn.click();
        }
    }

    handleUpSwipe(target) {
        // Scroll rápido hacia arriba
        if (!target.closest('.modal, .dropdown-menu')) {
            window.scrollTo({
                top: Math.max(0, window.pageYOffset - window.innerHeight * 0.7),
                behavior: 'smooth'
            });
        }
    }

    handleDownSwipe(target) {
        // Cerrar modales abiertos
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            const modal = bootstrap.Modal.getInstance(openModal);
            if (modal) modal.hide();
        }
        
        // Pull to refresh (solo en el top de la página)
        if (window.pageYOffset === 0 && !target.closest('.modal, .dropdown-menu')) {
            this.triggerPullToRefresh();
        }
    }

    setupPinchGestures() {
        let initialDistance = 0;
        let initialScale = 1;
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
                initialScale = 1;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / initialDistance;
                
                // Aplicar zoom a imágenes específicas
                const target = e.target.closest('img, .zoomable');
                if (target) {
                    this.handlePinchZoom(target, scale);
                }
            }
        });
    }

    getDistance(touch1, touch2) {
        const deltaX = touch1.clientX - touch2.clientX;
        const deltaY = touch1.clientY - touch2.clientY;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    handlePinchZoom(element, scale) {
        const currentScale = element.style.transform.match(/scale\(([^)]+)\)/);
        const baseScale = currentScale ? parseFloat(currentScale[1]) : 1;
        const newScale = Math.max(0.5, Math.min(3, baseScale * scale));
        
        element.style.transform = `scale(${newScale})`;
        element.style.transformOrigin = 'center center';
        element.style.transition = 'none';
    }

    setupTapGestures() {
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            const timeSinceLastTap = now - this.lastTap;
            
            // Detectar doble tap
            if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                this.handleDoubleTap(e.target);
                this.lastTap = 0; // Resetear para evitar triple tap
            } else {
                this.lastTap = now;
            }
        }, { passive: true });
    }

    handleDoubleTap(target) {
        // Zoom en imágenes
        if (target.tagName === 'IMG') {
            this.toggleImageZoom(target);
        }
        
        // Activar chatbot con doble tap en botón
        if (target.closest('#chatbotToggle')) {
            // Agregar animación especial
            target.style.animation = 'pulse 0.3s';
            setTimeout(() => {
                target.style.animation = '';
            }, 300);
        }
    }

    toggleImageZoom(img) {
        const isZoomed = img.style.transform.includes('scale');
        
        if (isZoomed) {
            img.style.transform = 'scale(1)';
            img.style.position = '';
            img.style.zIndex = '';
        } else {
            img.style.transform = 'scale(2)';
            img.style.position = 'relative';
            img.style.zIndex = '1000';
        }
        
        img.style.transition = 'transform 0.3s ease';
    }

    setupLongPressGestures() {
        let pressTimer;
        
        document.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                this.handleLongPress(e.target);
            }, 500);
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        }, { passive: true });
        
        document.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        }, { passive: true });
    }

    handleLongPress(target) {
        // Mostrar menú contextual
        if (target.tagName === 'A') {
            this.showLinkContextMenu(target);
        }
        
        // Copiar texto en elementos específicos
        if (target.closest('.copyable')) {
            this.copyToClipboard(target.textContent);
        }
        
        // Feedback háptico si está disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    // ============================================
    // INTERFAZ MÓVIL OPTIMIZADA
    // ============================================

    optimizeMobileInterface() {
        this.enlargeTouchTargets();
        this.optimizeForms();
        this.improveMobileNavigation();
        this.optimizeChatbotForMobile();
        this.addMobileToolbar();
    }

    enlargeTouchTargets() {
        const minTouchSize = 44; // 44px mínimo recomendado
        
        const touchElements = document.querySelectorAll('button, .btn, a, input[type="checkbox"], input[type="radio"]');
        
        touchElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const currentHeight = parseInt(computedStyle.height);
            const currentWidth = parseInt(computedStyle.width);
            
            if (currentHeight < minTouchSize) {
                element.style.minHeight = minTouchSize + 'px';
                element.style.paddingTop = '8px';
                element.style.paddingBottom = '8px';
            }
            
            if (currentWidth < minTouchSize) {
                element.style.minWidth = minTouchSize + 'px';
                element.style.paddingLeft = '12px';
                element.style.paddingRight = '12px';
            }
        });
    }

    optimizeForms() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                // Mejorar inputs en móvil
                if (this.isMobile) {
                    input.style.fontSize = '16px'; // Prevenir zoom
                    input.style.minHeight = '44px';
                    input.style.padding = '12px';
                }
                
                // Teclado virtual optimizado
                this.optimizeVirtualKeyboard(input);
            });
        });
    }

    optimizeVirtualKeyboard(input) {
        switch (input.type) {
            case 'email':
                input.inputMode = 'email';
                break;
            case 'tel':
                input.inputMode = 'tel';
                break;
            case 'number':
                input.inputMode = 'numeric';
                break;
            case 'search':
                input.inputMode = 'search';
                break;
        }
        
        // Auto-corrección y capitalización
        if (input.type === 'text' || input.tagName === 'TEXTAREA') {
            if (input.name && input.name.includes('name')) {
                input.autocapitalize = 'words';
            } else if (input.name && input.name.includes('email')) {
                input.autocapitalize = 'none';
                input.autocorrect = 'off';
            }
        }
    }

    improveMobileNavigation() {
        // Convertir navegación horizontal en collapse en móvil
        const navbar = document.querySelector('.navbar-nav');
        if (navbar && this.isMobile) {
            navbar.classList.add('flex-column');
            
            // Agregar separadores
            const navItems = navbar.querySelectorAll('.nav-item');
            navItems.forEach((item, index) => {
                if (index > 0) {
                    item.style.borderTop = '1px solid rgba(0,0,0,0.1)';
                    item.style.paddingTop = '8px';
                    item.style.marginTop = '8px';
                }
            });
        }
    }

    optimizeChatbotForMobile() {
        const chatbotContainer = document.querySelector('.chatbot-container');
        if (chatbotContainer && this.isMobile) {
            // Chatbot fullscreen en móvil
            chatbotContainer.style.position = 'fixed';
            chatbotContainer.style.top = '0';
            chatbotContainer.style.left = '0';
            chatbotContainer.style.width = '100vw';
            chatbotContainer.style.height = '100vh';
            chatbotContainer.style.zIndex = '9999';
            
            // Botón de cierre visible
            const closeBtn = chatbotContainer.querySelector('.chatbot-close');
            if (closeBtn) {
                closeBtn.style.display = 'block';
                closeBtn.style.position = 'absolute';
                closeBtn.style.top = '10px';
                closeBtn.style.right = '10px';
                closeBtn.style.zIndex = '10000';
            }
        }
    }

    addMobileToolbar() {
        if (!this.isMobile) return;
        
        const toolbar = document.createElement('div');
        toolbar.className = 'mobile-toolbar';
        toolbar.innerHTML = `
            <div class="mobile-toolbar-content">
                <button class="btn btn-primary btn-sm" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="window.advancedSearch?.openSearchModal()">
                    <i class="fas fa-search"></i>
                </button>
                <button class="btn btn-success btn-sm" onclick="document.getElementById('chatbotToggle')?.click()">
                    <i class="fas fa-comments"></i>
                </button>
                <button class="btn btn-info btn-sm" onclick="window.location.reload()">
                    <i class="fas fa-refresh"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(toolbar);
    }

    // ============================================
    // NAVEGACIÓN MÓVIL
    // ============================================

    setupMobileNavigation() {
        this.createBottomNavigation();
        this.improveMenuToggle();
        this.addSwipeNavigation();
    }

    createBottomNavigation() {
        if (!this.isMobile) return;
        
        const bottomNav = document.createElement('nav');
        bottomNav.className = 'bottom-navigation';
        bottomNav.innerHTML = `
            <div class="bottom-nav-items">
                <a href="index.html" class="bottom-nav-item">
                    <i class="fas fa-home"></i>
                    <span>Inicio</span>
                </a>
                <a href="servicios.html" class="bottom-nav-item">
                    <i class="fas fa-cog"></i>
                    <span>Servicios</span>
                </a>
                <a href="estudiantes.html" class="bottom-nav-item">
                    <i class="fas fa-graduation-cap"></i>
                    <span>Estudiantes</span>
                </a>
                <a href="contacto.html" class="bottom-nav-item">
                    <i class="fas fa-phone"></i>
                    <span>Contacto</span>
                </a>
            </div>
        `;
        
        document.body.appendChild(bottomNav);
        
        // Destacar página actual
        this.highlightCurrentPage(bottomNav);
    }

    highlightCurrentPage(bottomNav) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navItems = bottomNav.querySelectorAll('.bottom-nav-item');
        
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                item.classList.add('active');
            }
        });
    }

    improveMenuToggle() {
        const menuToggle = document.querySelector('.navbar-toggler');
        if (menuToggle && this.isMobile) {
            // Agregar animación hamburguesa
            menuToggle.innerHTML = `
                <div class="hamburger-menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            
            // Animar toggle
            menuToggle.addEventListener('click', () => {
                menuToggle.querySelector('.hamburger-menu').classList.toggle('active');
            });
        }
    }

    addSwipeNavigation() {
        // Navegación por swipe entre páginas principales
        const pages = ['index.html', 'conocenos.html', 'oferta-educativa.html', 'servicios.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const currentIndex = pages.indexOf(currentPage);
        
        if (currentIndex !== -1) {
            document.addEventListener('swipeleft', () => {
                const nextIndex = (currentIndex + 1) % pages.length;
                if (pages[nextIndex]) {
                    window.location.href = pages[nextIndex];
                }
            });
            
            document.addEventListener('swiperight', () => {
                const prevIndex = (currentIndex - 1 + pages.length) % pages.length;
                if (pages[prevIndex]) {
                    window.location.href = pages[prevIndex];
                }
            });
        }
    }

    // ============================================
    // CARACTERÍSTICAS MÓVILES ESPECÍFICAS
    // ============================================

    enableMobileFeatures() {
        this.setupPullToRefresh();
        this.addMobileShortcuts();
        this.optimizeForNotch();
        this.handleDeviceOrientation();
        this.enableHapticFeedback();
    }

    setupPullToRefresh() {
        let startY = 0;
        let pullDistance = 0;
        const refreshThreshold = 100;
        
        document.addEventListener('touchstart', (e) => {
            if (window.pageYOffset === 0) {
                startY = e.touches[0].clientY;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (window.pageYOffset === 0 && startY > 0) {
                pullDistance = e.touches[0].clientY - startY;
                
                if (pullDistance > 0) {
                    this.showPullToRefreshIndicator(pullDistance, refreshThreshold);
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (pullDistance > refreshThreshold) {
                this.triggerPullToRefresh();
            } else {
                this.hidePullToRefreshIndicator();
            }
            
            startY = 0;
            pullDistance = 0;
        }, { passive: true });
    }

    showPullToRefreshIndicator(distance, threshold) {
        let indicator = document.querySelector('.pull-refresh-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'pull-refresh-indicator';
            indicator.innerHTML = `
                <div class="pull-refresh-content">
                    <i class="fas fa-sync-alt"></i>
                    <span>Desliza para actualizar</span>
                </div>
            `;
            document.body.insertBefore(indicator, document.body.firstChild);
        }
        
        const progress = Math.min(distance / threshold, 1);
        indicator.style.transform = `translateY(${Math.min(distance, threshold)}px)`;
        indicator.style.opacity = progress;
        
        if (distance >= threshold) {
            indicator.querySelector('span').textContent = 'Suelta para actualizar';
            indicator.querySelector('i').style.animation = 'spin 1s linear infinite';
        }
    }

    hidePullToRefreshIndicator() {
        const indicator = document.querySelector('.pull-refresh-indicator');
        if (indicator) {
            indicator.style.transform = 'translateY(-100%)';
            indicator.style.opacity = '0';
            
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }
    }

    triggerPullToRefresh() {
        this.hidePullToRefreshIndicator();
        
        // Mostrar loading
        const loader = document.createElement('div');
        loader.className = 'page-refreshing';
        loader.innerHTML = `
            <div class="refresh-spinner">
                <i class="fas fa-sync-alt fa-spin"></i>
                <span>Actualizando...</span>
            </div>
        `;
        document.body.appendChild(loader);
        
        // Simular refresh
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    addMobileShortcuts() {
        // Atajos específicos para móvil
        const shortcuts = [
            {
                gesture: 'tap-hold-chatbot',
                action: () => {
                    // Activar modo voz del chatbot
                    if (window.advancedSearch?.startVoiceSearch) {
                        window.advancedSearch.startVoiceSearch();
                    }
                }
            },
            {
                gesture: 'double-tap-top',
                action: () => {
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        ];
        
        console.log('📱 Atajos móviles habilitados:', shortcuts.length);
    }

    optimizeForNotch() {
        // Detección de notch/safe areas
        const supportsNotch = CSS.supports('padding-top: constant(safe-area-inset-top)') ||
                             CSS.supports('padding-top: env(safe-area-inset-top)');
        
        if (supportsNotch) {
            document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
            
            // Aplicar padding a elementos específicos
            const header = document.querySelector('.navbar, header');
            if (header) {
                header.style.paddingTop = 'var(--safe-area-top)';
            }
            
            const bottomNav = document.querySelector('.bottom-navigation');
            if (bottomNav) {
                bottomNav.style.paddingBottom = 'var(--safe-area-bottom)';
            }
        }
    }

    handleDeviceOrientation() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.orientation = this.getOrientation();
                this.onOrientationChange();
            }, 100);
        });
    }

    onOrientationChange() {
        // Reajustar chatbot
        const chatbot = document.querySelector('.chatbot-container');
        if (chatbot && this.isMobile) {
            if (this.orientation === 'landscape') {
                chatbot.style.width = '50vw';
                chatbot.style.height = '100vh';
                chatbot.style.right = '0';
            } else {
                chatbot.style.width = '100vw';
                chatbot.style.height = '100vh';
            }
        }
        
        // Trigger resize events
        window.dispatchEvent(new Event('resize'));
    }

    enableHapticFeedback() {
        if (!navigator.vibrate) return;
        
        // Feedback para interacciones importantes
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, .btn, a, .card');
            
            if (target) {
                // Vibración sutil para feedback
                navigator.vibrate(10);
            }
        });
        
        // Feedback para gestos
        document.addEventListener('swipe', () => {
            navigator.vibrate(20);
        });
        
        document.addEventListener('longpress', () => {
            navigator.vibrate(50);
        });
    }

    // ============================================
    // PERFORMANCE MÓVIL
    // ============================================

    optimizeMobilePerformance() {
        this.reduceAnimationsOnLowEnd();
        this.optimizeForBatteryAPI();
        this.implementConnectionAwareness();
        this.setupMemoryManagement();
    }

    reduceAnimationsOnLowEnd() {
        // Detectar dispositivos de gama baja
        const isLowEndDevice = navigator.hardwareConcurrency <= 2 ||
                              navigator.deviceMemory <= 2 ||
                              /Android.*[3-6]\./i.test(navigator.userAgent);
        
        if (isLowEndDevice) {
            document.documentElement.style.setProperty('--animation-duration', '0.1s');
            document.documentElement.classList.add('reduced-motion');
            
            // Deshabilitar animaciones complejas
            const complexAnimations = document.querySelectorAll('.animate__animated, [data-aos]');
            complexAnimations.forEach(el => {
                el.style.animation = 'none';
                el.removeAttribute('data-aos');
            });
        }
    }

    optimizeForBatteryAPI() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then((battery) => {
                const optimizeForBattery = () => {
                    if (battery.level < 0.2 || !battery.charging) {
                        // Modo ahorro de batería
                        this.enableBatterySavingMode();
                    } else {
                        this.disableBatterySavingMode();
                    }
                };
                
                optimizeForBattery();
                battery.addEventListener('levelchange', optimizeForBattery);
                battery.addEventListener('chargingchange', optimizeForBattery);
            });
        }
    }

    enableBatterySavingMode() {
        document.body.classList.add('battery-saving');
        
        // Reducir frecuencia de actualizaciones
        if (window.performanceOptimizer) {
            window.performanceOptimizer.setBatterySavingMode(true);
        }
        
        console.log('🔋 Modo ahorro de batería activado');
    }

    disableBatterySavingMode() {
        document.body.classList.remove('battery-saving');
        
        if (window.performanceOptimizer) {
            window.performanceOptimizer.setBatterySavingMode(false);
        }
    }

    implementConnectionAwareness() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const handleConnectionChange = () => {
                const effectiveType = connection.effectiveType;
                
                if (effectiveType === 'slow-2g' || effectiveType === '2g') {
                    this.enableLowBandwidthMode();
                } else {
                    this.disableLowBandwidthMode();
                }
            };
            
            handleConnectionChange();
            connection.addEventListener('change', handleConnectionChange);
        }
    }

    enableLowBandwidthMode() {
        document.body.classList.add('low-bandwidth');
        
        // Comprimir imágenes más agresivamente
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && !img.src.includes('quality=')) {
                img.src += (img.src.includes('?') ? '&' : '?') + 'quality=60';
            }
        });
        
        console.log('📶 Modo bajo ancho de banda activado');
    }

    disableLowBandwidthMode() {
        document.body.classList.remove('low-bandwidth');
    }

    setupMemoryManagement() {
        // Limpieza periódica de caché en móvil
        if (this.isMobile) {
            setInterval(() => {
                if (window.cacheManager) {
                    window.cacheManager.cleanup();
                }
                
                // Limpiar referencias DOM no utilizadas
                this.cleanupDOMReferences();
            }, 5 * 60 * 1000); // Cada 5 minutos
        }
    }

    cleanupDOMReferences() {
        // Remover event listeners obsoletos
        const obsoleteElements = document.querySelectorAll('[data-cleanup="true"]');
        obsoleteElements.forEach(el => {
            el.remove();
        });
        
        // Forzar garbage collection si está disponible
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

    setupOrientationHandling() {
        // Lock orientation para ciertas páginas si es soportado
        if (screen.orientation && screen.orientation.lock) {
            const currentPage = window.location.pathname.split('/').pop();
            
            // Páginas que se benefician de orientación específica
            if (currentPage === 'calificaciones.html' || currentPage === 'admin-dashboard.html') {
                // Permitir ambas orientaciones pero optimizar para landscape en tablets
                if (this.isTablet) {
                    screen.orientation.lock('landscape').catch(() => {
                        console.log('No se pudo bloquear orientación');
                    });
                }
            }
        }
    }

    showLinkContextMenu(link) {
        const menu = document.createElement('div');
        menu.className = 'context-menu-mobile';
        menu.innerHTML = `
            <div class="context-menu-items">
                <button onclick="window.open('${link.href}', '_blank')">
                    <i class="fas fa-external-link-alt"></i> Abrir en nueva pestaña
                </button>
                <button onclick="window.mobileEnhancements.copyToClipboard('${link.href}')">
                    <i class="fas fa-copy"></i> Copiar enlace
                </button>
                <button onclick="navigator.share({url: '${link.href}', title: '${link.textContent}'})">
                    <i class="fas fa-share"></i> Compartir
                </button>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        setTimeout(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1)';
        }, 10);
        
        // Cerrar al hacer clic fuera
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('✅ Copiado al portapapeles');
            });
        } else {
            // Fallback para navegadores sin Clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('✅ Copiado al portapapeles');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            orientation: this.orientation,
            supportsTouch: 'ontouchstart' in window,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    refreshMobileOptimizations() {
        this.optimizeMobileInterface();
        this.setupMobileNavigation();
        console.log('📱 Optimizaciones móviles actualizadas');
    }
}

// Event listeners para gestos personalizados
document.addEventListener('touchstart', handleTouchStart, { passive: true });
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd, { passive: true });

function handleTouchStart(e) {
    // Implementación básica de detección de gestos
    window.touchStartX = e.touches[0].clientX;
    window.touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    if (!window.touchStartX || !window.touchStartY) return;
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    const deltaX = touchEndX - window.touchStartX;
    const deltaY = touchEndY - window.touchStartY;
    
    // Prevenir scroll vertical en swipes horizontales
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        e.preventDefault();
    }
}

function handleTouchEnd(e) {
    window.touchStartX = null;
    window.touchStartY = null;
}

// Inicializar mejoras móviles
document.addEventListener('DOMContentLoaded', () => {
    window.mobileEnhancements = new MobileEnhancements();
});

// Estilos CSS para móvil
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    /* Mobile-specific styles */
    .mobile-toolbar {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        border-radius: 25px;
        background: rgba(255,255,255,0.9);
        backdrop-filter: blur(10px);
        padding: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .mobile-toolbar-content {
        display: flex;
        gap: 8px;
    }
    
    .mobile-toolbar .btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .bottom-navigation {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #fff;
        border-top: 1px solid #e0e0e0;
        padding: 8px 0;
        z-index: 1000;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    }
    
    .bottom-nav-items {
        display: flex;
        justify-content: space-around;
        align-items: center;
    }
    
    .bottom-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-decoration: none;
        color: #666;
        padding: 4px 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        min-width: 60px;
    }
    
    .bottom-nav-item:hover,
    .bottom-nav-item.active {
        color: #007bff;
        background-color: rgba(0,123,255,0.1);
    }
    
    .bottom-nav-item i {
        font-size: 1.2rem;
        margin-bottom: 4px;
    }
    
    .bottom-nav-item span {
        font-size: 0.7rem;
        font-weight: 500;
    }
    
    .hamburger-menu {
        width: 20px;
        height: 15px;
        position: relative;
        cursor: pointer;
    }
    
    .hamburger-menu span {
        display: block;
        position: absolute;
        height: 2px;
        width: 100%;
        background: #333;
        border-radius: 2px;
        transition: all 0.3s ease;
    }
    
    .hamburger-menu span:nth-child(1) { top: 0; }
    .hamburger-menu span:nth-child(2) { top: 50%; transform: translateY(-50%); }
    .hamburger-menu span:nth-child(3) { bottom: 0; }
    
    .hamburger-menu.active span:nth-child(1) {
        transform: rotate(45deg);
        top: 50%;
        margin-top: -1px;
    }
    
    .hamburger-menu.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger-menu.active span:nth-child(3) {
        transform: rotate(-45deg);
        bottom: 50%;
        margin-bottom: -1px;
    }
    
    .pull-refresh-indicator {
        position: fixed;
        top: -100px;
        left: 0;
        right: 0;
        height: 100px;
        background: linear-gradient(135deg, #007bff, #0056b3);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: all 0.3s ease;
    }
    
    .pull-refresh-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
    
    .pull-refresh-content i {
        font-size: 1.5rem;
    }
    
    .page-refreshing {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .refresh-spinner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: #007bff;
    }
    
    .refresh-spinner i {
        font-size: 2rem;
    }
    
    .context-menu-mobile {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 9999;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.3s ease;
    }
    
    .context-menu-items {
        padding: 12px;
    }
    
    .context-menu-items button {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px 16px;
        background: none;
        border: none;
        text-align: left;
        border-radius: 8px;
        transition: background 0.2s ease;
    }
    
    .context-menu-items button:hover {
        background: #f8f9fa;
    }
    
    .mobile-toast {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .mobile-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
    
    /* Responsive improvements */
    @media (max-width: 768px) {
        body {
            padding-bottom: 70px; /* Space for bottom nav */
        }
        
        .container {
            padding-left: 15px;
            padding-right: 15px;
        }
        
        h1 { font-size: 1.8rem; }
        h2 { font-size: 1.5rem; }
        h3 { font-size: 1.3rem; }
        
        .btn {
            min-height: 44px;
            padding: 8px 16px;
        }
        
        .card {
            margin-bottom: 1rem;
        }
        
        .modal-dialog {
            margin: 10px;
            max-width: calc(100% - 20px);
        }
        
        /* Battery saving mode */
        .battery-saving * {
            animation-duration: 0.1s !important;
            transition-duration: 0.1s !important;
        }
        
        /* Low bandwidth mode */
        .low-bandwidth img {
            filter: contrast(0.8) brightness(0.9);
        }
        
        /* Reduced motion */
        .reduced-motion *,
        .reduced-motion *::before,
        .reduced-motion *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
    
    /* Safe area support */
    @supports (padding-top: env(safe-area-inset-top)) {
        .navbar {
            padding-top: env(safe-area-inset-top);
        }
        
        .bottom-navigation {
            padding-bottom: calc(8px + env(safe-area-inset-bottom));
        }
    }
`;

document.head.appendChild(mobileStyles);