/**
 * Simple Authentication System (Unified & Resilient)
 * Maneja login, registro, persistencia de sesión y sincronización global entre portales.
 */

class SimpleAuth {
    static API_BASE = (window.AppConfig && window.AppConfig.api && window.AppConfig.api.baseURL)
        ? window.AppConfig.api.baseURL
        : '';

    /**
     * Sincroniza tokens y datos de usuario en todos los namespaces del navegador
     */
    static syncSession(token, user) {
        if (!token && !user) return;

        if (token) {
            const tokenKeys = [
                'auth_token', 'bge_auth_token', 'authToken', 'token',
                'student_auth_token', 'teachers_auth_token', 'parent_auth_token'
            ];
            tokenKeys.forEach(k => {
                try {
                    localStorage.setItem(k, token);
                    sessionStorage.setItem(k, token);
                } catch (e) {}
            });
        }

        if (user) {
            const userJson = typeof user === 'string' ? user : JSON.stringify(user);
            const userObj = typeof user === 'string' ? JSON.parse(user) : user;
            const sessionData = JSON.stringify({
                user: userObj,
                role: userObj.role || 'admin',
                token: token || this.getToken(),
                isAuthenticated: true,
                expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
            });

            const userKeys = ['auth_user', 'bge_auth_user', 'userData', 'currentUser', 'current_student', 'current_parent'];
            userKeys.forEach(k => {
                try {
                    localStorage.setItem(k, userJson);
                    sessionStorage.setItem(k, userJson);
                } catch (e) {}
            });

            try {
                localStorage.setItem('bge_auth_session', sessionData);
                sessionStorage.setItem('bge_auth_session', sessionData);
                localStorage.setItem('secure_admin_session', sessionData);
                sessionStorage.setItem('secure_admin_session', sessionData);
                localStorage.setItem('auth_expires', String(Date.now() + 86400000 * 7));
                sessionStorage.setItem('auth_expires', String(Date.now() + 86400000 * 7));
            } catch (e) {}
        }
    }

    /**
     * Iniciar sesión
     */
    static async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || error.error || 'Error al iniciar sesión');
            }

            const data = await response.json();
            const token = data.token || (data.tokens && data.tokens.accessToken) || data.accessToken;
            const user = data.user;

            this.syncSession(token, user);

            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Registrar nuevo usuario
     */
    static async register(userData) {
        try {
            const response = await fetch(`${this.API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Error al registrarse');
            }

            const data = await response.json();
            if (data.token) {
                this.syncSession(data.token, data.user);
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cerrar sesión
     */
    static logout() {
        const keys = [
            'bge_auth_token', 'authToken', 'auth_token', 'token', 'admin_token',
            'student_auth_token', 'teachers_auth_token', 'parent_auth_token',
            'bge_refresh_token', 'refreshToken',
            'bge_auth_user', 'bge_user_data', 'userData', 'auth_user', 'currentUser',
            'current_student', 'current_parent', 'current_teacher',
            'bge_auth_session', 'secure_admin_session', 'auth_expires', 'bge_auth_expiry',
            'redirect_after_login'
        ];

        keys.forEach(k => {
            try {
                localStorage.removeItem(k);
                sessionStorage.removeItem(k);
            } catch (e) {}
        });

        try {
            document.cookie.split(";").forEach(function (c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
        } catch (e) {}

        window.dispatchEvent(new CustomEvent('bge-user-logged-out'));
        window.dispatchEvent(new CustomEvent('auth:logout'));

        window.location.href = 'index.html';
    }

    /**
     * Obtener token actual desde cualquier almacenamiento
     */
    static getToken() {
        const keys = [
            'bge_auth_token', 'auth_token', 'authToken', 'token',
            'student_auth_token', 'teachers_auth_token', 'parent_auth_token'
        ];

        for (const k of keys) {
            const val = sessionStorage.getItem(k) || localStorage.getItem(k);
            if (val && val !== 'null' && val !== 'undefined') return val;
        }

        // Buscar en sesiones empaquetadas
        const sessionStr = sessionStorage.getItem('bge_auth_session') || localStorage.getItem('bge_auth_session') ||
                           sessionStorage.getItem('secure_admin_session') || localStorage.getItem('secure_admin_session');
        if (sessionStr) {
            try {
                const parsed = JSON.parse(sessionStr);
                if (parsed.token) return parsed.token;
            } catch (e) {}
        }

        return null;
    }

    /**
     * Obtener usuario actual
     */
    static getUser() {
        const userKeys = ['auth_user', 'bge_auth_user', 'userData', 'currentUser', 'current_student', 'current_parent'];
        for (const k of userKeys) {
            const userStr = sessionStorage.getItem(k) || localStorage.getItem(k);
            if (userStr) {
                try {
                    return JSON.parse(userStr);
                } catch (e) {}
            }
        }

        const sessionStr = sessionStorage.getItem('bge_auth_session') || localStorage.getItem('bge_auth_session') ||
                           sessionStorage.getItem('secure_admin_session') || localStorage.getItem('secure_admin_session');
        if (sessionStr) {
            try {
                const parsed = JSON.parse(sessionStr);
                if (parsed.user) return parsed.user;
            } catch (e) {}
        }

        return null;
    }

    /**
     * Alias compatible de getUser()
     */
    static getCurrentUser() {
        return this.getUser();
    }

    /**
     * Verificar si está autenticado
     */
    static isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token || user);
    }

    /**
     * Proteger una ruta (redirigir a login si no autenticado)
     */
    static requireAuth(redirectTo = '/login.html') {
        if (!this.isAuthenticated()) {
            sessionStorage.setItem('redirect_after_login', window.location.pathname);
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    /**
     * Fetch autenticado
     */
    static async authenticatedFetch(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(url, { ...options, headers });
    }

    /**
     * Actualizar UI del header
     */
    static updateHeaderUI() {
        const user = this.getUser();
        const userMenu = document.getElementById('userMenu');
        const loginButtons = document.getElementById('loginButtons');

        if (this.isAuthenticated() && user) {
            if (loginButtons) loginButtons.classList.add('d-none');
            if (userMenu) {
                userMenu.classList.remove('d-none');
                const userNameEl = userMenu.querySelector('.user-name') || document.getElementById('userName') || document.getElementById('userMenuName');
                if (userNameEl) userNameEl.textContent = user.nombre || user.email?.split('@')[0] || 'Usuario';
            }
        } else {
            if (loginButtons) loginButtons.classList.remove('d-none');
            if (userMenu) userMenu.classList.add('d-none');
        }
    }
}

if (typeof window !== 'undefined') {
    window.SimpleAuth = SimpleAuth;

    // Sincronizar en carga inicial
    try {
        const token = SimpleAuth.getToken();
        const user = SimpleAuth.getUser();
        if (token || user) {
            SimpleAuth.syncSession(token, user);
        }
    } catch (e) {}

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SimpleAuth.updateHeaderUI());
    } else {
        SimpleAuth.updateHeaderUI();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleAuth;
}
