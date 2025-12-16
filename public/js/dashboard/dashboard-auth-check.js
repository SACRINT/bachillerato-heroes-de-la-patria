/**
 * 🔒 DASHBOARD AUTH CHECK - Verificación de autenticación unificada
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(function () {
    'use strict';
    console.log('🔒 [DASHBOARD AUTH] Verificación unificada de autenticación...');

    function isAuthenticated() {
        // ✅ FIX (16 Dec 2025): Buscar en localStorage Y sessionStorage con claves correctas

        // Sistema 1: JWT moderno (unified-auth-system-v2.js) - CLAVES CORRECTAS
        // Buscar primero en localStorage (usuario marcó "Recordarme")
        let token = localStorage.getItem('bge_auth_token');
        let userData = localStorage.getItem('bge_auth_user');

        // Si no está en localStorage, buscar en sessionStorage (usuario NO marcó "Recordarme")
        if (!token) {
            token = sessionStorage.getItem('bge_auth_token');
        }
        if (!userData) {
            userData = sessionStorage.getItem('bge_auth_user');
        }

        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                if (user && (user.role === 'admin' || user.role === 'administrativo')) {
                    console.log('✅ [DASHBOARD AUTH] JWT moderno (bge_auth_*) válido - Rol:', user.role);
                    return true;
                } else {
                    console.warn('⚠️ [DASHBOARD AUTH] Token válido pero rol inválido:', user.role);
                }
            } catch (e) {
                console.warn('⚠️ [DASHBOARD AUTH] Error parsing JWT moderno:', e);
            }
        }

        // Sistema 2: JWT legacy (claves antiguas) - Por compatibilidad hacia atrás
        const legacyToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const legacyUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');

        if (legacyToken && legacyUserData) {
            try {
                const user = JSON.parse(legacyUserData);
                if (user && (user.role === 'admin' || user.role === 'administrativo')) {
                    console.log('✅ [DASHBOARD AUTH] JWT legacy (authToken/userData) válido - Rol:', user.role);
                    return true;
                }
            } catch (e) {
                console.warn('⚠️ [DASHBOARD AUTH] Error parsing JWT legacy:', e);
            }
        }

        // Sistema 3: Secure session (legacy)
        const secureSession = localStorage.getItem('secure_admin_session') || sessionStorage.getItem('secure_admin_session');
        if (secureSession) {
            try {
                const sessionData = JSON.parse(secureSession);
                if (sessionData.isAuthenticated && sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                    console.log('✅ [DASHBOARD AUTH] Sistema secure_admin_session válido');
                    return true;
                }
            } catch (e) {
                console.warn('⚠️ [DASHBOARD AUTH] Error en secure session:', e);
            }
        }

        console.warn('❌ [DASHBOARD AUTH] NO SE ENCONTRÓ AUTENTICACIÓN EN NINGÚN SISTEMA');
        return false;
    }

    // Verificación inmediata pero NO intrusiva
    if (!isAuthenticated()) {
        console.log('❌ [DASHBOARD AUTH] No autenticado - Redirigiendo...');
        // DEBUG MODE: Redirección Desactivada
        // setTimeout(() => {
        //     window.location.href = 'index.html';
        // }, 100);

        const debugInfo = {
            token: !!localStorage.getItem('bge_auth_token'),
            userData: localStorage.getItem('bge_auth_user'),
            legacyToken: !!localStorage.getItem('authToken'),
            secureSession: !!localStorage.getItem('secure_admin_session')
        };

        console.error('❌ [DASHBOARD AUTH] FALLO DETACTADO:', debugInfo);

        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100vh;background:rgba(200,0,0,0.9);color:white;z-index:99999;padding:2rem;overflow:auto;';
        errorMsg.innerHTML = `
            <h1>⛔ ACCESO DENEGADO (DEBUG)</h1>
            <p>El sistema de seguridad ha bloqueado el acceso. No se ha redirigido para permitir diagnóstico.</p>
            <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
            <button onclick="window.location.reload()">Reintentar</button>
            <button onclick="window.location.href='index.html'">Ir al Inicio</button>
        `;
        document.body.appendChild(errorMsg);

        return;
    }

    console.log('✅ [DASHBOARD AUTH] Autenticación confirmada - Cargando dashboard');
})();
