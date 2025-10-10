/**
 * 🔐 MIDDLEWARE DE AUTENTICACIÓN JWT - BGE HÉROES DE LA PATRIA
 * Sistema avanzado con manejo híbrido de base de datos y roles
 */

const { getJWTUtils } = require('../utils/jwtUtils');
const { getAuthService } = require('../services/authService');

// Instancias de servicios
const jwtUtils = getJWTUtils();
const authService = getAuthService();

/**
 * Middleware para verificar JWT token
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Extraer token del header
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Token de acceso requerido',
                message: 'Header Authorization requerido con formato: Bearer <token>'
            });
        }

        let token;
        try {
            token = jwtUtils.extractTokenFromHeader(authHeader);
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Formato de token inválido',
                message: error.message
            });
        }

        // Verificar token
        let decoded;
        try {
            decoded = jwtUtils.verifyToken(token);
        } catch (error) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido',
                message: error.message
            });
        }

        // Verificar que sea un token de acceso
        if (decoded.type !== 'access') {
            return res.status(403).json({
                success: false,
                error: 'Tipo de token inválido',
                message: 'Se requiere un token de acceso'
            });
        }

        // Obtener información completa del usuario
        let userProfile;
        try {
            userProfile = await authService.getUserProfile(decoded.userId);
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Usuario inválido',
                message: 'El usuario no existe o está inactivo'
            });
        }

        // Verificar que el usuario siga activo
        if (!userProfile.active) {
            return res.status(401).json({
                success: false,
                error: 'Usuario inactivo',
                message: 'Tu cuenta está desactivada. Contacta al administrador.'
            });
        }

        // Agregar información del usuario al request
        req.user = {
            id: userProfile.id,
            email: userProfile.email,
            username: userProfile.username,
            role: userProfile.role,
            permissions: userProfile.permissions || [],
            active: userProfile.active
        };

        // Información adicional del token
        req.tokenInfo = {
            jwtId: decoded.jti,
            issuedAt: new Date(decoded.iat * 1000),
            expiresAt: new Date(decoded.exp * 1000),
            shouldRefresh: decoded.shouldRefresh
        };

        console.log(`👤 Usuario autenticado: ${userProfile.username} (${userProfile.role})`);

        next();

    } catch (error) {
        console.error('❌ Error en middleware de autenticación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error verificando autenticación'
        });
    }
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (allowedRoles) => {
    // Normalizar a array si es string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'No autenticado',
                message: 'Debes estar autenticado para acceder a este recurso'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: `Se requiere rol: ${roles.join(' o ')}`,
                userRole: req.user.role,
                allowedRoles: roles
            });
        }

        console.log(`✅ Acceso autorizado: ${req.user.role} para roles: ${roles.join(', ')}`);
        next();
    };
};

/**
 * Middleware para verificar permisos específicos
 */
const requirePermission = (requiredPermissions) => {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'No autenticado',
                message: 'Debes estar autenticado para acceder a este recurso'
            });
        }

        const userPermissions = req.user.permissions || [];

        // Verificar si tiene alguno de los permisos requeridos o permisos administrativos
        const hasPermission = permissions.some(perm =>
            userPermissions.includes(perm) ||
            userPermissions.includes('read_all') ||
            userPermissions.includes('write_all')
        );

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                error: 'Permisos insuficientes',
                message: `Se requiere permiso: ${permissions.join(' o ')}`,
                userPermissions: userPermissions,
                requiredPermissions: permissions
            });
        }

        console.log(`✅ Permiso autorizado: ${permissions.join(', ')} para usuario: ${req.user.role}`);
        next();
    };
};

/**
 * Middleware para verificar si es administrador
 */
const requireAdmin = requireRole(['admin']);

/**
 * Middleware para verificar si es docente o superior
 */
const requireTeacher = requireRole(['docente', 'admin']);

/**
 * Middleware para verificar si es estudiante o superior
 */
const requireStudent = requireRole(['estudiante', 'docente', 'admin']);

/**
 * Middleware para verificar si es padre de familia o superior
 */
const requireParent = requireRole(['padre_familia', 'docente', 'admin']);

/**
 * Middleware para verificar acceso propio o superior
 * Permite acceso si es el propio usuario o tiene rol superior
 */
const requireSelfOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'No autenticado',
            message: 'Debes estar autenticado para acceder'
        });
    }

    const targetUserId = parseInt(req.params.userId || req.body.userId);
    const isOwnAccount = req.user.id === targetUserId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwnAccount && !isAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado',
            message: 'Solo puedes acceder a tu propia cuenta o ser administrador',
            userId: req.user.id,
            targetUserId: targetUserId
        });
    }

    next();
};

/**
 * Middleware opcional de autenticación (para rutas públicas con contenido adicional para usuarios autenticados)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            req.user = null;
            return next();
        }

        try {
            const token = jwtUtils.extractTokenFromHeader(authHeader);
            const decoded = jwtUtils.verifyToken(token);

            if (decoded.type === 'access') {
                const userProfile = await authService.getUserProfile(decoded.userId);

                if (userProfile.active) {
                    req.user = {
                        id: userProfile.id,
                        email: userProfile.email,
                        username: userProfile.username,
                        role: userProfile.role,
                        permissions: userProfile.permissions || [],
                        active: userProfile.active
                    };
                    console.log(`👤 Usuario opcional autenticado: ${userProfile.username}`);
                }
            }
        } catch (error) {
            // En auth opcional, los errores no bloquean el acceso
            console.log(`⚠️ Token opcional inválido: ${error.message}`);
        }

        req.user = req.user || null;
        next();

    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requirePermission,
    requireAdmin,
    requireTeacher,
    requireStudent,
    requireParent,
    requireSelfOrAdmin,
    optionalAuth
};