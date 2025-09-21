/**
 * 🔐 RUTAS DE AUTENTICACIÓN
 * Endpoints seguros para login/logout con JWT
 */

// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, query } = require('express-validator');

const { 
    authenticateToken, 
    requireAdmin, 
    handleValidationErrors,
    sanitizeInputs,
    loginRateLimit 
} = require('../middleware/security');

const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

// ============================================
// CONFIGURACIÓN DE CONTRASEÑAS ADMIN
// ============================================

/**
 * Contraseña por defecto (solo para desarrollo)
 * EN PRODUCCIÓN: Esta debe venir de variables de entorno
 */
const DEFAULT_ADMIN_PASSWORD = 'HeroesPatria2024!';

/**
 * Hash de la contraseña admin (desde variables de entorno)
 */
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

/**
 * Inicializar hash de contraseña
 */
// Debug de variables de entorno
console.log('🔍 DEBUG - ADMIN_PASSWORD_HASH:', ADMIN_PASSWORD_HASH ? 'LOADED' : 'NOT_FOUND');
console.log('🔍 DEBUG - JWT_SECRET:', process.env.JWT_SECRET ? 'LOADED' : 'NOT_FOUND');

// Verificar que el hash esté configurado
if (!ADMIN_PASSWORD_HASH) {
    console.error('❌ ERROR: ADMIN_PASSWORD_HASH environment variable is required');
    console.error('🔍 All env vars:', Object.keys(process.env).filter(k => k.includes('ADMIN')));
    process.exit(1);
}

console.log('✅ Using ADMIN_PASSWORD_HASH from environment variables');

// ============================================
// VALIDACIONES DE INPUT
// ============================================

const loginValidation = [
    body('password')
        .notEmpty()
        .withMessage('Contraseña es requerida')
        .isLength({ min: 8 })
        .withMessage('Contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Contraseña debe contener: mayúscula, minúscula, número y símbolo'),
];

// ============================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================

/**
 * POST /api/auth/login
 * Autenticación de administrador
 */
router.post('/login', 
    loginRateLimit, // Rate limiting específico para login
    sanitizeInputs,
    loginValidation,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { password } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'Unknown';
        
        console.log(`🔐 Intento de login desde IP: ${ip}`);
        
        // Verificar que el hash esté inicializado
        if (!ADMIN_PASSWORD_HASH) {
            console.error('❌ Hash de contraseña admin no inicializado');
            throw createError('Error de configuración del servidor', 500, 'CONFIG_ERROR');
        }
        
        try {
            // Verificar contraseña usando bcrypt
            const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
            
            if (!isValidPassword) {
                console.warn(`🚫 Login fallido desde IP: ${ip} - Contraseña incorrecta`);
                
                // Respuesta genérica para no dar pistas
                return res.status(401).json({
                    error: 'Credenciales inválidas',
                    code: 'INVALID_CREDENTIALS',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Generar JWT token
            const payload = {
                role: 'admin',
                loginTime: new Date().toISOString(),
                ip: ip,
                userAgent: userAgent.substring(0, 100) // Limitar tamaño
            };
            
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { 
                    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
                    issuer: 'heroes-patria-auth',
                    audience: 'heroes-patria-admin'
                }
            );
            
            console.log(`✅ Login exitoso desde IP: ${ip} - Admin autenticado`);
            
            // Configurar cookie segura
            const cookieOptions = {
                httpOnly: true, // Previene acceso desde JavaScript
                secure: process.env.NODE_ENV === 'production', // HTTPS only en producción
                sameSite: 'strict', // CSRF protection
                maxAge: 30 * 60 * 1000, // 30 minutos
            };
            
            res.cookie('authToken', token, cookieOptions);
            
            // Respuesta exitosa
            res.json({
                success: true,
                message: 'Autenticación exitosa',
                token: token, // También en el body para compatibilidad
                user: {
                    role: 'admin',
                    loginTime: payload.loginTime,
                    expiresIn: process.env.JWT_EXPIRES_IN || '30m'
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error(`❌ Error en login desde IP: ${ip}`, error);
            
            if (error.name === 'bcryptError') {
                throw createError('Error de verificación de contraseña', 500, 'BCRYPT_ERROR');
            }
            
            throw createError('Error interno de autenticación', 500, 'AUTH_ERROR');
        }
    })
);

/**
 * POST /api/auth/logout
 * Cerrar sesión (invalidar token)
 */
router.post('/logout',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const ip = req.ip || req.connection.remoteAddress;
        
        console.log(`🚪 Logout desde IP: ${ip} - Usuario: ${req.user.role}`);
        
        // Limpiar cookie
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        // En un sistema más complejo, aquí agregaríamos el token a una blacklist
        // Por simplicidad, confiamos en la expiración del token
        
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente',
            timestamp: new Date().toISOString()
        });
    })
);

/**
 * GET /api/auth/verify
 * Verificar si el token actual es válido
 */
router.get('/verify',
    authenticateToken,
    requireAdmin,
    asyncHandler(async (req, res) => {
        // Si llegamos aquí, el token es válido
        res.json({
            valid: true,
            user: {
                role: req.user.role,
                loginTime: req.user.loginTime,
                ip: req.user.ip
            },
            timestamp: new Date().toISOString()
        });
    })
);

/**
 * POST /api/auth/change-password
 * Cambiar contraseña de administrador (endpoint protegido)
 */
router.post('/change-password',
    authenticateToken,
    requireAdmin,
    sanitizeInputs,
    [
        body('currentPassword')
            .notEmpty()
            .withMessage('Contraseña actual requerida'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Nueva contraseña debe tener al menos 8 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Nueva contraseña debe contener: mayúscula, minúscula, número y símbolo')
    ],
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        
        console.log(`🔑 Cambio de contraseña solicitado desde IP: ${ip}`);
        
        // Verificar contraseña actual
        const isCurrentValid = await bcrypt.compare(currentPassword, ADMIN_PASSWORD_HASH);
        
        if (!isCurrentValid) {
            console.warn(`🚫 Cambio de contraseña fallido - contraseña actual incorrecta - IP: ${ip}`);
            return res.status(401).json({
                error: 'Contraseña actual incorrecta',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }
        
        // Verificar que la nueva contraseña sea diferente
        const isSamePassword = await bcrypt.compare(newPassword, ADMIN_PASSWORD_HASH);
        if (isSamePassword) {
            return res.status(400).json({
                error: 'La nueva contraseña debe ser diferente a la actual',
                code: 'SAME_PASSWORD'
            });
        }
        
        // Generar hash de la nueva contraseña
        const saltRounds = 12;
        const newHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Actualizar hash global
        ADMIN_PASSWORD_HASH = newHash;
        
        console.log(`✅ Contraseña cambiada exitosamente desde IP: ${ip}`);
        console.log(`🔑 NUEVO HASH para .env: ADMIN_PASSWORD_HASH=${newHash}`);
        
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente',
            newHash: newHash, // Para actualizar .env
            timestamp: new Date().toISOString()
        });
    })
);

/**
 * GET /api/auth/status
 * Estado del sistema de autenticación
 */
router.get('/status', (req, res) => {
    res.json({
        system: 'Authentication API',
        version: '1.0.0',
        status: 'operational',
        features: {
            jwt: true,
            bcrypt: true,
            rateLimit: true,
            validation: true,
            cors: true
        },
        security: {
            passwordHashingRounds: 12,
            jwtExpiry: process.env.JWT_EXPIRES_IN || '30m',
            rateLimitWindow: '15 minutes',
            rateLimitMax: 5
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;