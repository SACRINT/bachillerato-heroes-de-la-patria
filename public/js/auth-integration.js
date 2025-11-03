/**
 * 🔗 INTEGRACIÓN DE SISTEMAS DE AUTENTICACIÓN - BGE HÉROES DE LA PATRIA
 * Integración entre el nuevo sistema JWT y el sistema admin existente
 */

class BGEAuthIntegration {
    constructor() {
        this.jwtAuthSystem = null;
        this.legacyAdminAuth = null;
        this.sessionManager = null;
        this.roleManager = null;

        this.isIntegrated = false;
        this.preferredSystem = 'jwt'; // 'jwt' o 'legacy'

        this.init();
    }

    /**
     * Inicializar integración
     */
    async init() {
        console.log('🔗 Inicializando integración de sistemas de autenticación...');

        // Esperar a que estén disponibles los sistemas
        await this.waitForSystems();

        // Configurar integración
        this.setupIntegration();

        console.log('✅ Integración de autenticación completada');
    }

    /**
     * Esperar a que los sistemas estén disponibles
     */
    async waitForSystems() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos máximo

            const checkSystems = () => {
                attempts++;

                // Verificar sistemas JWT
                if (window.getBGEAuthSystem) {
                    this.jwtAuthSystem = window.getBGEAuthSystem();
                }

                if (window.getBGESessionManager) {
                    this.sessionManager = window.getBGESessionManager();
                }

                if (window.getBGERoleManager) {
                    this.roleManager = window.getBGERoleManager();
                }

                // Verificar sistema legacy
                if (window.adminAuth) {
                    this.legacyAdminAuth = window.adminAuth;
                }

                // Verificar si todos están listos
                const allReady = this.jwtAuthSystem && this.sessionManager && this.roleManager;

                if (allReady || attempts >= maxAttempts) {
                    resolve(allReady);
                } else {
                    setTimeout(checkSystems, 100);
                }
            };

            checkSystems();
        });
    }

    /**
     * Configurar integración entre sistemas
     */
    setupIntegration() {
        if (!this.jwtAuthSystem) {
            console.warn('⚠️ Sistema JWT no disponible, usando solo sistema legacy');
            this.preferredSystem = 'legacy';
            return;
        }

        // Configurar listeners de eventos JWT
        this.setupJWTListeners();

        // Configurar sincronización con sistema legacy
        this.setupLegacySync();

        // Actualizar UI inicial
        this.updateIntegratedUI();

        this.isIntegrated = true;
        console.log(`✅ Integración configurada con sistema preferido: ${this.preferredSystem}`);
    }

    /**
     * Configurar listeners del sistema JWT
     */
    setupJWTListeners() {
        // Listener de login JWT
        this.jwtAuthSystem.on('login', (data) => {
            console.log('🔗 Login JWT detectado, sincronizando con sistema legacy...');
            this.syncJWTToLegacy(data.user);
            this.updateIntegratedUI();
        });

        // Listener de logout JWT
        this.jwtAuthSystem.on('logout', () => {
            console.log('🔗 Logout JWT detectado, sincronizando con sistema legacy...');
            this.syncLogoutToLegacy();
            this.updateIntegratedUI();
        });

        // Listener de renovación de token
        this.jwtAuthSystem.on('tokenRefreshed', () => {
            console.log('🔗 Token JWT renovado');
            this.updateIntegratedUI();
        });
    }

    /**
     * Configurar sincronización con sistema legacy
     */
    setupLegacySync() {
        if (!this.legacyAdminAuth) return;

        // Sobrescribir métodos del sistema legacy para usar JWT cuando esté disponible
        const originalLogin = this.legacyAdminAuth.login.bind(this.legacyAdminAuth);
        const originalLogout = this.legacyAdminAuth.logout.bind(this.legacyAdminAuth);

        // Interceptar login legacy
        this.legacyAdminAuth.login = async () => {
            if (this.preferredSystem === 'jwt' && this.jwtAuthSystem) {
                console.log('🔗 Interceptando login legacy, redirigiendo a sistema JWT...');
                await this.showJWTLoginModal();
            } else {
                return originalLogin();
            }
        };

        // Interceptar logout legacy
        this.legacyAdminAuth.logout = async () => {
            if (this.jwtAuthSystem && this.jwtAuthSystem.isAuthenticated()) {
                console.log('🔗 Interceptando logout legacy, usando sistema JWT...');
                await this.jwtAuthSystem.logout();
            }
            return originalLogout();
        };
    }

    /**
     * Sincronizar login JWT con sistema legacy
     */
    syncJWTToLegacy(user) {
        if (!this.legacyAdminAuth) return;

        // Simular login en sistema legacy sin validación de contraseña
        this.legacyAdminAuth.isAdminLoggedIn = true;
        this.legacyAdminAuth.adminSession = {
            timestamp: Date.now(),
            role: user.role,
            loginTime: new Date().toISOString(),
            email: user.email,
            jwtIntegrated: true
        };

        // Almacenar sesión legacy
        localStorage.setItem('admin_session', JSON.stringify(this.legacyAdminAuth.adminSession));

        console.log('✅ Login sincronizado con sistema legacy');
    }

    /**
     * Sincronizar logout con sistema legacy
     */
    syncLogoutToLegacy() {
        if (!this.legacyAdminAuth) return;

        this.legacyAdminAuth.isAdminLoggedIn = false;
        this.legacyAdminAuth.adminSession = null;
        localStorage.removeItem('admin_session');

        console.log('✅ Logout sincronizado con sistema legacy');
    }

    /**
     * Mostrar modal de login JWT
     */
    async showJWTLoginModal() {
        return new Promise((resolve, reject) => {
            // Crear modal de login JWT
            const modal = this.createJWTLoginModal();
            document.body.appendChild(modal);

            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();

            // Manejar cierre del modal
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                resolve(false);
            });
        });
    }

    /**
     * Crear modal de login JWT
     */
    createJWTLoginModal() {
        const modalHTML = `
            <div class="modal fade" id="jwtLoginModal" tabindex="-1" aria-labelledby="jwtLoginModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="jwtLoginModalLabel">
                                <i class="fas fa-shield-alt me-2"></i>
                                Iniciar Sesión - BGE Héroes de la Patria
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="jwtLoginForm">
                                <div class="mb-3">
                                    <label for="jwtEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="jwtEmail" required
                                           placeholder="usuario@heroespatria.edu.mx">
                                </div>
                                <div class="mb-3">
                                    <label for="jwtPassword" class="form-label">Contraseña</label>
                                    <input type="password" class="form-control" id="jwtPassword" required>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="jwtRememberMe">
                                    <label class="form-check-label" for="jwtRememberMe">
                                        Recordarme (30 días)
                                    </label>
                                </div>
                                <div id="jwtLoginError" class="alert alert-danger d-none"></div>
                                <div id="jwtLoginLoading" class="d-none text-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Autenticando...</span>
                                    </div>
                                    <p class="mt-2">Verificando credenciales...</p>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                Cancelar
                            </button>
                            <button type="submit" form="jwtLoginForm" class="btn btn-primary" id="jwtLoginBtn">
                                <i class="fas fa-sign-in-alt me-2"></i>
                                Iniciar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHTML;
        const modal = modalElement.firstElementChild;

        // Configurar formulario
        const form = modal.querySelector('#jwtLoginForm');
        const errorDiv = modal.querySelector('#jwtLoginError');
        const loadingDiv = modal.querySelector('#jwtLoginLoading');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = modal.querySelector('#jwtEmail').value;
            const password = modal.querySelector('#jwtPassword').value;
            const rememberMe = modal.querySelector('#jwtRememberMe').checked;

            // Mostrar loading
            form.style.display = 'none';
            loadingDiv.classList.remove('d-none');
            errorDiv.classList.add('d-none');

            try {
                const result = await this.jwtAuthSystem.login({
                    email,
                    password,
                    rememberMe
                });

                if (result.success) {
                    console.log('✅ Login JWT exitoso');
                    const bootstrapModal = bootstrap.Modal.getInstance(modal);
                    bootstrapModal.hide();
                } else {
                    throw new Error(result.message || 'Error en el login');
                }

            } catch (error) {
                console.error('❌ Error en login JWT:', error);

                // Mostrar error
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('d-none');
                form.style.display = 'block';
                loadingDiv.classList.add('d-none');
            }
        });

        return modal;
    }

    /**
     * Actualizar UI integrada
     */
    updateIntegratedUI() {
        // Actualizar elementos legacy si JWT está autenticado
        if (this.jwtAuthSystem && this.jwtAuthSystem.isAuthenticated()) {
            this.updateLegacyUIElements();
        }

        // Actualizar botones de login/logout
        this.updateAuthButtons();
    }

    /**
     * Actualizar elementos UI del sistema legacy
     */
    updateLegacyUIElements() {
        if (!this.legacyAdminAuth) return;

        // Forzar actualización de UI legacy
        setTimeout(() => {
            if (this.legacyAdminAuth.updateUI) {
                this.legacyAdminAuth.updateUI();
            }
        }, 100);
    }

    /**
     * Actualizar botones de autenticación
     */
    updateAuthButtons() {
        const loginBtn = document.getElementById('adminPanelMenuLink');
        const user = this.jwtAuthSystem ? this.jwtAuthSystem.getCurrentUser() : null;

        if (loginBtn) {
            if (user) {
                // Usuario autenticado
                loginBtn.innerHTML = `
                    <i class="fas fa-user-shield me-2"></i>
                    ${user.nombre || user.username}
                    <span class="badge bg-success ms-1">${user.role}</span>
                `;
                loginBtn.classList.add('text-success');
                loginBtn.onclick = () => this.showUserMenu();
            } else {
                // Usuario no autenticado
                loginBtn.innerHTML = '<i class="fas fa-shield-halved me-2"></i>Iniciar Sesión';
                loginBtn.classList.remove('text-success');
                loginBtn.onclick = () => this.showJWTLoginModal();
            }
        }
    }

    /**
     * Mostrar menú de usuario
     */
    showUserMenu() {
        const user = this.jwtAuthSystem.getCurrentUser();
        if (!user) return;

        const menuHTML = `
            <div class="dropdown-menu show position-fixed" style="top: 60px; right: 20px; z-index: 9999;">
                <div class="dropdown-header">
                    <strong>${user.nombre || user.username}</strong><br>
                    <small class="text-muted">${user.email}</small><br>
                    <span class="badge bg-primary">${user.role}</span>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" onclick="bgeAuthIntegration.showProfile()">
                    <i class="fas fa-user me-2"></i>Mi Perfil
                </button>
                <button class="dropdown-item" onclick="bgeAuthIntegration.showSettings()">
                    <i class="fas fa-cog me-2"></i>Configuración
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item text-danger" onclick="bgeAuthIntegration.logout()">
                    <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                </button>
            </div>
        `;

        // Remover menú existente
        const existingMenu = document.querySelector('.dropdown-menu.show');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Agregar nuevo menú
        const menuElement = document.createElement('div');
        menuElement.innerHTML = menuHTML;
        document.body.appendChild(menuElement.firstElementChild);

        // Auto-remover al hacer click fuera
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                const menu = document.querySelector('.dropdown-menu.show');
                if (menu && !menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    /**
     * Mostrar perfil de usuario
     */
    showProfile() {
        console.log('🔍 Abriendo perfil de usuario...');
        // Implementar modal de perfil
    }

    /**
     * Mostrar configuración
     */
    showSettings() {
        console.log('⚙️ Abriendo configuración...');
        // Implementar modal de configuración
    }

    /**
     * Cerrar sesión integrada
     */
    async logout() {
        try {
            if (this.jwtAuthSystem && this.jwtAuthSystem.isAuthenticated()) {
                await this.jwtAuthSystem.logout();
            }

            // Cerrar menú
            const menu = document.querySelector('.dropdown-menu.show');
            if (menu) {
                menu.remove();
            }

            console.log('✅ Logout integrado completado');
        } catch (error) {
            console.error('❌ Error en logout integrado:', error);
        }
    }

    /**
     * Verificar si está autenticado en cualquier sistema
     */
    isAuthenticated() {
        if (this.jwtAuthSystem && this.jwtAuthSystem.isAuthenticated()) {
            return true;
        }

        if (this.legacyAdminAuth && this.legacyAdminAuth.isAuthenticated()) {
            return true;
        }

        return false;
    }

    /**
     * Obtener usuario actual de cualquier sistema
     */
    getCurrentUser() {
        if (this.jwtAuthSystem && this.jwtAuthSystem.isAuthenticated()) {
            return this.jwtAuthSystem.getCurrentUser();
        }

        if (this.legacyAdminAuth && this.legacyAdminAuth.isAuthenticated()) {
            return {
                username: 'admin',
                role: 'admin',
                email: 'admin@heroespatria.edu.mx',
                legacySystem: true
            };
        }

        return null;
    }

    /**
     * Debug de integración
     */
    debug() {
        console.log('🔍 === DEBUG BGE AUTH INTEGRATION ===');
        console.log('Sistema JWT:', !!this.jwtAuthSystem);
        console.log('Sistema Legacy:', !!this.legacyAdminAuth);
        console.log('Sistema preferido:', this.preferredSystem);
        console.log('Integrado:', this.isIntegrated);
        console.log('Autenticado (JWT):', this.jwtAuthSystem ? this.jwtAuthSystem.isAuthenticated() : false);
        console.log('Autenticado (Legacy):', this.legacyAdminAuth ? this.legacyAdminAuth.isAuthenticated() : false);
        console.log('Usuario actual:', this.getCurrentUser());
        console.log('========================================');
    }
}

// Instancia global
let bgeAuthIntegration = null;

/**
 * Obtener instancia de integración
 */
function getBGEAuthIntegration() {
    if (!bgeAuthIntegration) {
        bgeAuthIntegration = new BGEAuthIntegration();
    }
    return bgeAuthIntegration;
}

// Exponer globalmente
window.BGEAuthIntegration = BGEAuthIntegration;
window.getBGEAuthIntegration = getBGEAuthIntegration;

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Auto-inicializando BGE Auth Integration...');
    window.bgeAuthIntegration = getBGEAuthIntegration();
});

export { BGEAuthIntegration, getBGEAuthIntegration };