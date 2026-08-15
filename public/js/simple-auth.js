/**
 * Simple Authentication System
 * Maneja login, registro, persistencia de sesión y protección de rutas
 */

class SimpleAuth {
    static API_BASE = (window.AppConfig && window.AppConfig.api && window.AppConfig.api.baseURL)
        ? window.AppConfig.api.baseURL
        : '';

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
                const error = await response.json();
                throw new Error(error.message || error.error || 'Error al iniciar sesión');
            }

            const data = await response.json();
            const token = data.token || (data.tokens && data.tokens.accessToken) || data.accessToken;

            // Guardar token y datos de usuario de manera unificada
            if (token) {
                localStorage.setItem('auth_token', token);
                localStorage.setItem('bge_auth_token', token);
                if (data.user?.role === 'estudiante') {
                    localStorage.setItem('student_auth_token', token);
                    localStorage.setItem('current_student', JSON.stringify(data.user));
                } else if (data.user?.role === 'docente') {
                    localStorage.setItem('teachers_auth_token', token);
                } else if (data.user?.role === 'padre_familia' || data.user?.role === 'padre') {
                    localStorage.setItem('parent_auth_token', token);
                    localStorage.setItem('current_parent', JSON.stringify(data.user));
                }
            }

            if (data.user) {
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                localStorage.setItem('bge_auth_session', JSON.stringify({ user: data.user, role: data.user.role }));
            }

            localStorage.setItem('auth_expires', data.expiresAt || Date.now() + 86400000);

            return data;
        } catch (error) {
            console.error('Login error:', error);
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
                const error = await response.json();
                throw new Error(error.message || 'Error al registrarse');
            }

            const data = await response.json();

            // Auto-login después del registro
            if (data.token) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                localStorage.setItem('auth_expires', data.expiresAt || Date.now() + 86400000);
            }

            return data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    /**
     * Cerrar sesión (Limpieza TOTAL)
     */
    static logout() {
        console.log('🧹 Ejecutando limpieza total de sesión...');

        // 1. Limpiar Admin Auth
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_expires');

        // 2. Limpiar Student Auth
        localStorage.removeItem('student_auth_token');
        localStorage.removeItem('current_student');

        // 3. Limpiar Legacy/Unified Auth
        localStorage.removeItem('bge_auth_token');
        localStorage.removeItem('bge_user_data');

        // 4. Limpiar Cookies
        document.cookie.split(";").forEach(function (c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        window.location.href = '/login.html';
    }

    /**
     * Obtener token actual
     */
    static getToken() {
        return localStorage.getItem('auth_token');
    }

    /**
     * Obtener usuario actual
     */
    static getUser() {
        const userStr = localStorage.getItem('auth_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Verificar si está autenticado
     */
    /**
     * Verificar si está autenticado
     */
    static isAuthenticated() {
        const token = this.getToken();
        const expires = localStorage.getItem('auth_expires');

        if (!token) return false;

        // Validación básica de formato JWT
        if (token.split('.').length !== 3) {
            console.warn('Token inválido detectado, cerrando sesión...');
            this.logout();
            return false;
        }

        // Verificar si el token expiró (si existe fecha de expiración guardada)
        if (expires && Date.now() > parseInt(expires)) {
            console.warn('Sesión expirada, cerrando sesión...');
            this.logout();
            return false;
        }

        // Verificar expiración interna del token (payload)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                console.warn('Token JWT expirado internamente, cerrando sesión...');
                this.logout();
                return false;
            }
        } catch (e) {
            console.error('Error decodificando token en check:', e);
            this.logout();
            return false;
        }

        return true;
    }

    /**
     * Proteger una ruta (redirigir a login si no autenticado)
     */
    static requireAuth(redirectTo = '/login.html') {
        if (!this.isAuthenticated()) {
            // Guardar URL actual para redirigir después del login
            sessionStorage.setItem('redirect_after_login', window.location.pathname);
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    /**
     * Hacer request autenticado
     */
    static async authenticatedFetch(url, options = {}) {
        const token = this.getToken();

        if (!token) {
            throw new Error('No autenticado');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(`${this.API_BASE}${url}`, {
            ...options,
            headers
        });

        // Si es 401, logout automático
        if (response.status === 401) {
            this.logout();
            throw new Error('Sesión expirada');
        }

        return response;
    }

    /**
     * Actualizar header con estado de auth
     */
    static updateHeaderUI() {
        const user = this.getUser();
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');

        if (!authButtons) return;

        if (this.isAuthenticated() && user) {
            // Mostrar menú de usuario
            authButtons.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-primary dropdown-toggle" type="button" id="userMenuDropdown" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle me-2"></i>${user.nombre || user.email}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="/estudiantes.html"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</a></li>
                        <li><a class="dropdown-item" href="/profile.html"><i class="fas fa-user me-2"></i>Mi Perfil</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="SimpleAuth.logout()"><i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión</a></li>
                    </ul>
                </div>
            `;
        } else {
            // Mostrar botones de login/registro
            authButtons.innerHTML = `
                <a href="/login.html" class="btn btn-outline-primary me-2">
                    <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                </a>
                <a href="/register.html" class="btn btn-primary">
                    <i class="fas fa-user-plus me-2"></i>Registrarse
                </a>
            `;
        }
    }
}

// Auto-actualizar header cuando cargue la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SimpleAuth.updateHeaderUI());
} else {
    SimpleAuth.updateHeaderUI();
}

// Exponer globalmente
window.SimpleAuth = SimpleAuth;
