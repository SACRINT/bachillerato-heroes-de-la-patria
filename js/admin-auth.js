/**
 * SISTEMA DE AUTENTICACIÓN ADMIN - BACHILLERATO HÉROES DE LA PATRIA
 * Control de acceso y seguridad por roles
 */

class AdminAuth {
    constructor() {
        this.isAdminLoggedIn = false;
        this.adminSession = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutos
        this.adminPassword = 'HeroesPatria2024!'; // CAMBIAR AQUÍ: Reemplaza por tu contraseña segura
        this.maxAttempts = 5; // Máximo 5 intentos
        this.lockoutTime = 15 * 60 * 1000; // 15 minutos de bloqueo
        this.storagePrefix = 'adminAuth_';
        
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.setupEventListeners();
        this.updateUI();
        this.startSessionMonitoring();
    }

    // Verificar si hay una sesión activa
    checkExistingSession() {
        const session = localStorage.getItem('admin_session');
        //console.log('🔍 Verificando sesión existente:', !!session);
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const now = Date.now();
                
                //console.log('📊 Validando sesión...');
                
                if (now - sessionData.timestamp < this.sessionTimeout) {
                    this.isAdminLoggedIn = true;
                    this.adminSession = sessionData;
                    //console.log('✅ Sesión admin restaurada - Estado:', this.isAdminLoggedIn);
                    
                    // Forzar actualización de UI inmediatamente
                    setTimeout(() => {
                        //console.log('🔄 Actualizando UI por sesión restaurada...');
                        this.updateUI();
                    }, 100);
                } else {
                    this.logout();
                    //console.log('⏰ Sesión admin expirada');
                }
            } catch (error) {
                console.error('❌ Error parseando sesión:', error);
                localStorage.removeItem('admin_session');
            }
        } else {
            //console.log('ℹ️ No hay sesión guardada');
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Event listener para el formulario de autenticación
        document.addEventListener('DOMContentLoaded', () => {
            const authForm = document.getElementById('adminPanelAuthForm');
            if (authForm) {
                authForm.addEventListener('submit', (e) => this.handleLogin(e));
            }

            // Auto-logout cuando se cierra la ventana
            window.addEventListener('beforeunload', () => {
                if (this.isAdminLoggedIn) {
                    this.updateSessionTimestamp();
                }
            });
        });
    }

    // Manejar el login
    async handleLogin(event) {
        event.preventDefault();
        
        // Verificar si está bloqueado
        if (this.isLockedOut()) {
            this.showLockoutMessage();
            return;
        }
        
        const passwordInput = document.getElementById('adminPanelPassword');
        const errorElement = document.getElementById('adminPanelAuthError');
        const errorText = document.getElementById('adminPanelAuthErrorText');
        
        if (!passwordInput) return;

        const password = passwordInput.value.trim();
        
        // Validar contraseña
        if (this.validatePassword(password)) {
            // Login exitoso - limpiar intentos fallidos
            //console.log('🔐 Contraseña correcta - iniciando login...');
            this.clearFailedAttempts();
            this.login();
            this.closeAuthModal();
            this.showSuccessMessage();
            passwordInput.value = '';
            errorElement?.classList.add('d-none');
            
            // FORZAR actualización de UI múltiples veces
            //console.log('🔄 Forzando actualización de UI post-login...');
            setTimeout(() => this.updateUI(), 100);
            setTimeout(() => this.updateUI(), 300);
            setTimeout(() => this.updateUI(), 500);
            setTimeout(() => this.updateUI(), 1000);
            
            //console.log('✅ Proceso de login completado');
        } else {
            // Login fallido - incrementar contador
            this.recordFailedAttempt();
            const attempts = this.getFailedAttempts();
            const remaining = this.maxAttempts - attempts;
            
            if (attempts >= this.maxAttempts) {
                this.lockout();
                this.showLockoutMessage();
                this.closeAuthModal();
            } else {
                this.showError(errorElement, errorText, 
                    `Contraseña incorrecta. Te quedan ${remaining} intento(s).`);
            }
            
            passwordInput.value = '';
            
            // Delay de seguridad progresivo
            const delay = Math.min(attempts * 1000, 5000);
            passwordInput.disabled = true;
            setTimeout(() => {
                passwordInput.disabled = false;
            }, delay);
        }
    }

    // Validar contraseña
    validatePassword(password) {
        return password === this.adminPassword;
    }

    // Iniciar sesión admin
    login() {
        //console.log('🚀 Iniciando proceso de login...');
        this.isAdminLoggedIn = true;
        this.adminSession = {
            timestamp: Date.now(),
            role: 'admin',
            loginTime: new Date().toISOString()
        };

        //console.log('💾 Guardando sesión:', this.adminSession);
        //console.log('🔍 Estado interno:', {
            isAdminLoggedIn: this.isAdminLoggedIn,
            sessionExists: !!this.adminSession
        });

        // Guardar sesión
        localStorage.setItem('admin_session', JSON.stringify(this.adminSession));
        
        // Verificar que se guardó correctamente
        const saved = localStorage.getItem('admin_session');
        //console.log('✅ Sesión guardada en localStorage:', !!saved);
        
        // Actualizar UI inmediatamente y con múltiples intentos
        //console.log('🔄 Iniciando actualización de UI post-login...');
        this.updateUI();
        
        // Actualizar UI con delays incrementales para asegurar que el DOM esté listo
        setTimeout(() => {
            //console.log('🔄 Segunda actualización de UI (100ms)...');
            this.updateUI();
        }, 100);
        
        setTimeout(() => {
            //console.log('🔄 Tercera actualización de UI (300ms)...');
            this.updateUI();
            //console.log('✅ Admin logueado exitosamente - UI actualizada');
        }, 300);
    }

    // Cerrar sesión admin
    logout() {
        this.isAdminLoggedIn = false;
        this.adminSession = null;
        
        localStorage.removeItem('admin_session');
        
        // LIMPIAR ESTADO DEL MODAL COMPLETAMENTE Y REINCIAR TODO EL SISTEMA
        const modal = document.getElementById('adminPanelAuthModal');
        const passwordInput = document.getElementById('adminPanelPassword');
        const errorElement = document.getElementById('adminPanelAuthError');
        const errorText = document.getElementById('adminPanelAuthErrorText');
        const form = document.getElementById('adminPanelAuthForm');
        
        if (modal) {
            // Cerrar el modal si está abierto
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
            
            // RESET COMPLETO del modal después de un delay
            setTimeout(() => {
                // Destruir instancia actual del modal
                const currentInstance = bootstrap.Modal.getInstance(modal);
                if (currentInstance) {
                    currentInstance.dispose();
                }
                
                // Remover cualquier backdrop que quede
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
                
                // Limpiar clases de body
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                
                //console.log('🔄 Modal completamente reiniciado');
            }, 500);
        }
        
        if (passwordInput) {
            // Limpiar contraseña y habilitar input
            passwordInput.value = '';
            passwordInput.disabled = false;
            passwordInput.readOnly = false;
        }
        
        if (errorElement) {
            // Ocultar errores
            errorElement.classList.add('d-none');
        }
        
        if (errorText) {
            errorText.textContent = '';
        }
        
        if (form) {
            // Resetear el formulario completamente
            form.reset();
        }
        
        // LIMPIAR TODOS LOS EVENT LISTENERS Y RECREARLOS
        setTimeout(() => {
            this.setupEventListeners();
            //console.log('🔄 Event listeners reiniciados');
        }, 600);
        
        // Actualizar UI
        this.updateUI();
        
        // FORZAR ACTUALIZACIÓN DEL SCRIPT NUCLEAR INMEDIATAMENTE
        if (typeof window.nuclearForceAdminElements === 'function') {
            //console.log('🔄 Forzando actualización nuclear después de logout');
            setTimeout(() => window.nuclearForceAdminElements(), 100);
            setTimeout(() => window.nuclearForceAdminElements(), 300);
        }
        
        this.showLogoutMessage();
        //console.log('🚪 Admin deslogueado - modal limpiado');
    }

    // Actualizar interfaz de usuario según el rol
    updateUI() {
        // VERIFICAR ESTADO DE SESIÓN ANTES DE ACTUALIZAR UI
        const session = localStorage.getItem('admin_session');
        if (session && !this.isAdminLoggedIn) {
            //console.log('🔄 Detectada sesión en localStorage pero estado interno es false - corrigiendo...');
            try {
                const sessionData = JSON.parse(session);
                const now = Date.now();
                if (now - sessionData.timestamp < this.sessionTimeout) {
                    this.isAdminLoggedIn = true;
                    this.adminSession = sessionData;
                    //console.log('✅ Estado corregido - Admin logueado');
                }
            } catch (error) {
                localStorage.removeItem('admin_session');
            }
        }
        
        //console.log('🔄 Actualizando UI - Estado admin:', this.isAdminLoggedIn);
        
        // Función para actualizar elementos con múltiples reintentos
        const updateElements = (attemptNum = 1, maxAttempts = 8) => {
            // Elementos solo para admin - incluir ambos elementos
            const adminOnlyElements = document.querySelectorAll('#adminOnlySection, #adminOnlySection2');
            const loginBtn = document.getElementById('adminPanelMenuLink');
            const logoutOption = document.getElementById('adminPanelLogoutOption');
            const sessionStatus = document.getElementById('adminPanelSessionStatus');

            //console.log(`🔍 Intento ${attemptNum} - Elementos encontrados:`, {
                adminElements: adminOnlyElements.length,
                loginBtn: !!loginBtn,
                logoutOption: !!logoutOption,
                sessionStatus: !!sessionStatus
            });

            // Si no encontramos elementos críticos y aún podemos reintentar
            if ((adminOnlyElements.length === 0 || !loginBtn) && attemptNum < maxAttempts) {
                //console.log(`⏳ Elementos no encontrados, reintentando en ${attemptNum * 200}ms... (${attemptNum}/${maxAttempts})`);
                setTimeout(() => updateElements(attemptNum + 1, maxAttempts), attemptNum * 200);
                return;
            }
            
            // Si aún no tenemos elementos en el último intento, mostrar error
            if ((adminOnlyElements.length === 0 || !loginBtn) && attemptNum === maxAttempts) {
                console.error('❌ No se pudieron encontrar elementos críticos del DOM después de', maxAttempts, 'intentos');
                console.error('Elementos buscados: #adminOnlySection, #adminOnlySection2, #adminPanelMenuLink');
                return;
            }

            if (this.isAdminLoggedIn) {
                //console.log('✅ Mostrando elementos de admin...');
                //console.log('🔍 Estado actual de elementos admin:');
                adminOnlyElements.forEach((el, index) => {
                    //console.log(`Elemento ${index + 1}:`, el.id, 'Oculto:', el.classList.contains('d-none'));
                });
                
                // Mostrar elementos de admin
                adminOnlyElements.forEach((el, index) => {
                    if (el) {
                        el.classList.remove('d-none');
                        el.style.display = ''; // Forzar que no esté oculto con style
                        //console.log(`👁️ Mostrando elemento admin ${index + 1}:`, el.id);
                        //console.log(`✅ Elemento ${el.id} clases:`, el.className);
                    }
                });
                
                // Actualizar botón de login
                if (loginBtn) {
                    loginBtn.innerHTML = '<i class="fas fa-shield-check me-2"></i>Admin <span class="badge bg-light text-success ms-1">✓</span>';
                    loginBtn.classList.remove('admin-login-compact');
                    loginBtn.classList.add('text-success');
                    loginBtn.onclick = () => this.openAdminPanel();
                    //console.log('🔄 Botón login actualizado a estado logueado');
                }

                // Mostrar opción de logout
                if (logoutOption) {
                    logoutOption.classList.remove('d-none');
                    //console.log('👁️ Mostrando opción de logout');
                }
                if (sessionStatus) {
                    sessionStatus.classList.remove('d-none');
                    //console.log('👁️ Mostrando status de sesión');
                }

            } else {
                //console.log('❌ Ocultando elementos de admin...');
                
                // Ocultar elementos de admin (SOLO si no están forzados a ser visibles)
                adminOnlyElements.forEach((el, index) => {
                    if (el && !el.hasAttribute('data-force-visible')) {
                        el.classList.add('d-none');
                        //console.log(`🙈 Ocultando elemento admin ${index + 1}:`, el.id);
                    } else if (el && el.hasAttribute('data-force-visible')) {
                        //console.log(`🔒 Elemento ${el.id} PROTEGIDO - no se oculta`);
                    }
                });
                
                // Restaurar botón de login
                if (loginBtn) {
                    loginBtn.innerHTML = '<i class="fas fa-shield-halved me-2"></i>Admin';
                    loginBtn.classList.add('admin-login-compact');
                    loginBtn.classList.remove('text-success');
                    loginBtn.onclick = () => {
                        if (typeof showAdminPanelAuth === 'function') {
                            showAdminPanelAuth();
                        } else {
                            console.error('❌ showAdminPanelAuth no disponible');
                        }
                    };
                    //console.log('🔄 Botón login restaurado a estado normal');
                }

                // Ocultar opción de logout (SOLO si no está forzada a ser visible)
                if (logoutOption && !logoutOption.hasAttribute('data-force-visible')) {
                    logoutOption.classList.add('d-none');
                    //console.log('🙈 Ocultando opción de logout');
                } else if (logoutOption && logoutOption.hasAttribute('data-force-visible')) {
                    //console.log('🔒 Logout PROTEGIDO - no se oculta');
                }
                if (sessionStatus) {
                    sessionStatus.classList.add('d-none');
                    //console.log('🙈 Ocultando status de sesión');
                }
            }

            // Actualizar elementos específicos según contexto
            this.updateContextualElements();
            
            //console.log('✅ Actualización de UI completada');
        };

        // Iniciar el proceso de actualización
        updateElements();
    }

    // Actualizar elementos contextuales
    updateContextualElements() {
        // En admin-dashboard.html, mostrar/ocultar funciones avanzadas
        const advancedFeatures = document.querySelectorAll('.admin-only-feature');
        const restrictedButtons = document.querySelectorAll('.admin-restricted');

        advancedFeatures.forEach(el => {
            if (this.isAdminLoggedIn) {
                el.classList.remove('d-none');
            } else {
                el.classList.add('d-none');
            }
        });

        restrictedButtons.forEach(btn => {
            if (this.isAdminLoggedIn) {
                btn.disabled = false;
                btn.title = '';
            } else {
                btn.disabled = true;
                btn.title = 'Requiere autenticación de administrador';
            }
        });
    }

    // Abrir panel de admin
    openAdminPanel() {
        if (this.isAdminLoggedIn) {
            window.location.href = 'admin-dashboard.html';
        }
    }

    // Cerrar modal de autenticación
    closeAuthModal() {
        const modal = document.getElementById('adminPanelAuthModal');
        if (modal) {
            const bootstrapModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
            bootstrapModal.hide();
        }
    }

    // Mostrar mensaje de éxito
    showSuccessMessage() {
        const toast = this.createToast('success', 'Sesión Iniciada', 'Bienvenido al panel de administración');
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 4000);
    }

    // Mostrar mensaje de logout
    showLogoutMessage() {
        const toast = this.createToast('info', 'Sesión Cerrada', 'Has cerrado la sesión de administrador');
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }

    // Crear toast notification
    createToast(type, title, message) {
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

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        return toast;
    }

    // Mostrar error de autenticación
    showError(errorElement, errorTextElement, message) {
        if (errorElement && errorTextElement) {
            errorTextElement.textContent = message;
            errorElement.classList.remove('d-none');
        }
    }

    // Actualizar timestamp de sesión
    updateSessionTimestamp() {
        if (this.adminSession) {
            this.adminSession.timestamp = Date.now();
            localStorage.setItem('admin_session', JSON.stringify(this.adminSession));
        }
    }

    // Monitoreo de sesión
    startSessionMonitoring() {
        setInterval(() => {
            if (this.isAdminLoggedIn && this.adminSession) {
                const now = Date.now();
                const timeLeft = this.sessionTimeout - (now - this.adminSession.timestamp);
                
                // Advertencia a 5 minutos del vencimiento
                if (timeLeft <= 5 * 60 * 1000 && timeLeft > 4.9 * 60 * 1000) {
                    const toast = this.createToast('warning', 'Sesión por expirar', 'Tu sesión de admin expirará en 5 minutos');
                    document.body.appendChild(toast);
                }
                
                // Logout automático
                if (timeLeft <= 0) {
                    this.logout();
                }
            }
        }, 30000); // Verificar cada 30 segundos
    }

    // Verificar si el usuario está autenticado (para usar en otras páginas)
    isAuthenticated() {
        return this.isAdminLoggedIn;
    }

    // Método para validar acceso a funciones específicas
    requireAuth(callback) {
        if (this.isAuthenticated()) {
            callback();
        } else {
            this.showError(null, null, 'Esta función requiere autenticación de administrador');
            showAdminPanelAuth();
        }
    }

    // === SISTEMA DE SEGURIDAD CONTRA ATAQUES DE FUERZA BRUTA ===
    
    // Obtener número de intentos fallidos
    getFailedAttempts() {
        const attempts = localStorage.getItem(this.storagePrefix + 'failedAttempts');
        return attempts ? parseInt(attempts) : 0;
    }
    
    // Registrar intento fallido
    recordFailedAttempt() {
        const attempts = this.getFailedAttempts() + 1;
        localStorage.setItem(this.storagePrefix + 'failedAttempts', attempts.toString());
        localStorage.setItem(this.storagePrefix + 'lastAttempt', Date.now().toString());
    }
    
    // Limpiar intentos fallidos
    clearFailedAttempts() {
        localStorage.removeItem(this.storagePrefix + 'failedAttempts');
        localStorage.removeItem(this.storagePrefix + 'lastAttempt');
        localStorage.removeItem(this.storagePrefix + 'lockoutTime');
    }
    
    // Bloquear cuenta
    lockout() {
        const lockoutUntil = Date.now() + this.lockoutTime;
        localStorage.setItem(this.storagePrefix + 'lockoutTime', lockoutUntil.toString());
        //console.log('🔒 Cuenta bloqueada por seguridad');
    }
    
    // Verificar si está bloqueado
    isLockedOut() {
        const lockoutTime = localStorage.getItem(this.storagePrefix + 'lockoutTime');
        if (!lockoutTime) return false;
        
        const lockoutUntil = parseInt(lockoutTime);
        const now = Date.now();
        
        if (now < lockoutUntil) {
            return true;
        } else {
            // Bloqueo expirado, limpiar
            this.clearFailedAttempts();
            return false;
        }
    }
    
    // Mostrar mensaje de bloqueo
    showLockoutMessage() {
        const lockoutTime = localStorage.getItem(this.storagePrefix + 'lockoutTime');
        if (!lockoutTime) return;
        
        const lockoutUntil = parseInt(lockoutTime);
        const now = Date.now();
        const remainingMs = lockoutUntil - now;
        const remainingMin = Math.ceil(remainingMs / (60 * 1000));
        
        if (remainingMin > 0) {
            const toast = this.createToast('danger', 'Cuenta Bloqueada', 
                `Por seguridad, la cuenta está bloqueada por ${remainingMin} minuto(s) más.`);
            document.body.appendChild(toast);
        }
    }
}

// Funciones globales para mantener compatibilidad
let adminAuth;

// Función para inicializar el sistema de autenticación
function initAdminAuthSystem() {
    if (!adminAuth) {
        //console.log('🚀 Inicializando sistema de autenticación admin...');
        adminAuth = new AdminAuth();
        
        // Hacer funciones disponibles globalmente
        window.adminAuth = adminAuth;
        
        // handleAdminLogin ahora está implementado inline en el botón
        
        window.showAdminPanelAuth = function() {
            //console.log('🔐 Abriendo modal de autenticación...');
            const modal = document.getElementById('adminPanelAuthModal');
            if (modal) {
                const bootstrapModal = new bootstrap.Modal(modal);
                bootstrapModal.show();
                //console.log('✅ Modal de autenticación mostrado');
            } else {
                console.error('❌ Modal de autenticación no encontrado');
                //console.log('🔍 Elementos disponibles:', document.querySelectorAll('[id*="admin"]'));
            }
        };
        
        window.logoutAdminPanel = function() {
            //console.log('🚪 Cerrando sesión admin...');
            if (adminAuth) {
                adminAuth.logout();
            }
        };
        
        // Función para verificar si está autenticado (para usar en otras scripts)
        window.isAdminAuthenticated = function() {
            return adminAuth ? adminAuth.isAuthenticated() : false;
        };
        
        // Función de debug para monitorear el estado
        window.debugAdminAuth = function() {
            //console.log('🔍 === DEBUG ADMIN AUTH ===');
            //console.log('adminAuth existe:', !!adminAuth);
            //console.log('Autenticado:', window.isAdminAuthenticated());
            //console.log('Sesión:', adminAuth?.adminSession);
            const adminElements = document.querySelectorAll('#adminOnlySection, #adminOnlySection2');
            //console.log('Elementos admin encontrados:', adminElements.length);
            adminElements.forEach((el, i) => {
                //console.log(`Elemento ${i + 1} (${el.id}):`, !el.classList.contains('d-none') ? 'VISIBLE' : 'OCULTO', 'Style:', el.style.display);
            });
            const loginBtn = document.getElementById('adminPanelMenuLink');
            //console.log('Botón login:', loginBtn?.innerHTML);
            //console.log('=========================');
        };
        
        // Función para forzar login de prueba
        window.forceAdminLogin = function() {
            //console.log('🚀 Forzando login de admin...');
            if (adminAuth) {
                adminAuth.isAdminLoggedIn = true;
                adminAuth.adminSession = {
                    timestamp: Date.now(),
                    role: 'admin',
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('admin_session', JSON.stringify(adminAuth.adminSession));
                //console.log('🔍 Estado después de forzar:', {
                    loggedIn: adminAuth.isAdminLoggedIn,
                    session: adminAuth.adminSession,
                    localStorage: !!localStorage.getItem('admin_session')
                });
                
                // Actualizar UI múltiples veces
                adminAuth.updateUI();
                setTimeout(() => adminAuth.updateUI(), 100);
                setTimeout(() => adminAuth.updateUI(), 300);
                setTimeout(() => adminAuth.updateUI(), 500);
                
                //console.log('✅ Login forzado completado - UI actualizada múltiples veces');
            } else {
                console.error('❌ adminAuth no disponible');
            }
        };
        
        // Función para limpiar completamente y reiniciar
        window.resetAdminAuth = function() {
            //console.log('🗑️ Limpiando sistema de auth...');
            localStorage.removeItem('admin_session');
            if (adminAuth) {
                adminAuth.isAdminLoggedIn = false;
                adminAuth.adminSession = null;
                adminAuth.updateUI();
            }
            //console.log('✅ Sistema reseteado');
        };
        
        // Función para mostrar elementos admin directamente
        window.showAdminElements = function() {
            //console.log('👁️ FORZANDO VISIBILIDAD - MODO AGRESIVO...');
            
            // FORZAR ESTADO INTERNO PRIMERO
            if (adminAuth) {
                adminAuth.isAdminLoggedIn = true;
                adminAuth.adminSession = {
                    timestamp: Date.now(),
                    role: 'admin',
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('admin_session', JSON.stringify(adminAuth.adminSession));
                //console.log('🔥 ESTADO INTERNO FORZADO A TRUE');
            }
            
            const adminElements = document.querySelectorAll('#adminOnlySection, #adminOnlySection2');
            const loginBtn = document.getElementById('adminPanelMenuLink');
            const logoutBtn = document.getElementById('adminPanelLogoutOption');
            
            //console.log('🔍 Elementos encontrados:', {
                adminElements: adminElements.length,
                loginBtn: !!loginBtn,
                logoutBtn: !!logoutBtn
            });
            
            // FORZAR ELEMENTOS CON MÚLTIPLES MÉTODOS
            adminElements.forEach((el, i) => {
                if (el) {
                    // Remover TODAS las clases que ocultan
                    el.classList.remove('d-none', 'hidden');
                    el.style.display = 'block !important';
                    el.style.visibility = 'visible !important';
                    el.style.opacity = '1 !important';
                    // Agregar atributo para evitar que se oculte
                    el.setAttribute('data-force-visible', 'true');
                    //console.log(`🔥 ELEMENTO ${i + 1} (${el.id}) FORZADO A SER VISIBLE`);
                }
            });
            
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-user-shield me-1"></i>Panel Admin <span class="badge bg-success ms-1">✓</span>';
                loginBtn.classList.add('text-success');
                loginBtn.setAttribute('data-admin-active', 'true');
                //console.log('🔥 BOTÓN LOGIN FORZADO');
            }
            
            if (logoutBtn) {
                logoutBtn.classList.remove('d-none', 'hidden');
                logoutBtn.style.display = 'block !important';
                logoutBtn.setAttribute('data-force-visible', 'true');
                //console.log('🔥 BOTÓN LOGOUT FORZADO');
            }
            
            //console.log('🔥 ELEMENTOS FORZADOS CON MODO AGRESIVO - DEBERÍAN SER VISIBLES AHORA');
        };
        
        // Función para bloquear completamente el sistema de ocultamiento
        window.lockAdminVisible = function() {
            //console.log('🔐 BLOQUEANDO SISTEMA DE OCULTAMIENTO...');
            
            // Forzar estado interno
            if (adminAuth) {
                adminAuth.isAdminLoggedIn = true;
                adminAuth.adminSession = {
                    timestamp: Date.now(),
                    role: 'admin',
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('admin_session', JSON.stringify(adminAuth.adminSession));
            }
            
            // Mostrar elementos
            showAdminElements();
            
            // Crear un observer para evitar que se oculten los elementos
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const target = mutation.target;
                        if (target.id === 'adminOnlySection' || target.id === 'adminOnlySection2') {
                            if (target.classList.contains('d-none')) {
                                //console.log('🚫 BLOQUEANDO intento de ocultar', target.id);
                                target.classList.remove('d-none');
                                target.style.display = 'block !important';
                            }
                        }
                    }
                });
            });
            
            // Observar los elementos admin
            const adminElements = document.querySelectorAll('#adminOnlySection, #adminOnlySection2, #adminPanelLogoutOption');
            adminElements.forEach(el => {
                if (el) {
                    observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
                }
            });
            
            //console.log('🔐 SISTEMA DE PROTECCIÓN ACTIVADO - Los elementos NO SE PUEDEN OCULTAR');
        };
        
        // Función para requerir autenticación
        window.requireAdminAuth = function(callback) {
            if (adminAuth) {
                adminAuth.requireAuth(callback);
            }
        };
        
        // Función para abrir Panel de Administración como ventana popup
        window.openAdminPanel = function() {
            //console.log('🚀 Abriendo Panel de Administración...');
            
            // Verificar autenticación
            if (!window.isAdminAuthenticated()) {
                console.warn('⚠️ Usuario no autenticado, mostrando modal de login');
                alert('Debes iniciar sesión como administrador primero.');
                showAdminPanelAuth();
                return;
            }
            
            // Configuración de la ventana popup
            const windowFeatures = [
                'width=1200',
                'height=800',
                'left=' + (screen.width / 2 - 600),
                'top=' + (screen.height / 2 - 400),
                'resizable=yes',
                'scrollbars=yes',
                'status=yes',
                'location=yes',
                'toolbar=no',
                'menubar=no'
            ].join(',');
            
            try {
                const adminWindow = window.open(
                    'admin/manual.html',
                    'AdminPanel',
                    windowFeatures
                );
                
                if (adminWindow) {
                    // Enfocar la ventana
                    adminWindow.focus();
                    //console.log('✅ Panel de Administración abierto como popup');
                    
                    // Listener para cuando se cierre la ventana
                    const checkClosed = setInterval(() => {
                        if (adminWindow.closed) {
                            //console.log('🚪 Panel de Administración cerrado');
                            clearInterval(checkClosed);
                            
                            // Forzar actualización de UI cuando se cierre
                            if (adminAuth) {
                                //console.log('🔄 Actualizando UI después de cerrar panel...');
                                adminAuth.updateUI();
                            }
                        }
                    }, 1000);
                    
                } else {
                    console.warn('⚠️ No se pudo abrir popup, posible bloqueador');
                    alert('No se pudo abrir la ventana. Verifica que no esté bloqueada por el navegador.');
                    // Fallback: abrir en nueva pestaña
                    window.open('admin/manual.html', '_blank');
                }
                
            } catch (error) {
                console.error('❌ Error abriendo panel:', error);
                alert('Error abriendo el panel. Se abrirá en nueva pestaña.');
                // Fallback: abrir en nueva pestaña
                window.open('admin/manual.html', '_blank');
            }
        };
        
        //console.log('✅ Sistema de autenticación admin inicializado');
        
        // Actualizar UI después de un breve delay para asegurar que el DOM esté listo
        setTimeout(() => {
            //console.log('🔄 Forzando actualización de UI post-inicialización...');
            adminAuth.updateUI();
        }, 100);
        
    } else {
        //console.log('ℹ️ Sistema de autenticación ya estaba inicializado - actualizando UI...');
        // Si ya está inicializado, solo actualizar la UI
        setTimeout(() => {
            adminAuth.updateUI();
        }, 100);
    }
}

// Inicializar cuando el DOM esté listo - solo si no está ya inicializado
document.addEventListener('DOMContentLoaded', function() {
    //console.log('📄 DOM cargado - verificando inicialización de admin auth...');
    if (!window.adminAuth) {
        initAdminAuthSystem();
    } else {
        //console.log('ℹ️ Admin auth ya inicializado desde DOM event');
    }
});

// Exponer función de inicialización globalmente
window.initAdminAuthSystem = initAdminAuthSystem;