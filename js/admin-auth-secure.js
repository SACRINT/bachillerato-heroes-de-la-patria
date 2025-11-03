/**
 * 🛡️ SISTEMA DE AUTENTICACIÓN SEGURO (VERSION 2.0)
 * Bachillerato General Estatal "Héroes de la Patria"
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * ✅ Autenticación server-side con JWT
 * ✅ No más contraseñas hardcoded
 * ✅ Tokens seguros con expiración
 * ✅ Validación server-side
 * ✅ Rate limiting incorporado
 * ✅ Sanitización de inputs
 */

//console.log('🔄 CARGANDO admin-auth-secure.js...');
//console.log('🔍 Bootstrap disponible?', !!window.bootstrap);
//console.log('🔍 DOM listo?', document.readyState);

class SecureAdminAuth {
    constructor() {
        this.apiBaseUrl = this.detectApiUrl();
        this.isAuthenticated = false;
        this.authToken = null;
        this.userInfo = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutos
        
        this.init();
    }

    /**
     * Detectar URL de la API automáticamente
     */
    detectApiUrl() {
        const currentHost = window.location.hostname;
        const currentPort = window.location.port;
        
        // En desarrollo local
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            return '/api';
        }
        
        // En producción, asumimos que la API está en el mismo dominio
        return `${window.location.protocol}//${window.location.host}/api`;
    }

    async init() {
        //console.log('🛡️ Inicializando sistema de autenticación seguro...');
        //console.log(`🌐 API URL: ${this.apiBaseUrl}`);
        
        // Verificar si hay un token existente
        await this.checkExistingSession();
        
        this.setupEventListeners();
        this.updateUI();
        this.startSessionMonitoring();
        
        // Configurar un observer para reconfigurar listeners cuando se carguen partials
        this.setupPartialObserver();
        
        //console.log('✅ Sistema de autenticación seguro inicializado');
    }

    /**
     * Configurar observer para detectar cuando se cargan los partials
     */
    setupPartialObserver() {
        // Verificar periódicamente si el formulario está disponible
        const checkFormInterval = setInterval(() => {
            const form = document.getElementById('adminPanelAuthForm');
            const loginButton = document.getElementById('adminPanelMenuLink');
            
            if (form && !form.hasAttribute('data-auth-listener')) {
                //console.log('🔄 Formulario detectado después de cargar partials, reconfigurando listeners...');
                this.setupEventListeners();
                clearInterval(checkFormInterval);
            }
            
            // También verificar y actualizar UI si el botón de login está disponible
            if (loginButton) {
                //console.log('🔄 Botón de login detectado después de cargar partials, actualizando UI...');
                this.updateUI();
                // No limpiar el interval aquí porque puede necesitarse para el form también
            }
        }, 500);
        
        // Limpiar el interval después de 10 segundos para evitar bucles infinitos
        setTimeout(() => clearInterval(checkFormInterval), 10000);
    }

    /**
     * Verificar sesión existente
     */
    async checkExistingSession() {
        const token = this.getStoredToken();
        
        if (token) {
            //console.log('🔍 Verificando token existente...');
            
            try {
                const isValid = await this.verifyTokenWithServer(token);
                
                if (isValid) {
                    this.authToken = token;
                    this.isAuthenticated = true;
                    //console.log('✅ Token válido - Sesión restaurada');
                } else {
                    //console.log('❌ Token inválido - Limpiando sesión');
                    this.clearSession();
                }
            } catch (error) {
                console.warn('⚠️ Error verificando token:', error);
                this.clearSession();
            }
        }
    }

    /**
     * Obtener token almacenado (prioridad: memoria > localStorage)
     */
    getStoredToken() {
        // Prioridad 1: Token en memoria
        if (this.authToken) {
            return this.authToken;
        }
        
        // Prioridad 2: Token en localStorage
        const storedData = localStorage.getItem('secure_admin_session');
        if (storedData) {
            try {
                const sessionData = JSON.parse(storedData);
                return sessionData.token;
            } catch (error) {
                console.warn('⚠️ Error parsing stored session:', error);
                localStorage.removeItem('secure_admin_session');
            }
        }
        
        return null;
    }

    /**
     * Verificar token con el servidor
     * MODO DESARROLLO: Si estamos en localhost, NO verificar con servidor
     */
    async verifyTokenWithServer(token) {
        // ✅ MODO DESARROLLO: En localhost, confiar en el token local
        const isLocalhost = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname === '';

        if (isLocalhost) {
            console.log('🔧 [DEV MODE] Modo desarrollo: verificación local sin servidor');

            // Verificar solo que el token existe y tiene estructura válida
            try {
                const session = JSON.parse(localStorage.getItem('secure_admin_session'));
                if (session && session.token && session.user) {
                    this.userInfo = session.user;
                    console.log('✅ [DEV MODE] Sesión local válida:', session.user.email);
                    return true;
                }
            } catch (e) {
                console.error('❌ [DEV MODE] Error parseando sesión local:', e);
            }
            return false;
        }

        // MODO PRODUCCIÓN: Verificar con servidor
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.userInfo = data.user;
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error verificando token con servidor:', error);
            return false;
        }
    }

    /**
     * Login seguro con el servidor
     */
    async login(password, username = 'admin') {
        //console.log('🔐 Iniciando login seguro...');

        if (!password || password.trim().length === 0) {
            throw new Error('Contraseña requerida');
        }

        if (!username || username.trim().length === 0) {
            throw new Error('Usuario requerido');
        }

        try {
            // Verificar conectividad primero
            //console.log('🔗 Verificando conectividad con servidor...');

            const requestBody = JSON.stringify({
                username: username.trim(),
                password: password.trim()
            });

            //console.log('📤 Enviando request:', requestBody);

            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: requestBody
            });

            //console.log('📥 Response status:', response.status, response.statusText);

            // Verificar si el response es JSON válido
            const responseText = await response.text();
            //console.log('📥 Response text:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Error parsing JSON:', parseError);
                console.error('📄 Response body:', responseText);

                // Si no es JSON válido, probablemente el servidor devolvió HTML de error
                if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
                    throw new Error('El servidor no está disponible. Intenta más tarde.');
                } else {
                    throw new Error(`Error de comunicación con el servidor: ${responseText.substring(0, 100)}`);
                }
            }

            if (!response.ok) {
                console.warn('🚫 Login fallido:', data);

                // Manejar diferentes tipos de error
                if (data.code === 'INVALID_CREDENTIALS') {
                    throw new Error('Contraseña incorrecta');
                } else if (data.code === 'TOO_MANY_LOGIN_ATTEMPTS') {
                    throw new Error('Demasiados intentos. Intenta en 15 minutos');
                } else if (data.code === 'VALIDATION_ERROR') {
                    throw new Error('Contraseña no cumple requisitos de seguridad');
                } else {
                    throw new Error(data.error || 'Error de autenticación');
                }
            }

            // Login exitoso
            console.log('✅ Login exitoso');

            this.authToken = data.token;
            this.userInfo = data.user;
            this.isAuthenticated = true;

            console.log('🔐 Estado después del login:', {
                isAuthenticated: this.isAuthenticated,
                token: !!this.authToken,
                user: this.userInfo
            });

            // Almacenar sesión
            this.storeSession(data.token, data.user);

            // Actualizar UI
            console.log('🔄 Llamando a updateUI después del login exitoso...');
            this.updateUI();
            this.showSuccessMessage();

            return {
                success: true,
                user: data.user
            };
            
        } catch (error) {
            console.error('❌ Error en login:', error);

            // Manejo específico de errores de conectividad
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('🔌 Error de conexión. El servidor no está disponible. Verifica tu conexión e intenta de nuevo.');
            }

            // Error de red general
            if (error.message.includes('NetworkError') || error.message.includes('net::')) {
                throw new Error('🌐 Error de red. Verifica tu conexión a internet e intenta de nuevo.');
            }

            // Error de timeout
            if (error.name === 'AbortError' || error.message.includes('timeout')) {
                throw new Error('⏱️ Tiempo de espera agotado. El servidor está tardando mucho en responder.');
            }

            // Error específico de CORS
            if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
                throw new Error('🚫 Error de CORS. Problema de configuración del servidor.');
            }

            // Si ya es un error con mensaje personalizado, propagarlo
            if (error.message && !error.message.includes('TypeError')) {
                throw error;
            }

            // Error genérico
            throw new Error('❌ Error inesperado durante la autenticación. Intenta de nuevo.');
        }
    }

    /**
     * Almacenar sesión de forma segura
     */
    storeSession(token, userInfo) {
        const sessionData = {
            token: token,
            user: userInfo,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout
        };
        
        localStorage.setItem('secure_admin_session', JSON.stringify(sessionData));
        //console.log('💾 Sesión almacenada de forma segura');
    }

    /**
     * Logout seguro
     */
    async logout() {
        //console.log('🚪 Iniciando logout seguro...');
        
        try {
            // Intentar logout en el servidor
            if (this.authToken) {
                await fetch(`${this.apiBaseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
            }
        } catch (error) {
            console.warn('⚠️ Error en logout del servidor (continuando):', error);
        }
        
        // Limpiar sesión local
        this.clearSession();
        this.updateUI();
        
        // NUEVO: Limpiar completamente el estado de modals y formularios
        this.resetModalAndFormState();
        
        // Reconfigurar listeners para asegurar que funcione el próximo login
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
        
        this.showLogoutMessage();
        
        //console.log('✅ Logout completado con reset completo');
    }

    /**
     * Limpiar sesión local
     */
    clearSession() {
        this.authToken = null;
        this.userInfo = null;
        this.isAuthenticated = false;
        
        // Limpiar almacenamiento
        localStorage.removeItem('secure_admin_session');
        localStorage.removeItem('admin_session'); // Limpiar sesión antigua también
        
        //console.log('🗑️ Sesión local limpiada');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Estrategia múltiple para encontrar el formulario
        const formSelectors = [
            '#adminPanelAuthForm',
            'form[data-auth-form="true"]',
            'form.auth-form',
            'form[action*="auth"]',
            'form[action*="login"]'
        ];
        
        let form = null;
        let foundSelector = '';
        
        for (const selector of formSelectors) {
            form = document.querySelector(selector);
            if (form) {
                foundSelector = selector;
                break;
            }
        }
        
        //console.log('🔍 Configurando listeners - Formulario encontrado:', !!form, foundSelector);
        
        if (form && !form.hasAttribute('data-auth-listener')) {
            form.addEventListener('submit', async (e) => {
                //console.log('📝 Evento submit disparado en el formulario');
                e.preventDefault();
                await this.handleLogin(e);
            });
            form.setAttribute('data-auth-listener', 'true');
            form.id = 'adminPanelAuthForm'; // Asegurar ID consistente
            //console.log('✅ Listener de submit configurado en el formulario');
        } else if (form && form.hasAttribute('data-auth-listener')) {
            //console.log('✅ Formulario ya tiene listener configurado');
        } else {
            //console.log('ℹ️ Modal de autenticación no encontrado en esta página (normal en páginas que no lo requieren)');
        }
        
        // Manejar visibilidad de página (detectar cuando vuelve el usuario)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAuthenticated) {
                this.verifyCurrentSession();
            }
        });
    }

    /**
     * Manejar evento de login
     */
    async handleLogin(event) {
        event.preventDefault();
        //console.log('🔐 handleLogin EJECUTÁNDOSE - Evento submit detectado');
        
        const passwordInput = document.getElementById('adminPanelPassword');
        const usernameInput = document.getElementById('adminPanelUsername');
        const errorElement = document.getElementById('adminPanelAuthError');
        const errorTextElement = document.getElementById('adminPanelAuthErrorText');
        
        // Buscar botón de submit de forma más flexible
        let submitButton = null;
        try {
            submitButton = event.target.querySelector('button[type="submit"]') || 
                          document.querySelector('#adminPanelAuthForm button[type="submit"]') ||
                          document.querySelector('.btn[onclick*="processLogin"]');
        } catch (error) {
            console.warn('⚠️ No se pudo encontrar botón de submit:', error);
        }
        
        // Limpiar errores previos
        this.hideError(errorElement);
        
        if (!passwordInput || !passwordInput.value.trim()) {
            this.showError(errorElement, errorTextElement, 'Por favor ingresa la contraseña');
            return;
        }
        
        // Deshabilitar botón y mostrar loading (si existe)
        let originalButtonText = 'Acceder al Panel';
        if (submitButton) {
            originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';
        }
        
        try {
            await this.login(passwordInput.value, usernameInput.value);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('adminPanelAuthModal'));
            if (modal) {
                modal.hide();
            }
            
            // Limpiar formulario
            passwordInput.value = '';
            
        } catch (error) {
            console.error('❌ Error en handleLogin:', error);
            this.showError(errorElement, errorTextElement, error.message);
            
        } finally {
            // Restaurar botón (si existe)
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        }
    }

    /**
     * Verificar sesión actual periódicamente
     */
    async verifyCurrentSession() {
        if (!this.isAuthenticated || !this.authToken) return;
        
        try {
            const isValid = await this.verifyTokenWithServer(this.authToken);
            
            if (!isValid) {
                //console.log('⚠️ Sesión expirada - Cerrando automáticamente');
                this.clearSession();
                this.updateUI();
                this.showSessionExpiredMessage();
            }
        } catch (error) {
            console.warn('⚠️ Error verificando sesión:', error);
        }
    }

    /**
     * Actualizar interfaz de usuario
     */
    updateUI() {
        console.log(`🔄 Actualizando UI - Autenticado: ${this.isAuthenticated}`);

        // Elementos admin-only
        const adminElements = document.querySelectorAll('#adminOnlySection, #adminOnlySection2');
        const loginButton = document.getElementById('adminPanelMenuLink');
        const logoutOption = document.getElementById('adminPanelLogoutOption'); // ✅ NUEVO: botón "Cerrar Sesión" del header
        const dashboardLink = document.getElementById('adminDashboardLink'); // ✅ NUEVO: enlace "Dashboard Admin"

        console.log(`🔍 Elementos admin encontrados: ${adminElements.length}`);
        console.log(`🔍 Botón login encontrado:`, !!loginButton);
        console.log(`🔍 Botón logout encontrado:`, !!logoutOption); // ✅ NUEVO
        if (loginButton) {
            console.log(`🔍 Contenido actual del botón:`, loginButton.innerHTML);
        }

        // DEBUG: Listar TODOS los elementos con IDs que contienen "admin"
        console.log('🔍 DEBUG: Buscando todos los elementos con "admin" en el ID...');
        const allElements = document.querySelectorAll('[id*="admin"], [id*="Admin"]');
        console.log(`🔍 Total de elementos con "admin" en ID: ${allElements.length}`);
        allElements.forEach(el => {
            console.log(`   - ID: ${el.id}, Classes: ${el.className}, Visible: ${!el.classList.contains('d-none')}`);
        });

        adminElements.forEach((element, index) => {
            console.log(`🔍 Elemento admin ${index + 1}:`, element.id, element.classList.toString());

            if (this.isAuthenticated) {
                console.log(`🟢 Mostrando elemento admin: ${element.id}`);
                element.classList.remove('d-none');
                element.style.display = '';
            } else {
                console.log(`🔴 Ocultando elemento admin: ${element.id}`);
                element.classList.add('d-none');
            }

            console.log(`🔍 Estado después - ${element.id}:`, element.classList.toString());
        });

        // ✅ NUEVO: Actualizar botón "Cerrar Sesión" del header
        if (logoutOption) {
            if (this.isAuthenticated) {
                console.log(`🟢 Mostrando botón "Cerrar Sesión" del header`);
                logoutOption.classList.remove('d-none');
            } else {
                console.log(`🔴 Ocultando botón "Cerrar Sesión" del header`);
                logoutOption.classList.add('d-none');
            }
        }

        // ✅ NUEVO: NO actualizar el enlace "Dashboard Admin" - dejarlo sin nombre de usuario
        // (Se mantiene como está en el HTML: "Dashboard Admin")

        // Actualizar botón de login
        if (loginButton) {
            //console.log(`🔄 Actualizando botón - Autenticado: ${this.isAuthenticated}`);
            if (this.isAuthenticated) {
                // ✅ CORRECCIÓN: Mostrar botón "Admin (usuario)" en VERDE cuando esté autenticado
                loginButton.parentElement.classList.remove('d-none');

                // Obtener nombre de usuario (extraer solo la parte antes del @ si es email)
                let username = this.userInfo?.username || this.userInfo?.email || 'admin';

                // Si contiene @, extraer solo la parte antes del @
                if (username.includes('@')) {
                    username = username.split('@')[0];
                }

                // Actualizar texto y estilo (username en BLANCO para mejor visibilidad)
                loginButton.innerHTML = `<i class="fas fa-shield-halved me-2"></i>Admin (${username})`;
                loginButton.classList.add('text-success', 'bg-success', 'bg-opacity-25');
                loginButton.classList.remove('text-danger');

                // Cambiar a función que redirige al dashboard
                loginButton.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = 'admin-dashboard.html';
                    return false;
                };

                //console.log('✅ Botón actualizado para mostrar usuario autenticado');

            } else {
                // Mostrar el botón "Admin" cuando NO esté autenticado
                loginButton.parentElement.classList.remove('d-none');
                loginButton.innerHTML = '<i class="fas fa-shield-halved me-2"></i>Admin';
                loginButton.classList.remove('text-success', 'text-danger', 'bg-success', 'bg-opacity-25');

                // Cambiar a función de mostrar modal
                loginButton.onclick = (e) => {
                    e.preventDefault();
                    //console.log('🔐 Login clickeado desde botón');
                    this.showLoginModal();
                    return false;
                };

                //console.log('✅ Botón actualizado para login');
            }
        } else {
            //console.log('ℹ️ Botón de admin no encontrado en esta página (normal en páginas sin menú de admin)');
        }

        //console.log('✅ UI actualizada');
    }

    /**
     * Mostrar modal de login
     */
    showLoginModal() {
        const modal = document.getElementById('adminPanelAuthModal');
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    /**
     * Resetear completamente el estado de modales y formularios
     * Para resolver el problema de requerir recarga después de logout
     */
    resetModalAndFormState() {
        //console.log('🔄 Reseteando estado de modales y formularios...');
        
        try {
            // 1. Limpiar todas las instancias de modales Bootstrap
            const modal = document.getElementById('adminPanelAuthModal');
            if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                    modalInstance.dispose();
                    //console.log('✅ Modal Bootstrap disposed');
                }
                
                // Limpiar el backdrop manualmente si existe
                document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                    backdrop.remove();
                });
                
                // Remover clases de modal-open del body
                document.body.classList.remove('modal-open');
                document.body.style.paddingRight = '';
                document.body.style.overflow = '';
            }
            
            // 2. Limpiar todos los formularios relacionados
            const form = document.getElementById('adminPanelAuthForm');
            if (form) {
                // Remover listeners existentes
                form.removeAttribute('data-auth-listener');
                
                // Limpiar el formulario
                form.reset();
                
                // Limpiar errores
                const errorElement = document.getElementById('adminPanelAuthError');
                const errorTextElement = document.getElementById('adminPanelAuthErrorText');
                this.hideError(errorElement);
                
                //console.log('✅ Formulario limpiado y reseteado');
            }
            
            // 3. Resetear el botón de login para asegurar que funcione
            const loginButton = document.getElementById('adminPanelMenuLink');
            if (loginButton) {
                // Eliminar todos los event listeners clonando el elemento
                const newLoginButton = loginButton.cloneNode(true);
                loginButton.parentNode.replaceChild(newLoginButton, loginButton);
                //console.log('✅ Botón de login reconstruido');
            }
            
            //console.log('✅ Reset completo de modal y formulario terminado');
            
        } catch (error) {
            console.warn('⚠️ Error durante reset de modal/formulario:', error);
        }
    }

    /**
     * Monitoring de sesión
     */
    startSessionMonitoring() {
        // Verificar cada 5 minutos
        setInterval(() => {
            if (this.isAuthenticated) {
                this.verifyCurrentSession();
            }
        }, 5 * 60 * 1000);

        // Advertencia a 5 minutos de expiración
        setInterval(() => {
            if (this.isAuthenticated && this.userInfo) {
                const storedData = localStorage.getItem('secure_admin_session');
                if (storedData) {
                    try {
                        const sessionData = JSON.parse(storedData);
                        const timeLeft = sessionData.expiresAt - Date.now();
                        
                        // Advertir a 5 minutos de expiración
                        if (timeLeft <= 5 * 60 * 1000 && timeLeft > 4.9 * 60 * 1000) {
                            this.showExpirationWarning();
                        }
                    } catch (error) {
                        console.warn('Error checking session expiration:', error);
                    }
                }
            }
        }, 30 * 1000); // Check cada 30 segundos
    }

    // ============================================
    // MENSAJES DE USUARIO
    // ============================================

    showSuccessMessage() {
        this.showToast('success', 'Acceso Autorizado', `Bienvenido, administrador. Sesión iniciada correctamente.`);
    }

    showLogoutMessage() {
        this.showToast('info', 'Sesión Cerrada', 'Has cerrado la sesión de administrador de forma segura.');
    }

    showSessionExpiredMessage() {
        this.showToast('warning', 'Sesión Expirada', 'Tu sesión ha expirado por seguridad. Inicia sesión nuevamente.');
    }

    showExpirationWarning() {
        this.showToast('warning', 'Sesión por Expirar', 'Tu sesión expirará en 5 minutos. Guarda tu trabajo.');
    }

    showError(errorElement, errorTextElement, message) {
        if (errorElement && errorTextElement) {
            errorTextElement.textContent = message;
            errorElement.classList.remove('d-none');
        }
        console.error('🚨 Error mostrado al usuario:', message);
    }

    hideError(errorElement) {
        if (errorElement) {
            errorElement.classList.add('d-none');
        }
    }

    showToast(type, title, message) {
        const colors = {
            success: 'bg-success',
            info: 'bg-info', 
            warning: 'bg-warning',
            danger: 'bg-danger'
        };

        const toast = document.createElement('div');
        toast.className = `toast position-fixed top-0 end-0 m-3`;
        toast.style.zIndex = '9999';
        
        toast.innerHTML = `
            <div class="toast-header ${colors[type]} text-white">
                <i class="fas fa-shield-alt me-2"></i>
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        setTimeout(() => toast.remove(), 5000);
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    /**
     * Verificar si está autenticado
     */
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * Obtener información del usuario
     */
    getUserInfo() {
        return this.userInfo;
    }

    /**
     * Requerir autenticación para una acción
     */
    requireAuth(callback) {
        if (this.isAuthenticated) {
            callback();
        } else {
            this.showToast('warning', 'Autenticación Requerida', 'Debes iniciar sesión como administrador.');
            this.showLoginModal();
        }
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

let secureAdminAuth;

function initSecureAuthSystem() {
    if (!secureAdminAuth) {
        console.log('🚀 Inicializando sistema de autenticación seguro...');
        secureAdminAuth = new SecureAdminAuth();

        // Funciones globales para compatibilidad
        window.secureAdminAuth = secureAdminAuth;
        console.log('✅ window.secureAdminAuth establecido:', !!window.secureAdminAuth);
        window.isAdminAuthenticated = () => secureAdminAuth.isUserAuthenticated();
        window.requireAdminAuth = (callback) => secureAdminAuth.requireAuth(callback);
        window.showAdminPanelAuth = () => secureAdminAuth.showLoginModal();
        window.logoutAdminPanel = () => secureAdminAuth.logout();
        
        // Función para panel de administración
        window.openAdminPanel = function() {
            secureAdminAuth.requireAuth(() => {
                const windowFeatures = [
                    'width=1200', 'height=800',
                    'left=' + (screen.width / 2 - 600),
                    'top=' + (screen.height / 2 - 400),
                    'resizable=yes', 'scrollbars=yes'
                ].join(',');
                
                // Obtener el token actual
                const token = secureAdminAuth.authToken;
                const userInfo = secureAdminAuth.userInfo;
                
                // Abrir ventana y pasar datos de autenticación
                const adminWindow = window.open('admin/manual.html', 'AdminPanel', windowFeatures);
                if (adminWindow) {
                    adminWindow.focus();
                    
                    // Esperar a que la ventana cargue y pasarle los datos de autenticación
                    adminWindow.addEventListener('load', () => {
                        if (adminWindow.postMessage) {
                            adminWindow.postMessage({
                                type: 'AUTH_DATA',
                                token: token,
                                userInfo: userInfo,
                                authenticated: true
                            }, '*');
                        }
                    });
                    
                    // También intentar enviar después de un delay por si el load ya pasó
                    setTimeout(() => {
                        if (adminWindow && !adminWindow.closed && adminWindow.postMessage) {
                            adminWindow.postMessage({
                                type: 'AUTH_DATA',
                                token: token,
                                userInfo: userInfo,
                                authenticated: true
                            }, '*');
                        }
                    }, 1000);
                }
            });
        };
        
        //console.log('✅ Sistema de autenticación seguro listo');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initSecureAuthSystem);

// NUEVA: También inicializar inmediatamente para asegurar disponibilidad
// Esto resuelve problemas de timing con verificaciones tempranas
if (document.readyState === 'loading') {
    // Si el DOM aún se está cargando, esperar hasta que esté listo
    document.addEventListener('DOMContentLoaded', initSecureAuthSystem);
} else {
    // Si el DOM ya está listo, inicializar inmediatamente
    initSecureAuthSystem();
}

// Exponer función de inicialización
window.initSecureAuthSystem = initSecureAuthSystem;

console.log('✅ admin-auth-secure.js CARGADO COMPLETAMENTE');
console.log('🔍 window.initSecureAuthSystem disponible?', !!window.initSecureAuthSystem);

// ============================================
// FUNCIÓN PARA EL BOTÓN DE LOGIN DEL HEADER
// ============================================

/**
 * Función global llamada por el botón "Acceder al Panel" del header
 */
window.handleAdminLogin = function() {
    //console.log('🔑 handleAdminLogin llamado desde el header');

    // PRIMERO: Verificar si ya existe una sesión válida
    const existingSession = localStorage.getItem('secure_admin_session');
    if (existingSession) {
        try {
            const session = JSON.parse(existingSession);
            const now = Date.now();

            // Verificar si la sesión es válida y no ha expirado
            if (session.token && session.expiresAt && session.expiresAt > now) {
                //console.log('✅ Sesión válida encontrada, redirigiendo a panel admin...');
                window.location.href = 'admin-dashboard.html';
                return; // Salir de la función
            } else {
                //console.log('⚠️ Sesión expirada o inválida, limpiando...');
                localStorage.removeItem('secure_admin_session');
            }
        } catch (error) {
            console.error('❌ Error al verificar sesión:', error);
            localStorage.removeItem('secure_admin_session');
        }
    }

    // Si no hay sesión válida, mostrar modal de login
    //console.log('🔍 Debug: secureAdminAuth existe?', !!secureAdminAuth);
    //console.log('🔍 Debug: window.secureAdminAuth existe?', !!window.secureAdminAuth);

    // Intentar usar window.secureAdminAuth primero
    const authInstance = secureAdminAuth || window.secureAdminAuth;

    if (!authInstance) {
        //console.log('⏳ Sistema no inicializado, inicializando...');
        initSecureAuthSystem();

        // Dar tiempo para que se inicialice
        setTimeout(() => {
            const newAuthInstance = secureAdminAuth || window.secureAdminAuth;
            if (newAuthInstance) {
                //console.log('✅ Sistema inicializado, mostrando modal...');
                newAuthInstance.showLoginModal();
            } else {
                console.error('❌ Error: No se pudo inicializar el sistema de autenticación');
                // Fallback: intentar abrir el modal directamente
                //console.log('🔧 Fallback: Intentando abrir modal directamente...');
                const modal = document.getElementById('adminPanelAuthModal');
                if (modal) {
                    const bootstrapModal = new bootstrap.Modal(modal);
                    bootstrapModal.show();
                } else {
                    alert('Error: Sistema de autenticación no disponible');
                }
            }
        }, 200);
    } else {
        // Sistema ya inicializado, mostrar modal directamente
        //console.log('✅ Sistema ya inicializado, mostrando modal...');
        try {
            authInstance.showLoginModal();
        } catch (error) {
            console.error('❌ Error llamando showLoginModal:', error);
            // Fallback: intentar abrir el modal directamente
            //console.log('🔧 Fallback: Intentando abrir modal directamente...');
            const modal = document.getElementById('adminPanelAuthModal');
            if (modal) {
                const bootstrapModal = new bootstrap.Modal(modal);
                bootstrapModal.show();
            }
        }
    }
};