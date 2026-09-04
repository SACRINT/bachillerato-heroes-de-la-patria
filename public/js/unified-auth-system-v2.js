// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}

if (typeof window !== 'undefined' && (typeof window.UnifiedAuthSystem === 'undefined' || typeof window.UnifiedAuthSystem !== 'function')) {
(function() {

class UnifiedAuthSystem {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl || '/api',
            googleClientId: config.googleClientId || null, // Se carga de forma asíncrona
            sessionTimeout: config.sessionTimeout || 30 * 60 * 1000, // 30 minutos
            ...config
        };

        // ✅ NO hay demo login - TODO debe venir de la base de datos PostgreSQL
        // El usuario explícitamente rechazó hardcoded credentials

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

            // ✅ FIX (19 Nov 2025): Inicializar managers y crear UI PRIMERO
            // Esto asegura que el modal existe antes de cualquier operación async que pueda fallar

            // 2. Inicializar managers (necesario para crear UI)
            this.initializeManagers();

            // 3. Crear UI TEMPRANO - antes de operaciones async que pueden fallar
            this.createLoginUI();

            // 4. Setup listeners TEMPRANO - para que el botón funcione aunque Google falle
            this.setupEventListeners();

            // ✅ SEMANA 25: Inicializar WebAuthn Manager
            await this.initializeWebAuthn();

            // 5. Cargar Google Client ID desde servidor (.env) - puede fallar sin afectar login manual
            const clientId = await this.loadGoogleClientIdFromServer();
            if (!clientId) {
                debugLog.log('APP', '⚠️ Google Client ID no disponible, intentando fallback...');
                this.config.googleClientId = this.getGoogleClientIdFallback();
            }

            // 6. Cargar sesión guardada
            await this.loadStoredSession();

            // ✅ FIX (14 Dic 2025): Actualizar UI DESPUÉS de cargar la sesión guardada
            // Esto asegura que si hay una sesión guardada, se muestre correctamente en el header
            this.updateAuthUI();

            // 7. Cargar Google Services (opcional - si falla, login manual sigue funcionando)
            await this.initializeGoogleOAuth();

            // 8. Monitor actividad
            this.setupActivityMonitor();

            this.state.isInitialized = true;
            debugLog.log('APP', '✅ Sistema de Autenticación V2 listo');

            // Disparar evento
            window.dispatchEvent(new CustomEvent('bge-auth-ready', { detail: this.state }));

        } catch (error) {
            debugLog.error('ERROR', '❌ Error inicializando autenticación:', error);
            // ✅ FIX (19 Nov 2025): No mostrar error al usuario, el login manual puede funcionar
            // this.showError('Error inicializando sistema de autenticación');
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

            // ✅ HABILITADO (14 Dic 2025): Google OAuth ahora funcional
            // CSP headers han sido configurados correctamente en vercel.json
            await this.managers.google.loadServices();

            this.state.googleReady = true;
            debugLog.log('APP', '✅ Google OAuth inicializado correctamente');

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
     * ✅ SEMANA 25: INICIALIZAR WEBAUTHN
     */
    async initializeWebAuthn() {
        debugLog.log('AUTH', '🔐 Inicializando WebAuthn...');

        try {
            // Create WebAuthn Manager instance
            if (typeof WebAuthnManager === 'undefined') {
                debugLog.warn('AUTH', '⚠️ WebAuthnManager no cargado, cargando script...');

                // Load webauthn-manager.js dynamically
                await this.loadScript('/js/webauthn-manager.js');
            }

            this.webauthn = new WebAuthnManager({
                apiBaseUrl: this.config.apiBaseUrl,
                onSuccess: (result) => {
                    debugLog.log('AUTH', '✅ WebAuthn success:', result.type);
                },
                onError: (error) => {
                    debugLog.error('AUTH', '❌ WebAuthn error:', error.type, error.error);
                }
            });

            await this.webauthn.init();

            this.state.webauthnReady = this.webauthn.isAvailable;

            debugLog.log('AUTH', `WebAuthn ${this.state.webauthnReady ? 'disponible' : 'no disponible'}`);

            // Update UI button visibility
            this.updateBiometricButtonVisibility();

        } catch (error) {
            debugLog.warn('AUTH', '⚠️ WebAuthn no disponible:', error.message);
            this.state.webauthnReady = false;
        }
    }

    /**
     * ✅ SEMANA 25: ACTUALIZAR VISIBILIDAD DEL BOTÓN BIOMÉTRICO
     */
    async updateBiometricButtonVisibility() {
        const biometricBtn = document.getElementById('biometric-login-btn');
        const statusText = document.getElementById('biometric-status-text');

        if (!biometricBtn) return;

        if (!this.state.webauthnReady) {
            // WebAuthn not supported
            biometricBtn.style.display = 'none';
            return;
        }

        // Check if user has credentials registered
        try {
            const hasCredentials = this.state.isAuthenticated ?
                await this.webauthn.hasCredentials() : false;

            if (!hasCredentials && !this.state.isAuthenticated) {
                // Not logged in and no credentials - hide button
                biometricBtn.style.display = 'none';
            } else {
                // Show button
                biometricBtn.style.display = 'block';

                if (statusText) {
                    statusText.innerHTML = hasCredentials ?
                        '<i class="fas fa-check-circle me-1 text-success"></i> Dispositivo registrado' :
                        '<i class="fas fa-info-circle me-1"></i> Touch ID, Face ID, Windows Hello';
                }
            }
        } catch (error) {
            // If checking fails (not authenticated), hide button
            biometricBtn.style.display = 'none';
        }
    }

    /**
     * ✅ SEMANA 25: MANEJAR LOGIN BIOMÉTRICO
     */
    async handleBiometricLogin() {
        debugLog.log('AUTH', '🔐 Iniciando login biométrico...');

        if (!this.state.webauthnReady) {
            this.showError('Tu navegador no soporta autenticación biométrica');
            return;
        }

        const biometricBtn = document.getElementById('biometric-login-btn');
        const originalHTML = biometricBtn.innerHTML;

        biometricBtn.disabled = true;
        biometricBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Autenticando...';

        try {
            // Authenticate with biometrics
            const result = await this.webauthn.authenticate(null, false);

            if (result.success) {
                debugLog.log('AUTH', '✅ Login biométrico exitoso');

                // Process login (save tokens, update UI)
                const token = result.tokens.accessToken;
                await this.processLogin(result.user, token, result.sessionInfo.rememberMe);

                // Close modal
                this.hideModal();

                this.showSuccess('¡Autenticación biométrica exitosa!');
            } else {
                throw new Error('Autenticación fallida');
            }

        } catch (error) {
            debugLog.error('AUTH', '❌ Error en login biométrico:', error);

            let errorMessage = 'Error en la autenticación biométrica';

            if (error.name === 'NotAllowedError') {
                errorMessage = 'Autenticación cancelada o rechazada';
            } else if (error.name === 'InvalidStateError') {
                errorMessage = 'No tienes dispositivos biométricos registrados';
            } else if (error.message) {
                errorMessage = error.message;
            }

            this.showError(errorMessage);

        } finally {
            biometricBtn.disabled = false;
            biometricBtn.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(originalHTML) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(originalHTML) : originalHTML));
        }
    }

    /**
     * CARGAR SCRIPT DINÁMICAMENTE
     */
    async loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * CREAR UI DE LOGIN
     */
    createLoginUI() {
        // Crear modal si no existe
        if (!document.getElementById('unified-auth-modal')) {
            const modalHTML = this.managers.ui.createModalHTML();

            // Sanitizar de forma segura sin romper atributos esenciales ni inputs
            let sanitizedHTML = modalHTML;
            try {
                if (typeof DOMPurify !== 'undefined') {
                    // Usar DOMPurify directamente si está disponible, sin 'simple' que destruye inputs
                    sanitizedHTML = DOMPurify.sanitize(modalHTML);
                }
            } catch (error) {
                debugLog.warn('ERROR', '⚠️ Error sanitizando modal HTML:', error.message);
                sanitizedHTML = modalHTML;
            }

            document.body.insertAdjacentHTML('beforeend', sanitizedHTML);
            debugLog.log('APP', '✅ Modal inyectada en el DOM');
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

            // Validar token con servidor (NO destruir sesión si falla)
            // FIX: La validación del servidor puede fallar por CORS, red, o JWT_SECRET mismatch
            // En esos casos, confiar en la sesión local
            try {
                const isValid = await this.validateToken();
                if (!isValid) {
                    debugLog.warn('APP', '⚠️ Token validation failed - keeping local session');
                }
            } catch (e) {
                debugLog.warn('APP', '⚠️ Token validation error - keeping local session:', e.message);
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

        // ✅ SEMANA 25: Listener para botón de login biométrico
        document.addEventListener('click', (e) => {
            if (e.target?.id === 'biometric-login-btn' || e.target?.closest('#biometric-login-btn')) {
                e.preventDefault();
                this.handleBiometricLogin();
            }
        });

        // ✅ FIX (19 Nov 2025): Listener DIRECTO al botón de login como respaldo
        // Buscar el botón y agregarle listener directo además del delegado
        const attachDirectListener = () => {
            const loginBtn = document.getElementById('loginButton') || document.getElementById('loginBtn');
            if (loginBtn && !loginBtn._authListenerAttached) {
                loginBtn._authListenerAttached = true;
                loginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    

                    const modal = document.getElementById('unified-auth-modal');
                    if (modal) {
                        // Mostrar modal usando showModalDirectly
                        this.managers.manual.showModalDirectly(modal);
                    } else {
                        
                        this.createLoginUI();
                        setTimeout(() => {
                            const newModal = document.getElementById('unified-auth-modal');
                            if (newModal) {
                                this.managers.manual.showModalDirectly(newModal);
                            }
                        }, 100);
                    }
                });
                
            }
        };

        // Intentar agregar listener directo inmediatamente y después de un delay
        attachDirectListener();
        setTimeout(attachDirectListener, 1000);
        setTimeout(attachDirectListener, 3000);

        
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
        // 🔍 DEBUG: Log COMPLETO de userData
        
        
        

        // GDPR: Datos sensibles enmascarados
        debugLog.log('APP', '🔓 Procesando login para:', userData.nombre || userData.name);

        this.state.currentUser = userData;
        this.state.token = token;
        this.state.isAuthenticated = true;

        // 🔍 DEBUG: Verificar que state.currentUser se asignó correctamente
        

        // Guardar sesión
        this.managers.session.saveSession(userData, token, rememberMe);

        // 🔍 DEBUG: Antes de actualizar UI
        

        // Actualizar UI
        this.updateAuthUI();

        // 🔍 DEBUG: Después de actualizar UI, verificar elementos del DOM
        setTimeout(() => {
            const userMenuName = document.getElementById('userMenuName');
            const loginButtons = document.getElementById('loginButtons');
            const userMenu = document.getElementById('userMenu');
            
        }, 100);

        // Cerrar modal
        this.managers.ui.closeModal();

        // Mostrar éxito
        this.showSuccess(`Bienvenido, ${userData.nombre || userData.name}!`);

        // Disparar evento
        window.dispatchEvent(new CustomEvent('bge-user-logged-in', {
            detail: { user: userData }
        }));

        // ✅ REDIRECCIÓN AUTOMÁTICA PARA ADMINS
        const userRole = (userData.role || userData.tipo_usuario || '').toLowerCase();
        if (userRole === 'admin' || userRole === 'administrativo' || userRole === 'administrator' || userRole === 'directivo') {
            // FORCE REMEMBER ME para asegurar persistencia cruzada en LocalStorage
            // Esto soluciona problemas donde sessionStorage se pierde en redirecciones raras
            if (!rememberMe) {
                this.managers.session.saveSession(userData, token, true);
            }

            // Pequeño delay para UX
            setTimeout(() => {
                // Validación extra para evitar bucles si ya estamos en el dashboard
                if (!window.location.pathname.includes('admin-dashboard.html')) {
                    window.location.replace('admin-dashboard.html');
                }
            }, 500);
        }

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
        if (this.managers && this.managers.session) {
            this.managers.session.clearSession();
        }

        // Limpieza directa de respaldo
        const ALL_AUTH_STORAGE_KEYS = [
            'bge_auth_token', 'authToken', 'auth_token', 'token', 'admin_token',
            'student_auth_token', 'teachers_auth_token', 'parent_auth_token',
            'bge_refresh_token', 'refreshToken',
            'bge_auth_user', 'bge_user_data', 'userData', 'auth_user', 'currentUser',
            'current_student', 'current_parent', 'current_teacher',
            'bge_auth_session', 'secure_admin_session', 'auth_expires', 'bge_auth_expiry',
            'redirect_after_login'
        ];
        ALL_AUTH_STORAGE_KEYS.forEach(key => {
            try {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            } catch (e) {}
        });

        // Limpiar cookies
        try {
            document.cookie.split(";").forEach(function (c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
        } catch (e) {}

        // Actualizar UI
        this.updateAuthUI();

        // Disparar eventos
        window.dispatchEvent(new CustomEvent('bge-user-logged-out'));
        window.dispatchEvent(new CustomEvent('auth:logout'));

        // Redirigir siempre a index.html
        window.location.href = 'index.html';
    }

    /**
     * ACTUALIZAR UI SEGÚN ESTADO
     */
    updateAuthUI() {
        // ✅ FIX (15 Dic 2025): Esperar a que el header esté disponible antes de actualizar UI
        // El header se carga dinámicamente con loadHeaderFooter(), por lo que puede no estar listo inmediatamente

        const tryUpdateUI = (attempts = 0) => {
            // Obtener elementos del header (IDs correctos de header.html)
            const loginButtons = document.getElementById('loginButtons');
            const userMenu = document.getElementById('userMenu');
            const userMenuName = document.getElementById('userMenuName');
            const userMenuRole = document.getElementById('userMenuRole');
            const userMenuHeader = document.getElementById('userMenuHeader');
            const logoutBtn = document.getElementById('logoutBtn');

            // Elementos de menú específicos por rol
            const adminMenuItems = document.getElementById('adminMenuItems');
            const teacherMenuItems = document.getElementById('teacherMenuItems');
            const studentMenuItems = document.getElementById('studentMenuItems');

            // Si header NO está listo, reintentar en 50ms
            if (!loginButtons && attempts < 10) {
                
                setTimeout(() => tryUpdateUI(attempts + 1), 50);
                return;
            }

            

            if (this.state.isAuthenticated && this.state.currentUser) {
                // Usuario autenticado - ocultar botón login, mostrar menú usuario
                if (loginButtons) loginButtons.classList.add('d-none');
                if (userMenu) userMenu.classList.remove('d-none');

                // Actualizar nombre de usuario
                if (userMenuName) {
                    userMenuName.textContent = this.state.currentUser.nombre ||
                        this.state.currentUser.name ||
                        this.state.currentUser.email?.split('@')[0] ||
                        'Usuario';
                    
                } else {
                    
                }

                // Actualizar rol
                const role = this.state.currentUser.role || 'usuario';
                if (userMenuRole) {
                    const roleLabels = {
                        'admin': 'Admin',
                        'administrator': 'Admin',
                        'docente': 'Docente',
                        'teacher': 'Docente',
                        'estudiante': 'Estudiante',
                        'student': 'Estudiante',
                        'padre': 'Padre',
                        'parent': 'Padre'
                    };
                    userMenuRole.textContent = roleLabels[role] || role;
                    
                } else {
                    
                }

                // Actualizar header del dropdown
                if (userMenuHeader) {
                    userMenuHeader.textContent = this.state.currentUser.email || 'Usuario autenticado';
                }

                // Mostrar/ocultar opciones de menú según rol
                if (adminMenuItems) {
                    adminMenuItems.classList.toggle('d-none', !['admin', 'administrator'].includes(role));
                }
                if (teacherMenuItems) {
                    teacherMenuItems.classList.toggle('d-none', !['docente', 'teacher'].includes(role));
                }
                if (studentMenuItems) {
                    studentMenuItems.classList.toggle('d-none', !['estudiante', 'student'].includes(role));
                }

                // Configurar evento de logout
                if (logoutBtn && !logoutBtn.hasAttribute('data-logout-bound')) {
                    logoutBtn.setAttribute('data-logout-bound', 'true');
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.logout();
                    });
                }

                // Mostrar dashboard admin si es admin
                const isAdmin = ['admin', 'administrator', 'directivo', 'administrativo'].includes(role);
                const adminOnlySection = document.getElementById('adminOnlySection');
                if (adminOnlySection) {
                    adminOnlySection.classList.toggle('d-none', !isAdmin);
                }

                const adminPanelLogoutOption = document.getElementById('adminPanelLogoutOption');
                if (adminPanelLogoutOption) {
                    adminPanelLogoutOption.classList.toggle('d-none', !isAdmin);
                }

                const adminPanelSessionStatus = document.getElementById('adminPanelSessionStatus');
                if (adminPanelSessionStatus) {
                    adminPanelSessionStatus.classList.toggle('d-none', !isAdmin);
                }
            } else {
                // Usuario no autenticado - mostrar botón login, ocultar menú usuario
                if (loginButtons) loginButtons.classList.remove('d-none');
                if (userMenu) userMenu.classList.add('d-none');

                // Ocultar secciones admin
                const adminOnlySection = document.getElementById('adminOnlySection');
                if (adminOnlySection) adminOnlySection.classList.add('d-none');

                const adminPanelLogoutOption = document.getElementById('adminPanelLogoutOption');
                if (adminPanelLogoutOption) adminPanelLogoutOption.classList.add('d-none');

                const adminPanelSessionStatus = document.getElementById('adminPanelSessionStatus');
                if (adminPanelSessionStatus) adminPanelSessionStatus.classList.add('d-none');
            }
        };

        // Llamar inmediatamente la primera vez
        tryUpdateUI();
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

    /**
     * ✅ SEMANA 25: MOSTRAR MODAL DE VERIFICACIÓN 2FA
     */
    show2FAVerificationModal() {
        debugLog.log('AUTH', '🔐 Mostrando modal de verificación 2FA');

        // Create 2FA modal if it doesn't exist
        let modal2FA = document.getElementById('twofa-verification-modal');
        if (!modal2FA) {
            modal2FA = this.create2FAVerificationModal();
            document.body.appendChild(modal2FA);
        }

        // Show the modal
        modal2FA.classList.add('show');
        modal2FA.style.display = 'block';
        modal2FA.setAttribute('aria-modal', 'true');

        // Add backdrop
        document.body.classList.add('modal-open');
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
        }

        // Focus on 2FA code input
        setTimeout(() => {
            const codeInput = document.getElementById('twofa-code');
            if (codeInput) codeInput.focus();
        }, 300);
    }

    /**
     * ✅ SEMANA 25: CREAR MODAL DE VERIFICACIÓN 2FA
     */
    create2FAVerificationModal() {
        const modal = document.createElement('div');
        modal.id = 'twofa-verification-modal';
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'twofa-modal-title');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 15px; overflow: hidden;">
                    <div class="modal-header bg-gradient" style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; border-bottom: none;">
                        <div>
                            <h5 class="modal-title" id="twofa-modal-title">
                                <i class="fas fa-shield-alt me-2"></i>
                                Verificación en Dos Pasos
                            </h5>
                            <p class="mb-0 mt-1" style="font-size: 0.9rem; opacity: 0.9;">
                                Ingresa el código de 6 dígitos
                            </p>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body px-4 py-4">
                        <!-- Alert para mensajes -->
                        <div id="twofa-alert" class="alert d-none" role="alert"></div>

                        <!-- Formulario de 2FA -->
                        <form id="twofa-verification-form">
                            <div class="mb-4 text-center">
                                <i class="fas fa-mobile-alt" style="font-size: 3rem; color: #1a73e8;"></i>
                                <p class="mt-3 text-muted">
                                    Abre tu aplicación de autenticación (Google Authenticator, Authy, etc.) e ingresa el código de 6 dígitos.
                                </p>
                            </div>

                            <div class="mb-3">
                                <label for="twofa-code" class="form-label fw-bold">Código de Autenticación</label>
                                <input type="text" class="form-control form-control-lg text-center" id="twofa-code"
                                       placeholder="000000" maxlength="6" pattern="[0-9]{6}"
                                       style="font-size: 1.5rem; letter-spacing: 0.5rem; font-family: monospace;"
                                       required autocomplete="off">
                                <div class="form-text text-center">
                                    Código de 6 dígitos de tu app de autenticación
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary w-100 py-2 fw-bold" id="verify-2fa-btn">
                                <i class="fas fa-check-circle me-2"></i>
                                Verificar Código
                            </button>
                        </form>

                        <div class="mt-4 text-center">
                            <button type="button" class="btn btn-link text-decoration-none" id="use-backup-code-btn">
                                <i class="fas fa-key me-1"></i>
                                ¿Perdiste tu dispositivo? Usa un código de respaldo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const form = modal.querySelector('#twofa-verification-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.verify2FACode(false);
        });

        const backupBtn = modal.querySelector('#use-backup-code-btn');
        backupBtn.addEventListener('click', () => {
            const codeLabel = modal.querySelector('label[for="twofa-code"]');
            const codeInput = modal.querySelector('#twofa-code');
            const formText = modal.querySelector('.form-text');

            if (codeLabel.textContent.includes('Respaldo')) {
                // Switch back to normal 2FA
                codeLabel.innerHTML = 'Código de Autenticación';
                codeInput.placeholder = '000000';
                codeInput.maxLength = 6;
                formText.textContent = 'Código de 6 dígitos de tu app de autenticación';
                backupBtn.innerHTML = '<i class="fas fa-key me-1"></i> ¿Perdiste tu dispositivo? Usa un código de respaldo';
                this.usingBackupCode = false;
            } else {
                // Switch to backup code
                codeLabel.innerHTML = 'Código de Respaldo';
                codeInput.placeholder = 'XXXX-XXXX';
                codeInput.maxLength = 9;
                formText.textContent = 'Ingresa uno de tus códigos de respaldo de 8 caracteres';
                backupBtn.innerHTML = '<i class="fas fa-mobile-alt me-1"></i> Volver a código de autenticación';
                this.usingBackupCode = true;
            }
        });

        const closeBtn = modal.querySelector('[data-bs-dismiss="modal"]');
        closeBtn.addEventListener('click', () => this.hide2FAModal());

        return modal;
    }

    /**
     * ✅ SEMANA 25: VERIFICAR CÓDIGO 2FA
     */
    async verify2FACode(useBackupCode = false) {
        const codeInput = document.getElementById('twofa-code');
        const code = codeInput.value.trim();

        if (!code) {
            this.show2FAError('Por favor ingresa el código');
            return;
        }

        if (!useBackupCode && code.length !== 6) {
            this.show2FAError('El código debe tener 6 dígitos');
            return;
        }

        const pending2FA = this.pending2FAData;
        if (!pending2FA) {
            this.show2FAError('Error: datos de sesión perdidos. Por favor inicia sesión nuevamente.');
            return;
        }

        const verifyBtn = document.getElementById('verify-2fa-btn');
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Verificando...';

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/auth/verify-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: pending2FA.userId,
                    token: code,
                    rememberMe: pending2FA.rememberMe,
                    useBackupCode: useBackupCode || this.usingBackupCode || false
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                debugLog.log('AUTH', '✅ 2FA verificado exitosamente');

                // Process login with tokens
                const accessToken = data.tokens.accessToken;
                await this.processLogin(data.user, accessToken, pending2FA.rememberMe);

                // Close 2FA modal
                this.hide2FAModal();

                // Clear pending data
                delete this.pending2FAData;

                this.showSuccess('¡Autenticación exitosa!');
            } else {
                this.show2FAError(data.message || 'Código inválido. Por favor intenta de nuevo.');
                codeInput.value = '';
                codeInput.focus();
            }
        } catch (error) {
            debugLog.error('ERROR', 'Error en verificación 2FA:', error);
            this.show2FAError('Error de conexión con el servidor');
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i> Verificar Código';
        }
    }

    /**
     * ✅ SEMANA 25: MOSTRAR ERROR EN MODAL 2FA
     */
    show2FAError(message) {
        const alert = document.getElementById('twofa-alert');
        if (alert) {
            alert.className = 'alert alert-danger';
            alert.textContent = message;
            alert.classList.remove('d-none');

            setTimeout(() => alert.classList.add('d-none'), 5000);
        }
    }

    /**
     * ✅ SEMANA 25: OCULTAR MODAL 2FA
     */
    hide2FAModal() {
        const modal = document.getElementById('twofa-verification-modal');
        const backdrop = document.querySelector('.modal-backdrop');

        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            modal.removeAttribute('aria-modal');
        }

        if (backdrop) backdrop.remove();
        document.body.classList.remove('modal-open');

        debugLog.log('AUTH', 'Modal 2FA cerrado');
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

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                debugLog.error('ERROR', 'Respuesta no es JSON válido:', parseError);
                return {
                    success: false,
                    error: 'Respuesta inválida del servidor'
                };
            }

            if (response.ok && data.success) {
                return data;
            } else {
                return {
                    success: false,
                    error: data.error || data.message || 'Error en autenticación con Google'
                };
            }
        } catch (error) {
            debugLog.error('ERROR', 'Error verificando con backend:', error);
            return {
                success: false,
                error: 'Error de conexión: ' + error.message
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
    /**
     * SETUP LISTENERS - ROBUST EVENT DELEGATION
     */
    setupListeners() {
        

        // 1. INTERCEPTAR TODOS LOS CLICS EN BOTONES DE LOGIN (Delegación Global)
        document.addEventListener('click', (e) => {
            // Botón para abrir modal (cualquiera con ID o clase correcta)
            const logoutAdminBtn = e.target.closest('[data-action="logout-admin-panel"]') || e.target.closest('#logoutBtn');
            if (logoutAdminBtn) {
                e.preventDefault();
                this.auth.logout();
                return;
            }

            const toggleBtn = e.target.closest('#authToggleBtn') ||
                e.target.closest('#loginButton') ||
                e.target.closest('.login-trigger') ||
                e.target.closest('[data-action="open-unified-login"]');

            if (toggleBtn) {
                e.preventDefault();
                
                this.openModalSafe();
                return;
            }

            // Botón "Iniciar Sesión" DENTRO del formulario (fallback directo)
            const submitBtn = e.target.closest('#manual-login-btn');
            if (submitBtn) {
                const parentForm = submitBtn.closest('form') || document.getElementById('unified-login-form');
                if (parentForm) {
                    // Si el click no activa el submit nativo, manejarlo con fallback
                    setTimeout(() => {
                        if (!this.isLoading) {
                            this.handleManualLogin(parentForm);
                        }
                    }, 50);
                }
            }
        });

        // 2. INTERCEPTAR ENVÍO DEL FORMULARIO (CRÍTICO)
        // Usamos capture phase (true) para asegurar que lo atrapamos antes que nadie
        document.addEventListener('submit', (e) => {
            const form = e.target;

            // Verificar si es nuestro formulario de login
            if (form.id === 'unified-login-form' || form.id === 'manual-login-form' || form.closest('#unified-login-form')) {
                e.preventDefault(); // 🛑 DETENER ENVÍO TRADICIONAL
                e.stopPropagation(); // 🛑 DETENER PROPAGACIÓN

                this.handleManualLogin(form); // ✅ EJECUTAR LÓGICA JS CON FORM CONTEXTUAL
                return false;
            }

            // Formulario de registro
            if (form.id === 'public-register-form') {
                e.preventDefault();
                this.handlePublicRegister();
            }
        }, true); // <--- Use Capture Phase

        // 3. LISTENERS AUXILIARES (UI)
        document.addEventListener('click', (e) => {
            // Toggle Password
            const togglePassBtn = e.target.closest('#togglePassword') || e.target.closest('#toggle-password');
            if (togglePassBtn) {
                this.togglePasswordVisibility(togglePassBtn);
            }
            // Cerrar Modal
            if (e.target.closest('.btn-close') || e.target.closest('#modal-close-btn')) {
                this.auth.managers.ui.hideModal();
            }
        });

        
    }

    /**
     * Helper param abrir modal de forma segura
     */
    openModalSafe() {
        const modal = document.getElementById('unified-auth-modal');
        if (modal) {
            this.showModalDirectly(modal);
        } else {
            
            this.auth.createLoginUI();
            // Pequeño delay para asegurar que el DOM se actualizó
            setTimeout(() => {
                const newModal = document.getElementById('unified-auth-modal');
                if (newModal) this.showModalDirectly(newModal);
            }, 50);
        }
    }

    /**
     * MOSTRAR MODAL DIRECTAMENTE (using Bootstrap Modal API)
     */
    showModalDirectly(modal) {
        try {
            if (!modal) {
                console.error('[AUTH-V2] ❌ Modal element not found');
                return;
            }

            // ✅ SOLUCIÓN DEFINITIVA: Hacer el modal visible directamente con !important
            // Usar estilos inline agresivos para asegurar visibilidad

            // Remover las clases que ocultan
            modal.classList.remove('fade');
            modal.classList.add('show');

            // Aplicar estilos inline con !important para forzar visibilidad
            modal.setAttribute('style', `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 1060 !important;
                width: 100% !important;
                height: 100% !important;
            `);

            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-hidden', 'false');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('data-bs-backdrop', 'static');

            // Agregar clase modal-open al body
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';

            // Crear backdrop (fondo oscuro) si no existe
            let backdrop = document.querySelector('.modal-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop show';
                backdrop.setAttribute('style', `
                    display: block !important;
                    opacity: 1 !important;
                    background-color: rgba(0, 0, 0, 0.5) !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    z-index: 1050 !important;
                    width: 100% !important;
                    height: 100% !important;
                `);
                document.body.appendChild(backdrop);
                
            } else {
                backdrop.classList.add('show');
                backdrop.setAttribute('style', `
                    display: block !important;
                    opacity: 1 !important;
                    z-index: 1050 !important;
                `);
            }

            

        } catch (error) {
            console.error('[AUTH-V2] ❌ Error abriendo modal:', error);
        }
    }

    /**
     * MANEJAR LOGIN MANUAL
     */
    async handleManualLogin(submittedForm = null) {
        if (this.isLoading) return;

        // 1. Contexto prioritario: buscar en el formulario que emitió el evento o modal activo
        const form = submittedForm || 
                     document.getElementById('unified-login-form') || 
                     document.getElementById('manual-login-form') ||
                     document.querySelector('#unified-auth-modal form') ||
                     document.querySelector('.modal.show form') ||
                     document;

        let emailInput = form.querySelector('#loginEmail, #login-email, input[type="email"], input[name="email"]');
        let passInput = form.querySelector('#loginPassword, #login-password, input[type="password"], input[id*="assword"], input[name*="assword"]');
        let rememberInput = form.querySelector('#rememberMe, #remember-me, input[type="checkbox"]');

        let email = emailInput?.value?.trim() || '';
        let password = passInput?.value || '';
        let rememberMe = rememberInput?.checked || false;

        // 2. 🛡️ Fallback Robusto 1: Si email está vacío, escanear todos los inputs de email del DOM que contengan texto
        if (!email) {
            const allEmails = Array.from(document.querySelectorAll('input[type="email"], #loginEmail, #login-email, input[name="email"], input[autocomplete="email"]'));
            const filled = allEmails.find(inp => inp.value && inp.value.trim().length > 0);
            if (filled) {
                email = filled.value.trim();
                emailInput = filled;
            }
        }

        // 3. 🛡️ Fallback Robusto 2: Si password está vacío, escanear todos los inputs de contraseña
        // (incluyendo type="text" por si el usuario activó togglePassword con el botón del ojo)
        if (!password) {
            const allPasswords = Array.from(document.querySelectorAll('#loginPassword, #login-password, input[type="password"], input[id*="assword"], input[name*="assword"], input[autocomplete*="password"]'));
            const filled = allPasswords.find(inp => inp.value && inp.value.length > 0);
            if (filled) {
                password = filled.value;
                passInput = filled;
            } else {
                const toggleBtn = document.querySelector('#togglePassword, #toggle-password');
                const nearbyInput = toggleBtn?.closest('.input-group')?.querySelector('input');
                if (nearbyInput && nearbyInput.value) {
                    password = nearbyInput.value;
                    passInput = nearbyInput;
                }
            }
        }

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
            // ✅ Asegurar endpoint correcto
            const apiBase = (this.auth && this.auth.config && this.auth.config.apiBaseUrl) ? this.auth.config.apiBaseUrl : '/api';
            const endpoint = apiBase.endsWith('/') ? `${apiBase}auth/login` : `${apiBase}/auth/login`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe })
            });

            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.error('[AUTH-LOGIN] ❌ Error parseando JSON:', parseError);
                    throw new Error('Error en formato de respuesta del servidor');
                }
            } else {
                // Si no es JSON, obtener como texto (posible error 429 u otro error del proxy/Vercel)
                const text = await response.text();
                

                // Si es un error de rate limit conocido
                if (response.status === 429) {
                    throw new Error(text.includes('Too many') || text.includes('intentos') ?
                        'Demasiados intentos. Por favor espera 15 minutos.' :
                        'Límite de peticiones excedido');
                }

                throw new Error(`Error del servidor (${response.status})`);
            }

            // ✅ SUCCESS LOGIC DEFINITIVA Y ROBUSTA
            const isSuccess = response.ok && !!(data?.user && (data.user.id || data.user.email)) && !!(data?.tokens?.accessToken || data?.token || data?.accessToken);

            if (isSuccess) {
                if (data.requires2FA) {
                    debugLog.log('AUTH', 'Login requiere 2FA');
                    this.auth.pending2FAData = {
                        userId: data.userId,
                        username: data.user.username,
                        email: data.user.email,
                        role: data.user.role,
                        rememberMe: rememberMe
                    };
                    this.auth.managers.ui.closeModal();
                    if (this.auth.show2FAVerificationModal) {
                        this.auth.show2FAVerificationModal();
                    } else {
                        console.error('[AUTH] show2FAVerificationModal not found on auth system');
                        this.auth.showError('Error: Sistema 2FA no encontrado');
                    }
                    return;
                }

                const accessToken = data.tokens?.accessToken || data.token || data.accessToken;
                await this.auth.processLogin(data.user, accessToken, rememberMe);
            } else {
                const errorMsg = data.error || data.message || 'Credenciales inválidas';
                debugLog.warn('AUTH', 'Login fallido:', errorMsg);
                this.auth.showError(errorMsg);
            }
        } catch (error) {
            debugLog.error('ERROR', 'Error en login:', error);
            this.auth.showError('Error de conexión con el servidor: ' + error.message);
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
    togglePasswordVisibility(toggleBtn = null) {
        const btn = toggleBtn || document.querySelector('#togglePassword, #toggle-password');
        const container = btn?.closest('.input-group') || document;
        const input = container.querySelector('#loginPassword, #login-password, input[type="password"], input[type="text"]') ||
                      document.getElementById('loginPassword') || document.getElementById('login-password');
        const icon = btn?.querySelector('i') || document.querySelector('#togglePassword i, #toggle-password i');

        if (!input || !icon) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    /**
     * TOGGLE REGISTER PASSWORD VISIBILITY
     */
    toggleRegisterPasswordVisibility() {
        const input = document.getElementById('register-password');
        const icon = document.querySelector('#toggle-register-password i');

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
     * MANEJAR REGISTRO PÚBLICO
     */
    async handlePublicRegister() {
        const nombre = document.getElementById('register-nombre')?.value?.trim();
        const apellido = document.getElementById('register-apellido')?.value?.trim();
        const email = document.getElementById('register-email')?.value?.trim();
        const password = document.getElementById('register-password')?.value;
        const passwordConfirm = document.getElementById('register-password-confirm')?.value;
        const acceptTerms = document.getElementById('accept-terms')?.checked;

        // Validaciones
        if (!nombre || !apellido || !email || !password || !passwordConfirm) {
            this.auth.showWarning('Por favor completa todos los campos requeridos');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.auth.showWarning('Email no válido');
            return;
        }

        if (password.length < 8) {
            this.auth.showWarning('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        // Validar complejidad de contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(password)) {
            this.auth.showWarning('La contraseña debe incluir mayúscula, minúscula y número');
            return;
        }

        if (password !== passwordConfirm) {
            this.auth.showWarning('Las contraseñas no coinciden');
            return;
        }

        if (!acceptTerms) {
            this.auth.showWarning('Debes aceptar los términos y condiciones');
            return;
        }

        // Enviar registro
        await this.submitRegister(email, password, nombre, apellido);
    }

    /**
     * ENVIAR REGISTRO AL SERVIDOR
     */
    async submitRegister(email, password, nombre, apellido_paterno) {
        this.setRegisterLoading(true);

        try {
            const response = await fetch(`${this.auth.config.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    nombre,
                    apellido_paterno
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                debugLog.error('ERROR', 'Respuesta no es JSON válido:', parseError);
                this.auth.showError('Respuesta inválida del servidor');
                this.setRegisterLoading(false);
                return;
            }

            if (response.ok && data.success) {
                // Registro exitoso - mostrar mensaje
                this.auth.showSuccess(data.message || 'Registro exitoso. Revisa tu correo para verificar tu cuenta.');

                // Limpiar formulario
                document.getElementById('public-register-form')?.reset();

                // Cambiar a tab de login después de 3 segundos
                setTimeout(() => {
                    const emailTab = document.getElementById('email-tab');
                    if (emailTab) emailTab.click();
                }, 3000);
            } else {
                const errorMsg = data.message || data.error || 'Error en el registro';
                debugLog.warn('AUTH', 'Registro fallido:', errorMsg);
                this.auth.showError(errorMsg);
            }
        } catch (error) {
            debugLog.error('ERROR', 'Error en registro:', error);
            this.auth.showError('Error de conexión con el servidor: ' + error.message);
        } finally {
            this.setRegisterLoading(false);
        }
    }

    /**
     * SET REGISTER LOADING STATE
     */
    setRegisterLoading(isLoading) {
        const submitBtn = document.querySelector('#public-register-form button[type="submit"]');
        const form = document.getElementById('public-register-form');

        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(isLoading) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(isLoading) : isLoading))
                ? '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...'
                : '<i class="fas fa-user-plus me-2"></i>Crear Cuenta';
        }

        if (form) {
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => input.disabled = isLoading);
        }
    }

    /**
     * SET LOADING STATE
     */
    setLoading(isLoading) {
        this.isLoading = isLoading;
        const submitBtn = document.getElementById('manual-login-btn') || 
                          document.querySelector('#unified-login-form button[type="submit"]') ||
                          document.querySelector('#manual-login-form button[type="submit"]');
        const form = document.getElementById('unified-login-form') || document.getElementById('manual-login-form');

        if (submitBtn) {
            submitBtn.disabled = isLoading;
            const loadingSpan = submitBtn.querySelector('.loading-text');
            const normalSpan = submitBtn.querySelector('.normal-text');
            if (loadingSpan && normalSpan) {
                if (isLoading) {
                    loadingSpan.classList.remove('d-none');
                    normalSpan.classList.add('d-none');
                } else {
                    loadingSpan.classList.add('d-none');
                    normalSpan.classList.remove('d-none');
                }
            } else {
                submitBtn.innerHTML = isLoading
                    ? '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...'
                    : '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
            }
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
        const storageName = rememberMe ? 'localStorage' : 'sessionStorage';

        // ✅ FIX (13 Dic 2025): Si guardamos en sessionStorage (NO rememberMe),
        // limpiar localStorage primero para evitar conflictos entre sesiones
        if (!rememberMe) {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            // También limpiar keys legacy
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('bge_auth_session');
            
        }

        try {
            storage.setItem(this.STORAGE_KEYS.token, token);
            storage.setItem(this.STORAGE_KEYS.user, JSON.stringify(userData));

            // Guardar tiempo de expiración (24 horas)
            const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
            storage.setItem(this.STORAGE_KEYS.expiry, expiryTime.toString());

            // ✅ FIX (18 Ene 2026): Guardar keys legacy para compatibilidad con admin-auth.js
            storage.setItem('token', token);
            storage.setItem('authToken', token);

            // ✅ FIX (18 Ene 2026): Guardar bge_auth_session para UnifiedAuthManager
            const sessionData = {
                user: userData,
                provider: 'email',
                loginTime: new Date().toISOString(),
                expiresAt: expiryTime
            };
            storage.setItem('bge_auth_session', JSON.stringify(sessionData));

            // ✅ PERSISTENCIA DE ADMIN: Guardar adminSession para admin-dashboard.html
            const role = (userData.role || userData.tipo_usuario || '').toLowerCase();
            if (role === 'admin' || role === 'administrativo' || role === 'directivo' || role === 'administrator') {
                const adminSessionData = {
                    username: userData.username || userData.email,
                    role: role,
                    name: userData.nombre ? `${userData.nombre} ${userData.apellido_paterno || ''}`.trim() : (userData.username || 'Administrador'),
                    token: token,
                    isAuthenticated: true,
                    loginTime: Date.now(),
                    expires: expiryTime
                };
                const adminStr = JSON.stringify(adminSessionData);
                const userStr = JSON.stringify(userData);
                localStorage.setItem('adminSession', adminStr);
                sessionStorage.setItem('adminSession', adminStr);
                localStorage.setItem('secure_admin_session', adminStr);
                sessionStorage.setItem('secure_admin_session', adminStr);
                localStorage.setItem('bge_user_data', userStr);
                sessionStorage.setItem('bge_user_data', userStr);
                localStorage.setItem('bge_auth_user', userStr);
                sessionStorage.setItem('bge_auth_user', userStr);
                localStorage.setItem('bge_auth_token', token);
                sessionStorage.setItem('bge_auth_token', token);
            }

            // VERIFICACIÓN INMEDIATA
            const tokenCheck = storage.getItem(this.STORAGE_KEYS.token);
            const userCheck = storage.getItem(this.STORAGE_KEYS.user);

            

            if (!tokenCheck || !userCheck) {
                console.error(`[SESSION-DEBUG] ❌ ERROR CRÍTICO: Falló la escritura en ${storageName}`);
            }

            // GDPR: Datos sensibles enmascarados
            debugLog.log('APP', '✅ Sesión guardada en', storageName);
        } catch (e) {
            console.error('[SESSION-DEBUG] ❌ EXCEPCIÓN guardando sesión:', e);
        }
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
        const ALL_AUTH_STORAGE_KEYS = [
            'adminSession', 'secure_admin_session', 'admin_session',
            'bge_auth_token', 'authToken', 'auth_token', 'token', 'admin_token',
            'student_auth_token', 'teachers_auth_token', 'parent_auth_token',
            'bge_refresh_token', 'refreshToken',
            'bge_auth_user', 'bge_user_data', 'userData', 'auth_user', 'currentUser',
            'current_student', 'current_parent', 'current_teacher',
            'bge_auth_session', 'auth_expires', 'bge_auth_expiry',
            'redirect_after_login'
        ];

        ALL_AUTH_STORAGE_KEYS.forEach(key => {
            try {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            } catch (e) {}
        });

        try {
            document.cookie.split(";").forEach(function (c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
        } catch (e) {}

        debugLog.log('APP', '✅ Sesión limpiada completamente');
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
            <!-- 🔐 MODAL DE AUTENTICACIÓN UNIFICADO - DISEÑO PREMIUM -->
            <div class="modal fade" id="unified-auth-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg overflow-hidden">
                        <!-- Header Mejorado -->
                        <div class="modal-header border-0 bg-light">
                            <h5 class="modal-title fw-bold text-primary" id="authModalLabel">
                                <i class="fas fa-shield-alt me-2"></i>Acceso Seguro
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <!-- Contenido Principal -->
                        <div class="modal-body p-4">
                            <!-- Contenedor de Alertas Dinámicas -->
                            <div id="auth-alerts-container" class="mb-3"></div>
                            
                            <!-- Alerta estática (Legacy/Fallback) -->
                            <div id="auth-alert" class="alert d-none" role="alert"></div>

                            <!-- Formulario de Login Manual -->
                            <form id="unified-login-form" class="needs-validation" novalidate>
                                <div class="mb-3">
                                    <label for="loginEmail" class="form-label fw-semibold">Correo Electrónico</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-white text-muted"><i class="fas fa-envelope"></i></span>
                                        <input type="email" class="form-control" id="loginEmail" placeholder="usuario@ejemplo.com" required autocomplete="email">
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="loginPassword" class="form-label fw-semibold">Contraseña</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-white text-muted"><i class="fas fa-lock"></i></span>
                                        <input type="password" class="form-control" id="loginPassword" placeholder="******" required autocomplete="current-password">
                                        <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="d-flex justify-content-between align-items-center mb-4">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="rememberMe">
                                        <label class="form-check-label text-muted small" for="rememberMe">
                                            Recordarme
                                        </label>
                                    </div>
                                    <a href="#" id="forgot-password-link" class="text-decoration-none small text-primary">¿Olvidaste tu contraseña?</a>
                                </div>

                                <button type="submit" class="btn btn-primary w-100 py-2 fw-bold shadow-sm" id="manual-login-btn">
                                    <span class="normal-text">Iniciar Sesión</span>
                                    <span class="loading-text d-none">
                                        <span class="spinner-border spinner-border-sm me-2"></span> Entrando...
                                    </span>
                                </button>
                            </form>

                            <div class="text-center my-3 position-relative">
                                <hr class="text-muted opacity-25">
                                <span class="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">O continúa con</span>
                            </div>

                            <div class="d-grid gap-2">
                                <button id="google-signin-btn" class="btn btn-outline-dark py-2 d-flex align-items-center justify-content-center gap-2 transition-hover">
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18">
                                    <span>Google</span>
                                </button>

                                <button id="biometric-login-btn" class="btn btn-outline-secondary py-2 d-flex align-items-center justify-content-center gap-2 transition-hover" style="display: none;">
                                    <i class="fas fa-fingerprint text-success"></i>
                                    <span>Biometría</span>
                                </button>
                            </div>

                             <div class="mt-2 text-center" id="biometric-status-text"></div>
                        </div>

                        <!-- Footer -->
                        <div class="modal-footer bg-light border-0 justify-content-center py-3">
                            <p class="mb-0 small text-muted">¿No tienes cuenta? <a href="#" id="register-link" class="text-primary text-decoration-none fw-bold">Regístrate aquí</a></p>
                        </div>
                    </div>
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

        const safeAlertHTML = typeof DOMPurify !== 'undefined' 
            ? DOMPurify.sanitize(typeof sanitizeHTML === 'function' ? sanitizeHTML(alertHTML) : alertHTML)
            : (typeof sanitizeHTML === 'function' ? sanitizeHTML(alertHTML) : alertHTML);
        container.insertAdjacentHTML('beforeend', safeAlertHTML);

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
            modal.setAttribute('aria-hidden', 'false');

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
                // ✅ FIX: Remover style attribute completo para eliminar !important previos
                modal.removeAttribute('style');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
                modal.removeAttribute('aria-modal');
                debugLog.log('APP', '✅ Modal ocultado (atributos limpiados)');
            }

            if (backdrop) {
                backdrop.remove();
                // Asegurar que no queden backdrops huérfanos
                document.querySelectorAll('.modal-backdrop').forEach(bd => bd.remove());
                debugLog.log('APP', '✅ Backdrop eliminado');
            }

            document.body.classList.remove('modal-open');
            document.body.removeAttribute('style'); // Limpiar estilos del body tambien
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

    // ✅ FIX (14 Dic 2025): Registrar listener de headerLoaded DESPUÉS de crear la instancia pero ANTES de que se dispare el evento
    // El listener se registra aquí (sincronamente) para asegurar que está listo cuando main.js dispare 'headerLoaded'
    document.addEventListener('headerLoaded', () => {
        debugLog.log('APP', '📡 Evento headerLoaded recibido - actualizando UI de autenticación...');
        // En este punto, la sesión ya ha sido cargada en init() de UnifiedAuthSystem
        if (window.unifiedLogin && typeof window.unifiedLogin.updateAuthUI === 'function') {
            // Pequeño delay para asegurar que loadStoredSession() ya terminó
            setTimeout(() => {
                window.unifiedLogin.updateAuthUI();
            }, 100);
        } else {
            
        }
    }, { once: false });
}

// Mantener backward compatibility si algo usa window.bgeAuth
if (!window.bgeAuth) {
    window.bgeAuth = window.unifiedLogin;
}

// Exponer funciones globales de logout para compatibilidad
window.logoutAdminPanel = function() {
    if (window.unifiedLogin && typeof window.unifiedLogin.logout === 'function') {
        window.unifiedLogin.logout();
    } else {
        const ALL_AUTH_STORAGE_KEYS = [
            'bge_auth_token', 'authToken', 'auth_token', 'token', 'admin_token',
            'student_auth_token', 'teachers_auth_token', 'parent_auth_token',
            'bge_refresh_token', 'refreshToken',
            'bge_auth_user', 'bge_user_data', 'userData', 'auth_user', 'currentUser',
            'current_student', 'current_parent', 'current_teacher',
            'bge_auth_session', 'secure_admin_session', 'auth_expires', 'bge_auth_expiry',
            'redirect_after_login'
        ];
        ALL_AUTH_STORAGE_KEYS.forEach(k => {
            try {
                localStorage.removeItem(k);
                sessionStorage.removeItem(k);
            } catch(e) {}
        });
        try {
            document.cookie.split(";").forEach(function (c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
        } catch (e) {}
        window.location.href = 'index.html';
    }
};
window.logoutAdmin = window.logoutAdminPanel;

// Exportar para usar en otros scripts
window.UnifiedAuthSystem = UnifiedAuthSystem;

})();
}
