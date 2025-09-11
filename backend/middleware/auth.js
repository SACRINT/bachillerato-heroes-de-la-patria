/**
 * 🔐 MIDDLEWARE DE AUTENTICACIÓN
 * Sistema JWT para proteger rutas sensibles
 */

const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

/**
 * Middleware para verificar JWT token
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                error: 'Token de acceso requerido',
                message: 'Debes estar autenticado para acceder a este recurso'
            });
        }
        
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el usuario siga existiendo y activo
        const user = await executeQuery(
            'SELECT id, email, nombre, apellido_paterno, tipo_usuario, activo FROM usuarios WHERE id = ?',
            [decoded.userId]
        );
        
        if (user.length === 0 || !user[0].activo) {
            return res.status(401).json({
                error: 'Token inválido',
                message: 'El usuario no existe o está inactivo'
            });
        }
        
        // Agregar información del usuario al request
        req.user = user[0];
        req.user.id = decoded.userId;
        
        // Actualizar último acceso
        await executeQuery(
            'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
            [decoded.userId]
        );
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                error: 'Token inválido',
                message: 'El token proporcionado no es válido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                error: 'Token expirado',
                message: 'El token ha expirado, por favor inicia sesión nuevamente'
            });
        }
        
        console.error('Error en middleware de autenticación:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error verificando autenticación'
        });
    }
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'No autenticado',
                message: 'Debes estar autenticado para acceder'
            });
        }
        
        if (!allowedRoles.includes(req.user.tipo_usuario)) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: `Se requiere rol: ${allowedRoles.join(' o ')}`,
                userRole: req.user.tipo_usuario
            });
        }
        
        next();
    };
};

/**
 * Middleware para verificar si es administrador
 */
const requireAdmin = requireRole(['administrativo', 'directivo']);

/**
 * Middleware para verificar si es docente o superior
 */
const requireTeacher = requireRole(['docente', 'administrativo', 'directivo']);

/**
 * Generar JWT token
 */
const generateToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        tipo_usuario: user.tipo_usuario
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h',
        issuer: 'heroes-patria-api',
        subject: user.id.toString()
    });
};

/**
 * Generar refresh token
 */
const generateRefreshToken = (user) => {
    const payload = {
        userId: user.id,
        type: 'refresh'
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d',
        issuer: 'heroes-patria-api',
        subject: user.id.toString()
    });
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireTeacher,
    generateToken,
    generateRefreshToken
};