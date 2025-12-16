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

    console.log('[MAIN.JS] 🚀 Inicializando...');

    // ========================================
    // 1. CARGAR HEADER Y FOOTER DINÁMICAMENTE
    // ========================================

    async function loadHeaderFooter() {
        console.log('[MAIN.JS] 📦 Cargando header y footer...');

        try {
            // Cargar header
            const headerResponse = await fetch('/partials/header.html');
            if (headerResponse.ok) {
                const headerHTML = await headerResponse.text();
                const headerElement = document.getElementById('main-header');
                if (headerElement) {
                    headerElement.innerHTML = headerHTML;

                    // 🔧 EJECUTAR SCRIPTS DEL HEADER
                    // Los scripts dentro de innerHTML no se ejecutan automáticamente por seguridad
                    // Necesitamos extraerlos y ejecutarlos manualmente
                    const scripts = headerElement.querySelectorAll('script');
                    for (const script of scripts) {
                        const newScript = document.createElement('script');
                        if (script.src) {
                            newScript.src = script.src;
                            newScript.async = false;
                        } else {
                            newScript.textContent = script.textContent;
                        }
                        document.body.appendChild(newScript);
                    }

                    console.log('[MAIN.JS] ✅ Header cargado (scripts ejecutados)');
                }
            }

            // Cargar footer
            const footerResponse = await fetch('/partials/footer.html');
            if (footerResponse.ok) {
                const footerHTML = await footerResponse.text();
                const footerElement = document.getElementById('main-footer');
                if (footerElement) {
                    footerElement.innerHTML = footerHTML;

                    // 🔧 EJECUTAR SCRIPTS DEL FOOTER (si existen)
                    const scripts = footerElement.querySelectorAll('script');
                    for (const script of scripts) {
                        const newScript = document.createElement('script');
                        if (script.src) {
                            newScript.src = script.src;
                            newScript.async = false;
                        } else {
                            newScript.textContent = script.textContent;
                        }
                        document.body.appendChild(newScript);
                    }

                    console.log('[MAIN.JS] ✅ Footer cargado (scripts ejecutados)');
                }
            }

            // Disparar evento para que otros scripts sepan que el header está listo
            window.dispatchEvent(new CustomEvent('headerLoaded'));
            console.log('[MAIN.JS] 📡 Evento headerLoaded disparado');

        } catch (error) {
            console.error('[MAIN.JS] ❌ Error cargando header/footer:', error);
        }
    }

    // ========================================
    // 2. MANTENER SESIÓN DE USUARIO
    // ========================================

    function restoreUserSession() {
        console.log('[MAIN.JS] 🔐 Restaurando sesión de usuario...');

        // Intentar obtener sesión guardada
        let userSession = null;
        let userToken = null;

        // Buscar en sessionStorage primero
        userToken = sessionStorage.getItem('bge_auth_token') ||
                   localStorage.getItem('bge_auth_token') ||
                   sessionStorage.getItem('authToken') ||
                   localStorage.getItem('authToken');

        const userDataStr = sessionStorage.getItem('bge_user_data') ||
                           localStorage.getItem('bge_user_data') ||
                           sessionStorage.getItem('userData') ||
                           localStorage.getItem('userData');

        if (userDataStr) {
            try {
                userSession = JSON.parse(userDataStr);
            } catch (e) {
                console.warn('[MAIN.JS] ⚠️ No se pudo parsear datos de usuario:', e);
            }
        }

        if (userSession && userToken) {
            console.log('[MAIN.JS] ✅ Sesión encontrada:', userSession.nombre || userSession.email);
            return { user: userSession, token: userToken };
        } else {
            console.log('[MAIN.JS] ℹ️ Sin sesión activa');
            return null;
        }
    }

    // ========================================
    // 3. ACTUALIZAR UI DEL USUARIO EN HEADER
    // ========================================

    function updateUserUIInHeader(user, isAuthenticated) {
        if (!user || !isAuthenticated) {
            console.log('[MAIN.JS] 🔓 Usuario no autenticado - ocultando elementos de admin');
            return;
        }

        console.log('[MAIN.JS] 👤 Actualizando UI para usuario:', user.nombre);

        // Esperar a que el header esté renderizado
        const updateUI = () => {
            // Intentar encontrar elementos del header
            const userMenuName = document.getElementById('userMenuName');
            const userMenuRole = document.getElementById('userMenuRole');
            const loginButtons = document.getElementById('loginButtons');
            const userMenu = document.getElementById('userMenu');
            const adminMenuItems = document.getElementById('adminMenuItems');
            const teacherMenuItems = document.getElementById('teacherMenuItems');
            const studentMenuItems = document.getElementById('studentMenuItems');

            if (userMenuName) {
                userMenuName.textContent = user.nombre || user.email.split('@')[0];
                console.log('[MAIN.JS] ✅ Nombre de usuario actualizado en header');
            }

            if (userMenuRole) {
                const role = user.role || 'usuario';
                userMenuRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);
            }

            // Mostrar/ocultar elementos según autenticación
            if (loginButtons) loginButtons.classList.add('d-none');
            if (userMenu) userMenu.classList.remove('d-none');

            // Mostrar/ocultar menús específicos por rol
            const role = user.role || 'usuario';
            if (adminMenuItems) {
                adminMenuItems.classList.toggle('d-none', !['admin', 'administrator'].includes(role));
            }
            if (teacherMenuItems) {
                teacherMenuItems.classList.toggle('d-none', !['docente', 'teacher'].includes(role));
            }
            if (studentMenuItems) {
                studentMenuItems.classList.toggle('d-none', !['estudiante', 'student'].includes(role));
            }

            // Mostrar sección admin si es admin
            const adminSection = document.getElementById('adminOnlySection');
            if (adminSection) {
                adminSection.classList.toggle('d-none', !['admin', 'administrator'].includes(role));
            }
        };

        // Intentar actualizar inmediatamente
        updateUI();

        // Y también después de un pequeño delay en caso de que el header se cargue después
        setTimeout(updateUI, 500);
    }

    // ========================================
    // 4. INICIALIZACIÓN PRINCIPAL
    // ========================================

    async function init() {
        console.log('[MAIN.JS] ⏳ Iniciando secuencia de carga...');

        // Cargar header y footer
        await loadHeaderFooter();

        // Restaurar sesión de usuario
        const session = restoreUserSession();
        if (session) {
            console.log('[MAIN.JS] 🔐 Sesión activa encontrada');
            updateUserUIInHeader(session.user, true);

            // Guardar globalmente para que otros scripts accedan
            window.currentUserSession = session;
        } else {
            console.log('[MAIN.JS] 🔓 Usuario no autenticado');
        }

        console.log('[MAIN.JS] ✅ Inicialización completada');
    }

    // ========================================
    // 5. ESCUCHAR EVENTOS DE CAMBIO DE SESIÓN
    // ========================================

    // Cuando el usuario hace login (desde auth-login-patch.js)
    document.addEventListener('bge-user-logged-in', (event) => {
        console.log('[MAIN.JS] 📡 Usuario logueado:', event.detail.user.nombre);
        updateUserUIInHeader(event.detail.user, true);
        window.currentUserSession = {
            user: event.detail.user,
            token: sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token')
        };
    });

    // Cuando el usuario hace logout
    document.addEventListener('bge-user-logged-out', () => {
        console.log('[MAIN.JS] 📡 Usuario deslogueado');
        updateUserUIInHeader(null, false);
        window.currentUserSession = null;
    });

    // Cuando el usuario cambia de página dentro del sitio (navegación sin recargar)
    document.addEventListener('pagechange', () => {
        console.log('[MAIN.JS] 📄 Página cambiada - restaurando sesión...');
        const session = restoreUserSession();
        if (session) {
            updateUserUIInHeader(session.user, true);
        }
    });

    // ========================================
    // 6. EJECUTAR CUANDO EL DOM ESTÉ LISTO
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // 7. EXPORTAR FUNCIONES GLOBALES
    // ========================================

    window.mainJS = {
        restoreUserSession,
        updateUserUIInHeader,
        loadHeaderFooter
    };

    console.log('[MAIN.JS] 🎉 Script main.js listo');

})();
