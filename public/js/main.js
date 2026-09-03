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
        // Si DOMPurify está disponible, se utiliza sanitización permitiendo estructura HTML
        if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
            return DOMPurify.sanitize(html);
        }
        // Las plantillas en /partials/ son recursos locales estáticos y de confianza
        return html;
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

            // Cargar footer si existe el contenedor y está vacío
            const footerElement = document.getElementById('main-footer');
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
        initDarkMode();
        initBackToTop();
        initHashTabs();
        initChatbotLoader();
    }

    // ========================================
    // 5. ESCUCHAR EVENTOS DE CAMBIO DE SESIÓN
    // ========================================

    document.addEventListener('bge-user-logged-in', (event) => {
        if (event.detail && event.detail.user) {
            updateUserUIInHeader(event.detail.user, true);
            window.currentUserSession = {
                user: event.detail.user,
                token: sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token')
            };
        }
    });

    document.addEventListener('bge-user-logged-out', () => {
        updateUserUIInHeader(null, false);
        window.currentUserSession = null;
    });

    document.addEventListener('pagechange', () => {
        const session = restoreUserSession();
        if (session) {
            updateUserUIInHeader(session.user, true);
        }
    });

    // ========================================
    // 6. MODO OSCURO CENTRALIZADO
    // ========================================
    function initDarkMode() {
        applySavedTheme();
        const isDark = (getSavedTheme() === 'dark');

        let btn = document.getElementById('darkModeToggle');
        if (!btn && document.body) {
            btn = document.createElement('button');
            btn.className = 'dark-mode-toggle';
            btn.id = 'darkModeToggle';
            btn.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            btn.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            btn.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;
            btn.style.zIndex = '10000';
            document.body.appendChild(btn);
        } else if (btn) {
            btn.style.zIndex = '10000';
            const icon = btn.querySelector('i');
            if (icon) icon.className = `fas ${isDark ? 'fa-sun' : 'fa-moon'}`;
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
    // 7. BOTÓN VOLVER ARRIBA (BACK-TO-TOP)
    // ========================================
    function initBackToTop() {
        let btn = document.getElementById('backToTop') || document.getElementById('back-to-top');
        if (!btn && document.body) {
            btn = document.createElement('button');
            btn.id = 'backToTop';
            btn.className = 'back-to-top';
            btn.setAttribute('aria-label', 'Volver arriba');
            btn.setAttribute('title', 'Volver arriba');
            btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            document.body.appendChild(btn);
        }

        if (btn && !btn.dataset.bttBound) {
            btn.dataset.bttBound = 'true';
            btn.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            window.addEventListener('scroll', function() {
                if (window.scrollY > 300) {
                    btn.classList.add('visible');
                    btn.style.display = 'flex';
                } else {
                    btn.classList.remove('visible');
                    btn.style.display = 'none';
                }
            }, { passive: true });
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
    // 9. CARGA Y GARANTÍA CENTRAL DEL CHATBOT
    // ========================================
    function initChatbotLoader() {
        if (window.BGE_CHATBOT_LOADED) return;
        const pathname = window.location.pathname.toLowerCase();
        // Evitar cargar chatbot en áreas de login, registro o dashboards administrativos
        if (pathname.includes('login') || pathname.includes('register') || pathname.includes('admin-') || pathname.includes('dashboard')) {
            return;
        }

        // Si ya hay una etiqueta script cargando chatbot.js, no duplicar
        const existingScript = document.querySelector('script[src*="chatbot.js"]');
        if (existingScript) return;

        const script = document.createElement('script');
        script.src = 'js/chatbot.js';
        script.defer = true;
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
