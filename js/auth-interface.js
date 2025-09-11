/**
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
                                    <input type="password" class="form-control" id="loginPassword" required>
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
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Crear botón de autenticación en la interfaz
     */
    createAuthButton() {
        const authButtonContainer = document.createElement('div');
        authButtonContainer.id = 'authButtonContainer';
        authButtonContainer.className = 'auth-button-container';
        authButtonContainer.innerHTML = `
            <div class="auth-status" id="authStatus">
                <button class="btn btn-outline-primary btn-sm" id="authToggleBtn" type="button">
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
        `;

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
                    console.log('🔐 Usuario autenticado automáticamente:', this.currentUser.email);
                }
            } catch (error) {
                console.log('🔓 Sesión anterior expirada');
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
                
                console.log('✅ Login exitoso:', this.currentUser.email);

                // Reinicializar chatbot con nueva sesión
                if (window.initializeChatSession) {
                    window.initializeChatSession();
                }
            }

        } catch (error) {
            this.showAuthError(error.message || 'Error de autenticación');
            console.error('❌ Error de login:', error);
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
            console.warn('Error durante logout:', error);
        }

        this.currentUser = null;
        this.updateAuthInterface();
        this.showLogoutSuccess();
        console.log('🔓 Sesión cerrada');
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
     * Mostrar perfil del usuario
     */
    showProfile() {
        if (!this.currentUser) return;

        const profileModal = this.createProfileModal();
        const modal = new bootstrap.Modal(profileModal);
        modal.show();
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

        document.body.insertAdjacentHTML('beforeend', modalHTML);
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

    showAuthError(message) {
        const errorDiv = document.getElementById('authError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }

    hideAuthError() {
        const errorDiv = document.getElementById('authError');
        errorDiv.classList.add('d-none');
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
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
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
        console.log('🔐 Google Sign-In response received');
        
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

        console.log('📧 Usuario de Google:', googleUser.email);

        // Autenticar con el backend usando Google token
        if (window.apiClient) {
            try {
                const authResponse = await window.apiClient.loginWithGoogle(response.credential);
                
                if (authResponse.success && authResponse.user) {
                    window.authInterface.currentUser = authResponse.user;
                    window.authInterface.updateAuthInterface();
                    window.authInterface.closeAuthModal();
                    window.authInterface.showToast('success', '✅ Google Sign-In exitoso', `Bienvenido ${authResponse.user.nombre}`);
                    
                    console.log('✅ Autenticación con Google exitosa');
                } else {
                    throw new Error(authResponse.message || 'Error de autenticación con Google');
                }
                
            } catch (apiError) {
                console.warn('⚠️ Backend no disponible, usando autenticación local');
                
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
        console.error('❌ Error en Google Sign-In:', error);
        window.authInterface.showToast('danger', '❌ Error de autenticación', error.message || 'No se pudo completar el acceso con Google');
    }
};

/**
 * Inicializar Google Sign-In
 */
function initializeGoogleSignIn() {
    // Verificar si Google está configurado
    if (!window.AppConfig.isEnabled('google')) {
        console.log('⚠️ Google Sign-In no configurado - ocultando botón');
        
        // Ocultar sección de Google Sign-In si no está configurado
        setTimeout(() => {
            const googleSection = document.getElementById('g_id_onload')?.parentElement;
            const separatorDiv = document.querySelector('.row.align-items-center.mb-3');
            
            if (googleSection) {
                googleSection.style.display = 'none';
                console.log('🔐 Botón de Google Sign-In ocultado');
            }
            if (separatorDiv) {
                separatorDiv.style.display = 'none';
                console.log('🔐 Separador "o continúa con" ocultado');
            }
        }, 100);
        
        console.log('🔐 Usando solo autenticación tradicional');
        return;
    }
    
    // Cargar Google Sign-In SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        console.log('📱 Google Sign-In SDK cargado');
        
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
        console.log('🔐 Interfaz de autenticación inicializada');
        
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
                console.log('🔐 Sesión de Google restaurada:', user.email);
            } catch (error) {
                console.warn('⚠️ Error al restaurar sesión de Google:', error);
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