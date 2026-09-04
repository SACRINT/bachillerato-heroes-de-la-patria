/**
 * 🔒 DASHBOARD AUTH CHECK - Verificación de autenticación unificada
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 * 
 * v2.2 (Sep 2026): Soporte integral para adminSession, bge_user_data, bge_auth_token y tokens JWT.
 * Si no está autenticado, abre el modal institucional de acceso limpiamente sin overlays intrusivos.
 */

(function () {
    'use strict';

    const ADMIN_ROLES = ['admin', 'administrativo', 'directivo', 'administrator', 'director', 'subdirector', 'coordinador', 'superadmin'];

    function tryParseJSON(str) {
        if (!str || typeof str !== 'string') return null;
        try { return JSON.parse(str); } catch (e) { return null; }
    }

    function extractRole(obj) {
        if (!obj) return null;
        return obj.role || (obj.user && obj.user.role) || obj.tipo_usuario || null;
    }

    function isAuthenticated() {
        // =============================================
        // SISTEMA 1: adminSession / secure_admin_session
        // =============================================
        const adminSessionStr = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession')
                              || localStorage.getItem('secure_admin_session') || sessionStorage.getItem('secure_admin_session');
        if (adminSessionStr) {
            const adminData = tryParseJSON(adminSessionStr);
            if (adminData && typeof adminData === 'object') {
                const isExp = (adminData.expires && Date.now() > adminData.expires) ||
                              (adminData.expiresAt && Date.now() > adminData.expiresAt);
                if (!isExp) {
                    const role = extractRole(adminData);
                    if (adminData.isAuthenticated || adminData.token || (role && ADMIN_ROLES.includes(String(role).toLowerCase()))) {
                        return true;
                    }
                } else {
                    // Limpiar sesión expirada
                    try {
                        localStorage.removeItem('adminSession');
                        sessionStorage.removeItem('adminSession');
                        localStorage.removeItem('secure_admin_session');
                        sessionStorage.removeItem('secure_admin_session');
                    } catch (e) {}
                }
            }
        }

        // =============================================
        // SISTEMA 2: Token + UserData (SimpleAuth & unified-auth-system-v2)
        // =============================================
        const token = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token')
                    || localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
                    || localStorage.getItem('token') || sessionStorage.getItem('token')
                    || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
                    || localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

        const rawUserData = localStorage.getItem('bge_auth_user') || sessionStorage.getItem('bge_auth_user')
                          || localStorage.getItem('bge_user_data') || sessionStorage.getItem('bge_user_data')
                          || localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
                          || localStorage.getItem('userData') || sessionStorage.getItem('userData')
                          || localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

        if (token && rawUserData) {
            const user = tryParseJSON(rawUserData);
            const role = extractRole(user);
            if (role && ADMIN_ROLES.includes(String(role).toLowerCase())) {
                return true;
            }
        }

        // =============================================
        // SISTEMA 3: bge_auth_session
        // =============================================
        const authSessionStr = localStorage.getItem('bge_auth_session') || sessionStorage.getItem('bge_auth_session');
        if (authSessionStr) {
            const sessionData = tryParseJSON(authSessionStr);
            if (sessionData && typeof sessionData === 'object') {
                const isExp = (sessionData.expires && Date.now() > sessionData.expires) ||
                              (sessionData.expiresAt && Date.now() > sessionData.expiresAt);
                if (!isExp) {
                    const role = extractRole(sessionData) || extractRole(sessionData.user);
                    if (sessionData.isAuthenticated || (role && ADMIN_ROLES.includes(String(role).toLowerCase()))) {
                        return true;
                    }
                    if (sessionData.token || sessionData.user?.token) {
                        return true;
                    }
                }
            }
        }

        // =============================================
        // SISTEMA 4: Token JWT Payload decoding
        // =============================================
        if (token && typeof token === 'string' && token.includes('.')) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                if (decoded.exp && (decoded.exp * 1000) < Date.now()) {
                    return false; // Token expirado
                }
                const role = decoded.role || decoded.tipo_usuario;
                if (role && ADMIN_ROLES.includes(String(role).toLowerCase())) {
                    return true;
                }
            } catch (e) {
                // Si no se puede decodificar pero tiene longitud JWT
            }
        }

        return false;
    }

    // Exponer universalmente para otros scripts
    window.checkAdminSession = isAuthenticated;

    // Verificación de seguridad estricta para el dashboard
    if (!isAuthenticated()) {
        console.warn('🔒 [DASHBOARD AUTH] Acceso no autorizado detectado. Bloqueando vista y redirigiendo a login...');
        window.isDashboardUnauthenticated = true;

        // 1. Ocultar el documento de inmediato para evitar cualquier filtración visual de datos
        if (document.documentElement) {
            document.documentElement.style.display = 'none';
        }

        // 2. Guardar página de retorno
        try {
            sessionStorage.setItem('redirect_after_login', 'admin-dashboard.html');
        } catch (e) {}

        // 3. Redirigir de inmediato al portal de acceso con credenciales
        window.location.replace('login.html?redirect=admin-dashboard.html');
    } else {
        window.isDashboardUnauthenticated = false;
        if (document.documentElement && document.documentElement.style.display === 'none') {
            document.documentElement.style.display = '';
        }
        console.log('✅ [DASHBOARD AUTH] Sesión administrativa validada con éxito.');
    }

})();
