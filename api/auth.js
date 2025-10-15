import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import cookieParser from 'cookie-parser';
import { URL } from 'url';

// Cargar variables de entorno
// Vercel ya carga las variables de entorno configuradas en el dashboard
// require('dotenv').config(); // No es necesario en Vercel

// ============================================
// CONFIGURACIÓN DE CONTRASEÑAS ADMIN
// ============================================

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;

// Verificar que el hash y el secreto estén configurados
if (!ADMIN_PASSWORD_HASH || !JWT_SECRET) {
    console.error('❌ ERROR: ADMIN_PASSWORD_HASH o JWT_SECRET environment variable is required');
    // En Vercel, esto causará un 500, pero no podemos hacer process.exit(1) directamente
    // Se manejará con un error en el handler
}

// ============================================
// MIDDLEWARE ADAPTADO PARA SERVERLESS
// ============================================

// Adaptación de handleValidationErrors
const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    return null; // No hay errores
};

// Adaptación de authenticateToken
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido.' });
    }
};

// Adaptación de requireAdmin
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Acceso denegado. Requiere rol de administrador.' });
    }
};

// Adaptación de sanitizeInputs (simplificado)
const sanitizeInputs = (req, res, next) => {
    // Implementación básica de sanitización si es necesaria
    // Por ahora, solo pasa al siguiente middleware
    next();
};

// ============================================
// HANDLER PRINCIPAL PARA /api/auth
// ============================================

export default async function handler(req, res) {
    // Inicializar cookieParser para que req.cookies funcione
    // Vercel no tiene un middleware de cookie-parser por defecto
    const cookiesMiddleware = cookieParser();
    await new Promise(resolve => cookiesMiddleware(req, res, resolve));

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/auth', ''); // Eliminar prefijo /api/auth

    try {
        if (!ADMIN_PASSWORD_HASH || !JWT_SECRET) {
            return res.status(500).json({
                success: false,
                error: 'Error de configuración del servidor',
                code: 'CONFIG_ERROR',
                message: 'Variables de entorno ADMIN_PASSWORD_HASH o JWT_SECRET no configuradas.'
            });
        }

        switch (path) {
            case '/login':
                if (req.method === 'POST') {
                    // Aplicar validaciones
                    await Promise.all(loginValidation.map(validation => validation.run(req)));
                    const validationErrors = handleValidationErrors(req, res);
                    if (validationErrors) return validationErrors;

                    const { password } = req.body;
                    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                    const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

                    if (!isValidPassword) {
                        return res.status(401).json({
                            error: 'Credenciales inválidas',
                            code: 'INVALID_CREDENTIALS',
                            timestamp: new Date().toISOString()
                        });
                    }

                    const payload = {
                        role: 'admin',
                        loginTime: new Date().toISOString(),
                        ip: ip,
                        userAgent: req.headers['user-agent']?.substring(0, 100) || 'Unknown'
                    };

                    const token = jwt.sign(
                        payload,
                        JWT_SECRET,
                        {
                            expiresIn: process.env.JWT_EXPIRES_IN || '30m',
                            issuer: 'heroes-patria-auth',
                            audience: 'heroes-patria-admin'
                        }
                    );

                    res.setHeader('Set-Cookie', `authToken=${token}; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Max-Age=${30 * 60}`);

                    return res.status(200).json({
                        success: true,
                        message: 'Autenticación exitosa',
                        token: token,
                        user: {
                            role: 'admin',
                            loginTime: payload.loginTime,
                            expiresIn: process.env.JWT_EXPIRES_IN || '30m'
                        },
                        timestamp: new Date().toISOString()
                    });
                }
                break;

            case '/logout':
                if (req.method === 'POST') {
                    // No necesitamos authenticateToken aquí si solo limpiamos la cookie
                    res.setHeader('Set-Cookie', `authToken=; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Max-Age=0`);
                    return res.status(200).json({
                        success: true,
                        message: 'Sesión cerrada exitosamente',
                        timestamp: new Date().toISOString()
                    });
                }
                break;

            case '/verify':
                if (req.method === 'GET') {
                    // Adaptar authenticateToken y requireAdmin
                    let authError = null;
                    await new Promise(resolve => authenticateToken(req, res, () => resolve()));
                    if (!req.user) return; // authenticateToken ya envió la respuesta

                    await new Promise(resolve => requireAdmin(req, res, () => resolve()));
                    if (!req.user || req.user.role !== 'admin') return; // requireAdmin ya envió la respuesta

                    return res.status(200).json({
                        valid: true,
                        user: {
                            role: req.user.role,
                            loginTime: req.user.loginTime,
                            ip: req.user.ip
                        },
                        timestamp: new Date().toISOString()
                    });
                }
                break;

            case '/change-password':
                if (req.method === 'POST') {
                    // Adaptar authenticateToken y requireAdmin
                    let authError = null;
                    await new Promise(resolve => authenticateToken(req, res, () => resolve()));
                    if (!req.user) return; // authenticateToken ya envió la respuesta

                    await new Promise(resolve => requireAdmin(req, res, () => resolve()));
                    if (!req.user || req.user.role !== 'admin') return; // requireAdmin ya envió la respuesta

                    // Aplicar validaciones
                    await Promise.all(changePasswordValidation.map(validation => validation.run(req)));
                    const validationErrors = handleValidationErrors(req, res);
                    if (validationErrors) return validationErrors;

                    const { currentPassword, newPassword } = req.body;
                    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                    const isCurrentValid = await bcrypt.compare(currentPassword, ADMIN_PASSWORD_HASH);

                    if (!isCurrentValid) {
                        return res.status(401).json({
                            error: 'Contraseña actual incorrecta',
                            code: 'INVALID_CURRENT_PASSWORD'
                        });
                    }

                    const isSamePassword = await bcrypt.compare(newPassword, ADMIN_PASSWORD_HASH);
                    if (isSamePassword) {
                        return res.status(400).json({
                            error: 'La nueva contraseña debe ser diferente a la actual',
                            code: 'SAME_PASSWORD'
                        });
                    }

                    const saltRounds = 12;
                    const newHash = await bcrypt.hash(newPassword, saltRounds);

                    // En un entorno serverless, no podemos actualizar ADMIN_PASSWORD_HASH globalmente
                    // Esto debería ser manejado por un servicio de configuración o base de datos
                    // Por ahora, solo se devuelve el nuevo hash para que el usuario lo actualice en Vercel
                    console.log(`🔑 NUEVO HASH para Vercel: ADMIN_PASSWORD_HASH=${newHash}`);

                    return res.status(200).json({
                        success: true,
                        message: 'Contraseña actualizada exitosamente (actualiza tu variable de entorno en Vercel)',
                        newHash: newHash,
                        timestamp: new Date().toISOString()
                    });
                }
                break;

            case '/status':
                if (req.method === 'GET') {
                    return res.status(200).json({
                        system: 'Authentication API',
                        version: '1.0.0',
                        status: 'operational',
                        features: {
                            jwt: true,
                            bcrypt: true,
                            rateLimit: false, // Deshabilitado por ahora
                            validation: true,
                            cors: true
                        },
                        security: {
                            passwordHashingRounds: 12,
                            jwtExpiry: process.env.JWT_EXPIRES_IN || '30m',
                            rateLimitWindow: 'N/A',
                            rateLimitMax: 'N/A'
                        },
                        timestamp: new Date().toISOString()
                    });
                }
                break;

            default:
                res.status(404).json({ error: 'Endpoint no encontrado', path: url.pathname });
                break;
        }
    } catch (error) {
        console.error('❌ Error en la función auth:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
}

// Validaciones para login (fuera del handler para reutilización)
const loginValidation = [
    body('password')
        .notEmpty()
        .withMessage('Contraseña es requerida')
        .isLength({ min: 8 })
        .withMessage('Contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Contraseña debe contener: mayúscula, minúscula, número y símbolo'),
];

// Validaciones para cambio de contraseña
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Contraseña actual requerida'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Nueva contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Nueva contraseña debe contener: mayúscula, minúscula, número y símbolo')
];