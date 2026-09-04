/**
 * 🔒 DASHBOARD AUTH CHECK - Verificación de autenticación JWT Estricta
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025 | v3.0 (Sep 2026 - Seguridad Cero Confianza)
 * 
 * REGLAS ESTRICTAS:
 * 1. Nadie entra al Dashboard Administrativo sin un token JWT válido, no expirado y con rol de administrador.
 * 2. Un objeto JSON plano con { isAuthenticated: true } o tokens expirados/falsos son RECHAZADOS y PURGADOS de inmediato.
 * 3. Si no está autenticado, la pantalla se oculta inmediatamente y se redirige a login.html con el parámetro redirect.
 */

(function () {
    'use strict';

    const ADMIN_ROLES = [
        'admin', 'administrativo', 'directivo', 'administrator',
        'director', 'subdirector', 'coordinador', 'superadmin'
    ];

    const ADMIN_STORAGE_KEYS = [
        'adminSession', 'secure_admin_session', 'admin_session'
    ];

    function tryParseJSON(str) {
        if (!str || typeof str !== 'string') return null;
        try { return JSON.parse(str); } catch (e) { return null; }
    }

    /**
     * Valida la estructura, firma superficial, expiración y rol de un token JWT
     */
    function validateAdminJwt(token) {
        if (!token || typeof token !== 'string') return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        try {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            let jsonPayload;
            try {
                jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
            } catch (e) {
                jsonPayload = atob(base64);
            }
            const payload = JSON.parse(jsonPayload);

            // 1. Validar expiración estricta
            if (payload.exp && (payload.exp * 1000) < Date.now()) {
                return null;
            }

            // 2. Validar rol administrativo
            const role = (payload.role || payload.tipo_usuario || '').toLowerCase();
            if (ADMIN_ROLES.includes(role)) {
                return { valid: true, payload: payload, role: role };
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Limpia de forma exhaustiva las claves de sesión administrativa corruptas o expiradas
     */
    function purgeStaleAdminSessions() {
        ADMIN_STORAGE_KEYS.forEach(key => {
            try {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            } catch (e) {}
        });
    }

    /**
     * Comprobación canónica de sesión administrativa
     */
    function isAuthenticated() {
        // 1. Recopilar candidatos de token JWT
        const tokenCandidates = [
            sessionStorage.getItem('bge_auth_token'),
            localStorage.getItem('bge_auth_token'),
            sessionStorage.getItem('authToken'),
            localStorage.getItem('authToken'),
            sessionStorage.getItem('token'),
            localStorage.getItem('token'),
            sessionStorage.getItem('admin_token'),
            localStorage.getItem('admin_token')
        ];

        // 2. Extraer token de adminSession si existe
        const adminSessionStr = sessionStorage.getItem('adminSession') || localStorage.getItem('adminSession')
                              || sessionStorage.getItem('secure_admin_session') || localStorage.getItem('secure_admin_session');
        if (adminSessionStr) {
            const parsed = tryParseJSON(adminSessionStr);
            if (parsed) {
                if (parsed.token) tokenCandidates.unshift(parsed.token);
                if (parsed.accessToken) tokenCandidates.unshift(parsed.accessToken);
            }
        }

        // 3. Extraer token de bge_auth_session si existe
        const authSessionStr = sessionStorage.getItem('bge_auth_session') || localStorage.getItem('bge_auth_session');
        if (authSessionStr) {
            const parsed = tryParseJSON(authSessionStr);
            if (parsed) {
                if (parsed.token) tokenCandidates.unshift(parsed.token);
                if (parsed.user?.token) tokenCandidates.unshift(parsed.user.token);
            }
        }

        // 4. Validar si alguno de los tokens es un JWT administrativo legítimo y vigente
        for (let i = 0; i < tokenCandidates.length; i++) {
            const candidate = tokenCandidates[i];
            if (candidate) {
                const validation = validateAdminJwt(candidate);
                if (validation && validation.valid) {
                    return true;
                }
            }
        }

        // 5. Si ninguno es válido, no hay sesión administrativa legítima
        purgeStaleAdminSessions();
        return false;
    }

    // Exponer globalmente
    window.checkAdminSession = isAuthenticated;
    window.validateAdminJwt = validateAdminJwt;
    window.purgeStaleAdminSessions = purgeStaleAdminSessions;

    // =========================================================
    // GUARDIÁN SÍNCRONO INMEDIATO
    // =========================================================
    const isAuthed = isAuthenticated();

    if (!isAuthed) {
        console.warn('🔒 [DASHBOARD AUTH] Acceso denegado. No se detectó token administrativo válido.');
        window.isDashboardUnauthenticated = true;

        // 1. Bloquear y ocultar vista inmediatamente
        if (document.documentElement) {
            document.documentElement.style.display = 'none';
        }

        // 2. Remover contenido del body si ya empezó a crearse
        if (document.body) {
            document.body.style.display = 'none';
            document.body.innerHTML = '';
        }

        // 3. Guardar ruta de retorno
        try {
            sessionStorage.setItem('redirect_after_login', 'admin-dashboard.html');
        } catch (e) {}

        // 4. Redirigir forzosamente al login
        window.location.replace('login.html?redirect=admin-dashboard.html');
    } else {
        window.isDashboardUnauthenticated = false;

        // Revelar el documento
        if (document.documentElement) {
            document.documentElement.style.display = '';
        }
        if (typeof document.getElementById === 'function') {
            const authGateStyle = document.getElementById('auth-gate-style');
            if (authGateStyle) {
                authGateStyle.remove();
            }
        }
        console.log('✅ [DASHBOARD AUTH] Sesión administrativa verificada con JWT válido.');
    }

})();
