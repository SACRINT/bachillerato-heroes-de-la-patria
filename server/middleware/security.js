/**
 * 🛡️ MIDDLEWARE DE SEGURIDAD
 * Funciones de seguridad y validación
 */

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

/**
 * Middleware de seguridad general
 */
const securityMiddleware = (req, res, next) => {
    // Logging de seguridad
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`🔒 [${timestamp}] ${req.method} ${req.path} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}...`);
    
    // Headers de seguridad adicionales
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Eliminar headers que revelan información
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
};

/**
 * Middleware para verificar JWT token
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({
            error: 'Token de acceso requerido',
            code: 'NO_TOKEN'
        });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.warn(`🚫 Token inválido desde IP: ${req.ip}`);
            
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Token inválido',
                    code: 'TOKEN_INVALID'
                });
            } else {
                return res.status(401).json({
                    error: 'Error de autenticación',
                    code: 'AUTH_ERROR'
                });
            }
        }
        
        req.user = user;
        console.log(`✅ Usuario autenticado: ${user.role} - ${user.loginTime}`);
        next();
    });
};

/**
 * Middleware para verificar rol de administrador
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Autenticación requerida',
            code: 'NO_AUTH'
        });
    }
    
    if (req.user.role !== 'admin') {
        console.warn(`🚫 Acceso denegado a usuario no-admin desde IP: ${req.ip}`);
        return res.status(403).json({
            error: 'Acceso denegado. Se requieren privilegios de administrador.',
            code: 'INSUFFICIENT_PRIVILEGES'
        });
    }
    
    console.log(`👑 Acceso admin autorizado para: ${req.user.role}`);
    next();
};

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        console.warn(`❌ Errores de validación desde IP: ${req.ip}`, errors.array());
        
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            code: 'VALIDATION_ERROR',
            details: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }
    
    next();
};

/**
 * Middleware para sanitizar inputs
 */
const sanitizeInputs = (req, res, next) => {
    // Sanitizar strings en body
    if (req.body && typeof req.body === 'object') {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                // Eliminar scripts maliciosos
                req.body[key] = req.body[key]
                    .replace(/<script[^>]*>.*?<\/script>/gi, '')
                    .replace(/<[^>]*>/g, '')  // Eliminar HTML tags
                    .trim();
            }
        }
    }
    
    // Sanitizar query parameters
    if (req.query && typeof req.query === 'object') {
        for (let key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key]
                    .replace(/<script[^>]*>.*?<\/script>/gi, '')
                    .replace(/<[^>]*>/g, '')
                    .trim();
            }
        }
    }
    
    next();
};

/**
 * Rate limiting específico para login
 */
const loginRateLimit = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Aumentado a 50 intentos para desarrollo (en producción usar 5)
    message: {
        error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
        code: 'TOO_MANY_LOGIN_ATTEMPTS',
        retryAfter: 900 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Solo aplicar a intentos fallidos
    skipSuccessfulRequests: true,
});

module.exports = {
    securityMiddleware,
    authenticateToken,
    requireAdmin,
    handleValidationErrors,
    sanitizeInputs,
    loginRateLimit
};