/**
 * 🔐 RUTAS DE AUTENTICACIÓN JWT - BGE HÉROES DE LA PATRIA
 * Sistema completo con roles, seguridad y gestión avanzada de tokens
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { getAuthService } = require('../services/authService');
const { getJWTUtils } = require('../utils/jwtUtils');
const { authenticateToken, requireAdmin, requireRole } = require('../middleware/auth');
const devLogger = require('../utils/devLogger'); // 🔐 Logging seguro (GDPR compliant)
const router = express.Router();

// Instancias de servicios
const authService = getAuthService();
const jwtUtils = getJWTUtils();

// ============================================
// RATE LIMITING ESPECÍFICO
// ============================================

// Rate limiting para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: {
        error: 'Demasiados intentos de login',
        message: 'Has superado el límite de intentos. Intenta de nuevo en 15 minutos.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

// Rate limiting para registro
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 registros por hora por IP
    message: {
        error: 'Demasiados registros',
        message: 'Solo se permiten 3 registros por hora.',
        retryAfter: '1 hora'
    }
});

// Rate limiting para refresh token
const refreshLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 renovaciones por minuto
    message: {
        error: 'Demasiadas renovaciones',
        message: 'Espera un momento antes de renovar el token nuevamente.'
    }
});

// ============================================
// VALIDACIONES
// ============================================

const loginValidation = [
    body('username')
        .isLength({ min: 3 })
        .trim()
        .withMessage('Nombre de usuario mínimo 3 caracteres'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Contraseña mínimo 6 caracteres'),
    body('rememberMe')
        .optional()
        .isBoolean()
        .withMessage('RememberMe debe ser verdadero o falso')
];

const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email válido requerido'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        .withMessage('Contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo especial'),
    body('username')
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9_.-]+$/)
        .withMessage('Username debe tener 3-50 caracteres alfanuméricos'),
    body('nombre')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nombre entre 2 y 100 caracteres'),
    body('apellido_paterno')
        .isLength({ min: 2, max: 100 })
        .withMessage('Apellido paterno entre 2 y 100 caracteres'),
    body('role')
        .isIn(['admin', 'docente', 'estudiante', 'padre_familia'])
        .withMessage('Rol inválido')
];

const passwordChangeValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Contraseña actual requerida'),
    body('newPassword')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        .withMessage('Nueva contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo especial')
];

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión con JWT
 *     description: Autentica un usuario y devuelve tokens de acceso (access token) y renovación (refresh token). Incluye rate limiting de 5 intentos cada 15 minutos.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: "admin@bge.edu.mx"
 *                 description: Nombre de usuario o email (mínimo 3 caracteres)
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "Passw0rd!"
 *                 description: Contraseña del usuario (mínimo 6 caracteres)
 *               rememberMe:
 *                 type: boolean
 *                 example: false
 *                 description: Mantener sesión activa por más tiempo (opcional)
 *     responses:
 *       '200':
 *         description: Autenticación exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Autenticación exitosa"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: "admin"
 *                     email:
 *                       type: string
 *                       example: "admin@bge.edu.mx"
 *                     nombre:
 *                       type: string
 *                       example: "Juan"
 *                     apellido_paterno:
 *                       type: string
 *                       example: "Pérez"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["read", "write", "delete", "manage_users"]
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     accessTokenExpiry:
 *                       type: integer
 *                       example: 1699999999
 *                     refreshTokenExpiry:
 *                       type: integer
 *                       example: 1700000000
 *                 sessionInfo:
 *                   type: object
 *                   properties:
 *                     loginTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-15T12:00:00.000Z"
 *                     rememberMe:
 *                       type: boolean
 *                       example: false
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-15T13:00:00.000Z"
 *       '400':
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Datos de entrada inválidos"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                   example: [{"msg": "Contraseña mínimo 6 caracteres", "param": "password"}]
 *       '401':
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Credenciales inválidas"
 *                 message:
 *                   type: string
 *                   example: "Email o contraseña incorrectos"
 *       '429':
 *         description: Demasiados intentos de login (rate limit excedido - máximo 5 cada 15 minutos)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Demasiados intentos de login"
 *                 message:
 *                   type: string
 *                   example: "Has superado el límite de intentos. Intenta de nuevo en 15 minutos."
 *                 retryAfter:
 *                   type: string
 *                   example: "15 minutos"
 */
router.post('/login', loginLimiter, loginValidation, async (req, res, next) => {
    try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { username, password, rememberMe = false } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress;

        devLogger.log('Intento de login');

        // Autenticar usuario
        const user = await authService.authenticateUser(username, password);

        // Generar tokens
        const userPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: authService.permissions[user.role] || []
        };

        const tokenPair = jwtUtils.generateTokenPair(userPayload, rememberMe);

        // Log de login exitoso
        devLogger.log('Login exitoso');

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Autenticación exitosa',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                nombre: user.nombre,
                apellido_paterno: user.apellido_paterno,
                role: user.role,
                permissions: userPayload.permissions
            },
            tokens: tokenPair,
            sessionInfo: {
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe,
                expiresAt: new Date(tokenPair.accessTokenExpiry * 1000).toISOString()
            }
        });

    } catch (error) {
        devLogger.error('❌ Error en login:');

        // Respuesta genérica por seguridad
        res.status(401).json({
            success: false,
            error: 'Credenciales inválidas',
            message: 'Email o contraseña incorrectos'
        });
    }
});

/**
 * POST /api/auth/refresh
 * Renovar token de acceso
 */
router.post('/refresh', refreshLimiter, async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Token de refresh requerido',
                message: 'Debes proporcionar un token de refresh válido'
            });
        }

        // Renovar tokens
        const newTokenPair = jwtUtils.renewTokenPair(refreshToken);

        devLogger.log('🔄 Tokens renovados exitosamente');

        res.json({
            success: true,
            message: 'Tokens renovados exitosamente',
            tokens: newTokenPair
        });

    } catch (error) {
        devLogger.error('Error renovando token', error);
        res.status(403).json({
            success: false,
            error: 'Token de refresh inválido',
            message: error.message
        });
    }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', authenticateToken, async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = jwtUtils.extractTokenFromHeader(authHeader);

        // Agregar token a blacklist
        jwtUtils.blacklistToken(token);

        // Invalidar sesiones del usuario
        await authService.invalidateUserSessions(req.user.id);

        devLogger.log('Logout exitoso');

        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        devLogger.error('❌ Error en logout:');
        res.status(500).json({
            success: false,
            error: 'Error cerrando sesión',
            message: error.message
        });
    }
});

/**
 * POST /api/auth/register
 * Registrar nuevo usuario (solo para administradores)
 */
router.post('/register', authenticateToken, requireAdmin, registerLimiter, registerValidation, async (req, res, next) => {
    try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const {
            email,
            password,
            username,
            nombre,
            apellido_paterno,
            apellido_materno,
            role
        } = req.body;

        devLogger.log('Admin creando usuario');

        // Crear usuario usando el servicio
        const newUser = await authService.createUser({
            email,
            password,
            username,
            nombre,
            apellido_paterno,
            apellido_materno,
            role
        });

        devLogger.log('Usuario creado exitosamente');

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: newUser
        });

    } catch (error) {
        devLogger.error('❌ Error registrando usuario:');

        if (error.message.includes('ya está registrado')) {
            return res.status(409).json({
                success: false,
                error: 'Email ya registrado',
                message: error.message
            });
        }

        res.status(400).json({
            success: false,
            error: 'Error registrando usuario',
            message: error.message
        });
    }
});

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', authenticateToken, async (req, res, next) => {
    try {
        // Obtener perfil completo usando el servicio
        const userProfile = await authService.getUserProfile(req.user.id);

        res.json({
            success: true,
            message: 'Perfil obtenido exitosamente',
            user: userProfile
        });

    } catch (error) {
        devLogger.error('❌ Error obteniendo perfil:');
        res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            message: error.message
        });
    }
});

/**
 * PUT /api/auth/change-password
 * Cambiar contraseña
 */
router.put('/change-password', authenticateToken, passwordChangeValidation, async (req, res, next) => {
    try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        devLogger.log('Usuario cambiando contraseña');

        // Cambiar contraseña usando el servicio
        await authService.changePassword(req.user.id, currentPassword, newPassword);

        // Invalidar todas las sesiones del usuario por seguridad
        await authService.invalidateUserSessions(req.user.id);

        devLogger.log('Contraseña cambiada exitosamente');

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente. Por seguridad, debes iniciar sesión nuevamente.'
        });

    } catch (error) {
        devLogger.error('❌ Error cambiando contraseña:');

        if (error.message.includes('incorrecta')) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña incorrecta',
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno',
            message: 'No se pudo actualizar la contraseña'
        });
    }
});

// ============================================
// RUTAS DE INFORMACIÓN Y ADMINISTRACIÓN
// ============================================

/**
 * GET /api/auth/verify
 * Verificar validez del token actual
 */
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        user: req.user,
        isAuthenticated: true
    });
});

/**
 * GET /api/auth/permissions
 * Obtener permisos del usuario actual
 */
router.get('/permissions', authenticateToken, (req, res) => {
    const userPermissions = authService.permissions[req.user.role] || [];

    res.json({
        success: true,
        permissions: userPermissions,
        role: req.user.role,
        hasPermission: (permission) => authService.hasPermission(req.user.role, permission)
    });
});

/**
 * POST /api/auth/check-permission
 * Verificar si el usuario tiene un permiso específico
 */
router.post('/check-permission', authenticateToken, [
    body('permission').notEmpty().withMessage('Permiso requerido')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Datos inválidos',
            details: errors.array()
        });
    }

    const { permission } = req.body;
    const hasPermission = authService.hasPermission(req.user.role, permission);

    res.json({
        success: true,
        hasPermission: hasPermission,
        permission: permission,
        role: req.user.role
    });
});

/**
 * GET /api/auth/stats
 * Estadísticas del sistema de autenticación (solo admin)
 */
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    const stats = jwtUtils.getStats();

    res.json({
        success: true,
        message: 'Estadísticas del sistema de autenticación',
        stats: {
            ...stats,
            systemInfo: {
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            }
        }
    });
});

/**
 * POST /api/auth/invalidate-user-sessions
 * Invalidar todas las sesiones de un usuario (solo admin)
 */
router.post('/invalidate-user-sessions', authenticateToken, requireAdmin, [
    body('userId').isInt().withMessage('ID de usuario requerido')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: errors.array()
            });
        }

        const { userId } = req.body;

        await authService.invalidateUserSessions(userId);

        devLogger.log('Admin invalidó sesiones de usuario');

        res.json({
            success: true,
            message: 'Sesiones invalidadas exitosamente'
        });

    } catch (error) {
        devLogger.error('❌ Error invalidando sesiones:');
        res.status(500).json({
            success: false,
            error: 'Error interno',
            message: error.message
        });
    }
});

// ============================================
// SISTEMA DE SOLICITUDES DE REGISTRO
// ============================================

const fs = require('fs').promises;
const path = require('path');
const { getPasswordGenerator } = require('../utils/passwordGenerator');
const passwordGenerator = getPasswordGenerator();

// Rutas de archivos
const REGISTRATION_REQUESTS_PATH = path.join(__dirname, '../data/registration-requests.json');

// Rate limiting para solicitudes de registro
const registrationRequestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 solicitudes por hora
    message: {
        error: 'Demasiadas solicitudes de registro',
        message: 'Solo puedes enviar 3 solicitudes por hora. Intenta de nuevo más tarde.',
        retryAfter: '1 hora'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Validaciones para solicitud de registro
const requestRegistrationValidation = [
    body('fullName')
        .trim()
        .isLength({ min: 5, max: 200 })
        .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/)
        .withMessage('Nombre completo debe tener entre 5 y 200 caracteres y solo contener letras'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email válido requerido')
        .custom((value) => {
            // Validar dominios institucionales
            const allowedDomains = ['@bge.edu.mx', '@bgeheroespatria.edu.mx', '@heroespatria.edu.mx'];
            const isValid = allowedDomains.some(domain => value.endsWith(domain));
            if (!isValid) {
                throw new Error('Solo se permiten correos institucionales (@bge.edu.mx, @bgeheroespatria.edu.mx)');
            }
            return true;
        }),
    body('requestedRole')
        .isIn(['docente', 'estudiante', 'administrativo'])
        .withMessage('Rol debe ser: docente, estudiante o administrativo'),
    body('reason')
        .trim()
        .isLength({ min: 50, max: 1000 })
        .withMessage('El motivo debe tener entre 50 y 1000 caracteres'),
    body('phone')
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage('Teléfono debe tener 10 dígitos')
];

/**
 * Helpers para manejo de solicitudes de registro
 */
const RegistrationHelpers = {
    /**
     * Leer solicitudes desde archivo JSON
     */
    async readRegistrationRequests() {
        try {
            const data = await fs.readFile(REGISTRATION_REQUESTS_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Si el archivo no existe, crearlo
            const initialData = { requests: [], lastId: 0 };
            await fs.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(initialData, null, 2));
            return initialData;
        }
    },

    /**
     * Guardar solicitudes en archivo JSON
     */
    async writeRegistrationRequests(data) {
        await fs.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(data, null, 2));
    },

    /**
     * Sanitizar entrada de texto
     */
    sanitizeInput(text) {
        return text.trim().replace(/[<>]/g, '');
    },

    /**
     * Verificar si el email ya tiene solicitud pendiente
     */
    async hasPendingRequest(email) {
        const data = await this.readRegistrationRequests();
        return data.requests.some(
            req => req.email.toLowerCase() === email.toLowerCase() && req.status === 'pending'
        );
    }
};

/**
 * POST /api/auth/request-registration
 * Enviar solicitud de registro (público, con rate limiting)
 */
router.post('/request-registration', registrationRequestLimiter, requestRegistrationValidation, async (req, res) => {
    try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { fullName, email, requestedRole, reason, phone } = req.body;

        // Verificar si ya existe solicitud pendiente
        const hasPending = await RegistrationHelpers.hasPendingRequest(email);
        if (hasPending) {
            return res.status(409).json({
                success: false,
                error: 'Solicitud duplicada',
                message: 'Ya existe una solicitud pendiente para este email. Por favor espera a que sea revisada.'
            });
        }

        // Verificar si el email ya está registrado en el sistema
        try {
            const jsonUsers = await authService.loadUsersFromJson();
            const userExists = jsonUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
            if (userExists) {
                return res.status(409).json({
                    success: false,
                    error: 'Email ya registrado',
                    message: 'Este email ya está registrado en el sistema. Si olvidaste tu contraseña, contacta al administrador.'
                });
            }
        } catch (error) {
            devLogger.warn('⚠️ No se pudo verificar usuarios existentes:', error.message);
        }

        // Cargar solicitudes existentes
        const data = await RegistrationHelpers.readRegistrationRequests();

        // Crear nueva solicitud
        const newRequest = {
            id: `req_${Date.now()}_${++data.lastId}`,
            fullName: RegistrationHelpers.sanitizeInput(fullName),
            email: email.toLowerCase(),
            requestedRole,
            reason: RegistrationHelpers.sanitizeInput(reason),
            phone: phone || null,
            status: 'pending',
            createdAt: new Date().toISOString(),
            reviewedBy: null,
            reviewedAt: null,
            reviewNotes: null,
            ipAddress: req.ip || req.connection.remoteAddress
        };

        // Agregar a la lista
        data.requests.push(newRequest);

        // Guardar
        await RegistrationHelpers.writeRegistrationRequests(data);

        devLogger.log('Nueva solicitud de registro');

        res.status(201).json({
            success: true,
            message: 'Solicitud de registro enviada exitosamente',
            requestId: newRequest.id,
            data: {
                id: newRequest.id,
                email: newRequest.email,
                status: newRequest.status,
                createdAt: newRequest.createdAt
            }
        });

    } catch (error) {
        devLogger.error('❌ Error procesando solicitud de registro:');
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo procesar la solicitud. Intenta de nuevo más tarde.'
        });
    }
});

// ============================================
// GOOGLE OAUTH - VERIFICACIÓN DE TOKEN
// ============================================

/**
 * POST /api/auth/google
 * Verifica el token de Google y crea/autentica al usuario
 *
 * Flujo:
 * 1. Frontend envía JWT de Google
 * 2. Backend verifica con Google Auth Library
 * 3. Si es válido, busca/crea usuario en BD
 * 4. Genera token JWT propio (de nuestra app)
 * 5. Devuelve token al frontend
 */
router.post('/google', async (req, res) => {
    try {
        const { credential, email, name } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                error: 'Token de Google requerido'
            });
        }

        devLogger.log('[GOOGLE-AUTH] Verificando token de Google');

        // Importar google-auth-library
        const { OAuth2Client } = require('google-auth-library');

        // Crear cliente OAuth2 (IMPORTANTE: usar client ID del .env)
        const clientId = process.env.GOOGLE_CLIENT_ID || '411638938693-87nmapmm146kci8i0p80jo745cost08h.apps.googleusercontent.com';
        const client = new OAuth2Client(clientId);

        // Verificar el token JWT de Google
        let googleTicket;
        try {
            googleTicket = await client.verifyIdToken({
                idToken: credential,
                audience: clientId
            });
        } catch (error) {
            devLogger.error('[GOOGLE-AUTH] Token inválido', error);
            return res.status(401).json({
                success: false,
                error: 'Token de Google inválido',
                message: error.message
            });
        }

        // Extraer datos del token verificado
        const payload = googleTicket.getPayload();
        const { email: googleEmail, name: googleName, picture, sub } = payload;

        devLogger.log('[GOOGLE-AUTH] Token verificado');

        // Importar DAL
        const { getUserByEmail, createUserFromGoogle } = require('../data/database-access');

        // Buscar usuario existente
        let user = await getUserByEmail(googleEmail);

        if (!user) {
            // Crear usuario nuevo desde Google
            devLogger.log('[GOOGLE-AUTH] Creando nuevo usuario');

            user = await createUserFromGoogle({
                email: googleEmail,
                name: googleName,
                picture: picture,
                sub: sub
            });

            devLogger.log('[GOOGLE-AUTH] Usuario creado exitosamente');
        } else {
            devLogger.log('[GOOGLE-AUTH] Usuario existente encontrado');
        }

        // Generar JWT propio de nuestra aplicación
        const token = jwtUtils.generateToken(
            user.id,
            user.email,
            user.role
        );

        devLogger.log('[GOOGLE-AUTH] Token JWT generado');

        // Devolver respuesta exitosa
        res.json({
            success: true,
            message: 'Autenticación con Google exitosa',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    profilePicture: user.profile_picture || picture
                }
            },
            token: token,
            expiresIn: 3600
        });

    } catch (error) {
        devLogger.error('❌ [GOOGLE-AUTH] Error procesando autenticación:');
        res.status(500).json({
            success: false,
            error: 'Error procesando autenticación con Google',
            message: error.message
        });
    }
});

module.exports = router;