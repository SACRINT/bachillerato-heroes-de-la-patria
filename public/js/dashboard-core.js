/**
 * DASHBOARD CORE - Núcleo Minimalista del Admin Dashboard
 *
 * Propósito: Coordinar carga de módulos y lifecycle del dashboard
 * Responsabilidad: SOLO coordinación, SIN lógica de negocio
 *
 * Arquitectura:
 *   - Carga módulos dinámicamente
 *   - Gestiona lifecycle (init, destroy)
 *   - Comunica via Event Bus (0 dependencias directas)
 *
 * Versión: 1.0.0
 * Fecha: 21 Noviembre 2025
 * Parte de: SEMANA 1 - Refactorización Admin Dashboard
 */

class DashboardCore {
    constructor() {
        this.modules = new Map();
        this.isInitialized = false;
        this.currentUser = null;

        void 0;
    }

    /**
     * Inicializar dashboard
     */
    async init() {
        if (this.isInitialized) {
            void 0;
            return;
        }

        void 0;

        try {
            // 1. Verificar autenticación
            await this.checkAuthentication();

            if (!this.currentUser || !this.isAdmin()) {
                this.showLoginPrompt();
                return;
            }

            // 2. Registrar módulos
            this.registerModules();

            // 3. Inicializar módulos
            await this.initializeModules();

            // 4. Setup listeners globales
            this.setupEventListeners();

            // 5. Emit evento de inicialización completa
            eventBus.emit('dashboard.initialized', {
                user: this.currentUser,
                modules: Array.from(this.modules.keys())
            });

            this.isInitialized = true;
            void 0;

        } catch (error) {
            console.error('[DASHBOARD-CORE] ❌ Error inicializando dashboard:', error);
            this.showError('Error inicializando dashboard. Por favor recarga la página.');
        }
    }

    /**
     * Verificar autenticación del usuario
     */
    async checkAuthentication() {
        void 0;

        // Prioridad 1: Sistema seguro (nuevo)
        if (window.secureAdminAuth && window.secureAdminAuth.isUserAuthenticated()) {
            this.currentUser = window.secureAdminAuth.getCurrentUser();
            void 0;
            return;
        }

        // Prioridad 2: localStorage seguro
        try {
            const secureSession = localStorage.getItem('secure_admin_session');
            if (secureSession) {
                const sessionData = JSON.parse(secureSession);
                if (sessionData.token && sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                    this.currentUser = sessionData.user || { role: 'admin' };
                    void 0;
                    return;
                }
            }
        } catch (error) {
            void 0;
        }

        // Fallback: Sistema viejo
        if (window.authInterface && window.authInterface.isAuthenticated()) {
            this.currentUser = window.authInterface.getCurrentUser();
            void 0;
            return;
        }

        void 0;
        this.currentUser = null;
    }

    /**
     * Verificar si el usuario es admin
     */
    isAdmin() {
        return this.currentUser && (
            this.currentUser.role === 'admin' ||
            this.currentUser.role === 'administrativo' ||
            this.currentUser.isAdmin === true
        );
    }

    /**
     * Registrar módulos disponibles
     */
    registerModules() {
        void 0;

        // Módulo 1: Estudiantes
        if (window.StudentModule) {
            this.modules.set('students', new window.StudentModule(eventBus));
        }

        // Módulo 2: Calificaciones
        if (window.GradesModule) {
            this.modules.set('grades', new window.GradesModule(eventBus));
        }

        // Módulo 3: Asistencia
        if (window.AttendanceModule) {
            this.modules.set('attendance', new window.AttendanceModule(eventBus));
        }

        // Módulo 4: Notificaciones
        if (window.NotificationsModule) {
            this.modules.set('notifications', new window.NotificationsModule(eventBus));
        }

        // Módulo 5: Reportes
        if (window.ReportsModule) {
            this.modules.set('reports', new window.ReportsModule(eventBus));
        }

        // Módulo 6: Configuración
        if (window.SettingsModule) {
            this.modules.set('settings', new window.SettingsModule(eventBus));
        }

        void 0;
    }

    /**
     * Inicializar todos los módulos
     */
    async initializeModules() {
        void 0;

        const initPromises = [];

        for (const [name, module] of this.modules.entries()) {
            void 0;

            if (typeof module.init === 'function') {
                initPromises.push(
                    module.init().catch(error => {
                        console.error(`[DASHBOARD-CORE] ❌ Error inicializando ${name}:`, error);
                    })
                );
            }
        }

        await Promise.all(initPromises);
        void 0;
    }

    /**
     * Setup de event listeners globales
     */
    setupEventListeners() {
        // Listener: Usuario hace logout
        eventBus.on('auth.logout', () => {
            void 0;
            this.destroy();
            window.location.href = '/index.html';
        });

        // Listener: Sesión expirada
        eventBus.on('auth.sessionExpired', () => {
            void 0;
            this.destroy();
            this.showLoginPrompt();
        });

        // Listener: Error global
        eventBus.on('error', (event) => {
            console.error('[DASHBOARD-CORE] ❌ Error global:', event.data);
            this.showError(event.data.message || 'Ocurrió un error inesperado');
        });

        void 0;
    }

    /**
     * Mostrar prompt de login
     */
    showLoginPrompt() {
        void 0;

        const loginContainer = document.getElementById('login-container');
        const dashboardContainer = document.getElementById('dashboard-container');

        if (loginContainer) {
            loginContainer.style.display = 'block';
        }

        if (dashboardContainer) {
            dashboardContainer.style.display = 'none';
        }

        // Emit evento
        eventBus.emit('dashboard.loginRequired');
    }

    /**
     * Mostrar error
     */
    showError(message) {
        console.error('[DASHBOARD-CORE] 🚨 Error:', message);

        // Emit evento para que algún módulo lo maneje
        eventBus.emit('ui.showError', { message });

        // Fallback: alert
        if (typeof alert !== 'undefined') {
            alert(message);
        }
    }

    /**
     * Obtener módulo por nombre
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Destruir dashboard y limpiar recursos
     */
    destroy() {
        void 0;

        // Destruir todos los módulos
        for (const [name, module] of this.modules.entries()) {
            if (typeof module.destroy === 'function') {
                try {
                    module.destroy();
                    void 0;
                } catch (error) {
                    console.error(`[DASHBOARD-CORE] ❌ Error destruyendo ${name}:`, error);
                }
            }
        }

        // Limpiar módulos
        this.modules.clear();

        // Limpiar event bus
        eventBus.clear();

        this.isInitialized = false;
        this.currentUser = null;

        void 0;
    }
}

// Crear instancia global
window.dashboardCore = new DashboardCore();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboardCore.init();
    });
} else {
    // DOM ya está listo
    window.dashboardCore.init();
}
