/**
 * 🔐 SESSION MONITOR - Sistema de seguridad automática avanzado
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(function () {
    'use strict';

    let lastSessionCheck = null;
    let isRedirecting = false;
    let hasEverBeenAuthenticated = false;

    // 🚨 VERIFICACIÓN INMEDIATA AL CARGAR LA PÁGINA
    function immediateSecurityCheck() {
        console.log('🔍 [SECURITY] Verificación inmediata de seguridad...');
        console.log('🔍 [SECURITY DEBUG] Storage State Check:');
        console.log('   - LS bge_auth_token:', localStorage.getItem('bge_auth_token') ? 'PRESENT' : 'MISSING');
        console.log('   - LS bge_auth_user:', localStorage.getItem('bge_auth_user') ? 'PRESENT' : 'MISSING');
        console.log('   - SS bge_auth_token:', sessionStorage.getItem('bge_auth_token') ? 'PRESENT' : 'MISSING');
        console.log('   - SS bge_auth_user:', sessionStorage.getItem('bge_auth_user') ? 'PRESENT' : 'MISSING');
        console.log('   - LS authToken (legacy):', localStorage.getItem('authToken') ? 'PRESENT' : 'MISSING');
        console.log('   - LS secure_admin_session:', localStorage.getItem('secure_admin_session') ? 'PRESENT' : 'MISSING');


        // ✅ FIX (16 Dec 2025): Buscar credenciales en las claves correctas
        // Sistema 1: JWT moderno (unified-auth-system-v2.js)
        let hasValidAuth = false;

        // Buscar en localStorage (usuario marcó "Recordarme")
        const bgeToken = localStorage.getItem('bge_auth_token');
        const bgeUser = localStorage.getItem('bge_auth_user');

        // Si no en localStorage, buscar en sessionStorage
        const bgeTokenSession = sessionStorage.getItem('bge_auth_token');
        const bgeUserSession = sessionStorage.getItem('bge_auth_user');

        if ((bgeToken && bgeUser) || (bgeTokenSession && bgeUserSession)) {
            hasValidAuth = true;
            console.log('✅ [SECURITY] Sistema JWT moderno detectado');
        }

        // Sistema 2: JWT legacy
        if (!hasValidAuth) {
            const legacyToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const legacyUser = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            if (legacyToken && legacyUser) {
                hasValidAuth = true;
                console.log('✅ [SECURITY] Sistema JWT legacy detectado');
            }
        }

        // Sistema 3: Secure session (legacy)
        if (!hasValidAuth) {
            const session = localStorage.getItem('secure_admin_session') || sessionStorage.getItem('secure_admin_session');
            if (session) {
                try {
                    const sessionData = JSON.parse(session);
                    if (sessionData.isAuthenticated && sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                        hasValidAuth = true;
                        console.log('✅ [SECURITY] Sistema secure_admin_session detectado');
                    }
                } catch (e) {
                    console.warn('⚠️ [SECURITY] Error parsing secure_admin_session:', e);
                }
            }
        }

        // Sistema 4: window.unifiedLogin (nuevo)
        if (!hasValidAuth && window.unifiedLogin && typeof window.unifiedLogin.loadSession === 'function') {
            const sessionData = window.unifiedLogin.loadSession();
            if (sessionData && sessionData.token) {
                hasValidAuth = true;
                console.log('✅ [SECURITY] Sistema window.unifiedLogin detectado');
            }
        }

        // Si no hay sesión válida, bloquear inmediatamente
        if (!hasValidAuth) {
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
            console.warn('Redirect suppressed for debugging.');
            // window.location.replace('index.html'); // replace evita volver con botón atrás
        }, 2000);
    }

    function checkSessionAndRedirect() {
        // Solo ejecutar si no estamos en proceso de redirección
        if (isRedirecting) return;

        try {
            // Verificar múltiples formas de detectar cierre de sesión
            let isLoggedOut = false;

            // ✅ FIX (16 Dec 2025): Verificar claves correctas
            // 1. Verificar JWT moderno (bge_auth_*)
            const bgeToken = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token');
            const bgeUser = localStorage.getItem('bge_auth_user') || sessionStorage.getItem('bge_auth_user');

            const hasModernJWT = bgeToken && bgeUser;

            // 2. Verificar JWT legacy
            const legacyToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const legacyUser = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            const hasLegacyJWT = legacyToken && legacyUser;

            // 3. Verificar secure_admin_session
            const session = localStorage.getItem('secure_admin_session') || sessionStorage.getItem('secure_admin_session');
            const hasSecureSession = session ? (() => {
                try {
                    const sessionData = JSON.parse(session);
                    return sessionData.isAuthenticated && sessionData.expiresAt && Date.now() < sessionData.expiresAt;
                } catch (e) {
                    return false;
                }
            })() : false;

            // 4. Verificar window.unifiedLogin
            let hasUnifiedLogin = false;
            if (window.unifiedLogin && typeof window.unifiedLogin.loadSession === 'function') {
                const sessionData = window.unifiedLogin.loadSession();
                hasUnifiedLogin = sessionData && sessionData.token;
            }

            // Si ALGUNO de los sistemas tiene autenticación válida, permitir acceso
            const hasAnyValidAuth = hasModernJWT || hasLegacyJWT || hasSecureSession || hasUnifiedLogin;

            // Si DU no tiene autenticación válida y ANTES estaba autenticado, es un logout
            if (!hasAnyValidAuth && hasEverBeenAuthenticated) {
                console.log('🔒 [SECURITY] Logout detectado - Ningún sistema de autenticación activo');
                isLoggedOut = true;
            }

            // Verificar notificación de cierre en ventana
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
        window.addEventListener('popstate', function (event) {
            console.log('🔒 [SECURITY] Intento de retroceso detectado');

            // ✅ FIX (16 Dec 2025): Verificar claves correctas
            // Verificar inmediatamente la sesión en claves correctas
            const bgeToken = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token');
            const bgeUser = localStorage.getItem('bge_auth_user') || sessionStorage.getItem('bge_auth_user');
            const legacyToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const legacyUser = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            const session = localStorage.getItem('secure_admin_session') || sessionStorage.getItem('secure_admin_session');

            let hasValidAuth = (bgeToken && bgeUser) || (legacyToken && legacyUser);

            if (!hasValidAuth && session) {
                try {
                    const sessionData = JSON.parse(session);
                    hasValidAuth = sessionData.isAuthenticated && sessionData.expiresAt && Date.now() < sessionData.expiresAt;
                } catch (e) {
                    // Ignore parse errors
                }
            }

            if (!hasValidAuth) {
                console.log('🚨 [SECURITY] Retroceso sin autenticación - Bloqueando');
                blockPageAndRedirect('Navegación no autorizada');
            } else {
                // Si hay sesión válida, permitir pero mantener en la misma página
                history.pushState(null, null, location.href);
            }
        });
    }

    // 🚀 INICIALIZACIÓN DEL SISTEMA DE SEGURIDAD
    document.addEventListener('DOMContentLoaded', function () {
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
        document.addEventListener('visibilitychange', function () {
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
        window.addEventListener('focus', function () {
            if (!isRedirecting) {
                checkSessionAndRedirect();
            }
        });

        // Verificar cuando hay cambios en localStorage desde otras pestañas
        window.addEventListener('storage', function (e) {
            if (e.key === 'secure_admin_session' && !e.newValue) {
                console.log('🔒 [SECURITY] Logout detectado desde otra pestaña');
                blockPageAndRedirect('Sesión cerrada en otra pestaña');
            }
        });

        // Cleanup al salir de la página
        window.addEventListener('beforeunload', function () {
            stopSecurityCheck();
        });

        console.log('🛡️ [SECURITY SYSTEM] Sistema de seguridad optimizado activado');
    });

    // Ejecutar verificación inmediata incluso antes del DOMContentLoaded
    immediateSecurityCheck();

})();
