/**
 * 🎭 GESTOR DE ROLES Y CONTROL DE ACCESO - BGE HÉROES DE LA PATRIA
 * Sistema completo de control de acceso basado en roles y permisos
 */

class BGERoleManager {
    constructor() {
        this.authSystem = null;
        this.currentRole = null;
        this.currentPermissions = [];

        // Definición de roles y jerarquías
        this.roleHierarchy = {
            admin: 4,
            docente: 3,
            estudiante: 2,
            padre_familia: 1
        };

        // Permisos por rol
        this.rolePermissions = {
            admin: [
                'read_all', 'write_all', 'delete_all',
                'manage_users', 'manage_system', 'manage_reports',
                'manage_grades', 'manage_calendar', 'manage_communications',
                'view_analytics', 'manage_backup', 'manage_security'
            ],
            docente: [
                'read_students', 'write_grades', 'read_calendar', 'write_calendar',
                'write_communications', 'read_reports', 'manage_classes',
                'view_student_profiles', 'create_assignments', 'grade_assignments'
            ],
            estudiante: [
                'read_own_profile', 'read_own_grades', 'read_calendar',
                'read_communications', 'write_assignments', 'submit_assignments',
                'view_own_attendance', 'access_resources'
            ],
            padre_familia: [
                'read_child_profile', 'read_child_grades', 'read_calendar',
                'read_communications', 'write_communications_teachers',
                'view_child_attendance', 'access_child_resources'
            ]
        };

        // Elementos UI por rol
        this.roleElements = {
            admin: [
                '#adminOnlySection',
                '#adminOnlySection2',
                '.admin-only',
                '.admin-only-feature',
                '[data-role="admin"]'
            ],
            docente: [
                '#docenteSection',
                '.docente-only',
                '.teacher-features',
                '[data-role="docente"]',
                '[data-role-min="docente"]'
            ],
            estudiante: [
                '#estudianteSection',
                '.estudiante-only',
                '.student-features',
                '[data-role="estudiante"]'
            ],
            padre_familia: [
                '#padreSection',
                '.padre-only',
                '.parent-features',
                '[data-role="padre_familia"]'
            ]
        };

        // Rutas protegidas por rol
        this.protectedRoutes = {
            admin: [
                'admin-dashboard.html',
                'system-config.html',
                'user-management.html',
                'analytics.html'
            ],
            docente: [
                'teacher-dashboard.html',
                'grades-management.html',
                'class-management.html'
            ],
            estudiante: [
                'student-dashboard.html',
                'assignments.html',
                'grades-view.html'
            ],
            padre_familia: [
                'parent-dashboard.html',
                'child-progress.html'
            ]
        };

        this.init();
    }

    /**
     * Inicializar gestor de roles
     */
    async init() {
        console.log('🎭 Inicializando gestor de roles BGE...');

        // Obtener sistema de auth
        this.authSystem = window.getBGEAuthSystem();

        // Configurar listeners
        this.setupEventListeners();

        // Verificar rol inicial
        this.updateCurrentRole();

        // Configurar observador de cambios en el DOM
        this.setupDOMObserver();

        console.log('✅ Gestor de roles inicializado');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Escuchar cambios de autenticación
        this.authSystem.on('login', (data) => {
            this.handleRoleChange(data.user);
        });

        this.authSystem.on('logout', () => {
            this.handleRoleChange(null);
        });

        // Listener para cambios de página
        window.addEventListener('popstate', () => {
            this.checkPageAccess();
        });

        // Verificar acceso inicial
        document.addEventListener('DOMContentLoaded', () => {
            this.checkPageAccess();
            this.updateUIVisibility();
        });
    }

    /**
     * Manejar cambio de rol
     */
    handleRoleChange(user) {
        if (user) {
            this.currentRole = user.role;
            this.currentPermissions = user.permissions || this.rolePermissions[user.role] || [];

            console.log(`🎭 Rol actualizado: ${this.currentRole}`);
            console.log(`🔐 Permisos: ${this.currentPermissions.join(', ')}`);
        } else {
            this.currentRole = null;
            this.currentPermissions = [];
            console.log('🎭 Rol limpiado - usuario no autenticado');
        }

        // Actualizar UI
        this.updateUIVisibility();

        // Verificar acceso a página actual
        this.checkPageAccess();
    }

    /**
     * Actualizar rol actual
     */
    updateCurrentRole() {
        const user = this.authSystem.getCurrentUser();
        if (user) {
            this.currentRole = user.role;
            this.currentPermissions = user.permissions || this.rolePermissions[user.role] || [];
        } else {
            this.currentRole = null;
            this.currentPermissions = [];
        }
    }

    /**
     * Verificar si el usuario tiene un rol específico
     */
    hasRole(requiredRoles) {
        if (!this.currentRole) return false;

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        return roles.includes(this.currentRole);
    }

    /**
     * Verificar si el usuario tiene un rol mínimo
     */
    hasMinimumRole(minimumRole) {
        if (!this.currentRole) return false;

        const currentLevel = this.roleHierarchy[this.currentRole] || 0;
        const requiredLevel = this.roleHierarchy[minimumRole] || 0;

        return currentLevel >= requiredLevel;
    }

    /**
     * Verificar si el usuario tiene un permiso específico
     */
    hasPermission(requiredPermissions) {
        if (!this.currentRole) return false;

        const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

        return permissions.some(perm =>
            this.currentPermissions.includes(perm) ||
            this.currentPermissions.includes('read_all') ||
            this.currentPermissions.includes('write_all')
        );
    }

    /**
     * Verificar acceso a página actual
     */
    checkPageAccess() {
        const currentPage = window.location.pathname.split('/').pop();

        if (!currentPage || currentPage === '') return true;

        // Verificar si la página está protegida
        for (const [role, routes] of Object.entries(this.protectedRoutes)) {
            if (routes.includes(currentPage)) {
                if (!this.hasRole(role) && !this.hasMinimumRole('admin')) {
                    console.warn(`⚠️ Acceso denegado a ${currentPage} para rol: ${this.currentRole}`);
                    this.handleAccessDenied(currentPage, role);
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Manejar acceso denegado
     */
    handleAccessDenied(page, requiredRole) {
        // Mostrar mensaje de error
        this.showAccessDeniedMessage(requiredRole);

        // Redirigir a página apropiada
        setTimeout(() => {
            this.redirectToAppropriate();
        }, 3000);
    }

    /**
     * Mostrar mensaje de acceso denegado
     */
    showAccessDeniedMessage(requiredRole) {
        const message = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
                <h4 class="alert-heading"><i class="fas fa-lock me-2"></i>Acceso Denegado</h4>
                <p class="mb-2">No tienes permisos para acceder a esta página.</p>
                <p class="mb-2"><strong>Se requiere rol:</strong> ${requiredRole}</p>
                <p class="mb-0"><strong>Tu rol actual:</strong> ${this.currentRole || 'No autenticado'}</p>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', message);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            const alert = document.querySelector('.alert-danger[role="alert"]');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    /**
     * Redirigir a página apropiada según rol
     */
    redirectToAppropriate() {
        let redirectUrl = 'index.html';

        if (this.currentRole) {
            switch (this.currentRole) {
                case 'admin':
                    redirectUrl = 'admin-dashboard.html';
                    break;
                case 'docente':
                    redirectUrl = 'teacher-dashboard.html';
                    break;
                case 'estudiante':
                    redirectUrl = 'student-dashboard.html';
                    break;
                case 'padre_familia':
                    redirectUrl = 'parent-dashboard.html';
                    break;
                default:
                    redirectUrl = 'index.html';
            }
        }

        console.log(`🔄 Redirigiendo a: ${redirectUrl}`);
        window.location.href = redirectUrl;
    }

    /**
     * Actualizar visibilidad de elementos UI
     */
    updateUIVisibility() {
        console.log('🎭 Actualizando visibilidad de UI según rol...');

        // Ocultar todos los elementos protegidos primero
        this.hideAllProtectedElements();

        // Mostrar elementos para el rol actual
        if (this.currentRole) {
            this.showElementsForRole(this.currentRole);

            // También mostrar elementos para roles inferiores si es admin
            if (this.currentRole === 'admin') {
                Object.keys(this.roleElements).forEach(role => {
                    if (role !== 'admin') {
                        this.showElementsForRole(role);
                    }
                });
            }
        }

        // Actualizar elementos con atributos data-role
        this.updateDataRoleElements();

        // Actualizar elementos con atributos data-permission
        this.updateDataPermissionElements();
    }

    /**
     * Ocultar todos los elementos protegidos
     */
    hideAllProtectedElements() {
        Object.values(this.roleElements).forEach(selectors => {
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    el.classList.add('d-none');
                    el.style.display = 'none';
                });
            });
        });
    }

    /**
     * Mostrar elementos para un rol específico
     */
    showElementsForRole(role) {
        const selectors = this.roleElements[role] || [];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.classList.remove('d-none');
                el.style.display = '';
            });
        });

        console.log(`👁️ Elementos mostrados para rol: ${role}`);
    }

    /**
     * Actualizar elementos con data-role
     */
    updateDataRoleElements() {
        const elements = document.querySelectorAll('[data-role]');

        elements.forEach(el => {
            const requiredRole = el.getAttribute('data-role');
            const shouldShow = this.hasRole(requiredRole) || this.hasMinimumRole('admin');

            if (shouldShow) {
                el.classList.remove('d-none');
                el.style.display = '';
            } else {
                el.classList.add('d-none');
                el.style.display = 'none';
            }
        });

        // Elementos con rol mínimo
        const minRoleElements = document.querySelectorAll('[data-role-min]');
        minRoleElements.forEach(el => {
            const minRole = el.getAttribute('data-role-min');
            const shouldShow = this.hasMinimumRole(minRole);

            if (shouldShow) {
                el.classList.remove('d-none');
                el.style.display = '';
            } else {
                el.classList.add('d-none');
                el.style.display = 'none';
            }
        });
    }

    /**
     * Actualizar elementos con data-permission
     */
    updateDataPermissionElements() {
        const elements = document.querySelectorAll('[data-permission]');

        elements.forEach(el => {
            const requiredPermission = el.getAttribute('data-permission');
            const shouldShow = this.hasPermission(requiredPermission);

            if (shouldShow) {
                el.classList.remove('d-none');
                el.style.display = '';
                el.disabled = false;
            } else {
                el.classList.add('d-none');
                el.style.display = 'none';
                el.disabled = true;
            }
        });
    }

    /**
     * Configurar observador de cambios en el DOM
     */
    setupDOMObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Solo actualizar si se agregaron elementos con atributos de rol
                    const hasRoleElements = Array.from(mutation.addedNodes).some(node =>
                        node.nodeType === 1 && (
                            node.hasAttribute('data-role') ||
                            node.hasAttribute('data-permission') ||
                            node.querySelector('[data-role], [data-permission]')
                        )
                    );

                    if (hasRoleElements) {
                        setTimeout(() => this.updateUIVisibility(), 100);
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Verificar si un elemento debe ser visible
     */
    shouldElementBeVisible(element) {
        // Verificar data-role
        const requiredRole = element.getAttribute('data-role');
        if (requiredRole && !this.hasRole(requiredRole)) {
            return false;
        }

        // Verificar data-role-min
        const minRole = element.getAttribute('data-role-min');
        if (minRole && !this.hasMinimumRole(minRole)) {
            return false;
        }

        // Verificar data-permission
        const requiredPermission = element.getAttribute('data-permission');
        if (requiredPermission && !this.hasPermission(requiredPermission)) {
            return false;
        }

        // Verificar clases de rol
        const roleClasses = ['admin-only', 'docente-only', 'estudiante-only', 'padre-only'];
        const hasRoleClass = roleClasses.some(className => element.classList.contains(className));

        if (hasRoleClass) {
            const roleFromClass = roleClasses.find(className => element.classList.contains(className));
            const role = roleFromClass.replace('-only', '').replace('padre', 'padre_familia');
            return this.hasRole(role) || this.hasMinimumRole('admin');
        }

        return true;
    }

    /**
     * Obtener información del rol actual
     */
    getCurrentRoleInfo() {
        return {
            role: this.currentRole,
            permissions: this.currentPermissions,
            roleLevel: this.roleHierarchy[this.currentRole] || 0,
            isAuthenticated: !!this.currentRole,
            canAccess: (roleOrPermission) => {
                return this.hasRole(roleOrPermission) || this.hasPermission(roleOrPermission);
            }
        };
    }

    /**
     * Método para desarrolladores - forzar rol temporal
     */
    debugSetRole(role, permissions = null) {
        console.log(`🔧 DEBUG: Forzando rol temporal: ${role}`);

        this.currentRole = role;
        this.currentPermissions = permissions || this.rolePermissions[role] || [];

        this.updateUIVisibility();

        // Revertir después de 30 segundos
        setTimeout(() => {
            console.log('🔧 DEBUG: Revirtiendo rol temporal');
            this.updateCurrentRole();
            this.updateUIVisibility();
        }, 30000);
    }

    /**
     * Método debug para mostrar información del sistema
     */
    debug() {
        console.log('🔍 === DEBUG BGE ROLE MANAGER ===');
        console.log('Rol actual:', this.currentRole);
        console.log('Permisos:', this.currentPermissions);
        console.log('Nivel de rol:', this.roleHierarchy[this.currentRole] || 0);
        console.log('Usuario autenticado:', this.authSystem.isAuthenticated());
        console.log('Página actual:', window.location.pathname);
        console.log('Acceso permitido:', this.checkPageAccess());

        // Mostrar elementos visibles por rol
        Object.entries(this.roleElements).forEach(([role, selectors]) => {
            const visibleCount = selectors.reduce((count, selector) => {
                const elements = document.querySelectorAll(selector);
                return count + Array.from(elements).filter(el => !el.classList.contains('d-none')).length;
            }, 0);
            console.log(`Elementos ${role} visibles:`, visibleCount);
        });

        console.log('====================================');
    }
}

// Instancia global
let bgeRoleManager = null;

/**
 * Obtener instancia del gestor de roles
 */
function getBGERoleManager() {
    if (!bgeRoleManager) {
        bgeRoleManager = new BGERoleManager();
    }
    return bgeRoleManager;
}

// Exponer globalmente
window.BGERoleManager = BGERoleManager;
window.getBGERoleManager = getBGERoleManager;

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Auto-inicializando BGE Role Manager...');
    window.bgeRoleManager = getBGERoleManager();
});

export { BGERoleManager, getBGERoleManager };