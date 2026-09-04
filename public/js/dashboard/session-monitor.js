/**
 * 🔐 SESSION MONITOR & UNIVERSAL ADMIN AUTH BRIDGE
 * Sistema de gestión y verificación de sesión administrativa resiliente (BGE Plantel).
 * v3.0 (Sep 2026) - Blindaje definitivo:
 *   - Soporte universal para adminSession, secure_admin_session, bge_auth_token, authToken, token.
 *   - Cero bloqueos prematuros con pantallas rojas.
 *   - Provee helper global window.getGlobalAdminToken() y window.checkAdminSession().
 */

(function () {
    'use strict';

    const ADMIN_ROLES = ['admin', 'administrativo', 'directivo', 'administrator', 'director'];

    function tryParse(str) {
        if (!str || typeof str !== 'string') return null;
        try { return JSON.parse(str); } catch (e) { return null; }
    }

    /**
     * 🔑 Helper global para extraer el Token JWT desde cualquier ubicación de almacenamiento
     */
    window.getGlobalAdminToken = function () {
        // 1. Claves directas de almacenamiento
        const directKeys = [
            'bge_auth_token',
            'authToken',
            'token',
            'auth_token',
            'adminToken',
            'admin_token',
            'teachers_auth_token'
        ];

        for (const key of directKeys) {
            const val = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (val && typeof val === 'string' && val.trim().length > 10) {
                return val.trim();
            }
        }

        // 2. Objetos de sesión estructurados (adminSession, secure_admin_session, etc.)
        const sessionKeys = [
            'adminSession',
            'secure_admin_session',
            'bge_auth_session'
        ];

        for (const key of sessionKeys) {
            const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (raw) {
                const parsed = tryParse(raw);
                if (parsed) {
                    if (parsed.token && typeof parsed.token === 'string') return parsed.token;
                    if (parsed.tokens?.access) return parsed.tokens.access;
                    if (parsed.tokens?.accessToken) return parsed.tokens.accessToken;
                    if (parsed.user?.token) return parsed.user.token;
                }
            }
        }

        // 3. Fallback a cookies
        if (typeof document !== 'undefined' && document.cookie) {
            const match = document.cookie.match(/(?:^|;\s*)(?:bge_auth_token|authToken|token)=([^;]+)/);
            if (match && match[1]) return decodeURIComponent(match[1]);
        }

        return '';
    };

    /**
     * 🛡️ Helper global para verificar si existe una sesión administrativa activa
     */
    window.checkAdminSession = function () {
        // A. Verificar token disponible
        const token = window.getGlobalAdminToken();
        if (token) {
            // Si tiene estructura JWT, verificar expiración si es posible
            if (token.includes('.')) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                    if (payload.exp && (payload.exp * 1000) < Date.now()) {
                        console.warn('[SESSION-MONITOR] Token JWT expirado localmente.');
                        return false;
                    }
                    return true;
                } catch (e) {
                    return true; // Token opaco o no-JWT válido
                }
            }
            return true;
        }

        // B. Verificar adminSession / secure_admin_session
        const adminSessionStr = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession') ||
                                localStorage.getItem('secure_admin_session') || sessionStorage.getItem('secure_admin_session');
        if (adminSessionStr) {
            const sessionData = tryParse(adminSessionStr);
            if (sessionData) {
                const isExp = (sessionData.expires && Date.now() > sessionData.expires) ||
                              (sessionData.expiresAt && Date.now() > sessionData.expiresAt);
                if (!isExp && (sessionData.isAuthenticated || sessionData.token)) {
                    return true;
                }
            }
        }

        // C. Verificar usuario con rol administrativo
        const userKeys = ['bge_auth_user', 'bge_user_data', 'auth_user', 'userData'];
        for (const key of userKeys) {
            const rawUser = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (rawUser) {
                const user = tryParse(rawUser);
                const role = (user?.role || user?.tipo_usuario || user?.user?.role || '').toLowerCase();
                if (ADMIN_ROLES.includes(role)) {
                    return true;
                }
            }
        }

        return false;
    };

    // Manejador seguro en caso de que no haya sesión o se cierre
    function handleUnauthenticatedSession(reason) {
        console.warn(`🔒 [SESSION-MONITOR] Sesión no detectada (${reason}). Redirigiendo a login...`);

        // Si fue un logout explícito, redirigir limpiamente a index.html
        if (sessionStorage.getItem('admin_logout_redirect') === 'true') {
            sessionStorage.removeItem('admin_logout_redirect');
            window.location.replace('index.html');
            return;
        }

        // Ocultar vista y redirigir al login
        if (document.documentElement) {
            document.documentElement.style.display = 'none';
        }
        try {
            sessionStorage.setItem('redirect_after_login', 'admin-dashboard.html');
        } catch (e) {}
        window.location.replace('login.html?redirect=admin-dashboard.html');
    }

    // Inicialización al cargar el DOM con período de gracia
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(function () {
            const isValid = window.checkAdminSession();
            if (!isValid) {
                handleUnauthenticatedSession('Verificación post-carga');
            } else {
                console.log('✅ [SESSION-MONITOR] Sesión administrativa validada con éxito.');
            }
        }, 800); // 800ms de gracia para que todos los stores e inicializadores se estabilicen

        // Sincronización entre pestañas sin romper navegación
        window.addEventListener('storage', function (e) {
            if (e.key === 'admin_logout_redirect' && e.newValue === 'true') {
                handleUnauthenticatedSession('Cierre de sesión en otra pestaña');
            }
        });
    });

})();
