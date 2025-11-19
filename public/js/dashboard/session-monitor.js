/**
 * 🔐 SESSION MONITOR - Sistema de seguridad automática avanzado
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(function() {
    'use strict';

    let lastSessionCheck = null;
    let isRedirecting = false;
    let hasEverBeenAuthenticated = false;

    // 🚨 VERIFICACIÓN INMEDIATA AL CARGAR LA PÁGINA
    function immediateSecurityCheck() {
        console.log('🔍 [SECURITY] Verificación inmediata de seguridad...');

        const session = localStorage.getItem('secure_admin_session');
        const hasValidAuth = window.secureAdminAuth &&
            typeof window.secureAdminAuth.isUserAuthenticated === 'function' &&
            window.secureAdminAuth.isUserAuthenticated();

        // Si no hay sesión válida, bloquear inmediatamente
        if (!session && !hasValidAuth) {
            console.log('🚨 [SECURITY] Acceso no autorizado detectado - Bloqueando página');
            blockPageAndRedirect('Acceso no autorizado');
            return false;
        }

        hasEverBeenAuthenticated = true;
        return true;
    }

    function blockPageAndRedirect(reason) {
        if (isRedirecting) return;
        isRedirecting = true;

        console.log(`🚨 [SECURITY ALERT] ${reason}. Bloqueando y redirigiendo...`);

        // Bloquear toda la página inmediatamente
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.9); z-index: 999998;
            display: flex; align-items: center; justify-content: center;
        `;

        // Mostrar notificación de seguridad
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: #dc3545; color: white; padding: 30px; border-radius: 12px;
            text-align: center; max-width: 400px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        `;
        notification.innerHTML = `
            <i class="fas fa-shield-alt fa-3x mb-3"></i>
            <h3>🔐 Seguridad Activada</h3>
            <p><strong>Motivo:</strong> ${reason}</p>
            <p>Redirigiendo por seguridad...</p>
            <div class="spinner-border text-light mt-3" role="status">
                <span class="visually-hidden">Redirigiendo...</span>
            </div>
        `;

        overlay.appendChild(notification);
        document.body.appendChild(overlay);

        // Ocultar todo el contenido de la página
        document.body.style.overflow = 'hidden';
        const mainContent = document.querySelector('main');
        if (mainContent) mainContent.style.display = 'none';

        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.replace('index.html'); // replace evita volver con botón atrás
        }, 2000);
    }

    function checkSessionAndRedirect() {
        // Solo ejecutar si no estamos en proceso de redirección
        if (isRedirecting) return;

        try {
            // Verificar múltiples formas de detectar cierre de sesión
            let isLoggedOut = false;

            // 1. Verificar localStorage
            const session = localStorage.getItem('secure_admin_session');
            if (!session && hasEverBeenAuthenticated) {
                console.log('🔒 [SECURITY] LocalStorage session eliminada');
                isLoggedOut = true;
            }

            // 2. Verificar si el sistema de autenticación reporta logout
            if (window.secureAdminAuth && typeof window.secureAdminAuth.isUserAuthenticated === 'function') {
                const authStatus = window.secureAdminAuth.isUserAuthenticated();
                if (!authStatus && hasEverBeenAuthenticated) {
                    console.log('🔒 [SECURITY] Sistema de autenticación reporta logout');
                    isLoggedOut = true;
                }
            }

            // 3. Verificar si hay cambios en el estado
            const currentSession = localStorage.getItem('secure_admin_session');
            if (lastSessionCheck !== null && lastSessionCheck !== currentSession) {
                console.log('🔒 [SECURITY] Cambio detectado en sesión');
                if (!currentSession && hasEverBeenAuthenticated) {
                    isLoggedOut = true;
                }
            }
            lastSessionCheck = currentSession;

            // 4. Verificar notificación de cierre en ventana
            if (sessionStorage.getItem('admin_logout_redirect') === 'true') {
                console.log('🔒 [SECURITY] Señal de logout detectada');
                sessionStorage.removeItem('admin_logout_redirect');
                isLoggedOut = true;
            }

            // Si se detectó cierre de sesión, bloquear inmediatamente
            if (isLoggedOut) {
                blockPageAndRedirect('Sesión cerrada');
            }

        } catch (error) {
            console.error('🚨 [SECURITY ERROR]', error);
        }
    }

    // 🛡️ PROTECCIÓN CONTRA BOTÓN DE RETROCESO
    function preventBackNavigation() {
        // Agregar entrada al historial para evitar retroceso directo
        history.pushState(null, null, location.href);

        // Interceptar evento de retroceso
        window.addEventListener('popstate', function(event) {
            console.log('🔒 [SECURITY] Intento de retroceso detectado');

            // Verificar inmediatamente la sesión
            const session = localStorage.getItem('secure_admin_session');
            const hasValidAuth = window.secureAdminAuth &&
                typeof window.secureAdminAuth.isUserAuthenticated === 'function' &&
                window.secureAdminAuth.isUserAuthenticated();

            if (!session && !hasValidAuth) {
                console.log('🚨 [SECURITY] Retroceso sin autenticación - Bloqueando');
                blockPageAndRedirect('Navegación no autorizada');
            } else {
                // Si hay sesión válida, permitir pero mantener en la misma página
                history.pushState(null, null, location.href);
            }
        });
    }

    // 🚀 INICIALIZACIÓN DEL SISTEMA DE SEGURIDAD
    document.addEventListener('DOMContentLoaded', function() {
        // Verificación inmediata
        if (!immediateSecurityCheck()) {
            return; // Ya se está redirigiendo
        }

        // Activar protección contra retroceso
        preventBackNavigation();

        // 🔧 OPTIMIZADO: Page Visibility API para pausar cuando la página no está visible
        let securityInterval = null;
        let isPageVisible = !document.hidden;

        function startSecurityCheck() {
            // Solo iniciar si no hay un intervalo activo y la página es visible
            if (!securityInterval && isPageVisible && !isRedirecting) {
                // Verificación cada 5 segundos en lugar de cada 1 segundo (500% más eficiente)
                securityInterval = setInterval(checkSessionAndRedirect, 5000);
                console.log('🛡️ [SECURITY] Verificación de seguridad iniciada (cada 5s)');
            }
        }

        function stopSecurityCheck() {
            if (securityInterval) {
                clearInterval(securityInterval);
                securityInterval = null;
                console.log('⏸️ [SECURITY] Verificación de seguridad pausada');
            }
        }

        // Manejar cambios de visibilidad de la página (Page Visibility API)
        document.addEventListener('visibilitychange', function() {
            isPageVisible = !document.hidden;

            if (isPageVisible) {
                console.log('👁️ [SECURITY] Página visible - Verificando sesión y reanudando checks');
                checkSessionAndRedirect(); // Verificación inmediata al volver
                startSecurityCheck();
            } else {
                console.log('🙈 [SECURITY] Página oculta - Pausando verificación periódica');
                stopSecurityCheck();
            }
        });

        // Iniciar verificación solo si la página es visible
        if (isPageVisible) {
            startSecurityCheck();
        }

        // Verificar también cuando se enfoca la ventana
        window.addEventListener('focus', function() {
            if (!isRedirecting) {
                checkSessionAndRedirect();
            }
        });

        // Verificar cuando hay cambios en localStorage desde otras pestañas
        window.addEventListener('storage', function(e) {
            if (e.key === 'secure_admin_session' && !e.newValue) {
                console.log('🔒 [SECURITY] Logout detectado desde otra pestaña');
                blockPageAndRedirect('Sesión cerrada en otra pestaña');
            }
        });

        // Cleanup al salir de la página
        window.addEventListener('beforeunload', function() {
            stopSecurityCheck();
        });

        console.log('🛡️ [SECURITY SYSTEM] Sistema de seguridad optimizado activado');
    });

    // Ejecutar verificación inmediata incluso antes del DOMContentLoaded
    immediateSecurityCheck();

})();
