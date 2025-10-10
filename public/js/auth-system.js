/**
 * 🔐 SISTEMA DE AUTENTICACIÓN JWT - BGE HÉROES DE LA PATRIA
 * Sistema completo de autenticación frontend con manejo de roles y sesiones
 */

class BGEAuthSystem {
    constructor() {
        this.apiBaseUrl = this.detectAPIBaseUrl();
        this.storagePrefix = 'bge_auth_';
        this.currentUser = null;
        this.tokens = null;
        this.refreshPromise = null;
        this.sessionTimeout = null;

        // Configuraciones
        this.tokenRefreshThreshold = 5 * 60 * 1000; // 5 minutos antes de expirar
        this.sessionWarningTime = 5 * 60 * 1000; // Advertir 5 minutos antes
        this.autoRefreshInterval = 30 * 1000; // Verificar cada 30 segundos

        // Roles y permisos
        this.roles = {
            ADMIN: 'admin',
            DOCENTE: 'docente',
            ESTUDIANTE: 'estudiante',
            PADRE: 'padre_familia'
        };

        this.permissions = {
            admin: [
                'read_all', 'write_all', 'delete_all',
                'manage_users', 'manage_system', 'manage_reports',
                'manage_grades', 'manage_calendar', 'manage_communications'
            ],
            docente: [
                'read_students', 'write_grades', 'read_calendar',
                'write_communications', 'read_reports', 'manage_classes'
            ],
            estudiante: [
                'read_own_profile', 'read_own_grades', 'read_calendar',
                'read_communications', 'write_assignments'
            ],
            padre_familia: [
                'read_child_profile', 'read_child_grades', 'read_calendar',
                'read_communications', 'write_communications'
            ]
        };

        // Callbacks para eventos
        this.eventCallbacks = {
            login: [],
            logout: [],
            sessionExpired: [],
            sessionWarning: [],
            tokenRefreshed: [],
            roleChanged: []
        };

        this.init();
    }

    /**
     * Detectar URL base de la API
     */
    detectAPIBaseUrl() {
        const hostname = window.location.hostname;
        const port = window.location.port;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Desarrollo local
            return port === '8080' ? 'http://localhost:3000' : `http://${hostname}:${port || 3000}`;
        } else {
            // Producción
            return window.location.origin;
        }
    }

    /**
     * Inicializar sistema de autenticación
     */
    async init() {
        console.log('🔐 Inicializando sistema de autenticación BGE...');

        // Cargar sesión existente
        await this.loadStoredSession();

        // Configurar interceptores de fetch
        this.setupFetchInterceptor();

        // Iniciar monitoreo de sesión
        this.startSessionMonitoring();

        // Event listeners para visibilidad de página
        this.setupPageVisibilityListeners();

        console.log('✅ Sistema de autenticación inicializado');
    }

    /**
     * Cargar sesión almacenada
     */
    async loadStoredSession() {
        try {
            const storedTokens = localStorage.getItem(this.storagePrefix + 'tokens');
            const storedUser = localStorage.getItem(this.storagePrefix + 'user');

            if (storedTokens && storedUser) {
                this.tokens = JSON.parse(storedTokens);
                this.currentUser = JSON.parse(storedUser);

                // Verificar si el token sigue válido
                const isValid = await this.verifyToken();
                if (isValid) {
                    console.log(`✅ Sesión restaurada: ${this.currentUser.email} (${this.currentUser.role})`);
                    this.emitEvent('login', this.currentUser);
                    return true;
                } else {
                    // Intentar renovar con refresh token
                    const refreshed = await this.refreshToken();
                    if (!refreshed) {
                        this.clearStoredSession();
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error cargando sesión:', error);
            this.clearStoredSession();
        }
        return false;
    }

    /**
     * Iniciar sesión
     */
    async login(credentials) {
        try {
            const { email, password, rememberMe = false } = credentials;

            console.log(`🔐 Intentando login: ${email}`);

            const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    password,
                    rememberMe
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en el login');
            }

            if (!data.success) {
                throw new Error(data.message || 'Credenciales inválidas');
            }

            // Almacenar tokens y usuario
            this.tokens = data.tokens;
            this.currentUser = data.user;

            this.storeSession();

            console.log(`✅ Login exitoso: ${this.currentUser.email} (${this.currentUser.role})`);

            // Emitir evento de login
            this.emitEvent('login', {
                user: this.currentUser,
                sessionInfo: data.sessionInfo
            });

            return {
                success: true,
                user: this.currentUser,
                sessionInfo: data.sessionInfo
            };

        } catch (error) {
            console.error('❌ Error en login:', error);
            throw new Error(error.message || 'Error iniciando sesión');
        }
    }

    /**
     * Cerrar sesión
     */
    async logout(invalidateServer = true) {
        try {
            if (invalidateServer && this.tokens?.accessToken) {
                // Notificar al servidor
                try {
                    await fetch(`${this.apiBaseUrl}/api/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.tokens.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.warn('⚠️ No se pudo notificar logout al servidor:', error);
                }
            }

            const userEmail = this.currentUser?.email;

            // Limpiar datos locales
            this.clearStoredSession();
            this.currentUser = null;
            this.tokens = null;

            // Detener monitoreo
            if (this.sessionTimeout) {
                clearTimeout(this.sessionTimeout);
                this.sessionTimeout = null;
            }

            console.log(`🚪 Logout exitoso: ${userEmail || 'Usuario'}`);

            // Emitir evento de logout
            this.emitEvent('logout');

            return true;

        } catch (error) {
            console.error('❌ Error en logout:', error);
            // Limpiar localmente aunque falle el servidor
            this.clearStoredSession();
            this.currentUser = null;
            this.tokens = null;
            this.emitEvent('logout');
            return false;
        }
    }

    /**
     * Renovar token de acceso
     */
    async refreshToken() {
        // Evitar múltiples solicitudes de refresh simultáneas
        if (this.refreshPromise) {
            return await this.refreshPromise;
        }

        this.refreshPromise = this._performTokenRefresh();
        const result = await this.refreshPromise;
        this.refreshPromise = null;

        return result;
    }

    /**
     * Realizar renovación de token
     */
    async _performTokenRefresh() {
        try {
            if (!this.tokens?.refreshToken) {
                throw new Error('No hay refresh token disponible');
            }

            console.log('🔄 Renovando token...');

            const response = await fetch(`${this.apiBaseUrl}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refreshToken: this.tokens.refreshToken
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error renovando token');
            }

            if (!data.success) {
                throw new Error(data.message || 'Token de refresh inválido');
            }

            // Actualizar tokens
            this.tokens = data.tokens;
            this.storeSession();

            console.log('✅ Token renovado exitosamente');

            this.emitEvent('tokenRefreshed', this.tokens);

            return true;

        } catch (error) {
            console.error('❌ Error renovando token:', error);

            // Si falla la renovación, hacer logout
            await this.logout(false);
            this.emitEvent('sessionExpired', error.message);

            return false;
        }
    }

    /**
     * Verificar validez del token actual
     */
    async verifyToken() {
        try {
            if (!this.tokens?.accessToken) {
                return false;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });

            const data = await response.json();

            return response.ok && data.success;

        } catch (error) {
            console.error('❌ Error verificando token:', error);
            return false;
        }
    }

    /**
     * Realizar petición autenticada
     */
    async authenticatedFetch(url, options = {}) {
        // Verificar autenticación
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        // Verificar si necesita renovar token
        if (this.shouldRefreshToken()) {
            await this.refreshToken();
        }

        // Agregar token a headers
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.tokens.accessToken}`
        };

        return fetch(url, {
            ...options,
            headers
        });
    }

    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        return !!(this.currentUser && this.tokens?.accessToken);
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Verificar rol del usuario
     */
    hasRole(requiredRoles) {
        if (!this.currentUser) return false;

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        return roles.includes(this.currentUser.role);
    }

    /**
     * Verificar permiso del usuario
     */
    hasPermission(requiredPermissions) {
        if (!this.currentUser) return false;

        const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
        const userPermissions = this.currentUser.permissions || this.permissions[this.currentUser.role] || [];

        return permissions.some(perm =>
            userPermissions.includes(perm) ||
            userPermissions.includes('read_all') ||
            userPermissions.includes('write_all')
        );
    }

    /**
     * Verificar si debe renovar el token
     */
    shouldRefreshToken() {
        if (!this.tokens?.accessToken) return false;

        try {
            // Decodificar token JWT (sin verificar firma)
            const payload = JSON.parse(atob(this.tokens.accessToken.split('.')[1]));
            const expiryTime = payload.exp * 1000;
            const timeUntilExpiry = expiryTime - Date.now();

            return timeUntilExpiry < this.tokenRefreshThreshold;
        } catch (error) {
            return true; // Si no se puede decodificar, intentar renovar
        }
    }

    /**
     * Almacenar sesión
     */
    storeSession() {
        try {
            localStorage.setItem(this.storagePrefix + 'tokens', JSON.stringify(this.tokens));
            localStorage.setItem(this.storagePrefix + 'user', JSON.stringify(this.currentUser));
        } catch (error) {
            console.error('❌ Error almacenando sesión:', error);
        }
    }

    /**
     * Limpiar sesión almacenada
     */
    clearStoredSession() {
        localStorage.removeItem(this.storagePrefix + 'tokens');
        localStorage.removeItem(this.storagePrefix + 'user');
    }

    /**
     * Configurar interceptor de fetch
     */
    setupFetchInterceptor() {
        const originalFetch = window.fetch;

        window.fetch = async (url, options = {}) => {
            // Solo interceptar peticiones a la API
            if (typeof url === 'string' && url.includes('/api/')) {
                // Si ya tiene Authorization header, usar authenticatedFetch
                if (!options.headers?.Authorization && this.isAuthenticated()) {
                    return this.authenticatedFetch(url, options);
                }
            }

            return originalFetch(url, options);
        };
    }

    /**
     * Iniciar monitoreo de sesión
     */
    startSessionMonitoring() {
        setInterval(() => {
            if (this.isAuthenticated()) {
                // Renovar automáticamente si es necesario
                if (this.shouldRefreshToken()) {
                    this.refreshToken();
                }
            }
        }, this.autoRefreshInterval);
    }

    /**
     * Configurar listeners de visibilidad de página
     */
    setupPageVisibilityListeners() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAuthenticated()) {
                // Verificar token cuando la página vuelva a estar visible
                this.verifyToken().then(valid => {
                    if (!valid) {
                        this.refreshToken();
                    }
                });
            }
        });
    }

    /**
     * Registrar callback para eventos
     */
    on(event, callback) {
        if (this.eventCallbacks[event]) {
            this.eventCallbacks[event].push(callback);
        }
    }

    /**
     * Desregistrar callback de evento
     */
    off(event, callback) {
        if (this.eventCallbacks[event]) {
            const index = this.eventCallbacks[event].indexOf(callback);
            if (index > -1) {
                this.eventCallbacks[event].splice(index, 1);
            }
        }
    }

    /**
     * Emitir evento
     */
    emitEvent(event, data) {
        if (this.eventCallbacks[event]) {
            this.eventCallbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error en callback de evento ${event}:`, error);
                }
            });
        }
    }

    /**
     * Obtener información de la sesión
     */
    getSessionInfo() {
        if (!this.isAuthenticated()) return null;

        try {
            const payload = JSON.parse(atob(this.tokens.accessToken.split('.')[1]));

            return {
                user: this.currentUser,
                tokenIssuedAt: new Date(payload.iat * 1000),
                tokenExpiresAt: new Date(payload.exp * 1000),
                timeUntilExpiry: (payload.exp * 1000) - Date.now(),
                shouldRefresh: this.shouldRefreshToken()
            };
        } catch (error) {
            return {
                user: this.currentUser,
                error: 'No se pudo decodificar token'
            };
        }
    }

    /**
     * Método de debug para desarrolladores
     */
    debug() {
        console.log('🔍 === DEBUG BGE AUTH SYSTEM ===');
        console.log('Autenticado:', this.isAuthenticated());
        console.log('Usuario actual:', this.currentUser);
        console.log('Tokens:', this.tokens);
        console.log('Info de sesión:', this.getSessionInfo());
        console.log('API Base URL:', this.apiBaseUrl);
        console.log('Callbacks registrados:', Object.keys(this.eventCallbacks).map(key => ({
            event: key,
            count: this.eventCallbacks[key].length
        })));
        console.log('================================');
    }
}

// Instancia global del sistema de autenticación
let bgeAuthSystem = null;

/**
 * Obtener instancia del sistema de autenticación
 */
function getBGEAuthSystem() {
    if (!bgeAuthSystem) {
        bgeAuthSystem = new BGEAuthSystem();
    }
    return bgeAuthSystem;
}

// Exponer globalmente
window.BGEAuthSystem = BGEAuthSystem;
window.getBGEAuthSystem = getBGEAuthSystem;

// Auto-inicializar cuando se carga el script
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Auto-inicializando BGE Auth System...');
    getBGEAuthSystem();
});

export { BGEAuthSystem, getBGEAuthSystem };