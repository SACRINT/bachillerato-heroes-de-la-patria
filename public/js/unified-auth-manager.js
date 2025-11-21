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

(function(window) {
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
            console.log('[GOOGLE-AUTH] ✅ Google OAuth inicializado');
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
            console.log('[FACEBOOK-AUTH] ✅ Facebook OAuth inicializado');
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
            this.sessionKey = 'secure_admin_session';

            // Registrar strategies
            this.strategies.set('email', new EmailPasswordStrategy(this));
            this.strategies.set('google', new GoogleOAuthStrategy(this));
            this.strategies.set('facebook', new FacebookOAuthStrategy(this));
            this.strategies.set('microsoft', new MicrosoftOAuthStrategy(this));
            this.strategies.set('apple', new AppleOAuthStrategy(this));

            console.log('[UNIFIED-AUTH] 🔐 Unified Auth Manager creado');
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

            console.log('[UNIFIED-AUTH] ✅ OAuth providers inicializados');
        }

        /**
         * Login con provider específico
         */
        async login(provider, credentials = {}) {
            const strategy = this.strategies.get(provider);

            if (!strategy) {
                throw new Error(`Provider no soportado: ${provider}`);
            }

            console.log(`[UNIFIED-AUTH] 🔑 Autenticando con: ${provider}`);

            try {
                const result = await strategy.authenticate(credentials);

                // Guardar sesión
                this.saveSession(result);

                this.currentUser = result.user;

                // Emit evento
                eventBus.emit('auth.success', {
                    provider: provider,
                    user: result.user
                });

                console.log('[UNIFIED-AUTH] ✅ Login exitoso:', result.user.email || result.user.name);

                return result;

            } catch (error) {
                console.error(`[UNIFIED-AUTH] ❌ Error en login con ${provider}:`, error);

                eventBus.emit('auth.error', {
                    provider: provider,
                    error: error.message
                });

                throw error;
            }
        }

        /**
         * Logout
         */
        async logout() {
            console.log('[UNIFIED-AUTH] 🚪 Cerrando sesión...');

            // Limpiar sesión
            this.clearSession();
            this.currentUser = null;

            // Emit evento
            eventBus.emit('auth.logout');

            console.log('[UNIFIED-AUTH] ✅ Sesión cerrada');
        }

        /**
         * Verificar si está autenticado
         */
        isAuthenticated() {
            return this.currentUser !== null || this.loadSession() !== null;
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
         * Guardar sesión
         */
        saveSession(authResult) {
            const session = {
                token: authResult.token,
                user: authResult.user,
                provider: authResult.provider,
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 días
            };

            const storage = authResult.remember ? localStorage : sessionStorage;
            storage.setItem(this.sessionKey, JSON.stringify(session));

            console.log('[UNIFIED-AUTH] 💾 Sesión guardada');
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
                    eventBus.emit('auth.sessionExpired');
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
            localStorage.removeItem(this.sessionKey);
            sessionStorage.removeItem(this.sessionKey);
        }

        /**
         * Validar token con backend
         */
        async validateToken() {
            const session = this.loadSession();

            if (!session || !session.token) {
                return false;
            }

            try {
                const response = await fetch('/api/auth/validate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.token}`
                    }
                });

                return response.ok;

            } catch (error) {
                console.error('[UNIFIED-AUTH] ❌ Error validando token:', error);
                return false;
            }
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
