/**
 * 🔧 MAIN.JS - Inicialización Global y Mantenimiento de Sesión
 *
 * Responsabilidades:
 * 1. Cargar header y footer dinámicamente
 * 2. Mantener la sesión de usuario en TODAS las páginas
 * 3. Restaurar estado de autenticación al cambiar de página
 * 4. Actualizar UI del usuario en todas las páginas
 *
 * Fecha: 15 Diciembre 2025
 */

(function() {
    'use strict';

    // 🛡️ 0. SANITIZADOR UNIVERSAL SEGURO
    if (typeof window.sanitizeHTML !== 'function') {
        window.sanitizeHTML = function (str) {
            if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
                return DOMPurify.sanitize(str);
            }
            return str || '';
        };
    }

    if (typeof window.escapeHtml !== 'function') {
        window.escapeHtml = function (text) {
            const temp = document.createElement('div');
            temp.textContent = text || '';
            return temp.innerHTML;
        };
    }

    // 🌙 CONTROLADOR UNIFICADO DE TEMA CLARO / OSCURO
    function getSavedTheme() {
        try {
            // 1. Si el usuario desactivó explícitamente el modo oscuro, respetar SIEMPRE
            const isExplicitlyDisabled = (
                localStorage.getItem('darkMode') === 'disabled' ||
                localStorage.getItem('theme') === 'light' ||
                localStorage.getItem('heroesPatria_darkMode') === 'false' ||
                localStorage.getItem('bge-dark-mode') === 'light'
            );
            if (isExplicitlyDisabled) return 'light';

            // 2. Si el usuario activó explícitamente el modo oscuro
            const isExplicitlyEnabled = (
                localStorage.getItem('darkMode') === 'enabled' ||
                localStorage.getItem('theme') === 'dark' ||
                localStorage.getItem('heroesPatria_darkMode') === 'true' ||
                localStorage.getItem('bge-dark-mode') === 'dark'
            );
            if (isExplicitlyEnabled) return 'dark';

            // 3. Por defecto modo claro para estética consistente del bachillerato
            return 'light';
        } catch (e) {
            return 'light';
        }
    }

    function setUnifiedTheme(theme) {
        const isDark = (theme === 'dark');
        try {
            if (isDark) {
                if (document.documentElement) {
                    document.documentElement.classList.add('dark-mode');
                    document.documentElement.setAttribute('data-theme', 'dark');
                }
                if (document.body) {
                    document.body.classList.add('dark-mode');
                }
            } else {
                if (document.documentElement) {
                    document.documentElement.classList.remove('dark-mode');
                    document.documentElement.setAttribute('data-theme', 'light');
                }
                if (document.body) {
                    document.body.classList.remove('dark-mode');
                }
            }

            // Sincronizar TODAS las variantes de llaves de almacenamiento en la plataforma
            localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            localStorage.setItem('heroesPatria_darkMode', isDark ? 'true' : 'false');
            localStorage.setItem('bge-dark-mode', isDark ? 'dark' : 'light');

            // Actualizar icono y accesibilidad del botón
            const btn = document.getElementById('darkModeToggle');
            if (btn) {
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                }
                btn.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
                btn.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            }

            window.dispatchEvent(new CustomEvent('darkModeChanged', { detail: { darkMode: isDark } }));
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: isDark ? 'dark' : 'light' } }));
        } catch (e) {}
    }

    function applySavedTheme() {
        setUnifiedTheme(getSavedTheme());
    }

    // Ejecutar aplicación temprana del tema
    applySavedTheme();

    // ========================================
    // 1. CARGAR HEADER Y FOOTER DINÁMICAMENTE
    // ========================================

    function sanitizePartial(html) {
        if (!html) return '';
        // Si DOMPurify está disponible, se utiliza sanitización permitiendo estructura completa
        if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
            return DOMPurify.sanitize(html, {
                ADD_TAGS: ['nav', 'header', 'footer', 'button', 'svg', 'path', 'i', 'span', 'ul', 'li', 'a', 'div', 'img', 'form', 'input', 'select'],
                ADD_ATTR: ['data-bs-toggle', 'data-bs-target', 'aria-expanded', 'aria-label', 'data-tenant-field']
            });
        }
        // Fallback defensivo que NO rompe las etiquetas HTML en texto crudo:
        // Usa DOMParser nativo del navegador para validar sintaxis y expurgar scripts/iframes no deseados
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const dangerousTags = doc.querySelectorAll('script, iframe, object, embed');
            dangerousTags.forEach(el => el.remove());
            return doc.body.innerHTML;
        } catch (e) {
            return html;
        }
    }

    async function loadHeaderFooter() {
        try {
            // Cargar header si existe el contenedor y está vacío
            const headerElement = document.getElementById('main-header');
            if (headerElement && !headerElement.innerHTML.trim()) {
                const headerResponse = await fetch('/partials/header.html');
                if (headerResponse.ok) {
                    const headerHTML = await headerResponse.text();
                    headerElement.innerHTML = sanitizePartial(headerHTML);

                    const scripts = headerElement.querySelectorAll('script');
                    for (const script of scripts) {
                        if (script.src) {
                            await new Promise((resolve) => {
                                const newScript = document.createElement('script');
                                newScript.src = script.src;
                                newScript.async = false;
                                newScript.onload = resolve;
                                newScript.onerror = resolve;
                                document.body.appendChild(newScript);
                            });
                        } else {
                            const newScript = document.createElement('script');
                            newScript.textContent = script.textContent;
                            document.body.appendChild(newScript);
                        }
                    }
                }
            }

            // Cargar footer si existe el contenedor y está vacío, o autocrearlo si falta en páginas estándar
            let footerElement = document.getElementById('main-footer');
            if (!footerElement && document.body) {
                const pathname = window.location.pathname.toLowerCase();
                const isMinimalPage = pathname.includes('login') || pathname.includes('register') || pathname.includes('test-login');
                if (!isMinimalPage) {
                    footerElement = document.createElement('footer');
                    footerElement.id = 'main-footer';
                    document.body.appendChild(footerElement);
                }
            }

            if (footerElement && !footerElement.innerHTML.trim()) {
                const footerResponse = await fetch('/partials/footer.html');
                if (footerResponse.ok) {
                    const footerHTML = await footerResponse.text();
                    footerElement.innerHTML = sanitizePartial(footerHTML);

                    const scripts = footerElement.querySelectorAll('script');
                    for (const script of scripts) {
                        if (script.src) {
                            await new Promise((resolve) => {
                                const newScript = document.createElement('script');
                                newScript.src = script.src;
                                newScript.async = false;
                                newScript.onload = resolve;
                                newScript.onerror = resolve;
                                document.body.appendChild(newScript);
                            });
                        } else {
                            const newScript = document.createElement('script');
                            newScript.textContent = script.textContent;
                            document.body.appendChild(newScript);
                        }
                    }
                }
            }

            window.dispatchEvent(new CustomEvent('headerLoaded'));
            if (typeof window.rebindTenantContent === 'function') {
                window.rebindTenantContent();
            }
        } catch (error) {
            // Silencioso en producción
        }
    }

    // ========================================
    // 2. MANTENER SESIÓN DE USUARIO
    // ========================================

    function restoreUserSession() {
        let userToken = sessionStorage.getItem('bge_auth_token') ||
                        localStorage.getItem('bge_auth_token') ||
                        sessionStorage.getItem('authToken') ||
                        localStorage.getItem('authToken');

        if (!userToken || userToken === 'null' || userToken === 'undefined') {
            return null;
        }

        const userDataStr = sessionStorage.getItem('bge_auth_user') ||
                            localStorage.getItem('bge_auth_user') ||
                            sessionStorage.getItem('bge_user_data') ||
                            localStorage.getItem('bge_user_data') ||
                            sessionStorage.getItem('userData') ||
                            localStorage.getItem('userData');

        if (!userDataStr || userDataStr === 'null' || userDataStr === 'undefined') {
            return null;
        }

        try {
            const userSession = JSON.parse(userDataStr);
            if (userSession && (userSession.id || userSession.email || userSession.role || userSession.nombre)) {
                return { user: userSession, token: userToken };
            }
        } catch (e) {}

        return null;
    }

    // ========================================
    // 3. ACTUALIZAR UI DEL USUARIO EN HEADER
    // ========================================

    function updateUserUIInHeader(user, isAuthenticated) {
        const updateUI = () => {
            const userMenuName = document.getElementById('userMenuName');
            const userMenuRole = document.getElementById('userMenuRole');
            const loginButtons = document.getElementById('loginButtons');
            const userMenu = document.getElementById('userMenu');
            const adminMenuItems = document.getElementById('adminMenuItems');
            const teacherMenuItems = document.getElementById('teacherMenuItems');
            const studentMenuItems = document.getElementById('studentMenuItems');
            const adminSection = document.getElementById('adminOnlySection');

            if (!user || !isAuthenticated) {
                if (loginButtons) loginButtons.classList.remove('d-none');
                if (userMenu) userMenu.classList.add('d-none');
                if (adminMenuItems) adminMenuItems.classList.add('d-none');
                if (teacherMenuItems) teacherMenuItems.classList.add('d-none');
                if (studentMenuItems) studentMenuItems.classList.add('d-none');
                if (adminSection) adminSection.classList.add('d-none');
                return;
            }

            if (userMenuName) {
                userMenuName.textContent = user.nombre || user.email?.split('@')[0] || 'Usuario';
            }

            if (userMenuRole) {
                const role = user.role || 'usuario';
                userMenuRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);
            }

            if (loginButtons) loginButtons.classList.add('d-none');
            if (userMenu) userMenu.classList.remove('d-none');

            const role = user.role || 'usuario';
            if (adminMenuItems) {
                adminMenuItems.classList.toggle('d-none', !['admin', 'administrator', 'directivo'].includes(role));
            }
            if (teacherMenuItems) {
                teacherMenuItems.classList.toggle('d-none', !['docente', 'teacher'].includes(role));
            }
            if (studentMenuItems) {
                studentMenuItems.classList.toggle('d-none', !['estudiante', 'student'].includes(role));
            }

            if (adminSection) {
                adminSection.classList.toggle('d-none', !['admin', 'administrator', 'directivo'].includes(role));
            }

            const adminPanelMenuLink = document.getElementById('adminPanelMenuLink');
            const adminPanelLogoutOption = document.getElementById('adminPanelLogoutOption');
            const adminPanelSessionStatus = document.getElementById('adminPanelSessionStatus');

            if (['admin', 'administrator', 'directivo'].includes(role)) {
                if (adminPanelMenuLink) {
                    adminPanelMenuLink.href = 'admin-dashboard.html';
                    adminPanelMenuLink.removeAttribute('data-action');
                    adminPanelMenuLink.innerHTML = '<i class="fas fa-tachometer-alt me-2"></i>Dashboard Administrativo';
                }
                if (adminPanelLogoutOption) adminPanelLogoutOption.classList.remove('d-none');
                if (adminPanelSessionStatus) adminPanelSessionStatus.classList.remove('d-none');
            } else {
                if (adminPanelMenuLink) {
                    adminPanelMenuLink.href = '#';
                    adminPanelMenuLink.setAttribute('data-action', 'open-unified-login');
                    adminPanelMenuLink.innerHTML = '<i class="fas fa-shield-halved me-2"></i>Administrador';
                }
                if (adminPanelLogoutOption) adminPanelLogoutOption.classList.add('d-none');
                if (adminPanelSessionStatus) adminPanelSessionStatus.classList.add('d-none');
            }
        };

        updateUI();
        setTimeout(updateUI, 300);
    }

    // ========================================
    // 4. INICIALIZACIÓN PRINCIPAL
    // ========================================

    async function init() {
        applySavedTheme();
        await loadHeaderFooter();
        const session = restoreUserSession();
        if (session) {
            updateUserUIInHeader(session.user, true);
            window.currentUserSession = session;
        }
        initFloatingControls();
        initHashTabs();
    }

    // ========================================
    // 5. GESTOR CENTRALIZADO DE BOTONES FLOTANTES
    // ========================================
    function initFloatingControls() {
        initDarkMode();
        initBackToTop();
        initChatbotLoader();
    }

    // ========================================
    // 6. MODO OSCURO CENTRALIZADO (Nivel Inferior)
    // ========================================
    function initDarkMode() {
        applySavedTheme();
        const isDark = (getSavedTheme() === 'dark');

        // Limpiar posibles botones duplicados en el HTML estático
        const allToggles = document.querySelectorAll('.dark-mode-toggle, #darkModeToggle');
        let btn = null;
        if (allToggles.length > 0) {
            btn = allToggles[0];
            // Eliminar duplicados si los hubiere
            for (let i = 1; i < allToggles.length; i++) {
                allToggles[i].remove();
            }
        }

        if (!btn && document.body) {
            btn = document.createElement('button');
            btn.className = 'dark-mode-toggle';
            btn.id = 'darkModeToggle';
            btn.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            btn.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            btn.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;
            document.body.appendChild(btn);
        } else if (btn) {
            btn.id = 'darkModeToggle';
            btn.className = 'dark-mode-toggle';
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = `fas ${isDark ? 'fa-sun' : 'fa-moon'}`;
            } else {
                btn.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;
            }
            btn.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            btn.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        }

        if (btn && !btn.dataset.dmBound) {
            btn.dataset.dmBound = 'true';
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const currentTheme = getSavedTheme();
                setUnifiedTheme(currentTheme === 'dark' ? 'light' : 'dark');
            });
        }
    }

    // ========================================
    // 7. BOTÓN VOLVER ARRIBA (Nivel Superior)
    // ========================================
    function initBackToTop() {
        const allBtt = document.querySelectorAll('#backToTop, #back-to-top, .back-to-top');
        let btn = null;
        if (allBtt.length > 0) {
            btn = allBtt[0];
            for (let i = 1; i < allBtt.length; i++) {
                allBtt[i].remove();
            }
        }

        if (!btn && document.body) {
            btn = document.createElement('button');
            btn.id = 'backToTop';
            btn.className = 'back-to-top';
            btn.setAttribute('aria-label', 'Volver arriba');
            btn.setAttribute('title', 'Volver arriba');
            btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            document.body.appendChild(btn);
        } else if (btn) {
            btn.id = 'backToTop';
            if (!btn.querySelector('i')) {
                btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            }
        }

        if (btn && !btn.dataset.bttBound) {
            btn.dataset.bttBound = 'true';
            btn.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            const onScroll = function() {
                if (window.scrollY > 300) {
                    btn.classList.add('visible');
                    btn.classList.add('show');
                } else {
                    btn.classList.remove('visible');
                    btn.classList.remove('show');
                }
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }
    }

    // ========================================
    // 8. SOPORTE UNIVERSAL DE PESTAÑAS POR HASH
    // ========================================
    function initHashTabs() {
        if (!window.location.hash) return;
        const hash = window.location.hash.substring(1);
        const tabBtn = document.querySelector(`[data-bs-target="#${hash}"], [data-bs-target="#pills-${hash}"], [data-bs-target="#tab-${hash}"], [id="tab-${hash}-btn"]`);
        if (tabBtn && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            try {
                const tab = new bootstrap.Tab(tabBtn);
                tab.show();
            } catch (e) {}
        }
    }

    // ========================================
    // 9. CARGA Y GARANTÍA CENTRAL DEL CHATBOT (Nivel Medio)
    // ========================================
    function initChatbotLoader() {
        const pathname = window.location.pathname.toLowerCase();
        // Evitar cargar chatbot únicamente en login, registro y dashboards de superadministración
        const isExcluded = pathname.includes('login.html') || 
                           pathname.includes('register.html') || 
                           pathname.includes('super-admin-dashboard') || 
                           pathname.includes('tenants-admin');
        if (isExcluded) return;

        // Si chatbot.js ya está en memoria y expone su inicializador, ejecutarlo
        if (typeof window.initChatbotSystem === 'function') {
            window.initChatbotSystem();
            if (typeof window.applyUnifiedTheme === 'function') {
                window.applyUnifiedTheme();
            }
            return;
        }

        // Si ya hay una etiqueta script cargando chatbot.js, asegurar callback onload
        const existingScript = document.querySelector('script[src*="chatbot.js"]');
        if (existingScript) {
            existingScript.addEventListener('load', function() {
                if (typeof window.initChatbotSystem === 'function') {
                    window.initChatbotSystem();
                    if (typeof window.applyUnifiedTheme === 'function') {
                        window.applyUnifiedTheme();
                    }
                }
            });
            return;
        }

        // Cargar dinámicamente chatbot.js y disparar inicialización al completar
        const script = document.createElement('script');
        script.src = 'js/chatbot.js';
        script.defer = true;
        script.onload = function() {
            if (typeof window.initChatbotSystem === 'function') {
                window.initChatbotSystem();
                if (typeof window.applyUnifiedTheme === 'function') {
                    window.applyUnifiedTheme();
                }
            }
        };
        document.body.appendChild(script);
    }

    window.addEventListener('hashchange', initHashTabs);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.setUnifiedTheme = setUnifiedTheme;
    window.applyUnifiedTheme = applySavedTheme;
    window.getSavedTheme = getSavedTheme;

    window.mainJS = {
        restoreUserSession,
        updateUserUIInHeader,
        loadHeaderFooter,
        initDarkMode,
        setUnifiedTheme,
        applyUnifiedTheme,
        getSavedTheme,
        initBackToTop,
        initChatbotLoader
    };
})();
