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

    // ========================================
    // 1. CARGAR HEADER Y FOOTER DINÁMICAMENTE
    // ========================================

    async function loadHeaderFooter() {
        try {
            // Cargar header si existe el elemento contenedor y está vacío
            const headerElement = document.getElementById('main-header');
            if (headerElement && !headerElement.innerHTML.trim()) {
                const headerResponse = await fetch('/partials/header.html');
                if (headerResponse.ok) {
                    const headerHTML = await headerResponse.text();
                    headerElement.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(headerHTML) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(headerHTML) : headerHTML));

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

            // Cargar footer si existe el elemento contenedor y está vacío
            const footerElement = document.getElementById('main-footer');
            if (footerElement && !footerElement.innerHTML.trim()) {
                const footerResponse = await fetch('/partials/footer.html');
                if (footerResponse.ok) {
                    const footerHTML = await footerResponse.text();
                    footerElement.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(footerHTML) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(footerHTML) : footerHTML));

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
        await loadHeaderFooter();
        const session = restoreUserSession();
        if (session) {
            updateUserUIInHeader(session.user, true);
            window.currentUserSession = session;
        }
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.mainJS = {
        restoreUserSession,
        updateUserUIInHeader,
        loadHeaderFooter
    };
})();
