/**
 * ROLES AND PERMISSIONS MIDDLEWARE
 * Sistema de Control de Acceso Basado en Roles (RBAC)
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

// Definición de Roles
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    EDITOR: 'editor',
    VIEWER: 'viewer',
    TEACHER: 'teacher',
    STUDENT: 'student',
    PARENT: 'parent'
};

// Definición de Permisos
const PERMISSIONS = {
    // CMS - Noticias
    NEWS_CREATE: 'news:create',
    NEWS_READ: 'news:read',
    NEWS_UPDATE: 'news:update',
    NEWS_DELETE: 'news:delete',
    NEWS_PUBLISH: 'news:publish',

    // CMS - Eventos
    EVENTS_CREATE: 'events:create',
    EVENTS_READ: 'events:read',
    EVENTS_UPDATE: 'events:update',
    EVENTS_DELETE: 'events:delete',
    EVENTS_PUBLISH: 'events:publish',

    // CMS - Avisos
    NOTICES_CREATE: 'notices:create',
    NOTICES_READ: 'notices:read',
    NOTICES_UPDATE: 'notices:update',
    NOTICES_DELETE: 'notices:delete',

    // CMS - Comunicados
    ANNOUNCEMENTS_CREATE: 'announcements:create',
    ANNOUNCEMENTS_READ: 'announcements:read',
    ANNOUNCEMENTS_UPDATE: 'announcements:update',
    ANNOUNCEMENTS_DELETE: 'announcements:delete',

    // Usuarios
    USERS_CREATE: 'users:create',
    USERS_READ: 'users:read',
    USERS_UPDATE: 'users:update',
    USERS_DELETE: 'users:delete',
    USERS_MANAGE_ROLES: 'users:manage_roles',

    // Analytics
    ANALYTICS_VIEW: 'analytics:view',
    ANALYTICS_EXPORT: 'analytics:export',

    // Configuración
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_UPDATE: 'settings:update',

    // Archivos
    FILES_UPLOAD: 'files:upload',
    FILES_DELETE: 'files:delete',

    // Aprobaciones
    APPROVALS_VIEW: 'approvals:view',
    APPROVALS_APPROVE: 'approvals:approve',
    APPROVALS_REJECT: 'approvals:reject',

    // Contactos y Quejas
    CONTACTS_VIEW: 'contacts:view',
    CONTACTS_RESPOND: 'contacts:respond',
    COMPLAINTS_VIEW: 'complaints:view',
    COMPLAINTS_RESPOND: 'complaints:respond',

    // Sistema
    SYSTEM_BACKUP: 'system:backup',
    SYSTEM_RESTORE: 'system:restore',
    SYSTEM_LOGS: 'system:logs'
};

// Mapeo de Roles a Permisos
const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // Todos los permisos

    [ROLES.ADMIN]: [
        // CMS completo
        ...Object.values(PERMISSIONS).filter(p =>
            p.startsWith('news:') ||
            p.startsWith('events:') ||
            p.startsWith('notices:') ||
            p.startsWith('announcements:')
        ),
        // Usuarios (sin manage roles)
        PERMISSIONS.USERS_CREATE,
        PERMISSIONS.USERS_READ,
        PERMISSIONS.USERS_UPDATE,
        // Analytics
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.ANALYTICS_EXPORT,
        // Archivos
        PERMISSIONS.FILES_UPLOAD,
        PERMISSIONS.FILES_DELETE,
        // Aprobaciones
        PERMISSIONS.APPROVALS_VIEW,
        PERMISSIONS.APPROVALS_APPROVE,
        PERMISSIONS.APPROVALS_REJECT,
        // Contactos
        PERMISSIONS.CONTACTS_VIEW,
        PERMISSIONS.CONTACTS_RESPOND,
        PERMISSIONS.COMPLAINTS_VIEW,
        PERMISSIONS.COMPLAINTS_RESPOND,
        // Settings
        PERMISSIONS.SETTINGS_VIEW
    ],

    [ROLES.EDITOR]: [
        // CMS - crear, leer, actualizar (no delete, no publish)
        PERMISSIONS.NEWS_CREATE,
        PERMISSIONS.NEWS_READ,
        PERMISSIONS.NEWS_UPDATE,
        PERMISSIONS.EVENTS_CREATE,
        PERMISSIONS.EVENTS_READ,
        PERMISSIONS.EVENTS_UPDATE,
        PERMISSIONS.NOTICES_CREATE,
        PERMISSIONS.NOTICES_READ,
        PERMISSIONS.NOTICES_UPDATE,
        PERMISSIONS.ANNOUNCEMENTS_CREATE,
        PERMISSIONS.ANNOUNCEMENTS_READ,
        PERMISSIONS.ANNOUNCEMENTS_UPDATE,
        // Files
        PERMISSIONS.FILES_UPLOAD,
        // Analytics (solo ver)
        PERMISSIONS.ANALYTICS_VIEW
    ],

    [ROLES.VIEWER]: [
        // Solo lectura
        PERMISSIONS.NEWS_READ,
        PERMISSIONS.EVENTS_READ,
        PERMISSIONS.NOTICES_READ,
        PERMISSIONS.ANNOUNCEMENTS_READ,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.CONTACTS_VIEW,
        PERMISSIONS.COMPLAINTS_VIEW
    ],

    [ROLES.TEACHER]: [
        // Eventos y avisos educativos
        PERMISSIONS.EVENTS_READ,
        PERMISSIONS.NOTICES_READ,
        PERMISSIONS.ANNOUNCEMENTS_READ,
        // Ver contactos de sus estudiantes
        PERMISSIONS.CONTACTS_VIEW
    ],

    [ROLES.STUDENT]: [
        // Solo lectura pública
        PERMISSIONS.NEWS_READ,
        PERMISSIONS.EVENTS_READ,
        PERMISSIONS.NOTICES_READ
    ],

    [ROLES.PARENT]: [
        // Información general y contacto
        PERMISSIONS.NEWS_READ,
        PERMISSIONS.EVENTS_READ,
        PERMISSIONS.NOTICES_READ,
        PERMISSIONS.CONTACTS_VIEW
    ]
};

/**
 * Middleware: Verificar si el usuario está autenticado
 */
function requireAuth(req, res, next) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Debe iniciar sesión para acceder a este recurso'
        });
    }
    next();
}

/**
 * Middleware: Verificar si el usuario tiene un rol específico
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Debe iniciar sesión'
            });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: `Este recurso requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
                userRole: userRole,
                requiredRoles: allowedRoles
            });
        }

        next();
    };
}

/**
 * Middleware: Verificar si el usuario tiene un permiso específico
 */
function requirePermission(...requiredPermissions) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Debe iniciar sesión'
            });
        }

        const userRole = req.user.role;
        const userPermissions = ROLE_PERMISSIONS[userRole] || [];

        // Verificar si tiene al menos uno de los permisos requeridos
        const hasPermission = requiredPermissions.some(permission =>
            userPermissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({
                error: 'Permisos insuficientes',
                message: 'No tiene permisos para realizar esta acción',
                requiredPermissions: requiredPermissions,
                userRole: userRole
            });
        }

        // Adjuntar permisos al request para uso posterior
        req.userPermissions = userPermissions;

        next();
    };
}

/**
 * Middleware: Verificar si el usuario tiene TODOS los permisos especificados
 */
function requireAllPermissions(...requiredPermissions) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Debe iniciar sesión'
            });
        }

        const userRole = req.user.role;
        const userPermissions = ROLE_PERMISSIONS[userRole] || [];

        // Verificar si tiene TODOS los permisos requeridos
        const hasAllPermissions = requiredPermissions.every(permission =>
            userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
            const missingPermissions = requiredPermissions.filter(p =>
                !userPermissions.includes(p)
            );

            return res.status(403).json({
                error: 'Permisos insuficientes',
                message: 'No tiene todos los permisos necesarios',
                missingPermissions: missingPermissions,
                userRole: userRole
            });
        }

        req.userPermissions = userPermissions;
        next();
    };
}

/**
 * Helper: Verificar si un usuario tiene un permiso (para uso en lógica)
 */
function hasPermission(userRole, permission) {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
}

/**
 * Helper: Obtener todos los permisos de un rol
 */
function getPermissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Helper: Verificar si un rol es superior a otro
 */
function isRoleSuperior(role1, role2) {
    const hierarchy = [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN,
        ROLES.EDITOR,
        ROLES.VIEWER,
        ROLES.TEACHER,
        ROLES.STUDENT,
        ROLES.PARENT
    ];

    const index1 = hierarchy.indexOf(role1);
    const index2 = hierarchy.indexOf(role2);

    return index1 < index2; // Menor índice = mayor jerarquía
}

/**
 * Middleware: Solo el propietario del recurso o admin puede acceder
 */
function requireOwnerOrAdmin(resourceUserIdField = 'userId') {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Debe iniciar sesión'
            });
        }

        const isAdmin = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(req.user.role);
        const isOwner = req.user.id === req.params[resourceUserIdField] ||
                       req.user.id === req.body[resourceUserIdField];

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Solo el propietario del recurso o un administrador pueden acceder'
            });
        }

        next();
    };
}

module.exports = {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    requireAuth,
    requireRole,
    requirePermission,
    requireAllPermissions,
    requireOwnerOrAdmin,
    hasPermission,
    getPermissionsForRole,
    isRoleSuperior
};
