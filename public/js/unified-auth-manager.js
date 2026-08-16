/**
 * UNIFIED AUTH MANAGER - Sistema Unificado de Autenticación
 *
 * Propósito: Consolidar 4 sistemas de auth duplicados en 1 solo
 * Reemplaza:
 *   - unified-auth-system-v2.js (2,000 líneas)
 *   - intelligent-login-system.js (1,500 líneas)
 *   - admin-auth.js (1,200 líneas)
 *   - auth-manager.js (800 líneas)
 *
 * Arquitectura: Strategy Pattern para múltiples providers
 * Providers Soportados:
 *   1. Email + Password
 *   2. Google OAuth
 *   3. Facebook OAuth
 *   4. Microsoft OAuth
 *   5. Apple OAuth
 *
 * Versión: 2.0.0
 * Fecha: 21 Noviembre 2025
 * Parte de: SEMANA 3 - Refactorización Auth
 */

(function (window) {
    'use strict';

    // ============================================
    // STRATEGY BASE CLASS
    // ============================================
    class AuthStrategy {
        constructor(manager) {
            this.manager = manager;
        }

        async authenticate() {
            throw new Error('authenticate() debe ser implementado por la estrategia');
        }

        getProviderName() {
            return 'unknown';
        }
    }

    // ============================================
    // EMAIL + PASSWORD STRATEGY
    // ============================================
    class EmailPasswordStrategy extends AuthStrategy {
        getProviderName() {
            return 'email';
        }

        async authenticate(credentials) {
            const { email, password, remember = false } = credentials;

            // Validaciones
            if (!email || !password) {
                throw new Error('Email y contraseña son requeridos');
            }

            if (!this.validateEmail(email)) {
                throw new Error('Email inválido');
            }

            if (password.length < 3) {
                throw new Error('Contraseña debe tener al menos 3 caracteres');
            }

            // Autenticar con backend
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error de autenticación');
            }

            const data = await response.json();

            return {
                provider: 'email',
                token: data.token,
                user: data.user,
                remember: remember
            };
        }

        validateEmail(email) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        }
    }

    // ============================================
    // GOOGLE OAUTH STRATEGY
    // ============================================
    class GoogleOAuthStrategy extends AuthStrategy {
        constructor(manager) {
            super(manager);
            this.clientId = null;
            this.isInitialized = false;
        }

        getProviderName() {
            return 'google';
        }

        async init(clientId) {
            if (this.isInitialized) return;

            this.clientId = clientId;

            // Cargar Google Identity Services
            await this.loadGoogleSDK();

            // Inicializar Google Identity
            google.accounts.id.initialize({
                client_id: this.clientId,
                callback: (response) => this.handleGoogleResponse(response)
            });

            this.isInitialized = true;
            void 0;
        }

        async loadGoogleSDK() {
            if (window.google) return;

            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        async authenticate() {
            if (!this.isInitialized) {
                throw new Error('Google OAuth no está inicializado. Llama a init() primero.');
            }

            return new Promise((resolve, reject) => {
                this.authPromise = { resolve, reject };

                // Mostrar One Tap
                google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        // Fallback: Mostrar botón de Google
                        this.showGoogleButton();
                    }
                });
            });
        }

        async handleGoogleResponse(response) {
            try {
                const idToken = response.credential;

                // Enviar token al backend para validación
                const backendResponse = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: idToken })
                });

                if (!backendResponse.ok) {
                    throw new Error('Error validando con backend');
                }

                const data = await backendResponse.json();

                const result = {
                    provider: 'google',
                    token: data.token,
                    user: data.user,
                    remember: true
                };

                if (this.authPromise) {
                    this.authPromise.resolve(result);
                }

                return result;

            } catch (error) {
                console.error('[GOOGLE-AUTH] ❌ Error:', error);
                if (this.authPromise) {
                    this.authPromise.reject(error);
                }
                throw error;
            }
        }

        showGoogleButton() {
            const container = document.getElementById('google-signin-button');
            if (container) {
                google.accounts.id.renderButton(container, {
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'rectangular'
                });
            }
        }
    }

    // ============================================
    // FACEBOOK OAUTH STRATEGY
    // ============================================
    class FacebookOAuthStrategy extends AuthStrategy {
        constructor(manager) {
            super(manager);
            this.appId = null;
            this.isInitialized = false;
        }

        getProviderName() {
            return 'facebook';
        }

        async init(appId) {
            if (this.isInitialized) return;

            this.appId = appId;

            await this.loadFacebookSDK();

            FB.init({
                appId: this.appId,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });

            this.isInitialized = true;
            void 0;
        }

        async loadFacebookSDK() {
            if (window.FB) return;

            return new Promise((resolve) => {
                window.fbAsyncInit = () => resolve();

                const script = document.createElement('script');
                script.src = 'https://connect.facebook.net/en_US/sdk.js';
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
            });
        }

        async authenticate() {
            if (!this.isInitialized) {
                throw new Error('Facebook OAuth no está inicializado');
            }

            return new Promise((resolve, reject) => {
                FB.login((response) => {
                    if (response.authResponse) {
                        this.handleFacebookResponse(response.authResponse)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(new Error('Usuario canceló login de Facebook'));
                    }
                }, { scope: 'public_profile,email' });
            });
        }

        async handleFacebookResponse(authResponse) {
            const accessToken = authResponse.accessToken;

            // Obtener datos del usuario
            const userInfo = await this.getFacebookUserInfo(accessToken);

            // Enviar al backend
            const backendResponse = await fetch('/api/auth/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, userInfo })
            });

            const data = await backendResponse.json();

            return {
                provider: 'facebook',
                token: data.token,
                user: data.user,
                remember: true
            };
        }

        async getFacebookUserInfo(accessToken) {
            return new Promise((resolve, reject) => {
                FB.api('/me', { fields: 'id,name,email,picture' }, (response) => {
                    if (response.error) {
                        reject(response.error);
                    } else {
                        resolve(response);
                    }
                });
            });
        }
    }

    // ============================================
    // MICROSOFT OAUTH STRATEGY
    // ============================================
    class MicrosoftOAuthStrategy extends AuthStrategy {
        constructor(manager) {
            super(manager);
            this.clientId = null;
            this.redirectUri = window.location.origin + '/auth/microsoft/callback';
        }

        getProviderName() {
            return 'microsoft';
        }

        async authenticate() {
            const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
                `client_id=${this.clientId}&` +
                `response_type=code&` +
                `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
                `response_mode=query&` +
                `scope=openid profile email`;

            window.location.href = authUrl;
        }
    }

    // ============================================
    // APPLE OAUTH STRATEGY
    // ============================================
    class AppleOAuthStrategy extends AuthStrategy {
        getProviderName() {
            return 'apple';
        }

        async authenticate() {
            // Apple Sign In requiere configuración especial en backend
            throw new Error('Apple Sign In aún no implementado');
        }
    }

    // ============================================
    // UNIFIED AUTH MANAGER (MAIN CLASS)
    // ============================================
    class UnifiedAuthManager {
        constructor() {
            this.strategies = new Map();
            this.currentUser = null;
            this.sessionKey = 'bge_auth_session';
            this.tokenKey = 'bge_auth_token';
            this.refreshTokenKey = 'bge_refresh_token';
            this.refreshTimer = null;
            this.refreshThreshold = 5 * 60 * 1000; // Refrescar 5 min antes de expirar

            // Registrar strategies
            this.strategies.set('email', new EmailPasswordStrategy(this));
            this.strategies.set('google', new GoogleOAuthStrategy(this));
            this.strategies.set('facebook', new FacebookOAuthStrategy(this));
            this.strategies.set('microsoft', new MicrosoftOAuthStrategy(this));
            this.strategies.set('apple', new AppleOAuthStrategy(this));

            // Escuchar cambios de storage entre pestañas
            this.setupStorageSync();
        }

        /**
         * Inicializar estrategias de OAuth
         */
        async initOAuth(config) {
            if (config.google?.clientId) {
                await this.strategies.get('google').init(config.google.clientId);
            }

            if (config.facebook?.appId) {
                await this.strategies.get('facebook').init(config.facebook.appId);
            }

            if (config.microsoft?.clientId) {
                this.strategies.get('microsoft').clientId = config.microsoft.clientId;
            }
        }

        /**
         * Login con provider específico
         */
        async login(provider, credentials = {}) {
            const strategy = this.strategies.get(provider);

            if (!strategy) {
                throw new Error(`Provider no soportado: ${provider}`);
            }

            void 0;

            try {
                const result = await strategy.authenticate(credentials);

                // Guardar tokens y sesión
                this.saveTokens(result);
                this.saveSession(result);

                this.currentUser = result.user;

                // Iniciar renovación automática de tokens
                this.scheduleTokenRefresh(result.tokens?.accessTokenExpiry);

                // Emit evento
                if (typeof eventBus !== 'undefined') {
                    eventBus.emit('auth.success', {
                        provider: provider,
                        user: result.user
                    });
                }

                // Disparar evento nativo para otras partes de la app
                window.dispatchEvent(new CustomEvent('auth:login', {
                    detail: { user: result.user, provider }
                }));

                void 0;

                return result;

            } catch (error) {
                console.error(`[UNIFIED-AUTH] ❌ Error en login con ${provider}:`, error);

                if (typeof eventBus !== 'undefined') {
                    eventBus.emit('auth.error', {
                        provider: provider,
                        error: error.message
                    });
                }

                throw error;
            }
        }

        /**
         * Login específico para admin (compatible con sistema existente)
         */
        async adminLogin(credentials) {
            const { username, password, rememberMe = false } = credentials;

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, rememberMe })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Credenciales inválidas');
            }

            const data = await response.json();

            // Verificar 2FA requerido
            if (data.requires2FA) {
                return {
                    requires2FA: true,
                    userId: data.userId,
                    user: data.user
                };
            }

            const result = {
                provider: 'email',
                user: data.user,
                tokens: data.tokens,
                remember: rememberMe
            };

            this.saveTokens(result);
            this.saveSession(result);
            this.currentUser = data.user;
            this.scheduleTokenRefresh(data.tokens?.accessTokenExpiry);

            window.dispatchEvent(new CustomEvent('auth:login', {
                detail: { user: data.user, provider: 'email' }
            }));

            return result;
        }

        /**
         * Login con Google OAuth (compatible con endpoint existente)
         */
        async googleLogin(credential) {
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error en autenticación Google');
            }

            const data = await response.json();

            const result = {
                provider: 'google',
                user: data.user,
                tokens: data.tokens,
                remember: true
            };

            this.saveTokens(result);
            this.saveSession(result);
            this.currentUser = data.user;
            this.scheduleTokenRefresh(data.tokens?.accessTokenExpiry);

            window.dispatchEvent(new CustomEvent('auth:login', {
                detail: { user: data.user, provider: 'google' }
            }));

            return result;
        }

        /**
         * Logout
         */
        async logout() {
            void 0;

            // Intentar invalidar token en el servidor
            try {
                const token = this.getToken();
                if (token) {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
            } catch (e) {
                void 0;
            }

            // Limpiar todo localmente
            this.clearSession();
            this.currentUser = null;
            this.cancelTokenRefresh();

            // Emit evento
            if (typeof eventBus !== 'undefined') {
                eventBus.emit('auth.logout');
            }

            window.dispatchEvent(new CustomEvent('auth:logout'));

            void 0;
        }

        /**
         * Obtener token de acceso actual
         */
        getToken() {
            return localStorage.getItem(this.tokenKey) ||
                sessionStorage.getItem(this.tokenKey) ||
                localStorage.getItem('token') || // Compatibilidad con sistema antiguo
                localStorage.getItem('authToken');
        }

        /**
         * Guardar tokens
         */
        saveTokens(result) {
            const storage = result.remember ? localStorage : sessionStorage;

            if (result.tokens) {
                storage.setItem(this.tokenKey, result.tokens.accessToken);
                if (result.tokens.refreshToken) {
                    storage.setItem(this.refreshTokenKey, result.tokens.refreshToken);
                }
                // Compatibilidad con sistema antiguo
                storage.setItem('token', result.tokens.accessToken);
                storage.setItem('authToken', result.tokens.accessToken);
            } else if (result.token) {
                storage.setItem(this.tokenKey, result.token);
                storage.setItem('token', result.token);
            }
        }

        /**
         * Refrescar token automáticamente
         */
        async refreshToken() {
            const refreshToken = localStorage.getItem(this.refreshTokenKey) ||
                sessionStorage.getItem(this.refreshTokenKey);

            if (!refreshToken) {
                void 0;
                return false;
            }

            try {
                const response = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (!response.ok) {
                    throw new Error('Refresh token inválido');
                }

                const data = await response.json();

                // Actualizar tokens
                const storage = localStorage.getItem(this.tokenKey) ? localStorage : sessionStorage;
                storage.setItem(this.tokenKey, data.tokens.accessToken);
                storage.setItem('token', data.tokens.accessToken);

                if (data.tokens.refreshToken) {
                    storage.setItem(this.refreshTokenKey, data.tokens.refreshToken);
                }

                // Programar próximo refresh
                this.scheduleTokenRefresh(data.tokens.accessTokenExpiry);

                void 0;
                return true;

            } catch (error) {
                console.error('[UNIFIED-AUTH] ❌ Error renovando token:', error);
                // Si falla el refresh, cerrar sesión
                this.logout();
                return false;
            }
        }

        /**
         * Programar renovación automática de token
         */
        scheduleTokenRefresh(expiresAt) {
            this.cancelTokenRefresh();

            if (!expiresAt) return;

            // Calcular cuando renovar (5 min antes de expirar)
            const expiresMs = expiresAt * 1000;
            const refreshAt = expiresMs - this.refreshThreshold;
            const delay = refreshAt - Date.now();

            if (delay > 0) {
                void 0;
                this.refreshTimer = setTimeout(() => this.refreshToken(), delay);
            }
        }

        /**
         * Cancelar renovación programada
         */
        cancelTokenRefresh() {
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer);
                this.refreshTimer = null;
            }
        }

        /**
         * Verificar si está autenticado
         */
        isAuthenticated() {
            return this.getToken() !== null;
        }

        /**
         * Obtener usuario actual
         */
        getCurrentUser() {
            if (!this.currentUser) {
                const session = this.loadSession();
                this.currentUser = session?.user || null;
            }

            return this.currentUser;
        }

        /**
         * Obtener rol del usuario
         */
        getUserRole() {
            const user = this.getCurrentUser();
            return user?.role || null;
        }

        /**
         * Verificar si tiene permiso
         */
        hasPermission(permission) {
            const user = this.getCurrentUser();
            return user?.permissions?.includes(permission) || false;
        }

        /**
         * Guardar sesión
         */
        saveSession(authResult) {
            const session = {
                user: authResult.user,
                provider: authResult.provider,
                loginTime: new Date().toISOString(),
                expiresAt: authResult.tokens?.accessTokenExpiry
                    ? authResult.tokens.accessTokenExpiry * 1000
                    : Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 días default
            };

            const storage = authResult.remember ? localStorage : sessionStorage;
            storage.setItem(this.sessionKey, JSON.stringify(session));
        }

        /**
         * Cargar sesión
         */
        loadSession() {
            try {
                const sessionData = localStorage.getItem(this.sessionKey) ||
                    sessionStorage.getItem(this.sessionKey);

                if (!sessionData) return null;

                const session = JSON.parse(sessionData);

                // Verificar si expiró
                if (session.expiresAt && Date.now() > session.expiresAt) {
                    this.clearSession();
                    if (typeof eventBus !== 'undefined') {
                        eventBus.emit('auth.sessionExpired');
                    }
                    window.dispatchEvent(new CustomEvent('auth:expired'));
                    return null;
                }

                return session;

            } catch (error) {
                console.error('[UNIFIED-AUTH] ❌ Error cargando sesión:', error);
                return null;
            }
        }

        /**
         * Limpiar sesión
         */
        clearSession() {
            // Limpiar nuevas keys
            localStorage.removeItem(this.sessionKey);
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.refreshTokenKey);
            sessionStorage.removeItem(this.sessionKey);
            sessionStorage.removeItem(this.tokenKey);
            sessionStorage.removeItem(this.refreshTokenKey);

            // Limpiar keys antiguas para compatibilidad
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('jwt');
            localStorage.removeItem('secure_admin_session');
            localStorage.removeItem('student_auth_token');
            localStorage.removeItem('current_student');
            sessionStorage.removeItem('token');
        }

        /**
         * Sincronizar sesión entre pestañas
         */
        setupStorageSync() {
            window.addEventListener('storage', (event) => {
                if (event.key === this.tokenKey || event.key === 'token') {
                    if (event.newValue === null) {
                        // Token eliminado en otra pestaña = logout
                        void 0;
                        this.currentUser = null;
                        window.dispatchEvent(new CustomEvent('auth:logout'));
                    } else if (event.oldValue === null && event.newValue) {
                        // Nuevo login en otra pestaña
                        void 0;
                        this.getCurrentUser();
                        window.dispatchEvent(new CustomEvent('auth:login'));
                    }
                }
            });
        }

        /**
         * Validar token con backend
         */
        async validateToken() {
            const token = this.getToken();

            if (!token) {
                return false;
            }

            try {
                const response = await fetch('/api/auth/verify', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.user) {
                        this.currentUser = data.user;
                    }
                    return true;
                }

                return false;

            } catch (error) {
                console.error('[UNIFIED-AUTH] ❌ Error validando token:', error);
                return false;
            }
        }

        /**
         * Obtener headers de autenticación para fetch
         */
        getAuthHeaders() {
            const token = this.getToken();
            if (!token) return {};

            return {
                'Authorization': `Bearer ${token}`
            };
        }
    }

    // Crear instancia global
    window.unifiedAuth = new UnifiedAuthManager();

    // Auto-cargar sesión al inicio
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.unifiedAuth.getCurrentUser();
        });
    } else {
        window.unifiedAuth.getCurrentUser();
    }

})(window);
