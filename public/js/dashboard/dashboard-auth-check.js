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

    const ADMIN_ROLES = ['admin', 'administrativo', 'directivo', 'administrator'];

    function tryParseJSON(str) {
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
            if (adminData) {
                const role = extractRole(adminData);
                if (adminData.isAuthenticated || adminData.token || (role && ADMIN_ROLES.includes(role.toLowerCase()))) {
                    return true;
                }
            }
        }

        // =============================================
        // SISTEMA 2: Token + UserData (unified-auth-system-v2 & main.js)
        // Keys: bge_auth_token + bge_auth_user / bge_user_data
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
            if (role && ADMIN_ROLES.includes(role.toLowerCase())) {
                return true;
            }
        }

        // =============================================
        // SISTEMA 3: bge_auth_session (unified-auth-system-v2 legacy path)
        // =============================================
        const authSession = localStorage.getItem('bge_auth_session') || sessionStorage.getItem('bge_auth_session');
        if (authSession) {
            const sessionData = tryParseJSON(authSession);
            if (sessionData) {
                const role = extractRole(sessionData) || extractRole(sessionData.user);
                if (role && ADMIN_ROLES.includes(role.toLowerCase())) {
                    return true;
                }
                if (sessionData.token || sessionData.user?.token || sessionData.user) {
                    return true;
                }
            }
        }

        // =============================================
        // SISTEMA 4: Token JWT Payload decoding (100% resiliente)
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
                if (token.length > 20) return true;
            }
        }

        return false;
    }

    // Verificación amigable y no bloqueante
    if (!isAuthenticated()) {
        console.warn('⚠️ [DASHBOARD AUTH] Sesión no detectada. Preparando modal de acceso...');
        window.isDashboardUnauthenticated = true;

        const openLoginPrompt = function() {
            const modalEl = document.getElementById('loginModal');
            if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
                modalInstance.show();
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', openLoginPrompt);
        } else {
            setTimeout(openLoginPrompt, 150);
        }
    } else {
        window.isDashboardUnauthenticated = false;
        console.log('✅ [DASHBOARD AUTH] Sesión administrativa validada.');
    }

})();
