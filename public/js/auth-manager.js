/**
 * 🔐 GESTOR DE AUTENTICACIÓN BGE
 * Sistema de autenticación integrado con backend JWT
 * Versión 2.0 - Integración completa
 */

class AuthManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.currentUser = null;
        this.token = null;
        this.refreshToken = null;

        this.initializeAuth();
        this.checkExistingAuth();
    }

    /**
     * Inicializar sistema de autenticación
     */
    initializeAuth() {
        this.createAuthUI();
        this.attachEventListeners();
        this.loadStoredTokens();
    }

    /**
     * Crear interfaz de usuario de autenticación
     */
    createAuthUI() {
        // Crear botón de login en header si no existe
        this.createAuthButton();

        // Crear modal de login
        this.createLoginModal();

        // Crear overlay de perfil de usuario
        this.createUserProfile();
    }

    /**
     * Crear botón de autenticación en el header
     */
    createAuthButton() {
        const header = document.querySelector('header') || document.querySelector('.navbar');
        if (!header) return;

        // Verificar si ya existe
        if (document.getElementById('auth-button-container')) return;

        const authButtonHTML = `
            <div id="auth-button-container" class="auth-container ms-auto">
                <!-- Estado no autenticado -->
                <div id="login-button" class="auth-state" style="display: none;">
                    <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#loginModal">
                        <i class="fas fa-sign-in-alt me-1"></i>
                        Iniciar Sesión
                    </button>
                </div>

                <!-- Estado autenticado -->
                <div id="user-menu" class="auth-state" style="display: none;">
                    <div class="dropdown">
                        <button class="btn btn-success dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                            <i class="fas fa-user me-1"></i>
                            <span id="user-name">Usuario</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#" id="profile-link">
                                <i class="fas fa-user-circle me-2"></i>Mi Perfil
                            </a></li>
                            <li><a class="dropdown-item" href="#" id="dashboard-link">
                                <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" id="logout-button">
                                <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Insertar en el header
        const navContainer = header.querySelector('.container, .container-fluid') || header;
        navContainer.insertAdjacentHTML('beforeend', authButtonHTML);
    }

    /**
     * Crear modal de login
     */
    createLoginModal() {
        // Verificar si ya existe
        if (document.getElementById('loginModal')) return;

        const modalHTML = `
            <!-- Modal de Login BGE -->
            <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="loginModalLabel">
                                <i class="fas fa-graduation-cap me-2"></i>
                                BGE Héroes de la Patria
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="loginForm">
                                <div class="text-center mb-4">
                                    <img src="/images/logo-bachillerato-HDLP.webp" alt="BGE Logo" class="mb-3" style="max-height: 80px;">
                                    <h6 class="text-muted">Inicia sesión con tu cuenta institucional</h6>
                                </div>

                                <!-- Alertas -->
                                <div id="login-alerts"></div>

                                <!-- Email -->
                                <div class="mb-3">
                                    <label for="email" class="form-label">
                                        <i class="fas fa-envelope me-1"></i>Correo Electrónico
                                    </label>
                                    <input type="email" class="form-control" id="email" name="email" required
                                           placeholder="usuario@heroespatria.edu.mx">
                                </div>

                                <!-- Password -->
                                <div class="mb-3">
                                    <label for="password" class="form-label">
                                        <i class="fas fa-lock me-1"></i>Contraseña
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="password" name="password" required
                                               placeholder="Tu contraseña">
                                        <button class="btn btn-outline-secondary" type="button" id="toggle-password">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <!-- Recordar sesión -->
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="remember-me" name="remember">
                                    <label class="form-check-label" for="remember-me">
                                        Recordar mi sesión
                                    </label>
                                </div>

                                <!-- Botón de login -->
                                <button type="submit" class="btn btn-primary w-100" id="login-submit">
                                    <span class="login-text">
                                        <i class="fas fa-sign-in-alt me-1"></i>Iniciar Sesión
                                    </span>
                                    <span class="login-loading" style="display: none;">
                                        <span class="spinner-border spinner-border-sm me-2"></span>Verificando...
                                    </span>
                                </button>
                            </form>

                            <!-- Información adicional -->
                            <div class="mt-4 text-center">
                                <small class="text-muted">
                                    <i class="fas fa-info-circle me-1"></i>
                                    ¿Problemas para acceder? Contacta a sistemas@heroespatria.edu.mx
                                </small>
                            </div>

                            <!-- Cuentas de prueba (solo en desarrollo) -->
                            <div class="mt-3 p-2 bg-light rounded" id="dev-accounts" style="display: none;">
                                <small class="text-muted d-block mb-2">
                                    <strong>Cuentas de prueba:</strong>
                                </small>
                                <div class="d-flex gap-2 flex-wrap">
                                    <button class="btn btn-sm btn-outline-success" onclick="authManager.quickLogin('admin')">
                                        Admin
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" onclick="authManager.quickLogin('teacher')">
                                        Profesor
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning" onclick="authManager.quickLogin('student')">
                                        Estudiante
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Mostrar cuentas de prueba en desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            document.getElementById('dev-accounts').style.display = 'block';
        }
    }

    /**
     * Crear perfil de usuario
     */
    createUserProfile() {
        // Este será implementado cuando el usuario esté logueado
    }

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Login form
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'loginForm') {
                e.preventDefault();
                this.handleLogin(e.target);
            }
        });

        // Toggle password visibility
        document.addEventListener('click', (e) => {
            if (e.target.id === 'toggle-password' || e.target.closest('#toggle-password')) {
                this.togglePasswordVisibility();
            }

            // Logout button
            if (e.target.id === 'logout-button') {
                e.preventDefault();
                this.logout();
            }
        });

        // Auto-login en desarrollo
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                this.quickLogin('admin');
            }
        });
    }

    /**
     * Login rápido para desarrollo
     */
    quickLogin(role) {
        const credentials = {
            admin: { email: 'admin@heroespatria.edu.mx', password: 'admin123' },
            teacher: { email: 'teacher@heroespatria.edu.mx', password: 'teacher123' },
            student: { email: 'student@heroespatria.edu.mx', password: 'teacher123' }
        };

        const cred = credentials[role];
        if (cred) {
            document.getElementById('email').value = cred.email;
            document.getElementById('password').value = cred.password;
            this.performLogin(cred.email, cred.password);
        }
    }

    /**
     * Toggle visibilidad de contraseña
     */
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleButton = document.getElementById('toggle-password');
        const icon = toggleButton.querySelector('i');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }

    /**
     * Manejar submit del formulario de login
     */
    async handleLogin(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');

        await this.performLogin(email, password, remember);
    }

    /**
     * Realizar login con la API
     */
    async performLogin(email, password, remember = false) {
        const submitButton = document.getElementById('login-submit');
        const alertContainer = document.getElementById('login-alerts');

        // Mostrar loading
        this.setLoginLoading(true);

        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Login exitoso
                this.token = data.token;
                this.refreshToken = data.refreshToken;
                this.currentUser = data.user;

                // Guardar tokens
                this.storeTokens(remember);

                // Mostrar éxito
                this.showAlert('success', '¡Bienvenido! Iniciando sesión...', alertContainer);

                // Cerrar modal y actualizar UI
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    modal.hide();
                    this.updateAuthUI();
                    this.onLoginSuccess();
                }, 1000);

            } else {
                // Error en login
                this.showAlert('error', data.message || 'Credenciales incorrectas', alertContainer);
            }

        } catch (error) {
            console.error('Error en login:', error);
            this.showAlert('error', 'Error de conexión. Intenta nuevamente.', alertContainer);
        } finally {
            this.setLoginLoading(false);
        }
    }

    /**
     * Establecer estado de loading en el botón de login
     */
    setLoginLoading(loading) {
        const submitButton = document.getElementById('login-submit');
        const loginText = submitButton.querySelector('.login-text');
        const loadingText = submitButton.querySelector('.login-loading');

        if (loading) {
            loginText.style.display = 'none';
            loadingText.style.display = 'inline';
            submitButton.disabled = true;
        } else {
            loginText.style.display = 'inline';
            loadingText.style.display = 'none';
            submitButton.disabled = false;
        }
    }

    /**
     * Mostrar alerta en el modal
     */
    showAlert(type, message, container) {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';

        container.innerHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="${icon} me-2"></i>${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    /**
     * Guardar tokens en localStorage/sessionStorage
     */
    storeTokens(remember = false) {
        const storage = remember ? localStorage : sessionStorage;

        storage.setItem('bge_token', this.token);
        storage.setItem('bge_refresh_token', this.refreshToken);
        storage.setItem('bge_user', JSON.stringify(this.currentUser));
        storage.setItem('bge_remember', remember.toString());
    }

    /**
     * Cargar tokens almacenados
     */
    loadStoredTokens() {
        const token = localStorage.getItem('bge_token') || sessionStorage.getItem('bge_token');
        const refreshToken = localStorage.getItem('bge_refresh_token') || sessionStorage.getItem('bge_refresh_token');
        const userStr = localStorage.getItem('bge_user') || sessionStorage.getItem('bge_user');

        if (token && userStr) {
            this.token = token;
            this.refreshToken = refreshToken;
            this.currentUser = JSON.parse(userStr);
            this.updateAuthUI();

            // Verificar si el token es válido
            this.validateToken();
        }
    }

    /**
     * Validar token con el servidor
     */
    async validateToken() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                // Token inválido, hacer logout
                this.logout();
            }
        } catch (error) {
            console.error('Error validando token:', error);
        }
    }

    /**
     * Cerrar sesión
     */
    logout() {
        // Limpiar datos
        this.token = null;
        this.refreshToken = null;
        this.currentUser = null;

        // Limpiar storage
        localStorage.removeItem('bge_token');
        localStorage.removeItem('bge_refresh_token');
        localStorage.removeItem('bge_user');
        localStorage.removeItem('bge_remember');
        sessionStorage.removeItem('bge_token');
        sessionStorage.removeItem('bge_refresh_token');
        sessionStorage.removeItem('bge_user');

        // Actualizar UI
        this.updateAuthUI();

        // Recargar página si estamos en dashboard
        if (window.location.pathname.includes('admin') || window.location.pathname.includes('dashboard')) {
            window.location.href = '/';
        }

        console.log('✅ Sesión cerrada correctamente');
    }

    /**
     * Actualizar interfaz de usuario según estado de autenticación
     */
    updateAuthUI() {
        const loginButton = document.getElementById('login-button');
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');

        if (this.currentUser && this.token) {
            // Usuario autenticado
            loginButton.style.display = 'none';
            userMenu.style.display = 'block';

            if (userName) {
                userName.textContent = this.currentUser.username || this.currentUser.email;
            }

            // Mostrar/ocultar links según rol
            this.updateRoleBasedUI();

        } else {
            // Usuario no autenticado
            loginButton.style.display = 'block';
            userMenu.style.display = 'none';
        }
    }

    /**
     * Actualizar UI basada en roles
     */
    updateRoleBasedUI() {
        const dashboardLink = document.getElementById('dashboard-link');

        if (dashboardLink) {
            if (this.currentUser.role === 'admin') {
                dashboardLink.style.display = 'block';
                dashboardLink.href = '/admin-dashboard.html';
            } else {
                dashboardLink.style.display = 'none';
            }
        }
    }

    /**
     * Verificar autenticación existente
     */
    checkExistingAuth() {
        // Ya implementado en loadStoredTokens()
    }

    /**
     * Callback después de login exitoso
     */
    onLoginSuccess() {
        console.log(`✅ Login exitoso: ${this.currentUser.username} (${this.currentUser.role})`);

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('bge-login-success', {
            detail: { user: this.currentUser }
        }));

        // Redireccionar según rol si es necesario
        if (this.currentUser.role === 'admin' && window.location.pathname === '/') {
            // Preguntar si quiere ir al dashboard
            setTimeout(() => {
                if (confirm('¿Deseas ir al dashboard administrativo?')) {
                    window.location.href = '/admin-dashboard.html';
                }
            }, 1500);
        }
    }

    /**
     * Obtener token para requests autenticados
     */
    getAuthHeaders() {
        return this.token ? {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Hacer request autenticado
     */
    async authenticatedRequest(url, options = {}) {
        const headers = this.getAuthHeaders();

        return fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        });
    }
}

// Inicializar el gestor de autenticación
let authManager;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authManager = new AuthManager();
    });
} else {
    authManager = new AuthManager();
}

// Exportar para uso global
window.authManager = authManager;