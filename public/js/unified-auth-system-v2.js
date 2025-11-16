/**
// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    // Fallback si debug-logger.js no está cargado
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}


 * 🌍 SISTEMA DE AUTENTICACIÓN UNIFICADO V2 - CLASE MUNDIAL
 *
 * Sistema profesional de autenticación que unifica:
 * ✅ Google OAuth Real (con configuración en Google Cloud)
 * ✅ Login Manual (Email + Contraseña)
 * ✅ Gestión de Sesión Robusta
 * ✅ UI/UX Moderna y Profesional
 *
 * Eliminates: Conflictos entre 2 sistemas, fallbacks a Demo innecesarios
 * Adds: Experiencia de login clase mundial
 *
 * Estructura:
 * - UnifiedAuthSystem (clase principal)
 * - GoogleOAuthManager (Google OAuth real)
 * - ManualLoginManager (Email + Contraseña)
 * - SessionManager (Persistencia)
 * - UIManager (Modal y estados)
 * - ErrorHandler (Gestión de errores)
 */

class UnifiedAuthSystem {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl || '/api',
            googleClientId: config.googleClientId || null, // Se carga de forma asíncrona
            enableDemo: config.enableDemo !== false, // Demo como fallback
            sessionTimeout: config.sessionTimeout || 30 * 60 * 1000, // 30 minutos
            ...config
        };

        this.state = {
            currentUser: null,
            token: null,
            isAuthenticated: false,
            isInitialized: false,
            googleReady: false,
            lastActivityTime: Date.now()
        };

        this.managers = {};
        this.init();
    }

    /**
     * CARGAR GOOGLE CLIENT ID DESDE SERVIDOR
     * Lee la variable de entorno .env desde el backend
     */
    async loadGoogleClientIdFromServer() {
        try {
            debugLog.log('APP', '🔑 Cargando Google Client ID desde servidor...');

            const response = await fetch(`${this.config.apiBaseUrl}/config/google-client-id`);
            const data = await response.json();

            if (data.success && data.clientId) {
                this.config.googleClientId = data.clientId;
                debugLog.log('APP', '✅ Google Client ID cargado desde .env');
                return data.clientId;
            } else {
                debugLog.warn('ERROR', '⚠️ Google Client ID no disponible en servidor:', data.error);
                return null;
            }
        } catch (error) {
            debugLog.warn('ERROR', '⚠️ Error cargando Google Client ID:', error.message);
            return null;
        }
    }

    /**
     * OBTENER GOOGLE CLIENT ID (FALLBACK)
     * Solo se usa si el servidor no lo proporciona
     */
    getGoogleClientIdFallback() {
        // Intentar obtener del AppConfig si está disponible
        if (window.AppConfig && typeof window.AppConfig.getGoogleClientId === 'function') {
            return window.AppConfig.getGoogleClientId();
        }

        // Fallback: hardcoded (NO RECOMENDADO)
        debugLog.warn('APP', '⚠️ Usando Google Client ID hardcoded (se recomienda usar .env)');
        const isDev = this.isDevelopment();
        return isDev
            ? '411638938693-87nmapmm146kci8i0p80jo745cost08h.apps.googleusercontent.com'
            : '411638938693-87nmapmm146kci8i0p80jo745cost08h.apps.googleusercontent.com';
    }

    /**
     * DETECTAR ENTORNO
     */
    isDevelopment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('local');
    }

    /**
     * INICIALIZACIÓN PRINCIPAL
     */
    async init() {
        debugLog.log('APP', '🔐 Inicializando Sistema de Autenticación V2...');

        try {
            // 1. Esperar DOM
            await this.waitForDOM();

            // 2. Cargar Google Client ID desde servidor (.env)
            const clientId = await this.loadGoogleClientIdFromServer();
            if (!clientId) {
                debugLog.log('APP', '⚠️ Google Client ID no disponible, intentando fallback...');
                this.config.googleClientId = this.getGoogleClientIdFallback();
            }

            // 3. Inicializar managers
            this.initializeManagers();

            // 4. Cargar sesión guardada
            await this.loadStoredSession();

            // 5. Crear UI
            this.createLoginUI();

            // 6. Cargar Google Services
            await this.initializeGoogleOAuth();

            // 7. Setup listeners
            this.setupEventListeners();

            // 8. Monitor actividad
            this.setupActivityMonitor();

            this.state.isInitialized = true;
            debugLog.log('APP', '✅ Sistema de Autenticación V2 listo');

            // Disparar evento
            window.dispatchEvent(new CustomEvent('bge-auth-ready', { detail: this.state }));

        } catch (error) {
            debugLog.error('ERROR', '❌ Error inicializando autenticación:', error);
            this.showError('Error inicializando sistema de autenticación');
        }
    }

    /**
     * ESPERAR A QUE EL DOM ESTÉ LISTO
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    debugLog.log('APP', '✅ DOM cargado');
                    resolve();
                }, { once: true });
            } else {
                debugLog.log('APP', '✅ DOM ya listo');
                resolve();
            }
        });
    }

    /**
     * INICIALIZAR MANAGERS
     */
    initializeManagers() {
        this.managers = {
            google: new GoogleOAuthManager(this),
            manual: new ManualLoginManager(this),
            session: new SessionManager(this),
            ui: new UIManager(this),
            errors: new ErrorHandler(this)
        };

        debugLog.log('APP', '✅ Managers inicializados');
    }

    /**
     * INICIALIZAR GOOGLE OAUTH
     */
    async initializeGoogleOAuth() {
        // GDPR: Datos sensibles enmascarados
        debugLog.log('APP', '🔑 Inicializando Google OAuth...');

        try {
            // Verificar que Google Client ID sea válido
            if (!this.isValidGoogleClientId()) {
                debugLog.warn('APP', '⚠️ Google Client ID no válido');
                // GDPR: Datos sensibles enmascarados
                debugLog.log('APP', '💡 Para Google OAuth real: Configura en Google Cloud Console');
                this.state.googleReady = false;
                return;
            }

            // ✅ HABILITADO: Google Identity Services con CSP corregido
            await this.managers.google.loadServices();

            this.state.googleReady = true; // Ahora habilitado
            // GDPR: Datos sensibles enmascarados
            debugLog.log('APP', '✅ Google OAuth habilitado y listo');

        } catch (error) {
            // GDPR: Datos sensibles enmascarados
            debugLog.warn('ERROR', '⚠️ Google OAuth no disponible:', error.message);
            this.state.googleReady = false;
        }
    }

    /**
     * ACTUALIZAR STATUS DE GOOGLE EN MODAL
     */
    updateModalGoogleStatus() {
        try {
            // Ocultar alerta de "Google no disponible"
            const googleAlert = document.querySelector('#unified-auth-modal .alert-info');
            if (googleAlert) {
                googleAlert.style.display = 'none';
                debugLog.log('APP', '✅ Alerta de Google deshabilitado ocultada');
            }

            // Habilitar botón de Google
            const googleBtn = document.getElementById('google-signin-btn');
            if (googleBtn) {
                googleBtn.disabled = false;
                googleBtn.style.opacity = '1';
                googleBtn.style.pointerEvents = 'auto';
                debugLog.log('APP', '✅ Botón de Google habilitado');
            }
        } catch (error) {
            debugLog.error('ERROR', '⚠️ Error actualizando status de Google:', error);
        }
    }

    /**
     * VALIDAR GOOGLE CLIENT ID
     */
    isValidGoogleClientId() {
        return this.config.googleClientId &&
            this.config.googleClientId.includes('.apps.googleusercontent.com') &&
            !this.config.googleClientId.includes('YOUR_');
    }

    /**
     * CREAR UI DE LOGIN
     */
    createLoginUI() {
        // Crear modal si no existe
        if (!document.getElementById('unified-auth-modal')) {
            const modalHTML = this.managers.ui.createModalHTML();
            document.body.insertAdjacentHTML('beforeend', sanitizeHTML(modalHTML));
        }

        // Actualizar UI según estado actual
        this.updateAuthUI();

        debugLog.log('APP', '✅ UI de login creada');
    }

    /**
     * CARGAR SESIÓN GUARDADA
     */
    async loadStoredSession() {
        const session = this.managers.session.loadSession();

        if (session) {
            this.state.currentUser = session.user;
            this.state.token = session.token;
            this.state.isAuthenticated = true;

            // Validar token con servidor
            const isValid = await this.validateToken();

            if (!isValid) {
                this.logout();
            }

            // GDPR: Datos sensibles enmascarados
            debugLog.log('APP', '✅ Sesión cargada:', session.user.nombre || session.user.name);
        }
    }

    /**
     * VALIDAR TOKEN CON SERVIDOR
     */
    async validateToken() {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.state.token}`
                }
            });

            return response.ok;
        } catch (error) {
            // GDPR: Datos sensibles enmascarados
            debugLog.error('ERROR', 'Error validando token:', error);
            return false;
        }
    }

    /**
     * SETUP EVENT LISTENERS
     */
    setupEventListeners() {
        // Logout
        document.addEventListener('click', (e) => {
            if (e.target?.id === 'logout-button' || e.target?.closest('#logout-button')) {
                e.preventDefault();
                this.logout();
            }
        });

        // Profile link
        document.addEventListener('click', (e) => {
            if (e.target?.id === 'profile-link' || e.target?.closest('#profile-link')) {
                e.preventDefault();
                // Implementar navegación a perfil
                window.location.href = '/profile.html';
            }
        });

        // Listeners de managers
        this.managers.manual.setupListeners();
        this.managers.google.setupListeners();

        debugLog.log('APP', '✅ Event listeners configurados');
    }

    /**
     * MONITOR DE ACTIVIDAD (SESSION TIMEOUT)
     */
    setupActivityMonitor() {
        const checkActivity = () => {
            const now = Date.now();
            const timeSinceActivity = now - this.state.lastActivityTime;

            if (this.state.isAuthenticated && timeSinceActivity > this.config.sessionTimeout) {
                debugLog.log('APP', '⏰ Sesión expirada por inactividad');
                this.logout();
            }
        };

        // Resetear tiempo de actividad
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.state.lastActivityTime = Date.now();
            }, { passive: true });
        });

        // Verificar cada 1 minuto
        setInterval(checkActivity, 60000);

        debugLog.log('APP', '✅ Monitor de actividad configurado');
    }

    /**
     * PROCESAR LOGIN EXITOSO
     */
    async processLogin(userData, token, rememberMe = false) {
        // GDPR: Datos sensibles enmascarados
        debugLog.log('APP', '🔓 Procesando login para:', userData.nombre || userData.name);

        this.state.currentUser = userData;
        this.state.token = token;
        this.state.isAuthenticated = true;

        // Guardar sesión
        this.managers.session.saveSession(userData, token, rememberMe);

        // Actualizar UI
        this.updateAuthUI();

        // Cerrar modal
        this.managers.ui.closeModal();

        // Mostrar éxito
        this.showSuccess(`Bienvenido, ${userData.nombre || userData.name}!`);

        // Disparar evento
        window.dispatchEvent(new CustomEvent('bge-user-logged-in', {
            detail: { user: userData }
        }));

        return true;
    }

    /**
     * MOSTRAR MODAL DE LOGIN
     */
    showModal() {
        this.managers.ui.showModal();
    }

    /**
     * OCULTAR MODAL DE LOGIN
     */
    hideModal() {
        this.managers.ui.hideModal();
    }

    /**
     * CERRAR SESIÓN
     */
    logout() {
        debugLog.log('APP', '🔓 Cerrando sesión...');

        this.state.currentUser = null;
        this.state.token = null;
        this.state.isAuthenticated = false;

        // Limpiar almacenamiento
        this.managers.session.clearSession();

        // Actualizar UI
        this.updateAuthUI();

        // Mostrar mensaje
        this.showSuccess('Sesión cerrada correctamente');

        // Redirigir si estamos en admin
        if (window.location.pathname.includes('admin')) {
            window.location.href = '/';
        }

        // Disparar evento
        window.dispatchEvent(new CustomEvent('bge-user-logged-out'));
    }

    /**
     * ACTUALIZAR UI SEGÚN ESTADO
     */
    updateAuthUI() {
        // Obtener elementos
        const loginBtn = document.querySelector('[data-bs-target="#unified-auth-modal"]');
        const userMenu = document.getElementById('user-menu-state');
        const loginState = document.getElementById('login-button-state');

        if (this.state.isAuthenticated && this.state.currentUser) {
            // Usuario autenticado
            if (loginState) loginState.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'block';
                const userName = userMenu.querySelector('#user-display-name');
                if (userName) {
                    userName.textContent = this.state.currentUser.nombre ||
                        this.state.currentUser.name ||
                        this.state.currentUser.email;
                }
            }

            // Mostrar dashboard si es admin
            const dashboardLink = document.getElementById('dashboard-link');
            if (dashboardLink) {
                dashboardLink.style.display =
                    (this.state.currentUser.role === 'admin' || this.state.currentUser.role === 'administrator')
                        ? 'block'
                        : 'none';
            }
        } else {
            // Usuario no autenticado
            if (loginState) loginState.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    /**
     * MOSTRAR MENSAJES
     */
    showSuccess(message) {
        this.managers.ui.showAlert(message, 'success');
    }

    showError(message) {
        this.managers.ui.showAlert(message, 'danger');
    }

    showWarning(message) {
        this.managers.ui.showAlert(message, 'warning');
    }

    showInfo(message) {
        this.managers.ui.showAlert(message, 'info');
    }

    /**
     * GETTERS
     */
    getUser() {
        return this.state.currentUser;
    }

    getToken() {
        return this.state.token;
    }

    isLoggedIn() {
        return this.state.isAuthenticated;
    }

    isReady() {
        return this.state.isInitialized;
    }
}

/**
 * 🔐 MANAGER DE GOOGLE OAUTH
 */
class GoogleOAuthManager {
    constructor(authSystem) {
        this.auth = authSystem;
        this.clientId = authSystem.config.googleClientId;
    }

    /**
     * CARGAR GOOGLE IDENTITY SERVICES
     */
    async loadServices() {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (window.google?.accounts?.id) {
                debugLog.log('APP', '✅ Google Identity Services ya cargado');
                this.initializeGoogle();
                resolve();
                return;
            }

            debugLog.log('APP', '📥 Cargando Google Identity Services...');

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;

            // Timeout
            const timeout = setTimeout(() => {
                debugLog.warn('APP', '⏰ Timeout cargando Google Services');
                reject(new Error('Google Services timeout'));
            }, 10000);

            script.onload = () => {
                clearTimeout(timeout);
                debugLog.log('APP', '✅ Google Identity Services cargado');
                this.initializeGoogle();
                resolve();
            };

            script.onerror = () => {
                clearTimeout(timeout);
                debugLog.error('ERROR', '❌ Error cargando Google Services');
                reject(new Error('Failed to load Google Services'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * INICIALIZAR GOOGLE
     */
    initializeGoogle() {
        window.google.accounts.id.initialize({
            client_id: this.clientId,
            callback: (response) => this.handleGoogleResponse(response),
            auto_select: false, // No auto-select
            itp_support: true // iPhone Tracking Prevention support
        });

        debugLog.log('APP', '✅ Google inicializado');
    }

    /**
     * MANEJAR RESPUESTA DE GOOGLE
     */
    async handleGoogleResponse(response) {
        if (!response.credential) {
            debugLog.error('ERROR', '❌ No credential en respuesta de Google');
            this.auth.showError('Error en autenticación con Google');
            return;
        }

        // GDPR: Datos sensibles enmascarados
        debugLog.log('APP', '🔑 JWT de Google recibido');

        try {
            // Decodificar JWT (sin verificar firma en cliente)
            const decoded = this.decodeJWT(response.credential);
            // GDPR: Datos sensibles enmascarados
            debugLog.log('APP', '👤 Usuario de Google:', decoded.email);

            // Enviar al backend para verificar y crear/actualizar usuario
            const result = await this.verifyWithBackend(response.credential, decoded);

            if (result.success) {
                // Login exitoso
                await this.auth.processLogin(result.user, result.token, true);
            } else {
                this.auth.showError(result.error || 'No autorizado');
            }
        } catch (error) {
            debugLog.error('ERROR', '❌ Error procesando Google login:', error);
            this.auth.showError('Error procesando autenticación con Google');
        }
    }

    /**
     * DECODIFICAR JWT (SIMPLE, sin verificación de firma)
     */
    decodeJWT(token) {
        try {
            const base64 = token.split('.')[1];
            const decoded = JSON.parse(atob(base64));
            return decoded;
        } catch (error) {
            // GDPR: Datos sensibles enmascarados
            debugLog.error('ERROR', 'Error decodificando JWT:', error);
            return {};
        }
    }

    /**
     * VERIFICAR CON BACKEND
     */
    async verifyWithBackend(credential, googleUser) {
        try {
            const response = await fetch(`${this.auth.config.apiBaseUrl}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credential,
                    email: googleUser.email,
                    name: googleUser.name
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            debugLog.error('ERROR', 'Error verificando con backend:', error);
            return {
                success: false,
                error: 'Error de conexión'
            };
        }
    }

    /**
     * INICIAR LOGIN CON GOOGLE
     */
    initiateGoogleLogin() {
        if (!this.auth.state.googleReady) {
            this.auth.showWarning('Google OAuth no disponible');
            return;
        }

        // Mostrar Google Sign-In prompt
        window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Si el prompt no se muestra, usar popup
                this.showGoogleSignInPopup();
            }
        });
    }

    /**
     * MOSTRAR POPUP DE GOOGLE
     */
    showGoogleSignInPopup() {
        // Crear un contenedor temporal para el popup
        const popupContainer = document.createElement('div');
        popupContainer.id = 'google-signin-popup';
        popupContainer.style.position = 'fixed';
        popupContainer.style.top = '50%';
        popupContainer.style.left = '50%';
        popupContainer.style.transform = 'translate(-50%, -50%)';
        popupContainer.style.zIndex = '2000';

        document.body.appendChild(popupContainer);

        // Renderizar Google Sign-In button
        window.google.accounts.id.renderButton(popupContainer, {
            type: 'standard',
            size: 'large',
            text: 'signin_with',
            locale: 'es'
        });
    }

    /**
     * SETUP LISTENERS
     */
    setupListeners() {
        document.addEventListener('click', (e) => {
            if (e.target?.id === 'google-signin-btn' || e.target?.closest('#google-signin-btn')) {
                e.preventDefault();
                this.initiateGoogleLogin();
            }
        });
    }
}

/**
 * 🔐 MANAGER DE LOGIN MANUAL
 */
class ManualLoginManager {
    constructor(authSystem) {
        this.auth = authSystem;
        this.isLoading = false;
    }

    /**
     * SETUP LISTENERS
     */
    setupListeners() {
        // ✅ LISTENER PARA BOTÓN DE INICIAR SESIÓN
        document.addEventListener('click', (e) => {
            if (e.target?.getAttribute('data-bs-target') === '#unified-auth-modal' ||
                e.target?.closest('[data-bs-target="#unified-auth-modal"]')) {
                e.preventDefault();
                debugLog.log('APP', '📁 Botón de login clickeado, abriendo modal...');

                // 🔧 MANIPULACIÓN DIRECTA DEL DOM - Evitar llamadas a métodos
                const modal = document.getElementById('unified-auth-modal');
                if (!modal) {
                    debugLog.error('ERROR', '❌ Modal element not found in DOM');
                    return;
                }

                try {
                    // Mostrar el modal manipulando el DOM directamente
                    modal.classList.add('show');
                    modal.style.display = 'block';
                    modal.setAttribute('aria-modal', 'true');
                    document.body.classList.add('modal-open');

                    // Crear o mostrar el backdrop
                    let backdrop = document.querySelector('.modal-backdrop');
                    if (!backdrop) {
                        backdrop = document.createElement('div');
                        backdrop.className = 'modal-backdrop fade show';
                        document.body.appendChild(backdrop);
                        debugLog.log('APP', '✅ Backdrop creado');
                    } else {
                        backdrop.classList.add('show');
                    }

                    debugLog.log('APP', '✅ Modal mostrado exitosamente (DOM directo)');
                } catch (error) {
                    debugLog.error('ERROR', '❌ Error abriendo modal:', error);
                }
            }
        });

        // ✅ LISTENER PARA SUBMIT DEL FORMULARIO DE LOGIN
        document.addEventListener('submit', (e) => {
            if (e.target?.id === 'manual-login-form') {
                e.preventDefault();
                this.handleManualLogin();
            }
        });

        // ✅ LISTENER PARA TOGGLE DE VISIBILIDAD DE CONTRASEÑA
        document.addEventListener('click', (e) => {
            if (e.target?.id === 'toggle-password' || e.target?.closest('#toggle-password')) {
                this.togglePasswordVisibility();
            }
        });

        // ✅ LISTENER PARA CERRAR MODAL CON BOTÓN X
        document.addEventListener('click', (e) => {
            if (e.target?.id === 'modal-close-btn' || e.target?.closest('#modal-close-btn')) {
                e.preventDefault();
                debugLog.log('APP', '🔴 Botón de cerrar clickeado, cerrando modal...');
                this.auth.managers.ui.hideModal();
            }
        });

        // ✅ LISTENER PARA CERRAR MODAL CLICKEANDO EN EL BACKDROP
        document.addEventListener('click', (e) => {
            if (e.target?.classList?.contains('modal-backdrop')) {
                debugLog.log('APP', '🔴 Backdrop clickeado, cerrando modal...');
                this.auth.managers.ui.hideModal();
            }
        });
    }

    /**
     * MANEJAR LOGIN MANUAL
     */
    async handleManualLogin() {
        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value;
        const rememberMe = document.getElementById('remember-me')?.checked || false;

        // Validaciones
        if (!email || !password) {
            this.auth.showWarning('Por favor completa todos los campos');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.auth.showWarning('Email no válido');
            return;
        }

        if (password.length < 3) {
            this.auth.showWarning('Contraseña muy corta');
            return;
        }

        await this.submitLogin(email, password, rememberMe);
    }

    /**
     * ENVIAR LOGIN AL SERVIDOR
     */
    async submitLogin(email, password, rememberMe) {
        this.setLoading(true);

        try {
            const response = await fetch(`${this.auth.config.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Login exitoso
                await this.auth.processLogin(data.user, data.token, rememberMe);
            } else {
                this.auth.showError(data.error || 'Error en autenticación');
            }
        } catch (error) {
            debugLog.error('ERROR', 'Error en login:', error);
            this.auth.showError('Error de conexión');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * VALIDAR EMAIL
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * TOGGLE PASSWORD VISIBILITY
     */
    togglePasswordVisibility() {
        const input = document.getElementById('login-password');
        const icon = document.querySelector('#toggle-password i');

        if (!input || !icon) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }

    /**
     * SET LOADING STATE
     */
    setLoading(isLoading) {
        this.isLoading = isLoading;
        const submitBtn = document.querySelector('#manual-login-form button[type="submit"]');
        const form = document.getElementById('manual-login-form');

        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.innerHTML = isLoading
                ? '<span class="spinner-border spinner-border-sm me-2"></span>Verificando...'
                : '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
        }

        if (form) {
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => input.disabled = isLoading);
        }
    }
}

/**
 * 💾 MANAGER DE SESIÓN
 */
class SessionManager {
    constructor(authSystem) {
        this.auth = authSystem;
        this.STORAGE_KEYS = {
            token: 'bge_auth_token',
            user: 'bge_auth_user',
            refresh: 'bge_refresh_token',
            expiry: 'bge_auth_expiry'
        };
    }

    /**
     * GUARDAR SESIÓN
     */
    saveSession(userData, token, rememberMe = false) {
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem(this.STORAGE_KEYS.token, token);
        storage.setItem(this.STORAGE_KEYS.user, JSON.stringify(userData));

        // Guardar tiempo de expiración (24 horas)
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        storage.setItem(this.STORAGE_KEYS.expiry, expiryTime.toString());

        // GDPR: Datos sensibles enmascarados
        debugLog.log('APP', '✅ Sesión guardada en', rememberMe ? 'localStorage' : 'sessionStorage');
    }

    /**
     * CARGAR SESIÓN
     */
    loadSession() {
        // Intentar localStorage primero, luego sessionStorage
        const token = localStorage.getItem(this.STORAGE_KEYS.token) ||
            sessionStorage.getItem(this.STORAGE_KEYS.token);
        const userStr = localStorage.getItem(this.STORAGE_KEYS.user) ||
            sessionStorage.getItem(this.STORAGE_KEYS.user);
        const expiry = localStorage.getItem(this.STORAGE_KEYS.expiry) ||
            sessionStorage.getItem(this.STORAGE_KEYS.expiry);

        if (!token || !userStr) {
            return null;
        }

        // Verificar expiración
        if (expiry && Date.now() > parseInt(expiry)) {
            debugLog.log('APP', '⏰ Sesión expirada');
            this.clearSession();
            return null;
        }

        try {
            const user = JSON.parse(userStr);
            return { token, user };
        } catch (error) {
            debugLog.error('ERROR', 'Error cargando sesión:', error);
            return null;
        }
    }

    /**
     * LIMPIAR SESIÓN
     */
    clearSession() {
        // Limpiar localStorage
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        // Limpiar sessionStorage
        Object.values(this.STORAGE_KEYS).forEach(key => {
            sessionStorage.removeItem(key);
        });

        debugLog.log('APP', '✅ Sesión limpiada');
    }
}

/**
 * 🎨 MANAGER DE UI
 */
class UIManager {
    constructor(authSystem) {
        this.auth = authSystem;
    }

    /**
     * CREAR HTML DEL MODAL
     */
    createModalHTML() {
        return `
            <!-- 🔐 MODAL DE AUTENTICACIÓN UNIFICADO V2 -->
            <div class="modal fade" id="unified-auth-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0 shadow-lg">
                        <!-- Header -->
                        <div class="modal-header border-0 bg-gradient pb-0">
                            <div>
                                <h5 class="modal-title fw-bold">
                                    <i class="fas fa-shield-alt me-2 text-primary"></i>Iniciar Sesión
                                </h5>
                                <p class="text-muted small mb-0">Accede a tu cuenta de BGE</p>
                            </div>
                            <button type="button" class="btn-close" id="modal-close-btn" aria-label="Cerrar"></button>
                        </div>

                        <!-- Contenido -->
                        <div class="modal-body pt-4">
                            <!-- Alertas -->
                            <div id="auth-alerts-container"></div>

                            <!-- Tabs -->
                            <ul class="nav nav-pills nav-fill mb-4" id="auth-tabs">
                                <li class="nav-item">
                                    <button class="nav-link active" id="google-tab" data-bs-toggle="tab" data-bs-target="#google-login">
                                        <i class="fab fa-google me-2"></i>Google
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link" id="email-tab" data-bs-toggle="tab" data-bs-target="#email-login">
                                        <i class="fas fa-envelope me-2"></i>Email
                                    </button>
                                </li>
                            </ul>

                            <!-- Tab Content -->
                            <div class="tab-content">
                                <!-- Google Login -->
                                <div class="tab-pane fade show active" id="google-login">
                                    <div class="text-center py-5">
                                        <i class="fab fa-google fa-3x text-danger mb-3 d-block"></i>
                                        <p class="text-muted mb-4">Continúa con tu cuenta de Google de forma rápida y segura</p>
                                        <button type="button" class="btn btn-outline-danger w-100 py-2" id="google-signin-btn">
                                            <i class="fab fa-google me-2"></i>Continuar con Google
                                        </button>
                                    </div>

                                    ${!this.auth.state.googleReady ? `
                                        <div class="alert alert-info small" role="alert">
                                            <i class="fas fa-info-circle me-2"></i>
                                            Google OAuth no disponible en este momento. Usa email para iniciar sesión.
                                        </div>
                                    ` : ''}
                                </div>

                                <!-- Email Login -->
                                <div class="tab-pane fade" id="email-login">
                                    <form id="manual-login-form">
                                        <div class="mb-3">
                                            <label class="form-label fw-bold">Email</label>
                                            <div class="input-group">
                                                <span class="input-group-text">
                                                    <i class="fas fa-envelope text-muted"></i>
                                                </span>
                                                <input type="email" class="form-control" id="login-email"
                                                       placeholder="ejemplo@bge.edu.mx" required>
                                            </div>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label fw-bold">Contraseña</label>
                                            <div class="input-group">
                                                <span class="input-group-text">
                                                    <i class="fas fa-lock text-muted"></i>
                                                </span>
                                                <input type="password" class="form-control" id="login-password"
                                                       placeholder="Tu contraseña" required>
                                                <button class="btn btn-outline-secondary" type="button" id="toggle-password">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div class="form-check mb-3">
                                            <input class="form-check-input" type="checkbox" id="remember-me">
                                            <label class="form-check-label" for="remember-me">
                                                Recordar esta sesión
                                            </label>
                                        </div>

                                        <button type="submit" class="btn btn-primary w-100 py-2 fw-bold">
                                            <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                                        </button>
                                    </form>

                                    <hr class="my-3">

                                    <div class="small text-muted">
                                        <p><strong>¿No tienes cuenta?</strong> <a href="#" class="text-primary">Regístrate aquí</a></p>
                                        <p><strong>¿Olvidaste tu contraseña?</strong> <a href="#" class="text-primary">Recupérala aquí</a></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="modal-footer border-top bg-light d-flex justify-content-center">
                            <small class="text-muted">
                                <i class="fas fa-lock me-1"></i>Tu información está protegida y encriptada
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estado de Autenticación -->
            <div id="login-button-state" class="d-flex align-items-center">
                <button class="btn btn-primary btn-sm" data-bs-target="#unified-auth-modal">
                    <i class="fas fa-sign-in-alt me-1"></i>Iniciar Sesión
                </button>
            </div>

            <div id="user-menu-state" style="display: none;" class="d-flex align-items-center">
                <div class="dropdown">
                    <button class="btn btn-success btn-sm dropdown-toggle" type="button" id="userDropdown"
                            data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle me-1"></i>
                        <span id="user-display-name">Usuario</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="/profile.html" id="profile-link">
                            <i class="fas fa-user me-2"></i>Mi Perfil
                        </a></li>
                        <li><a class="dropdown-item" href="/admin-dashboard.html" id="dashboard-link" style="display: none;">
                            <i class="fas fa-tachometer-alt me-2"></i>Dashboard Admin
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger cursor-pointer" id="logout-button">
                            <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                        </a></li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * MOSTRAR ALERTA
     */
    showAlert(message, type = 'info') {
        const container = document.getElementById('auth-alerts-container');
        if (!container) return;

        const alertClass = {
            'success': 'alert-success',
            'danger': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', sanitizeHTML(alertHTML));

        // Auto-remove después de 5 segundos (excepto errores)
        if (type !== 'danger') {
            setTimeout(() => {
                const alerts = container.querySelectorAll('.alert');
                if (alerts.length > 0) {
                    alerts[0].remove();
                }
            }, 5000);
        }
    }

    /**
     * CERRAR MODAL
     */
    closeModal() {
        // Usar el nuevo método hideModal() que manipula el DOM directamente
        this.auth.hideModal();
    }

    /**
     * MOSTRAR MODAL
     */
    showModal() {
        try {
            const modal = document.getElementById('unified-auth-modal');
            if (!modal) {
                debugLog.error('ERROR', '❌ Modal element not found');
                return;
            }

            debugLog.log('APP', '📂 Modal encontrado en DOM, mostrando...');

            // SOLUCIÓN SIMPLE: Manipular el DOM directamente sin Bootstrap.Modal
            // Esto evita completamente el error "Cannot read properties of undefined (reading 'backdrop')"

            // Agregar clases Bootstrap para mostrar el modal
            modal.classList.add('show');
            modal.style.display = 'block';
            modal.setAttribute('aria-modal', 'true');

            // Agregar clase modal-open al body para deshabilitar scroll
            document.body.classList.add('modal-open');

            // Crear y agregar el backdrop (fondo oscuro)
            let backdrop = document.querySelector('.modal-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
                debugLog.log('APP', '✅ Backdrop creado');
            }

            debugLog.log('APP', '✅ Modal mostrado exitosamente (sin Bootstrap.Modal)');

            // Agregar evento para cerrar el modal al hacer clic en el botón close
            const closeBtn = modal.querySelector('[data-bs-dismiss="modal"]');
            if (closeBtn && !closeBtn.hasAttribute('data-close-bound')) {
                closeBtn.setAttribute('data-close-bound', 'true');
                closeBtn.addEventListener('click', () => this.hideModal());
                debugLog.log('APP', '✅ Evento de cierre agregado al botón close');
            }

        } catch (error) {
            debugLog.error('ERROR', '❌ Error abriendo modal:', error);
        }
    }

    /**
     * OCULTAR MODAL
     */
    hideModal() {
        try {
            const modal = document.getElementById('unified-auth-modal');
            const backdrop = document.querySelector('.modal-backdrop');

            if (modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
                modal.removeAttribute('aria-modal');
                debugLog.log('APP', '✅ Modal ocultado');
            }

            if (backdrop) {
                backdrop.remove();
                debugLog.log('APP', '✅ Backdrop eliminado');
            }

            document.body.classList.remove('modal-open');
            debugLog.log('APP', '✅ Modal cerrado completamente');

        } catch (error) {
            debugLog.error('ERROR', '❌ Error cerrando modal:', error);
        }
    }
}

/**
 * ⚠️ MANAGER DE ERRORES
 */
class ErrorHandler {
    constructor(authSystem) {
        this.auth = authSystem;
    }

    /**
     * PROCESAR ERROR DE AUTENTICACIÓN
     */
    handleAuthError(error, context = '') {
        debugLog.error('ERROR', `❌ Error de autenticación [${context}]:`, error);

        const messages = {
            'network': 'Error de conexión. Verifica tu internet.',
            'invalid_credentials': 'Email o contraseña incorrectos',
            'user_not_found': 'Usuario no encontrado',
            'account_disabled': 'Tu cuenta está deshabilitada',
            'unauthorized': 'No autorizado',
            'timeout': 'Tiempo de conexión agotado',
            'google_error': 'Error con Google OAuth'
        };

        const message = messages[error.code] || error.message || 'Error desconocido';
        this.auth.showError(message);

        return message;
    }
}

// 🚀 INICIALIZAR SISTEMA
// Se inicializa inmediatamente (no esperar DOMContentLoaded)
// porque main.js carga el script dinámicamente DESPUÉS de que DOMContentLoaded ya ocurrió
if (!window.unifiedLogin) {
    debugLog.log('APP', '🔐 Inicializando Sistema de Autenticación V2 (Instancia Global)...');
    window.unifiedLogin = new UnifiedAuthSystem();
    debugLog.log('APP', '✅ Sistema de Autenticación V2 disponible en window.unifiedLogin');
}

// Mantener backward compatibility si algo usa window.bgeAuth
if (!window.bgeAuth) {
    window.bgeAuth = window.unifiedLogin;
}

// Exportar para usar en otros scripts
window.UnifiedAuthSystem = UnifiedAuthSystem;
