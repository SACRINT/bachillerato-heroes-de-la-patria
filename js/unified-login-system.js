/**
 * 🔐 SISTEMA DE LOGIN UNIFICADO
 * Reemplaza 3 sistemas antiguos por UNO solo
 */

class UnifiedLoginSystem {
    constructor() {
        this.API_BASE_URL = '/api';
        this.currentUser = null;
        this.token = null;
        this.isInitialized = false;

        this.init();
    }

    async init() {
        console.log('🔐 Inicializando Login Unificado...');

        // Esperar a que el DOM esté completamente listo (incluyendo header inyectado)
        await this.waitForDOM();

        // 1. Crear UI
        this.createLoginUI();

        // 2. Cargar sesión guardada
        this.loadStoredSession();

        // 3. Configurar listeners
        this.setupEventListeners();

        this.isInitialized = true;
        console.log('✅ Login Unificado listo');
    }

    /**
     * Esperar a que el header esté en el DOM
     */
    waitForDOM() {
        return new Promise((resolve) => {
            const checkHeader = () => {
                const header = document.querySelector('header') || document.querySelector('.navbar');
                if (header) {
                    console.log('✅ Header encontrado, inicializando UI...');
                    resolve();
                } else {
                    console.log('⏳ Esperando header...');
                    setTimeout(checkHeader, 300);
                }
            };
            checkHeader();
        });
    }

    /**
     * Crear interfaz de login
     */
    createLoginUI() {
        // Si ya existe, no crear duplicado
        if (document.getElementById('unified-auth-container')) {
            console.log('✅ UI de login ya existe');
            return;
        }

        const header = document.querySelector('header') || document.querySelector('.navbar');
        if (!header) {
            console.warn('⚠️ Header no encontrado, reintentando...');
            setTimeout(() => this.createLoginUI(), 500);
            return;
        }

        const authHTML = `
            <div id="unified-auth-container" class="ms-auto d-flex align-items-center gap-2">
                <!-- Estado no autenticado -->
                <div id="login-button-state" style="display: none;">
                    <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#unifiedLoginModal">
                        <i class="fas fa-sign-in-alt me-1"></i>
                        Iniciar Sesión
                    </button>
                </div>

                <!-- Estado autenticado -->
                <div id="user-menu-state" style="display: none;">
                    <div class="dropdown">
                        <button class="btn btn-success btn-sm dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                            <i class="fas fa-user-circle me-1"></i>
                            <span id="user-display-name">Usuario</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#" id="profile-link">
                                <i class="fas fa-user me-2"></i>Mi Perfil
                            </a></li>
                            <li><a class="dropdown-item" href="#" id="dashboard-link" style="display: none;">
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

        try {
            // Intentar encontrar el contenedor correcto
            let navContainer = header.querySelector('.container-fluid');

            if (!navContainer) {
                navContainer = header.querySelector('.container');
            }

            if (!navContainer) {
                navContainer = header;
            }

            // Inyectar el HTML
            navContainer.insertAdjacentHTML('beforeend', authHTML);

            // Verificar que se creó correctamente
            const authContainer = document.getElementById('unified-auth-container');
            if (authContainer) {
                console.log('✅ UI de login creada exitosamente');
            } else {
                console.error('❌ Error: El contenedor no se creó correctamente');
            }
        } catch (error) {
            console.error('❌ Error creando UI de login:', error);
            // Fallback: intentar nuevamente
            setTimeout(() => this.createLoginUI(), 1000);
        }
    }

    /**
     * Crear modal de login
     */
    createLoginModal() {
        if (document.getElementById('unifiedLoginModal')) return;

        const modalHTML = `
            <div class="modal fade" id="unifiedLoginModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Alertas -->
                            <div id="login-alerts"></div>

                            <!-- Tabs de métodos de login -->
                            <ul class="nav nav-tabs mb-3" id="loginTabs">
                                <li class="nav-item">
                                    <a class="nav-link active" data-bs-toggle="tab" href="#email-login">
                                        <i class="fas fa-envelope me-1"></i>Email
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-bs-toggle="tab" href="#demo-login">
                                        <i class="fas fa-gamepad me-1"></i>Demo
                                    </a>
                                </li>
                            </ul>

                            <div class="tab-content">
                                <!-- Email Login Tab -->
                                <div class="tab-pane fade show active" id="email-login">
                                    <form id="emailLoginForm">
                                        <div class="mb-3">
                                            <label class="form-label">Email</label>
                                            <input type="email" class="form-control" id="loginEmail" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Contraseña</label>
                                            <div class="input-group">
                                                <input type="password" class="form-control" id="loginPassword" required>
                                                <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="form-check mb-3">
                                            <input class="form-check-input" type="checkbox" id="rememberMe">
                                            <label class="form-check-label" for="rememberMe">
                                                Recordar mi sesión
                                            </label>
                                        </div>
                                        <button type="submit" class="btn btn-primary w-100">
                                            <span id="loginText">
                                                <i class="fas fa-sign-in-alt me-1"></i>Iniciar Sesión
                                            </span>
                                            <span id="loginLoading" style="display: none;">
                                                <span class="spinner-border spinner-border-sm me-2"></span>
                                                Verificando...
                                            </span>
                                        </button>
                                    </form>

                                    <div class="mt-3">
                                        <small class="text-muted d-block mb-2">
                                            <strong>Credenciales de prueba:</strong>
                                        </small>
                                        <small class="text-muted">
                                            Email: <code>sci@gmail.com</code><br>
                                            Contraseña: <code>sci123</code>
                                        </small>
                                    </div>
                                </div>

                                <!-- Demo Login Tab -->
                                <div class="tab-pane fade" id="demo-login">
                                    <div class="text-center p-4">
                                        <i class="fas fa-gamepad fa-3x text-primary mb-3"></i>
                                        <h5>Cuenta Demo</h5>
                                        <p class="text-muted mb-4">Acceso inmediato sin credenciales para explorar todas las funciones</p>
                                        <button type="button" class="btn btn-success w-100" id="demoLoginBtn">
                                            <i class="fas fa-rocket me-1"></i>Entrar como Demo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Crear modal si no existe
        this.createLoginModal();

        // Esperar a que el DOM esté listo para los listeners
        const setupListeners = () => {
            try {
                // Email login form - usar delegación de eventos
                document.addEventListener('submit', (e) => {
                    if (e.target && e.target.id === 'emailLoginForm') {
                        e.preventDefault();
                        this.handleEmailLogin();
                    }
                }, true); // Usar captura para asegurar que se capture

                // Toggle password visibility
                document.addEventListener('click', (e) => {
                    if (e.target && e.target.id === 'togglePassword') {
                        const input = document.getElementById('loginPassword');
                        const icon = e.target.querySelector('i');
                        if (input && icon) {
                            if (input.type === 'password') {
                                input.type = 'text';
                                icon.classList.replace('fa-eye', 'fa-eye-slash');
                            } else {
                                input.type = 'password';
                                icon.classList.replace('fa-eye-slash', 'fa-eye');
                            }
                        }
                    }
                });

                // Demo login
                document.addEventListener('click', (e) => {
                    if (e.target && e.target.id === 'demoLoginBtn') {
                        this.handleDemoLogin();
                    }
                });

                // Logout
                document.addEventListener('click', (e) => {
                    if (e.target && e.target.id === 'logout-button') {
                        e.preventDefault();
                        this.logout();
                    }
                });

                // Profile link
                document.addEventListener('click', (e) => {
                    if (e.target && e.target.id === 'profile-link') {
                        e.preventDefault();
                        alert('👤 Perfil - Próximamente disponible');
                    }
                });

                console.log('✅ Event listeners configurados');
            } catch (error) {
                console.error('❌ Error configurando event listeners:', error);
            }
        };

        // Ejecutar inmediatamente usando delegación de eventos
        setupListeners();
    }

    /**
     * Manejar login con email
     */
    async handleEmailLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!email || !password) {
            this.showAlert('Por favor completa email y contraseña', 'warning');
            return;
        }

        this.setLoginLoading(true);

        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Guardar tokens
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('bge_token', data.token);
                storage.setItem('bge_refresh_token', data.refreshToken || '');
                storage.setItem('bge_user', JSON.stringify(data.user));

                this.currentUser = data.user;
                this.token = data.token;

                this.showAlert('✅ Bienvenido!', 'success');

                // Cerrar modal y actualizar UI
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('unifiedLoginModal'));
                    if (modal) modal.hide();
                    this.updateAuthUI();
                }, 1000);
            } else {
                this.showAlert(data.error || 'Error en login', 'danger');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showAlert('Error de conexión', 'danger');
        } finally {
            this.setLoginLoading(false);
        }
    }

    /**
     * Manejar login demo
     */
    async handleDemoLogin() {
        if (confirm('¿Entrar como usuario Demo?')) {
            const demoUser = {
                id: 999,
                email: 'demo@bge.edu.mx',
                nombre: 'Usuario Demo',
                role: 'student',
                isDemoUser: true
            };

            localStorage.setItem('bge_token', 'demo_token_' + Date.now());
            localStorage.setItem('bge_user', JSON.stringify(demoUser));

            this.currentUser = demoUser;
            this.token = 'demo_token';

            const modal = bootstrap.Modal.getInstance(document.getElementById('unifiedLoginModal'));
            if (modal) modal.hide();

            this.updateAuthUI();
            this.showAlert('🎮 Bienvenido a Demo!', 'success');
        }
    }

    /**
     * Cargar sesión guardada
     */
    loadStoredSession() {
        const token = localStorage.getItem('bge_token') || sessionStorage.getItem('bge_token');
        const userStr = localStorage.getItem('bge_user') || sessionStorage.getItem('bge_user');

        if (token && userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
                this.token = token;
                this.updateAuthUI();
                this.validateToken();
            } catch (error) {
                console.error('Error cargando sesión:', error);
                this.logout();
            }
        }
    }

    /**
     * Validar token con servidor
     */
    async validateToken() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                this.logout();
            }
        } catch (error) {
            console.error('Error validando token:', error);
        }
    }

    /**
     * Actualizar UI según estado de autenticación
     */
    updateAuthUI() {
        const loginState = document.getElementById('login-button-state');
        const userState = document.getElementById('user-menu-state');
        const userName = document.getElementById('user-display-name');
        const dashboardLink = document.getElementById('dashboard-link');

        if (this.currentUser && this.token) {
            // Mostrar menú de usuario
            if (loginState) loginState.style.display = 'none';
            if (userState) userState.style.display = 'block';

            if (userName) {
                userName.textContent = this.currentUser.nombre || this.currentUser.name || this.currentUser.email;
            }

            // Mostrar dashboard link solo para admins
            if (dashboardLink && this.currentUser.role === 'admin') {
                dashboardLink.style.display = 'block';
                dashboardLink.href = '/admin-dashboard.html';
            }

            // Disparar evento de login
            window.dispatchEvent(new CustomEvent('bge-user-logged-in', {
                detail: { user: this.currentUser }
            }));
        } else {
            // Mostrar botón de login
            if (loginState) loginState.style.display = 'block';
            if (userState) userState.style.display = 'none';
        }
    }

    /**
     * Cerrar sesión
     */
    logout() {
        // Limpiar almacenamiento
        localStorage.removeItem('bge_token');
        localStorage.removeItem('bge_refresh_token');
        localStorage.removeItem('bge_user');
        sessionStorage.removeItem('bge_token');
        sessionStorage.removeItem('bge_refresh_token');
        sessionStorage.removeItem('bge_user');

        this.currentUser = null;
        this.token = null;

        this.updateAuthUI();

        // Redirigir a home si estamos en admin
        if (window.location.pathname.includes('admin')) {
            window.location.href = '/';
        }

        this.showAlert('✅ Sesión cerrada', 'info');
    }

    /**
     * Mostrar alerta
     */
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('login-alerts');
        if (!alertContainer) return;

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

        alertContainer.innerHTML = alertHTML;
    }

    /**
     * Estado de loading en botón
     */
    setLoginLoading(loading) {
        const submitBtn = document.querySelector('#emailLoginForm button[type="submit"]');
        const loginText = document.getElementById('loginText');
        const loginLoading = document.getElementById('loginLoading');

        if (loading) {
            if (loginText) loginText.style.display = 'none';
            if (loginLoading) loginLoading.style.display = 'inline';
            if (submitBtn) submitBtn.disabled = true;
        } else {
            if (loginText) loginText.style.display = 'inline';
            if (loginLoading) loginLoading.style.display = 'none';
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    /**
     * Obtener headers autenticados
     */
    getAuthHeaders() {
        return this.token ? {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }
}

// Inicializar cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.unifiedLogin = new UnifiedLoginSystem();
    });
} else {
    window.unifiedLogin = new UnifiedLoginSystem();
}
