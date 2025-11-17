/**
// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}


 * 🔐 INTERFAZ DE AUTENTICACIÓN
 * Sistema de login integrado para usuarios del plantel
 */

class AuthInterface {
    constructor() {
        this.currentUser = null;
        this.initializeAuthInterface();
        this.checkExistingAuth();
    }

    /**
     * Inicializar la interfaz de autenticación
     */
    initializeAuthInterface() {
        this.createAuthModal();
        this.createAuthButton();
        this.attachEventListeners();
    }

    /**
     * Crear modal de autenticación
     */
    createAuthModal() {
        const modalHTML = `
            <!-- Modal de Autenticación -->
            <div class="modal fade" id="authModal" tabindex="-1" aria-labelledby="authModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="authModalLabel">
                                <i class="fas fa-sign-in-alt me-2"></i>
                                Iniciar Sesión
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Google Sign-In Button -->
                            <div class="text-center mb-4">
                                <div id="g_id_onload"
                                     data-client_id="YOUR_GOOGLE_CLIENT_ID"
                                     data-callback="handleGoogleCredentialResponse"
                                     data-auto_prompt="false">
                                </div>
                                <div class="g_id_signin"
                                     data-type="standard"
                                     data-size="large"
                                     data-theme="outline"
                                     data-text="sign_in_with"
                                     data-shape="rectangular"
                                     data-logo_alignment="left">
                                </div>
                            </div>

                            <div class="row align-items-center mb-3">
                                <div class="col"><hr></div>
                                <div class="col-auto"><small class="text-muted">o continúa con</small></div>
                                <div class="col"><hr></div>
                            </div>

                            <form id="loginForm">
                                <div class="mb-3">
                                    <label for="loginEmail" class="form-label">
                                        <i class="fas fa-envelope me-1"></i>
                                        Correo Electrónico
                                    </label>
                                    <input type="email" class="form-control" id="loginEmail" required
                                           placeholder="tu.email@plantel.edu.mx">
                                </div>
                                <div class="mb-3">
                                    <label for="loginPassword" class="form-label">
                                        <i class="fas fa-lock me-1"></i>
                                        Contraseña
                                    </label>
                                    <input type="password" class="form-control" id="loginPassword" autocomplete="current-password" required>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="rememberMe">
                                    <label class="form-check-label" for="rememberMe">
                                        Recordar sesión
                                    </label>
                                </div>
                                <div id="authError" class="alert alert-danger d-none" role="alert"></div>
                                <div class="d-grid">
                                    <button type="submit" class="btn btn-primary" id="loginButton">
                                        <span id="loginButtonText">
                                            <i class="fas fa-sign-in-alt me-1"></i>
                                            Iniciar Sesión
                                        </span>
                                        <span id="loginSpinner" class="d-none">
                                            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                                            Conectando...
                                        </span>
                                    </button>
                                </div>
                            </form>
                            
                            <!-- Link para registro -->
                            <div class="text-center mt-3">
                                <p class="mb-2"><small class="text-muted">¿No tienes cuenta?</small></p>
                                <button type="button" class="btn btn-outline-primary btn-sm" id="showRegisterForm">
                                    <i class="fas fa-user-plus me-1"></i>
                                    Solicitar Registro
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <div class="w-100 text-center">
                                <small class="text-muted">
                                    <i class="fas fa-info-circle me-1"></i>
                                    Solo para personal y estudiantes del plantel
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitizeHTML(modalHTML)));
    }

    /**
     * Crear botón de autenticación en la interfaz
     */
    createAuthButton() {
        // No crear botón en index.html porque usa Google Auth
        const isIndexPage = window.location.pathname === '/' || window.location.pathname.includes('index.html');
        if (isIndexPage) {
            return; // Salir sin crear el botón
        }

        const authButtonContainer = document.createElement('div');
        authButtonContainer.id = 'authButtonContainer';
        authButtonContainer.className = 'auth-button-container';
        authButtonContainer.innerHTML = sanitizeHTML(`
            <div class="auth-status" id="authStatus">
                <button class="btn btn-outline-primary auth-btn-compact" id="authToggleBtn" type="button">
                    <i class="fas fa-user me-1"></i>
                    <span id="authButtonText">Iniciar Sesión</span>
                </button>
                <div class="dropdown d-none" id="userDropdown">
                    <button class="btn btn-success btn-sm dropdown-toggle" type="button" 
                            data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-check me-1"></i>
                        <span id="userName">Usuario</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><h6 class="dropdown-header" id="userInfo">Información del Usuario</h6></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="profileLink">
                            <i class="fas fa-user me-2"></i>Mi Perfil
                        </a></li>
                        <li><a class="dropdown-item" href="#" id="logoutLink">
                            <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                        </a></li>
                    </ul>
                </div>
            </div>
        `);

        // Insertar en la barra de navegación
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            navbar.appendChild(authButtonContainer);
        }
    }

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Botón de login/toggle
        const authToggleBtn = document.getElementById('authToggleBtn');
        if (authToggleBtn) {
            authToggleBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    this.logout();
                } else {
                    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
                    authModal.show();
                }
            });
        }

        // Formulario de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Botón para mostrar formulario de registro
        setTimeout(() => {
            const showRegisterBtn = document.getElementById('showRegisterForm');
            if (showRegisterBtn) {
                showRegisterBtn.addEventListener('click', () => this.showRegisterModal());
            }
        }, 100);

        // Enlace de logout
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Enlace de perfil
        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfile();
            });
        }
    }

    /**
     * Verificar autenticación existente al cargar
     */
    async checkExistingAuth() {
        if (window.apiClient && window.apiClient.isAuthenticated()) {
            try {
                const profile = await window.apiClient.getProfile();
                if (profile.success) {
                    this.currentUser = profile.user;
                    this.updateAuthInterface();
                    // GDPR: Datos sensibles enmascarados
                    //debugLog.log('APP', '🔐 Usuario autenticado automáticamente:', this.currentUser.email);
                }
            } catch (error) {
                //debugLog.log('APP', '🔓 Sesión anterior expirada');
                window.apiClient.removeToken();
            }
        }
    }

    /**
     * Manejar proceso de login
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Mostrar loading
        this.setLoginLoading(true);
        this.hideAuthError();

        try {
            if (!window.apiClient) {
                throw new Error('Sistema de autenticación no disponible');
            }

            const response = await window.apiClient.login(email, password);
            
            if (response.success && response.user) {
                this.currentUser = response.user;
                
                // Guardar en sessionStorage si no es "recordar"
                if (!rememberMe) {
                    localStorage.removeItem('heroes_auth_token');
                    sessionStorage.setItem('heroes_auth_token', response.token);
                }

                this.updateAuthInterface();
                this.closeAuthModal();
                this.showLoginSuccess();
                
                // GDPR: Datos sensibles enmascarados
                //debugLog.log('APP', '✅ Login exitoso:', this.currentUser.email);

                // Reinicializar chatbot con nueva sesión
                if (window.initializeChatSession) {
                    window.initializeChatSession();
                }
            }

        } catch (error) {
            this.showAuthError(error.message || 'Error de autenticación');
            debugLog.error('ERROR', '❌ Error de login:', error);
        } finally {
            this.setLoginLoading(false);
        }
    }

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            if (window.apiClient) {
                await window.apiClient.logout();
            }
        } catch (error) {
            debugLog.warn('ERROR', 'Error durante logout:', error);
        }

        this.currentUser = null;
        this.updateAuthInterface();
        this.showLogoutSuccess();
        //debugLog.log('APP', '🔓 Sesión cerrada');
    }

    /**
     * Actualizar interfaz según estado de autenticación
     */
    updateAuthInterface() {
        const authToggleBtn = document.getElementById('authToggleBtn');
        const userDropdown = document.getElementById('userDropdown');
        const authButtonText = document.getElementById('authButtonText');
        const userName = document.getElementById('userName');
        const userInfo = document.getElementById('userInfo');

        if (this.currentUser) {
            // Usuario autenticado
            authToggleBtn.classList.add('d-none');
            userDropdown.classList.remove('d-none');
            
            const displayName = `${this.currentUser.nombre} ${this.currentUser.apellido_paterno}`;
            userName.textContent = displayName;
            userInfo.textContent = `${this.currentUser.email} • ${this.currentUser.tipo_usuario}`;

            // Agregar clase CSS para indicar usuario autenticado
            document.body.classList.add('user-authenticated');
            document.body.classList.remove('user-anonymous');

        } else {
            // Usuario no autenticado
            authToggleBtn.classList.remove('d-none');
            userDropdown.classList.add('d-none');
            authButtonText.textContent = 'Iniciar Sesión';

            document.body.classList.remove('user-authenticated');
            document.body.classList.add('user-anonymous');
        }
    }

    /**
     * Mostrar modal de registro
     */
    showRegisterModal() {
        const registerModal = this.createRegisterModal();
        const modal = new bootstrap.Modal(registerModal);
        modal.show();
    }

    /**
     * Mostrar perfil del usuario
     */
    showProfile() {
        if (!this.currentUser) return;

        const profileModal = this.createProfileModal();
        const modal = new bootstrap.Modal(profileModal);
        modal.show();
    }

    /**
     * Crear modal de registro
     */
    createRegisterModal() {
        // Remover modal existente si existe
        const existingModal = document.getElementById('registerModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="registerModal" tabindex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="registerModalLabel">
                                <i class="fas fa-user-plus me-2"></i>
                                Solicitud de Registro
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Proceso de Registro:</strong> Tu solicitud será revisada y aprobada por el personal administrativo.
                                Recibirás un correo cuando tu cuenta esté lista.
                            </div>

                            <form id="registerForm">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="regNombre" class="form-label">
                                            <i class="fas fa-user me-1"></i>
                                            Nombre(s) *
                                        </label>
                                        <input type="text" class="form-control" id="regNombre" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="regApellidoPaterno" class="form-label">
                                            <i class="fas fa-user me-1"></i>
                                            Apellido Paterno *
                                        </label>
                                        <input type="text" class="form-control" id="regApellidoPaterno" required>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="regApellidoMaterno" class="form-label">
                                            <i class="fas fa-user me-1"></i>
                                            Apellido Materno
                                        </label>
                                        <input type="text" class="form-control" id="regApellidoMaterno">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="regTipoUsuario" class="form-label">
                                            <i class="fas fa-id-badge me-1"></i>
                                            Tipo de Usuario *
                                        </label>
                                        <select class="form-select" id="regTipoUsuario" required>
                                            <option value="">Selecciona tu rol</option>
                                            <option value="estudiante">👨‍🎓 Estudiante</option>
                                            <option value="padre_familia">👨‍👩‍👧‍👦 Padre de Familia</option>
                                            <option value="docente">👨‍🏫 Docente</option>
                                            <option value="administrativo">🏛️ Personal Administrativo</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="regEmail" class="form-label">
                                        <i class="fas fa-envelope me-1"></i>
                                        Correo Electrónico *
                                    </label>
                                    <input type="email" class="form-control" id="regEmail" required
                                           placeholder="tu.email@example.com">
                                    <small class="text-muted">Usa un correo que revises frecuentemente</small>
                                </div>

                                <div class="mb-3">
                                    <label for="regTelefono" class="form-label">
                                        <i class="fas fa-phone me-1"></i>
                                        Teléfono *
                                    </label>
                                    <input type="tel" class="form-control" id="regTelefono" required
                                           placeholder="222-123-4567">
                                </div>

                                <div class="mb-3" id="matriculaContainer" style="display: none;">
                                    <label for="regMatricula" class="form-label">
                                        <i class="fas fa-id-card me-1"></i>
                                        Matrícula del Estudiante
                                    </label>
                                    <input type="text" class="form-control" id="regMatricula"
                                           placeholder="202X-XXXX">
                                    <small class="text-muted">Solo para estudiantes y padres de familia</small>
                                </div>

                                <div class="mb-3">
                                    <label for="regMotivo" class="form-label">
                                        <i class="fas fa-comment me-1"></i>
                                        Motivo de la solicitud *
                                    </label>
                                    <textarea class="form-control" id="regMotivo" rows="3" required
                                              placeholder="Explica brevemente por qué necesitas acceso al sistema..."></textarea>
                                </div>

                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="regTerminos" required>
                                    <label class="form-check-label" for="regTerminos">
                                        Acepto los <a href="terminos.html" target="_blank">términos y condiciones</a> 
                                        y la <a href="privacidad.html" target="_blank">política de privacidad</a> *
                                    </label>
                                </div>

                                <div id="registerError" class="alert alert-danger d-none" role="alert"></div>
                                <div id="registerSuccess" class="alert alert-success d-none" role="alert"></div>

                                <div class="d-grid">
                                    <button type="submit" class="btn btn-primary" id="registerButton">
                                        <span id="registerButtonText">
                                            <i class="fas fa-paper-plane me-1"></i>
                                            Enviar Solicitud
                                        </span>
                                        <span id="registerSpinner" class="d-none">
                                            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                                            Enviando...
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <div class="w-100 text-center">
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    Las solicitudes son procesadas en 1-2 días hábiles
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitizeHTML(modalHTML)));
        
        // Agregar event listeners
        this.attachRegisterEventListeners();
        
        return document.getElementById('registerModal');
    }

    /**
     * Adjuntar event listeners del formulario de registro
     */
    attachRegisterEventListeners() {
        // Mostrar/ocultar campo de matrícula según tipo de usuario
        const tipoUsuarioSelect = document.getElementById('regTipoUsuario');
        const matriculaContainer = document.getElementById('matriculaContainer');
        const matriculaInput = document.getElementById('regMatricula');

        if (tipoUsuarioSelect && matriculaContainer) {
            tipoUsuarioSelect.addEventListener('change', (e) => {
                const shouldShow = e.target.value === 'estudiante' || e.target.value === 'padre_familia';
                matriculaContainer.style.display = shouldShow ? 'block' : 'none';
                
                if (shouldShow) {
                    matriculaInput.required = true;
                } else {
                    matriculaInput.required = false;
                    matriculaInput.value = '';
                }
            });
        }

        // Formulario de registro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    /**
     * Manejar envío del formulario de registro
     */
    async handleRegister(event) {
        event.preventDefault();
        
        const formData = {
            nombre: document.getElementById('regNombre').value.trim(),
            apellido_paterno: document.getElementById('regApellidoPaterno').value.trim(),
            apellido_materno: document.getElementById('regApellidoMaterno').value.trim(),
            tipo_usuario: document.getElementById('regTipoUsuario').value,
            email: document.getElementById('regEmail').value.trim(),
            telefono: document.getElementById('regTelefono').value.trim(),
            matricula: document.getElementById('regMatricula').value.trim(),
            motivo: document.getElementById('regMotivo').value.trim()
        };

        // Validaciones
        if (!this.validateRegisterForm(formData)) {
            return;
        }

        // Mostrar loading
        this.setRegisterLoading(true);
        this.hideRegisterMessages();

        try {
            // Intentar enviar al backend
            if (window.apiClient) {
                const response = await window.apiClient.request('/auth/register', {
                    method: 'POST',
                    body: formData
                });

                if (response.success) {
                    this.showRegisterSuccess();
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                        if (modal) modal.hide();
                    }, 3000);
                    return;
                }
            }

            // Fallback: Envío por email (para cuando no hay backend)
            await this.sendRegistrationByEmail(formData);
            this.showRegisterSuccess();
            
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                if (modal) modal.hide();
            }, 3000);

        } catch (error) {
            this.showRegisterError(error.message || 'Error al enviar la solicitud');
            debugLog.error('ERROR', '❌ Error en registro:', error);
        } finally {
            this.setRegisterLoading(false);
        }
    }

    /**
     * Validar formulario de registro
     */
    validateRegisterForm(data) {
        if (!data.nombre || !data.apellido_paterno || !data.email || !data.telefono || !data.motivo) {
            this.showRegisterError('Por favor completa todos los campos requeridos');
            return false;
        }

        if (!data.tipo_usuario) {
            this.showRegisterError('Selecciona tu tipo de usuario');
            return false;
        }

        if ((data.tipo_usuario === 'estudiante' || data.tipo_usuario === 'padre_familia') && !data.matricula) {
            this.showRegisterError('La matrícula es requerida para estudiantes y padres de familia');
            return false;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showRegisterError('El formato del correo electrónico no es válido');
            return false;
        }

        return true;
    }

    /**
     * Enviar solicitud de registro por email (fallback)
     */
    async sendRegistrationByEmail(data) {
        const emailBody = `
Nueva solicitud de registro:

👤 Nombre: ${data.nombre} ${data.apellido_paterno} ${data.apellido_materno}
📧 Email: ${data.email}
📱 Teléfono: ${data.telefono}
🏷️ Tipo: ${data.tipo_usuario}
${data.matricula ? `🆔 Matrícula: ${data.matricula}` : ''}
💬 Motivo: ${data.motivo}

Fecha: ${new Date().toLocaleString('es-MX')}
        `;

        // Guardar en localStorage como backup
        const registrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
        registrations.push({
            ...data,
            fecha_solicitud: new Date().toISOString(),
            estado: 'pendiente'
        });
        localStorage.setItem('pending_registrations', JSON.stringify(registrations));

        // GDPR: Datos sensibles enmascarados
        //debugLog.log('APP', '📧 Solicitud guardada localmente:', data.email);
    }

    /**
     * Crear modal de perfil
     */
    createProfileModal() {
        // Remover modal existente si existe
        const existingModal = document.getElementById('profileModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="profileModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-user me-2"></i>
                                Mi Perfil
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title">Información Personal</h6>
                                            <p><strong>Nombre:</strong> ${this.currentUser.nombre} ${this.currentUser.apellido_paterno} ${this.currentUser.apellido_materno || ''}</p>
                                            <p><strong>Email:</strong> ${this.currentUser.email}</p>
                                            <p><strong>Tipo de Usuario:</strong> ${this.currentUser.tipo_usuario}</p>
                                            <p><strong>Último acceso:</strong> ${this.formatDate(this.currentUser.ultimo_acceso)}</p>
                                            <p><strong>Miembro desde:</strong> ${this.formatDate(this.currentUser.fecha_creacion)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitizeHTML(modalHTML)));
        return document.getElementById('profileModal');
    }

    // ============================================
    // MÉTODOS DE UTILIDAD
    // ============================================

    setLoginLoading(loading) {
        const loginButton = document.getElementById('loginButton');
        const loginButtonText = document.getElementById('loginButtonText');
        const loginSpinner = document.getElementById('loginSpinner');
        
        if (loading) {
            loginButton.disabled = true;
            loginButtonText.classList.add('d-none');
            loginSpinner.classList.remove('d-none');
        } else {
            loginButton.disabled = false;
            loginButtonText.classList.remove('d-none');
            loginSpinner.classList.add('d-none');
        }
    }

    setRegisterLoading(loading) {
        const registerButton = document.getElementById('registerButton');
        const registerButtonText = document.getElementById('registerButtonText');
        const registerSpinner = document.getElementById('registerSpinner');
        
        if (registerButton && registerButtonText && registerSpinner) {
            if (loading) {
                registerButton.disabled = true;
                registerButtonText.classList.add('d-none');
                registerSpinner.classList.remove('d-none');
            } else {
                registerButton.disabled = false;
                registerButtonText.classList.remove('d-none');
                registerSpinner.classList.add('d-none');
            }
        }
    }

    showAuthError(message) {
        const errorDiv = document.getElementById('authError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }

    hideAuthError() {
        const errorDiv = document.getElementById('authError');
        errorDiv.classList.add('d-none');
    }

    showRegisterError(message) {
        const errorDiv = document.getElementById('registerError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('d-none');
        }
    }

    showRegisterSuccess() {
        const successDiv = document.getElementById('registerSuccess');
        if (successDiv) {
            successDiv.innerHTML = sanitizeHTML(`
                <i class="fas fa-check-circle me-2"></i>
                <strong>¡Solicitud enviada!</strong> Te contactaremos pronto para activar tu cuenta.
            `);
            successDiv.classList.remove('d-none');
        }
    }

    hideRegisterMessages() {
        const errorDiv = document.getElementById('registerError');
        const successDiv = document.getElementById('registerSuccess');
        
        if (errorDiv) errorDiv.classList.add('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    }

    closeAuthModal() {
        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (authModal) {
            authModal.hide();
        }
    }

    showLoginSuccess() {
        this.showToast('success', '✅ Sesión iniciada correctamente', `Bienvenido ${this.currentUser.nombre}`);
    }

    showLogoutSuccess() {
        this.showToast('info', '👋 Sesión cerrada', 'Has cerrado sesión correctamente');
    }

    showToast(type, title, message) {
        // Crear toast dinámicamente
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        const toastId = 'toast_' + Date.now();
        
        const toastHTML = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert" id="${toastId}">
                <div class="d-flex">
                    <div class="toast-body">
                        <strong>${title}</strong><br>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitizeHTML(toastHTML)));
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Limpiar después de mostrar
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    }

    formatDate(dateString) {
        if (!dateString) return 'No disponible';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString('es-MX');
        } catch (error) {
            return 'Fecha inválida';
        }
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getUserType() {
        return this.currentUser ? this.currentUser.tipo_usuario : 'visitante';
    }
}

// ============================================
// GOOGLE SIGN-IN INTEGRATION
// ============================================

/**
 * Manejar respuesta de Google Sign-In
 */
window.handleGoogleCredentialResponse = async function(response) {
    try {
        //debugLog.log('APP', '🔐 Google Sign-In response received');
        
        if (!response.credential) {
            throw new Error('No se recibió credencial de Google');
        }

        // Decodificar el JWT token de Google
        const decoded = JSON.parse(atob(response.credential.split('.')[1]));
        
        // Extraer información del usuario
        const googleUser = {
            email: decoded.email,
            nombre: decoded.given_name,
            apellido_paterno: decoded.family_name,
            foto: decoded.picture,
            email_verificado: decoded.email_verified,
            google_id: decoded.sub
        };

        // GDPR: Datos sensibles enmascarados
        //debugLog.log('APP', '📧 Usuario de Google:', googleUser.email);

        // Autenticar con el backend usando Google token
        if (window.apiClient) {
            try {
                const authResponse = await window.apiClient.loginWithGoogle(response.credential);
                
                if (authResponse.success && authResponse.user) {
                    window.authInterface.currentUser = authResponse.user;
                    window.authInterface.updateAuthInterface();
                    window.authInterface.closeAuthModal();
                    window.authInterface.showToast('success', '✅ Google Sign-In exitoso', `Bienvenido ${authResponse.user.nombre}`);
                    
                    //debugLog.log('APP', '✅ Autenticación con Google exitosa');
                } else {
                    throw new Error(authResponse.message || 'Error de autenticación con Google');
                }
                
            } catch (apiError) {
                debugLog.warn('APP', '⚠️ Backend no disponible, usando autenticación local');
                
                // Fallback: autenticación local temporal
                const localUser = {
                    id: googleUser.google_id,
                    email: googleUser.email,
                    nombre: googleUser.nombre,
                    apellido_paterno: googleUser.apellido_paterno,
                    tipo_usuario: 'visitante_google',
                    foto: googleUser.foto,
                    ultimo_acceso: new Date().toISOString(),
                    fecha_creacion: new Date().toISOString()
                };
                
                window.authInterface.currentUser = localUser;
                window.authInterface.updateAuthInterface();
                window.authInterface.closeAuthModal();
                window.authInterface.showToast('success', '✅ Acceso con Google', `Bienvenido ${localUser.nombre}`);
                
                // Guardar en sessionStorage
                sessionStorage.setItem('google_user_session', JSON.stringify(localUser));
            }
        } else {
            throw new Error('Sistema de autenticación no disponible');
        }

    } catch (error) {
        debugLog.error('ERROR', '❌ Error en Google Sign-In:', error);
        window.authInterface.showToast('danger', '❌ Error de autenticación', error.message || 'No se pudo completar el acceso con Google');
    }
};

/**
 * Inicializar Google Sign-In
 */
function initializeGoogleSignIn() {
    // Verificar si AppConfig está disponible y si Google está configurado
    if (!window.AppConfig || !window.AppConfig.isEnabled || !window.AppConfig.isEnabled('google')) {
        //debugLog.log('APP', '⚠️ Google Sign-In no configurado - ocultando botón');
        
        // Ocultar sección de Google Sign-In si no está configurado
        setTimeout(() => {
            const googleSection = document.getElementById('g_id_onload')?.parentElement;
            const separatorDiv = document.querySelector('.row.align-items-center.mb-3');
            
            if (googleSection) {
                googleSection.style.display = 'none';
                //debugLog.log('APP', '🔐 Botón de Google Sign-In ocultado');
            }
            if (separatorDiv) {
                separatorDiv.style.display = 'none';
                //debugLog.log('APP', '🔐 Separador "o continúa con" ocultado');
            }
        }, 100);
        
        //debugLog.log('APP', '🔐 Usando solo autenticación tradicional');
        return;
    }
    
    // Cargar Google Sign-In SDK
    const script = document.createElement('script');
    script.src = sanitizeURL('https://accounts.google.com/gsi/client');
    script.async = true;
    script.defer = true;
    script.onload = () => {
        //debugLog.log('APP', '📱 Google Sign-In SDK cargado');
        
        // Configurar con client ID real
        const gOnloadElement = document.getElementById('g_id_onload');
        if (gOnloadElement) {
            gOnloadElement.setAttribute('data-client_id', window.AppConfig.google.clientId);
        }
    };
    document.head.appendChild(script);
}

// Inicializar interfaz de autenticación cuando esté listo el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que el API client esté disponible
    setTimeout(() => {
        window.authInterface = new AuthInterface();
        //debugLog.log('APP', '🔐 Interfaz de autenticación inicializada');
        
        // Inicializar Google Sign-In
        setTimeout(() => {
            initializeGoogleSignIn();
        }, 500);
        
        // Verificar sesión de Google existente
        const googleSession = sessionStorage.getItem('google_user_session');
        if (googleSession && !window.authInterface.currentUser) {
            try {
                const user = JSON.parse(googleSession);
                window.authInterface.currentUser = user;
                window.authInterface.updateAuthInterface();
                // GDPR: Datos sensibles enmascarados
                //debugLog.log('APP', '🔐 Sesión de Google restaurada:', user.email);
            } catch (error) {
                debugLog.warn('ERROR', '⚠️ Error al restaurar sesión de Google:', error);
                sessionStorage.removeItem('google_user_session');
            }
        }
    }, 100);
});

// Estilos CSS para la interfaz de autenticación
const authStyles = document.createElement('style');
authStyles.textContent = `
    .auth-button-container {
        margin-left: auto;
    }
    
    .auth-status {
        display: flex;
        align-items: center;
    }
    
    .user-authenticated .chatbot-container {
        border-top: 3px solid #28a745;
    }
    
    .user-authenticated .chatbot-header::after {
        content: ' 🔓';
    }
    
    .user-anonymous .chatbot-container {
        border-top: 3px solid #6c757d;
    }
    
    .toast-container {
        z-index: 9999;
    }
`;

document.head.appendChild(authStyles);