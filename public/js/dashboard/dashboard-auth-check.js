/**
 * 🔒 DASHBOARD AUTH CHECK - Verificación de autenticación unificada
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(function () {
    'use strict';

    function isAuthenticated() {
        // Buscar token en localStorage o sessionStorage
        const token = localStorage.getItem('bge_auth_token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken') || sessionStorage.getItem('bge_auth_token') || sessionStorage.getItem('auth_token') || sessionStorage.getItem('authToken');
        
        // Buscar datos de usuario en todas las claves posibles
        const rawUserData = localStorage.getItem('bge_auth_user') || localStorage.getItem('auth_user') || localStorage.getItem('userData') || localStorage.getItem('currentUser') || sessionStorage.getItem('bge_auth_user') || sessionStorage.getItem('auth_user') || sessionStorage.getItem('userData') || sessionStorage.getItem('currentUser');
        
        if (token && rawUserData) {
            try {
                const user = JSON.parse(rawUserData);
                const role = user.role || (user.user && user.user.role);
                if (role === 'admin' || role === 'administrativo' || role === 'directivo') {
                    return true;
                }
            } catch (e) {
            }
        }

        // Sistema 3: Secure session (legacy)
        const secureSession = localStorage.getItem('secure_admin_session') || sessionStorage.getItem('secure_admin_session');
        if (secureSession) {
            try {
                const sessionData = JSON.parse(secureSession);
                if (sessionData.isAuthenticated || sessionData.token) {
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

})();
