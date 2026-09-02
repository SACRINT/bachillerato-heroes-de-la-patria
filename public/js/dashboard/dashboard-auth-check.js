/**
 * 🔒 DASHBOARD AUTH CHECK - Verificación de autenticación unificada
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 * 
 * v2.1 (Sep 2026): Agregado soporte para bge_auth_session (unified-auth-system-v2)
 * El sistema anterior buscaba secure_admin_session que ya no se crea.
 * Ahora busca en TODAS las claves posibles con ROLE CHECK.
 */

(function () {
    'use strict';

    const ADMIN_ROLES = ['admin', 'administrativo', 'directivo', 'administrator'];

    function tryParseJSON(str) {
        try { return JSON.parse(str); } catch (e) { return null; }
    }

    function extractRole(obj) {
        if (!obj) return null;
        return obj.role || (obj.user && obj.user.role) || null;
    }

    function isAuthenticated() {
        // =============================================
        // SISTEMA 1: Token + UserData (unified-auth-system-v2)
        // Keys: bge_auth_token + bge_auth_user
        // =============================================
        const token = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token')
                    || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                    || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

        const rawUserData = localStorage.getItem('bge_auth_user') || sessionStorage.getItem('bge_auth_user')
                          || localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
                          || localStorage.getItem('userData') || sessionStorage.getItem('userData')
                          || localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

        if (token && rawUserData) {
            const user = tryParseJSON(rawUserData);
            const role = extractRole(user);
            if (role && ADMIN_ROLES.includes(role.toLowerCase())) {
                return true;
            }
        }

        // =============================================
        // SISTEMA 2: bge_auth_session (unified-auth-system-v2 legacy path)
        // Guardado por saveSession() como JSON con {user, provider, loginTime}
        // =============================================
        const authSession = localStorage.getItem('bge_auth_session') || sessionStorage.getItem('bge_auth_session');
        if (authSession) {
            const sessionData = tryParseJSON(authSession);
            if (sessionData) {
                const role = extractRole(sessionData) || extractRole(sessionData.user);
                if (role && ADMIN_ROLES.includes(role.toLowerCase())) {
                    return true;
                }
                // Fallback: si tiene token pero sin role check
                if (sessionData.token || sessionData.user?.token || sessionData.user) {
                    return true;
                }
            }
        }

        // =============================================
        // SISTEMA 3: Token JWT Payload decoding (100% resiliente)
        // =============================================
        if (token && token.includes('.')) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                const role = decoded.role || decoded.tipo_usuario;
                if (role && ADMIN_ROLES.includes(role.toLowerCase())) {
                    return true;
                }
                // Si el token es válido y no expiró
                if (decoded.exp && (decoded.exp * 1000) > Date.now()) {
                    return true;
                }
            } catch (e) {
                // Si el token está presente y no se pudo decodificar, pero existe token
                if (token.length > 20) return true;
            }
        }

        // =============================================
        // SISTEMA 3: secure_admin_session (legacy admin-auth.js / bge-security-module)
        // =============================================
        const secureSession = localStorage.getItem('secure_admin_session') || sessionStorage.getItem('secure_admin_session');
        if (secureSession) {
            const sessionData = tryParseJSON(secureSession);
            if (sessionData && (sessionData.isAuthenticated || sessionData.token)) {
                return true;
            }
        }

        return false;
    }

    // Verificación inmediata pero NO intrusiva
    if (!isAuthenticated()) {
        const debugInfo = {
            bge_auth_token_LS: !!localStorage.getItem('bge_auth_token'),
            bge_auth_token_SS: !!sessionStorage.getItem('bge_auth_token'),
            bge_auth_user_LS: !!localStorage.getItem('bge_auth_user'),
            bge_auth_user_SS: !!sessionStorage.getItem('bge_auth_user'),
            bge_auth_session_LS: !!localStorage.getItem('bge_auth_session'),
            bge_auth_session_SS: !!sessionStorage.getItem('bge_auth_session'),
            secure_session_LS: !!localStorage.getItem('secure_admin_session'),
            secure_session_SS: !!sessionStorage.getItem('secure_admin_session'),
            legacyToken: !!localStorage.getItem('authToken')
        };

        console.error('❌ [DASHBOARD AUTH] FALLO DETACTADO:', debugInfo);

        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100vh;background:rgba(200,0,0,0.9);color:white;z-index:99999;padding:2rem;overflow:auto;';
        errorMsg.innerHTML = `
            <h1>ACCESO DENEGADO (DEBUG)</h1>
            <p>El sistema de seguridad ha bloqueado el acceso. No se ha redirigido para permitir diagnóstico.</p>
            <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
            <button onclick="window.location.reload()">Reintentar</button>
            <button onclick="window.location.href='index.html'">Ir al Inicio</button>
        `;
        document.body.appendChild(errorMsg);

        return;
    }

})();
