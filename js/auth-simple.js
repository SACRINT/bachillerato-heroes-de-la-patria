/**
 * 🔒 SISTEMA DE AUTENTICACIÓN SIMPLIFICADO Y ROBUSTO
 * Solución limpia para evitar todos los errores complejos
 */

class SimpleAuth {
    constructor() {
        this.isAuthenticated = false;
        this.adminPassword = 'HeroesPatria2024!';
        this.sessionKey = 'admin_authenticated';
        this.init();
    }

    init() {
        //console.log('🔐 Inicializando sistema de autenticación simple');
        
        // Verificar sesión existente
        this.checkExistingSession();
        
        // Configurar eventos cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }

    checkExistingSession() {
        const session = localStorage.getItem(this.sessionKey);
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                if (sessionData.authenticated && sessionData.timestamp) {
                    // Verificar si la sesión no ha expirado (30 minutos)
                    const now = Date.now();
                    const sessionAge = now - sessionData.timestamp;
                    const maxAge = 30 * 60 * 1000; // 30 minutos
                    
                    if (sessionAge < maxAge) {
                        this.isAuthenticated = true;
                        //console.log('✅ Sesión válida restaurada');
                    } else {
                        //console.log('⏰ Sesión expirada');
                        this.logout();
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error verificando sesión:', error);
                this.logout();
            }
        }
    }

    setupUI() {
        //console.log('🎨 Configurando interfaz de usuario');
        
        // Buscar botón de admin con múltiples selectores
        const adminButton = this.findAdminButton();
        if (adminButton) {
            this.updateAdminButton(adminButton);
        }

        // Configurar modal si existe
        this.setupModal();
        
        // Configurar verificación de dashboard
        this.setupDashboardProtection();
    }

    findAdminButton() {
        const selectors = [
            '#adminPanelMenuLink',
            'a[onclick*="handleAdminLogin"]',
            'a[href*="admin"]',
            '.admin-login',
            '[data-admin="true"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                //console.log(`✅ Botón admin encontrado: ${selector}`);
                return element;
            }
        }

        //console.log('⚠️ No se encontró botón de admin específico, buscando en navegación...');
        
        // Buscar en todos los enlaces que contengan "admin"
        const allLinks = document.querySelectorAll('a');
        for (const link of allLinks) {
            if (link.textContent.toLowerCase().includes('admin') || 
                link.innerHTML.toLowerCase().includes('admin')) {
                //console.log('✅ Botón admin encontrado en navegación');
                return link;
            }
        }

        return null;
    }

    updateAdminButton(button) {
        if (this.isAuthenticated) {
            button.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión';
            button.onclick = (e) => {
                e.preventDefault();
                this.logout();
                return false;
            };
        } else {
            button.innerHTML = '<i class="fas fa-shield-alt me-2"></i>Admin';
            button.onclick = (e) => {
                e.preventDefault();
                this.showLogin();
                return false;
            };
        }
    }

    setupModal() {
        // Crear modal si no existe
        if (!document.getElementById('simpleAuthModal')) {
            this.createModal();
        }
    }

    createModal() {
        const modalHTML = `
        <div class="modal fade" id="simpleAuthModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-lock me-2"></i>Autenticación de Administrador
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Desarrollo:</strong> Contraseña: <code>HeroesPatria2024!</code>
                        </div>
                        <form id="simpleAuthForm">
                            <div class="mb-3">
                                <label for="simpleAuthPassword" class="form-label">Contraseña:</label>
                                <input type="password" class="form-control" id="simpleAuthPassword" 
                                       placeholder="Ingresa la contraseña de administrador" required>
                            </div>
                            <div id="simpleAuthError" class="alert alert-danger d-none">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <span id="simpleAuthErrorText">Error en la autenticación</span>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="simpleAuthSubmit">
                            <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar eventos del modal
        this.setupModalEvents();
    }

    setupModalEvents() {
        const submitBtn = document.getElementById('simpleAuthSubmit');
        const passwordInput = document.getElementById('simpleAuthPassword');
        const form = document.getElementById('simpleAuthForm');

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleLogin());
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    showLogin() {
        //console.log('🔓 Mostrando modal de login');
        
        const modal = document.getElementById('simpleAuthModal');
        if (modal) {
            // Usar Bootstrap modal si está disponible
            if (window.bootstrap && bootstrap.Modal) {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            } else {
                // Fallback: mostrar modal manualmente
                modal.style.display = 'block';
                modal.classList.add('show');
                document.body.classList.add('modal-open');
            }
            
            // Limpiar campos
            const passwordInput = document.getElementById('simpleAuthPassword');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
            
            this.hideError();
        } else {
            console.error('❌ Modal no encontrado');
        }
    }

    handleLogin() {
        //console.log('🔑 Procesando login...');
        
        const passwordInput = document.getElementById('simpleAuthPassword');
        const submitBtn = document.getElementById('simpleAuthSubmit');
        
        if (!passwordInput) {
            console.error('❌ Campo de contraseña no encontrado');
            return;
        }

        const password = passwordInput.value.trim();
        
        if (!password) {
            this.showError('Por favor ingresa la contraseña');
            return;
        }

        // Deshabilitar botón mientras procesa
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';
        }

        // Simular verificación (en un sistema real esto sería una llamada al servidor)
        setTimeout(() => {
            if (password === this.adminPassword) {
                this.login();
                this.hideModal();
            } else {
                this.showError('Contraseña incorrecta. La contraseña debe ser: HeroesPatria2024!');
            }

            // Restaurar botón
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
            }
        }, 500);
    }

    login() {
        //console.log('✅ Login exitoso');
        
        this.isAuthenticated = true;
        
        // Guardar sesión
        const sessionData = {
            authenticated: true,
            timestamp: Date.now(),
            user: 'admin'
        };
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        
        // Actualizar UI
        this.setupUI();
        
        // Mostrar mensaje de éxito
        this.showSuccessMessage('¡Autenticación exitosa! Bienvenido, administrador.');
    }

    logout() {
        //console.log('🚪 Cerrando sesión');
        
        this.isAuthenticated = false;
        localStorage.removeItem(this.sessionKey);
        
        // Actualizar UI
        this.setupUI();
        
        // Redirigir si está en dashboard
        if (window.location.pathname.includes('admin-dashboard.html')) {
            window.location.href = 'index.html';
        }
        
        this.showSuccessMessage('Sesión cerrada correctamente.');
    }

    showError(message) {
        const errorDiv = document.getElementById('simpleAuthError');
        const errorText = document.getElementById('simpleAuthErrorText');
        
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.classList.remove('d-none');
        }
    }

    hideError() {
        const errorDiv = document.getElementById('simpleAuthError');
        if (errorDiv) {
            errorDiv.classList.add('d-none');
        }
    }

    hideModal() {
        const modal = document.getElementById('simpleAuthModal');
        if (modal) {
            if (window.bootstrap && bootstrap.Modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            } else {
                modal.style.display = 'none';
                modal.classList.remove('show');
                document.body.classList.remove('modal-open');
            }
        }
    }

    showSuccessMessage(message) {
        // Crear toast de éxito
        const toast = document.createElement('div');
        toast.className = 'toast-success';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        toast.innerHTML = `<i class="fas fa-check-circle me-2"></i>${message}`;
        
        document.body.appendChild(toast);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    setupDashboardProtection() {
        // Solo aplicar en dashboard
        if (window.location.pathname.includes('admin-dashboard.html')) {
            if (!this.isAuthenticated) {
                //console.log('🚫 Dashboard - Usuario no autenticado, redirigiendo...');
                alert('Acceso restringido: Debes iniciar sesión como administrador.');
                window.location.href = 'index.html';
            } else {
                //console.log('✅ Dashboard - Usuario autenticado, acceso permitido');
            }
        }
    }

    // Métodos públicos para compatibilidad
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    getUserInfo() {
        return this.isAuthenticated ? { role: 'admin', user: 'admin' } : null;
    }
}

// Inicializar sistema cuando se carga el script
//console.log('🚀 Cargando sistema de autenticación simple...');
const simpleAuth = new SimpleAuth();

// Exponer globalmente
window.simpleAuth = simpleAuth;
window.handleAdminLogin = () => simpleAuth.showLogin();
window.logoutAdmin = () => simpleAuth.logout();

//console.log('✅ Sistema de autenticación simple cargado y listo');