// Debug Logger - Logging condicional (GDPR compliant)
// ✅ FIX (19 Nov 2025): Fallback usa console.log para que los mensajes sean visibles
console.log('[AUTH-V2] 📦 Script cargando...');
if (typeof debugLog === 'undefined') {
    // Fallback si debug-logger.js no está cargado - usar console para debugging
    var debugLog = {
        log: (category, ...args) => console.log(`[${category}]`, ...args),
        warn: (category, ...args) => console.warn(`[${category}]`, ...args),
        error: (category, ...args) => console.error(`[${category}]`, ...args)
    };
}

/**
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

            // 5. Cargar Google Client ID desde servidor (.env) - puede fallar sin afectar login manual
            const clientId = await this.loadGoogleClientIdFromServer();
            if (!clientId) {
                debugLog.log('APP', '⚠️ Google Client ID no disponible, intentando fallback...');
                this.config.googleClientId = this.getGoogleClientIdFallback();
            }

            // 6. Cargar sesión guardada
            await this.loadStoredSession();

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

            // ❌ TEMPORALMENTE DESHABILITADO (18 Nov 2025): CSP en Vercel preview no permite gsi/style
            // En preview deployments, vercel.json headers NO se aplican correctamente
            // Google OAuth funcionará en PRODUCTION una vez que se mergee a main
            // await this.managers.google.loadServices();

            this.state.googleReady = false; // Deshabilitado temporalmente
            // GDPR: Datos sensibles enmascarados
            debugLog.warn('APP', '⚠️ Google OAuth deshabilitado temporalmente - CSP issue en preview');

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

            // Sanitizar con fallback si sanitizeHTML no está disponible
            let sanitizedHTML = modalHTML;
            try {
                if (typeof DOMPurify !== 'undefined' && typeof sanitizeHTML === 'function') {
                    sanitizedHTML = DOMPurify.sanitize(sanitizeHTML(modalHTML, 'simple'));
                } else if (typeof DOMPurify !== 'undefined') {
                    // Fallback: usar solo DOMPurify si sanitizeHTML no está disponible
                    sanitizedHTML = DOMPurify.sanitize(modalHTML);
                }
                // Si ni DOMPurify está disponible, usar el HTML directamente (último fallback)
            } catch (error) {
                debugLog.warn('ERROR', '⚠️ Error sanitizando modal HTML:', error.message);
                // Usar HTML sin sanitizar como último recurso
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

        // ✅ FIX (19 Nov 2025): Listener DIRECTO al botón de login como respaldo
        // Buscar el botón y agregarle listener directo además del delegado
        const attachDirectListener = () => {
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn && !loginBtn._authListenerAttached) {
                loginBtn._authListenerAttached = true;
                loginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[AUTH-V2] 🔴 Click DIRECTO en loginBtn detectado');

                    const modal = document.getElementById('unified-auth-modal');
                    if (modal) {
                        this.managers.ui.showModal();
                    } else {
                        console.log('[AUTH-V2] ⚠️ Modal no existe, creando...');
                        this.createLoginUI();
                        setTimeout(() => this.managers.ui.showModal(), 100);
                    }
                });
                console.log('[AUTH-V2] ✅ Listener DIRECTO agregado a #loginBtn');
            }
        };

        // Intentar agregar listener directo inmediatamente y después de un delay
        attachDirectListener();
        setTimeout(attachDirectListener, 1000);
        setTimeout(attachDirectListener, 3000);

        console.log('[AUTH-V2] ✅ Event listeners configurados');
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

        console.log('[AUTH-UI] Actualizando UI, autenticado:', this.state.isAuthenticated);

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
            const adminOnlySection = document.getElementById('adminOnlySection');
            if (adminOnlySection) {
                adminOnlySection.classList.toggle('d-none', !['admin', 'administrator'].includes(role));
            }

            console.log('[AUTH-UI] Usuario mostrado:', userMenuName?.textContent, 'Rol:', role);
        } else {
            // Usuario no autenticado - mostrar botón login, ocultar menú usuario
            if (loginButtons) loginButtons.classList.remove('d-none');
            if (userMenu) userMenu.classList.add('d-none');

            // Ocultar secciones admin
            const adminOnlySection = document.getElementById('adminOnlySection');
            if (adminOnlySection) adminOnlySection.classList.add('d-none');

            console.log('[AUTH-UI] Usuario no autenticado, mostrando botón login');
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
        // ✅ FIX (19 Nov 2025): Listener más robusto que detecta el botón por ID también
        document.addEventListener('click', (e) => {
            const target = e.target;
            const loginBtn = target.id === 'loginBtn' || target.closest('#loginBtn');
            const hasDataTarget = target.getAttribute('data-bs-target') === '#unified-auth-modal' ||
                                  target.closest('[data-bs-target="#unified-auth-modal"]');

            if (loginBtn || hasDataTarget) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[AUTH-V2] 📁 Botón de login clickeado, abriendo modal...');

                // 🔧 MANIPULACIÓN DIRECTA DEL DOM - Evitar llamadas a métodos
                const modal = document.getElementById('unified-auth-modal');
                if (!modal) {
                    console.error('[AUTH-V2] ❌ Modal element not found in DOM');
                    // Intentar crear el modal si no existe
                    if (this.auth && this.auth.createLoginUI) {
                        console.log('[AUTH-V2] ⚠️ Intentando crear modal...');
                        this.auth.createLoginUI();
                        const newModal = document.getElementById('unified-auth-modal');
                        if (newModal) {
                            this.showModalDirectly(newModal);
                        }
                    }
                    return;
                }

                this.showModalDirectly(modal);
            }
        });

        // ✅ LISTENER PARA SUBMIT DEL FORMULARIO DE LOGIN
        document.addEventListener('submit', (e) => {
            if (e.target?.id === 'manual-login-form') {
                e.preventDefault();
                this.handleManualLogin();
            }
            // ✅ LISTENER PARA SUBMIT DEL FORMULARIO DE REGISTRO
            if (e.target?.id === 'public-register-form') {
                e.preventDefault();
                this.handlePublicRegister();
            }
        });

        // ✅ LISTENER PARA TOGGLE DE VISIBILIDAD DE CONTRASEÑA
        document.addEventListener('click', (e) => {
            if (e.target?.id === 'toggle-password' || e.target?.closest('#toggle-password')) {
                this.togglePasswordVisibility();
            }
            // Toggle para formulario de registro
            if (e.target?.id === 'toggle-register-password' || e.target?.closest('#toggle-register-password')) {
                this.toggleRegisterPasswordVisibility();
            }
        });

        // ✅ LISTENER PARA CERRAR MODAL CON BOTÓN X
        document.addEventListener('click', (e) => {
            if (e.target?.id === 'modal-close-btn' || e.target?.closest('#modal-close-btn') ||
                e.target?.classList?.contains('btn-close') || e.target?.closest('.btn-close')) {
                e.preventDefault();
                console.log('[AUTH-V2] 🔴 Botón de cerrar clickeado, cerrando modal...');
                this.auth.managers.ui.hideModal();
            }
        });

        // ✅ LISTENER PARA CERRAR MODAL CLICKEANDO EN EL BACKDROP
        document.addEventListener('click', (e) => {
            if (e.target?.classList?.contains('modal-backdrop')) {
                console.log('[AUTH-V2] 🔴 Backdrop clickeado, cerrando modal...');
                this.auth.managers.ui.hideModal();
            }
        });

        // ✅ LISTENER PARA CERRAR MODAL CON ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('unified-auth-modal');
                if (modal && modal.classList.contains('show')) {
                    console.log('[AUTH-V2] 🔴 ESC presionado, cerrando modal...');
                    this.auth.managers.ui.hideModal();
                }
            }
        });

        console.log('[AUTH-V2] ✅ Listeners de ManualLoginManager configurados');
    }

    /**
     * MOSTRAR MODAL DIRECTAMENTE (manipulación DOM)
     */
    showModalDirectly(modal) {
        try {
            // Mostrar el modal manipulando el DOM directamente
            modal.classList.add('show');
            modal.style.display = 'block';
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('role', 'dialog');
            document.body.classList.add('modal-open');

            // Crear o mostrar el backdrop
            let backdrop = document.querySelector('.modal-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
                console.log('[AUTH-V2] ✅ Backdrop creado');
            } else {
                backdrop.classList.add('show');
            }

            console.log('[AUTH-V2] ✅ Modal mostrado exitosamente (DOM directo)');
        } catch (error) {
            console.error('[AUTH-V2] ❌ Error abriendo modal:', error);
        }
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
            // ✅ CORRECCIÓN CRÍTICA: Usar 'username' en lugar de 'email'
            // El endpoint /api/auth/login espera { username, password, rememberMe }
            const response = await fetch(`${this.auth.config.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: email,  // ✅ El campo se llama 'username' en el backend
                    password: password,
                    rememberMe: rememberMe
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // ✅ SEMANA 25: Check if 2FA is required
                if (data.requires2FA) {
                    debugLog.log('AUTH', 'Login requiere 2FA - mostrando modal de verificación');

                    // Store user data temporarily for 2FA verification
                    this.auth.pending2FAData = {
                        userId: data.userId,
                        username: data.user.username,
                        email: data.user.email,
                        role: data.user.role,
                        rememberMe: rememberMe
                    };

                    // Close login modal and show 2FA verification modal
                    this.auth.closeModal();
                    this.auth.show2FAVerificationModal();
                    return;
                }

                // ✅ CORRECCIÓN CRÍTICA: El endpoint devuelve tokens.accessToken, no token
                // Estructura: { success, message, user, tokens: { accessToken, refreshToken, ... }, sessionInfo }
                const accessToken = data.tokens?.accessToken || data.token;
                await this.auth.processLogin(data.user, accessToken, rememberMe);
            } else {
                this.auth.showError(data.error || data.message || 'Credenciales inválidas');
            }
        } catch (error) {
            debugLog.error('ERROR', 'Error en login:', error);
            this.auth.showError('Error de conexión con el servidor');
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
            const response = await fetch(`${this.auth.config.apiBaseUrl}/auth/public-register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    nombre,
                    apellido_paterno
                })
            });

            const data = await response.json();

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
                this.auth.showError(data.message || data.error || 'Error en el registro');
            }
        } catch (error) {
            debugLog.error('ERROR', 'Error en registro:', error);
            this.auth.showError('Error de conexión con el servidor');
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
            submitBtn.innerHTML = isLoading
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
                                <li class="nav-item">
                                    <button class="nav-link" id="register-tab" data-bs-toggle="tab" data-bs-target="#register-form">
                                        <i class="fas fa-user-plus me-2"></i>Registro
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
                                        <p><strong>¿No tienes cuenta?</strong> <a href="#" class="text-primary" data-bs-toggle="tab" data-bs-target="#register-form">Regístrate aquí</a></p>
                                        <p><strong>¿Olvidaste tu contraseña?</strong> <a href="#" class="text-primary">Recupérala aquí</a></p>
                                    </div>
                                </div>

                                <!-- Register Form -->
                                <div class="tab-pane fade" id="register-form">
                                    <form id="public-register-form">
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label fw-bold">Nombre <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control" id="register-nombre"
                                                       placeholder="Tu nombre" required minlength="2">
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label fw-bold">Apellido Paterno <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control" id="register-apellido"
                                                       placeholder="Tu apellido" required minlength="2">
                                            </div>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label fw-bold">Email <span class="text-danger">*</span></label>
                                            <div class="input-group">
                                                <span class="input-group-text">
                                                    <i class="fas fa-envelope text-muted"></i>
                                                </span>
                                                <input type="email" class="form-control" id="register-email"
                                                       placeholder="tu.email@ejemplo.com" required>
                                            </div>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label fw-bold">Contraseña <span class="text-danger">*</span></label>
                                            <div class="input-group">
                                                <span class="input-group-text">
                                                    <i class="fas fa-lock text-muted"></i>
                                                </span>
                                                <input type="password" class="form-control" id="register-password"
                                                       placeholder="Mínimo 8 caracteres" required minlength="8">
                                                <button class="btn btn-outline-secondary" type="button" id="toggle-register-password">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </div>
                                            <small class="text-muted">Debe incluir mayúscula, minúscula y número</small>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label fw-bold">Confirmar Contraseña <span class="text-danger">*</span></label>
                                            <div class="input-group">
                                                <span class="input-group-text">
                                                    <i class="fas fa-lock text-muted"></i>
                                                </span>
                                                <input type="password" class="form-control" id="register-password-confirm"
                                                       placeholder="Repite tu contraseña" required>
                                            </div>
                                        </div>

                                        <div class="form-check mb-3">
                                            <input class="form-check-input" type="checkbox" id="accept-terms" required>
                                            <label class="form-check-label small" for="accept-terms">
                                                Acepto los <a href="terminos.html" target="_blank">términos y condiciones</a>
                                                y la <a href="privacidad.html" target="_blank">política de privacidad</a>
                                            </label>
                                        </div>

                                        <button type="submit" class="btn btn-success w-100 py-2 fw-bold">
                                            <i class="fas fa-user-plus me-2"></i>Crear Cuenta
                                        </button>
                                    </form>

                                    <hr class="my-3">

                                    <div class="small text-muted text-center">
                                        <p class="mb-0"><strong>¿Ya tienes cuenta?</strong> <a href="#" class="text-primary" data-bs-toggle="tab" data-bs-target="#email-login">Inicia sesión aquí</a></p>
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

        container.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitizeHTML(alertHTML)));

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
