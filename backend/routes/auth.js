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

// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail, maskToken } = require('../utils/sanitized-errors');

// ✅ SEMANA 25: 2FA Service integration
const twoFactorService = require('../services/twoFactorService');

// ✅ SEMANA 25: WebAuthn Service integration
const webauthnService = require('../services/webauthnService');

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
 * POST /api/auth/login
 * Iniciar sesión con JWT
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

        debugLog.log('AUTH', `Intento de login para username=${username}`);

        // Autenticar usuario
        const user = await authService.authenticateUser(username, password);

        // ✅ SEMANA 25: Check if user has 2FA enabled
        const has2FA = await twoFactorService.isEnabled(user.id);

        if (has2FA) {
            debugLog.log('AUTH', `Usuario ${username} tiene 2FA habilitado - requiere verificación`);

            // Return requires2FA response (no tokens yet)
            return res.json({
                success: true,
                requires2FA: true,
                message: 'Se requiere verificación de segundo factor',
                userId: user.id, // Needed for 2FA verification
                user: {
                    username: user.username,
                    email: maskEmail(user.email), // Masked for security
                    role: user.role
                }
            });
        }

        // If no 2FA, continue with normal token generation
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
        debugLog.log('AUTH', `Login exitoso para username=${username}, email=${maskEmail(user.email)}, role=${user.role}`);

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
        debugLog.error('AUTH', '❌ Error en login', sanitizeError(error, 'auth'));

        // Respuesta genérica por seguridad
        res.status(401).json({
            success: false,
            error: 'Credenciales inválidas',
            message: 'Email o contraseña incorrectos'
        });
    }
});

/**
 * ✅ SEMANA 25: POST /api/auth/verify-2fa
 * Verificar código 2FA y completar el login
 */
router.post('/verify-2fa', loginLimiter, [
    body('userId').isInt().withMessage('ID de usuario requerido'),
    body('token').isString().isLength({ min: 6, max: 6 }).withMessage('Código de 6 dígitos requerido'),
    body('rememberMe').optional().isBoolean()
], async (req, res, next) => {
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

        const { userId, token, rememberMe = false, useBackupCode = false } = req.body;

        debugLog.log('AUTH', `Verificando 2FA para userId=${userId}, useBackupCode=${useBackupCode}`);

        // Verificar el código (TOTP o backup code)
        let verificationResult;
        if (useBackupCode) {
            verificationResult = await twoFactorService.verifyBackupCode(userId, token);
        } else {
            verificationResult = await twoFactorService.verify(userId, token);
        }

        if (!verificationResult.success) {
            debugLog.warn('AUTH', `❌ 2FA verification failed for userId=${userId}`);
            return res.status(401).json({
                success: false,
                error: 'Código 2FA inválido',
                message: verificationResult.message || 'El código ingresado es incorrecto o ha expirado',
                remainingCodes: verificationResult.remainingCodes
            });
        }

        // 2FA verified successfully - get user data and generate tokens
        const { pool } = require('../config/database');
        const userResult = await pool.query(
            'SELECT id, username, email, nombre, apellido_paterno, role FROM usuarios WHERE id = $1',
            [userId]
        );

        if (!userResult.rows.length) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const user = userResult.rows[0];

        // Generar tokens
        const userPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: authService.permissions[user.role] || []
        };

        const tokenPair = jwtUtils.generateTokenPair(userPayload, rememberMe);

        // Log de login exitoso con 2FA
        debugLog.log('AUTH', `✅ Login exitoso con 2FA para username=${user.username}, email=${maskEmail(user.email)}, role=${user.role}`);

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Autenticación 2FA exitosa',
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
                expiresAt: new Date(tokenPair.accessTokenExpiry * 1000).toISOString(),
                twoFactorVerified: true
            },
            remainingBackupCodes: verificationResult.remainingCodes
        });

    } catch (error) {
        debugLog.error('AUTH', '❌ Error en verificación 2FA', sanitizeError(error, 'auth'));

        res.status(500).json({
            success: false,
            error: 'Error en la verificación',
            message: 'Ocurrió un error al verificar el código 2FA'
        });
    }
});

/**
 * ✅ SEMANA 25: POST /api/auth/2fa/enable
 * Habilitar 2FA para el usuario autenticado
 */
router.post('/2fa/enable', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        debugLog.log('AUTH', `Habilitando 2FA para userId=${userId}`);

        // Generate secret and backup codes
        const result = await twoFactorService.enable(userId);

        res.json({
            success: true,
            message: '2FA habilitado exitosamente. Escanea el código QR con tu app de autenticación.',
            secret: result.secret,
            qrUri: result.qrUri,
            backupCodes: result.backupCodes
        });

    } catch (error) {
        debugLog.error('AUTH', '❌ Error al habilitar 2FA', sanitizeError(error, 'auth'));

        res.status(500).json({
            success: false,
            error: 'Error al habilitar 2FA',
            message: 'No se pudo habilitar la autenticación de dos factores'
        });
    }
});

/**
 * ✅ SEMANA 25: POST /api/auth/2fa/disable
 * Deshabilitar 2FA para el usuario autenticado
 */
router.post('/2fa/disable', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        debugLog.log('AUTH', `Deshabilitando 2FA para userId=${userId}`);

        await twoFactorService.disable(userId);

        res.json({
            success: true,
            message: '2FA deshabilitado exitosamente'
        });

    } catch (error) {
        debugLog.error('AUTH', '❌ Error al deshabilitar 2FA', sanitizeError(error, 'auth'));

        res.status(500).json({
            success: false,
            error: 'Error al deshabilitar 2FA',
            message: 'No se pudo deshabilitar la autenticación de dos factores'
        });
    }
});

/**
 * ✅ SEMANA 25: POST /api/auth/2fa/regenerate-backup-codes
 * Regenerar códigos de respaldo
 */
router.post('/2fa/regenerate-backup-codes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        debugLog.log('AUTH', `Regenerando backup codes para userId=${userId}`);

        const result = await twoFactorService.regenerateBackupCodes(userId);

        res.json({
            success: true,
            message: 'Códigos de respaldo regenerados exitosamente',
            backupCodes: result.backupCodes
        });

    } catch (error) {
        debugLog.error('AUTH', '❌ Error al regenerar backup codes', sanitizeError(error, 'auth'));

        res.status(500).json({
            success: false,
            error: 'Error al regenerar códigos',
            message: 'No se pudieron regenerar los códigos de respaldo'
        });
    }
});

/**
 * ✅ SEMANA 25: GET /api/auth/2fa/status
 * Verificar si el usuario tiene 2FA habilitado
 */
router.get('/2fa/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const isEnabled = await twoFactorService.isEnabled(userId);

        res.json({
            success: true,
            enabled: isEnabled
        });

    } catch (error) {
        debugLog.error('AUTH', '❌ Error al verificar estado 2FA', sanitizeError(error, 'auth'));

        res.status(500).json({
            success: false,
            error: 'Error al verificar estado',
            enabled: false
        });
    }
});

/**
 * ✅ SEMANA 25: POST /api/auth/2fa/verify-setup
 * Verificar código durante el setup inicial de 2FA
 */
router.post('/2fa/verify-setup', authenticateToken, [
    body('token').isString().isLength({ min: 6, max: 6 }).withMessage('Código de 6 dígitos requerido')
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

        const userId = req.user.userId;
        const { token } = req.body;

        debugLog.log('AUTH', `Verificando código de setup 2FA para userId=${userId}`);

        // Verify the token (this will also enable 2FA on first successful verification)
        const result = await twoFactorService.verify(userId, token);

        if (result.success) {
            res.json({
                success: true,
                message: 'Código verificado exitosamente. 2FA habilitado.'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Código inválido',
                message: result.message || 'El código ingresado es incorrecto'
            });
        }

    } catch (error) {
        debugLog.error('AUTH', '❌ Error verificando código de setup', sanitizeError(error, 'auth'));

        res.status(500).json({
            success: false,
            error: 'Error en la verificación',
            message: 'Ocurrió un error al verificar el código'
        });
    }
});

// ============================================
// ✅ SEMANA 25: WEBAUTHN (BIOMETRIC AUTH) ENDPOINTS
// ============================================

/**
 * POST /api/auth/webauthn/register/options
 * Generar opciones para registrar un nuevo dispositivo biométrico
 */
router.post('/webauthn/register/options', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = req.user;

        debugLog.log('WEBAUTHN', `Generando opciones de registro para userId=${userId}`);

        const result = await webauthnService.generateRegistrationOptions(
            userId,
            user.username || user.name,
            user.email
        );

        res.json(result);

    } catch (error) {
        debugLog.error('WEBAUTHN', '❌ Error generando opciones de registro', sanitizeError(error, 'webauthn'));

        res.status(500).json({
            success: false,
            error: 'Error al generar opciones de registro',
            message: error.message
        });
    }
});

/**
 * POST /api/auth/webauthn/register/verify
 * Verificar y completar el registro de un dispositivo biométrico
 */
router.post('/webauthn/register/verify', authenticateToken, [
    body('response').isObject().withMessage('Respuesta WebAuthn requerida'),
    body('deviceName').optional().isString().isLength({ max: 255 })
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

        const userId = req.user.userId;
        const { response, deviceName } = req.body;

        debugLog.log('WEBAUTHN', `Verificando registro de dispositivo para userId=${userId}`);

        const result = await webauthnService.verifyRegistrationResponse(
            userId,
            response,
            deviceName || 'Dispositivo Biométrico'
        );

        res.json({
            success: true,
            message: 'Dispositivo biométrico registrado exitosamente',
            credentialId: result.credentialId
        });

    } catch (error) {
        debugLog.error('WEBAUTHN', '❌ Error verificando registro', sanitizeError(error, 'webauthn'));

        res.status(400).json({
            success: false,
            error: 'Error al verificar registro',
            message: error.message
        });
    }
});

/**
 * POST /api/auth/webauthn/authenticate/options
 * Generar opciones para autenticación biométrica
 */
router.post('/webauthn/authenticate/options', async (req, res) => {
    try {
        const { userId } = req.body; // Optional: can be null for discoverable credentials

        debugLog.log('WEBAUTHN', `Generando opciones de autenticación${userId ? ` para userId=${userId}` : ''}`);

        const result = await webauthnService.generateAuthenticationOptions(userId || null);

        res.json(result);

    } catch (error) {
        debugLog.error('WEBAUTHN', '❌ Error generando opciones de autenticación', sanitizeError(error, 'webauthn'));

        res.status(500).json({
            success: false,
            error: 'Error al generar opciones de autenticación',
            message: error.message
        });
    }
});

/**
 * POST /api/auth/webauthn/authenticate/verify
 * Verificar autenticación biométrica y generar JWT tokens
 */
router.post('/webauthn/authenticate/verify', loginLimiter, [
    body('response').isObject().withMessage('Respuesta WebAuthn requerida'),
    body('userId').optional().isInt(),
    body('rememberMe').optional().isBoolean()
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

        const { response, userId, rememberMe = false } = req.body;

        debugLog.log('WEBAUTHN', 'Verificando autenticación biométrica');

        // Verify WebAuthn response
        const verificationResult = await webauthnService.verifyAuthenticationResponse(
            response,
            userId || null
        );

        if (!verificationResult.verified) {
            return res.status(401).json({
                success: false,
                error: 'Autenticación biométrica fallida'
            });
        }

        // Get user data
        const { pool } = require('../config/database');
        const userResult = await pool.query(
            'SELECT id, username, email, nombre, apellido_paterno, role FROM usuarios WHERE id = $1',
            [verificationResult.userId]
        );

        if (!userResult.rows.length) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const user = userResult.rows[0];

        // Generate JWT tokens
        const userPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: authService.permissions[user.role] || []
        };

        const tokenPair = jwtUtils.generateTokenPair(userPayload, rememberMe);

        debugLog.log('WEBAUTHN', `✅ Autenticación biométrica exitosa para userId=${user.id}`);

        res.json({
            success: true,
            message: 'Autenticación biométrica exitosa',
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
                expiresAt: new Date(tokenPair.accessTokenExpiry * 1000).toISOString(),
                biometricAuth: true
            }
        });

    } catch (error) {
        debugLog.error('WEBAUTHN', '❌ Error en autenticación biométrica', sanitizeError(error, 'webauthn'));

        res.status(401).json({
            success: false,
            error: 'Error en la autenticación',
            message: error.message
        });
    }
});

/**
 * GET /api/auth/webauthn/credentials
 * Listar dispositivos biométricos registrados del usuario
 */
router.get('/webauthn/credentials', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const credentials = await webauthnService.getUserCredentials(userId);

        // Sanitize response (don't send public keys to frontend)
        const sanitizedCredentials = credentials.map(cred => ({
            id: cred.id,
            deviceName: cred.device_name,
            transports: cred.transports,
            createdAt: cred.created_at,
            lastUsedAt: cred.last_used_at
        }));

        res.json({
            success: true,
            credentials: sanitizedCredentials,
            count: sanitizedCredentials.length
        });

    } catch (error) {
        debugLog.error('WEBAUTHN', '❌ Error listando credenciales', sanitizeError(error, 'webauthn'));

        res.status(500).json({
            success: false,
            error: 'Error al listar dispositivos',
            credentials: []
        });
    }
});

/**
 * DELETE /api/auth/webauthn/credentials/:id
 * Eliminar un dispositivo biométrico registrado
 */
router.delete('/webauthn/credentials/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const credentialId = parseInt(req.params.id);

        if (isNaN(credentialId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de credencial inválido'
            });
        }

        const deleted = await webauthnService.deleteCredential(credentialId, userId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Credencial no encontrada o no pertenece al usuario'
            });
        }

        debugLog.log('WEBAUTHN', `Dispositivo eliminado: credentialId=${credentialId} para userId=${userId}`);

        res.json({
            success: true,
            message: 'Dispositivo biométrico eliminado exitosamente'
        });

    } catch (error) {
        debugLog.error('WEBAUTHN', '❌ Error eliminando credencial', sanitizeError(error, 'webauthn'));

        res.status(500).json({
            success: false,
            error: 'Error al eliminar dispositivo'
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

        debugLog.log('AUTH', '🔄 Tokens renovados exitosamente');

        res.json({
            success: true,
            message: 'Tokens renovados exitosamente',
            tokens: newTokenPair
        });

    } catch (error) {
        debugLog.error('AUTH', 'Error renovando token', sanitizeError(error, 'auth'));
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

        debugLog.log('AUTH', `Logout exitoso para userId=${req.user.id}`);

        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        debugLog.error('AUTH', '❌ Error en logout', sanitizeError(error, 'auth'));
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

        debugLog.log('AUTH', `Admin creando usuario: username=${username}, email=${maskEmail(email)}, role=${role}`);

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

        debugLog.log('AUTH', `Usuario creado exitosamente: id=${newUser.id}, username=${newUser.username}, role=${newUser.role}`);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: newUser
        });

    } catch (error) {
        debugLog.error('AUTH', '❌ Error registrando usuario', sanitizeError(error, 'auth'));

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
        debugLog.error('AUTH', '❌ Error obteniendo perfil', sanitizeError(error, 'auth'));
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

        debugLog.log('AUTH', `Usuario cambiando contraseña: userId=${req.user.id}`);

        // Cambiar contraseña usando el servicio
        await authService.changePassword(req.user.id, currentPassword, newPassword);

        // Invalidar todas las sesiones del usuario por seguridad
        await authService.invalidateUserSessions(req.user.id);

        debugLog.log('AUTH', `Contraseña cambiada exitosamente para userId=${req.user.id}`);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente. Por seguridad, debes iniciar sesión nuevamente.'
        });

    } catch (error) {
        debugLog.error('AUTH', '❌ Error cambiando contraseña', sanitizeError(error, 'auth'));

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

        debugLog.log('AUTH', `Admin invalidó sesiones de usuario: userId=${userId}, admin=${req.user.id}`);

        res.json({
            success: true,
            message: 'Sesiones invalidadas exitosamente'
        });

    } catch (error) {
        debugLog.error('AUTH', '❌ Error invalidando sesiones', sanitizeError(error, 'auth'));
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
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getPasswordGenerator } = require('../utils/passwordGenerator');
const passwordGenerator = getPasswordGenerator();
const emailService = require('../services/emailService');
const pool = require('../config/database');

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
            debugLog.log('AUTH', `⚠️ No se pudo verificar usuarios existentes: ${error.message}`);
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

        debugLog.log('AUTH', `Nueva solicitud de registro: email=${maskEmail(email)}, role=${requestedRole}, requestId=${newRequest.id}`);

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
        debugLog.error('AUTH', '❌ Error procesando solicitud de registro', sanitizeError(error, 'auth'));
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

        debugLog.log('AUTH', '[GOOGLE-AUTH] Verificando token de Google');

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
            debugLog.error('AUTH', '[GOOGLE-AUTH] Token inválido', sanitizeError(error, 'auth'));
            return res.status(401).json({
                success: false,
                error: 'Token de Google inválido',
                message: error.message
            });
        }

        // Extraer datos del token verificado
        const payload = googleTicket.getPayload();
        const { email: googleEmail, name: googleName, picture, sub } = payload;

        debugLog.log('AUTH', `[GOOGLE-AUTH] Token verificado para email=${maskEmail(googleEmail)}`);

        // Importar DAL
        const { getUserByEmail, createUserFromGoogle } = require('../data/database-access');

        // Buscar usuario existente
        let user = await getUserByEmail(googleEmail);

        if (!user) {
            // Crear usuario nuevo desde Google
            debugLog.log('AUTH', `[GOOGLE-AUTH] Creando nuevo usuario para email=${maskEmail(googleEmail)}`);

            user = await createUserFromGoogle({
                email: googleEmail,
                name: googleName,
                picture: picture,
                sub: sub
            });

            debugLog.log('AUTH', `[GOOGLE-AUTH] Usuario creado exitosamente: userId=${user.id}, role=${user.role}`);
        } else {
            debugLog.log('AUTH', `[GOOGLE-AUTH] Usuario existente encontrado: userId=${user.id}`);
        }

        // Generar JWT propio de nuestra aplicación
        const token = jwtUtils.generateToken(
            user.id,
            user.email,
            user.role
        );

        debugLog.log('AUTH', '[GOOGLE-AUTH] Token JWT generado exitosamente');

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
        debugLog.error('AUTH', '❌ [GOOGLE-AUTH] Error procesando autenticación', sanitizeError(error, 'auth'));
        res.status(500).json({
            success: false,
            error: 'Error procesando autenticación con Google',
            message: error.message
        });
    }
});

// ============================================
// REGISTRO PÚBLICO CON VERIFICACIÓN DE EMAIL
// ============================================

// Validaciones para registro público
const publicRegisterValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email válido requerido'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'),
    body('nombre')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nombre entre 2 y 100 caracteres'),
    body('apellido_paterno')
        .isLength({ min: 2, max: 100 })
        .withMessage('Apellido paterno entre 2 y 100 caracteres')
];

/**
 * POST /api/auth/public-register
 * Registro público - Crea usuario pendiente y envía email de verificación
 */
router.post('/public-register', registerLimiter, publicRegisterValidation, async (req, res) => {
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

        const { email, password, nombre, apellido_paterno, apellido_materno = '' } = req.body;

        debugLog.log('AUTH', `[PUBLIC-REGISTER] Intento de registro para email=${maskEmail(email)}`);

        // Verificar si el email ya existe
        const checkQuery = 'SELECT id, email_verified FROM usuarios WHERE email = $1';
        const existingUser = await pool.query(checkQuery, [email.toLowerCase()]);

        if (existingUser.rows.length > 0) {
            const user = existingUser.rows[0];
            if (user.email_verified) {
                return res.status(409).json({
                    success: false,
                    error: 'Email ya registrado',
                    message: 'Este email ya está registrado. Intenta iniciar sesión o recuperar tu contraseña.'
                });
            } else {
                // Usuario existe pero no verificado - reenviar email
                debugLog.log('AUTH', `[PUBLIC-REGISTER] Reenviando verificación para email=${maskEmail(email)}`);
            }
        }

        // Generar hash de contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generar username desde email
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');

        let userId;

        if (existingUser.rows.length > 0) {
            // Actualizar usuario existente
            userId = existingUser.rows[0].id;
            const updateQuery = `
                UPDATE usuarios SET
                    password_hash = $1,
                    nombre = $2,
                    apellido_paterno = $3,
                    apellido_materno = $4
                WHERE id = $5
            `;
            await pool.query(updateQuery, [passwordHash, nombre, apellido_paterno, apellido_materno, userId]);
        } else {
            // Crear nuevo usuario (pendiente de verificación)
            const insertQuery = `
                INSERT INTO usuarios (
                    uuid, email, username, password_hash, role, status,
                    nombre, apellido_paterno, apellido_materno, email_verified, created_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, 'estudiante', 'pendiente',
                    $4, $5, $6, FALSE, NOW()
                ) RETURNING id
            `;
            const result = await pool.query(insertQuery, [
                email.toLowerCase(), username, passwordHash, nombre, apellido_paterno, apellido_materno
            ]);
            userId = result.rows[0].id;
        }

        // Generar token de verificación
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Eliminar tokens anteriores para este usuario
        await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);

        // Insertar nuevo token
        const tokenQuery = `
            INSERT INTO email_verification_tokens (user_id, token, type, expires_at)
            VALUES ($1, $2, 'registration', $3)
        `;
        await pool.query(tokenQuery, [userId, verificationToken, expiresAt]);

        // Construir URL de verificación
        const baseUrl = process.env.APP_URL || 'https://bge-heroesdelapatria.vercel.app';
        const verificationUrl = `${baseUrl}/verify-email.html?token=${verificationToken}`;

        // Enviar email de verificación
        try {
            await emailService.sendEmail({
                to: email,
                subject: 'Verifica tu Email - BGE Héroes de la Patria',
                template: 'email-verification',
                data: {
                    nombre: nombre,
                    verificationUrl: verificationUrl,
                    expiresIn: '24 horas',
                    currentYear: new Date().getFullYear()
                }
            });

            debugLog.log('AUTH', `[PUBLIC-REGISTER] Email de verificación enviado a ${maskEmail(email)}`);
        } catch (emailError) {
            debugLog.error('AUTH', `[PUBLIC-REGISTER] Error enviando email: ${emailError.message}`);
            // No fallar el registro si el email falla, pero logear
        }

        res.status(201).json({
            success: true,
            message: 'Registro exitoso. Revisa tu correo electrónico para verificar tu cuenta.',
            data: {
                email: email,
                requiresVerification: true
            }
        });

    } catch (error) {
        debugLog.error('AUTH', `[PUBLIC-REGISTER] Error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error en el registro',
            message: 'No se pudo completar el registro. Intenta de nuevo más tarde.'
        });
    }
});

/**
 * POST /api/auth/verify-email
 * Verificar token de email y activar cuenta
 */
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token requerido',
                message: 'Debes proporcionar el token de verificación.'
            });
        }

        debugLog.log('AUTH', `[VERIFY-EMAIL] Verificando token=${maskToken(token)}`);

        // Buscar token válido
        const tokenQuery = `
            SELECT evt.*, u.email, u.nombre
            FROM email_verification_tokens evt
            JOIN usuarios u ON u.id = evt.user_id
            WHERE evt.token = $1 AND evt.used_at IS NULL
        `;
        const tokenResult = await pool.query(tokenQuery, [token]);

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Token inválido',
                message: 'El enlace de verificación no es válido o ya fue utilizado.'
            });
        }

        const verificationData = tokenResult.rows[0];

        // Verificar si el token expiró
        if (new Date() > new Date(verificationData.expires_at)) {
            return res.status(400).json({
                success: false,
                error: 'Token expirado',
                message: 'El enlace de verificación ha expirado. Solicita uno nuevo.'
            });
        }

        // Activar usuario
        const activateQuery = `
            UPDATE usuarios SET
                email_verified = TRUE,
                email_verified_at = NOW(),
                status = 'activo'
            WHERE id = $1
        `;
        await pool.query(activateQuery, [verificationData.user_id]);

        // Marcar token como usado
        const markUsedQuery = `
            UPDATE email_verification_tokens SET used_at = NOW()
            WHERE token = $1
        `;
        await pool.query(markUsedQuery, [token]);

        debugLog.log('AUTH', `[VERIFY-EMAIL] Email verificado para userId=${verificationData.user_id}`);

        res.json({
            success: true,
            message: '¡Tu email ha sido verificado exitosamente! Ya puedes iniciar sesión.',
            data: {
                email: verificationData.email,
                verified: true
            }
        });

    } catch (error) {
        debugLog.error('AUTH', `[VERIFY-EMAIL] Error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error en la verificación',
            message: 'No se pudo verificar el email. Intenta de nuevo más tarde.'
        });
    }
});

/**
 * POST /api/auth/resend-verification
 * Reenviar email de verificación
 */
router.post('/resend-verification', registerLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email requerido'
            });
        }

        // Buscar usuario no verificado
        const userQuery = `
            SELECT id, nombre, email_verified FROM usuarios
            WHERE email = $1
        `;
        const userResult = await pool.query(userQuery, [email.toLowerCase()]);

        if (userResult.rows.length === 0) {
            // No revelar si el email existe
            return res.json({
                success: true,
                message: 'Si el email existe y no está verificado, recibirás un nuevo enlace.'
            });
        }

        const user = userResult.rows[0];

        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                error: 'Email ya verificado',
                message: 'Este email ya está verificado. Puedes iniciar sesión.'
            });
        }

        // Generar nuevo token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Eliminar tokens anteriores
        await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [user.id]);

        // Insertar nuevo token
        await pool.query(
            'INSERT INTO email_verification_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
            [user.id, verificationToken, 'registration', expiresAt]
        );

        // Enviar email
        const baseUrl = process.env.APP_URL || 'https://bge-heroesdelapatria.vercel.app';
        const verificationUrl = `${baseUrl}/verify-email.html?token=${verificationToken}`;

        await emailService.sendEmail({
            to: email,
            subject: 'Verifica tu Email - BGE Héroes de la Patria',
            template: 'email-verification',
            data: {
                nombre: user.nombre,
                verificationUrl: verificationUrl,
                expiresIn: '24 horas',
                currentYear: new Date().getFullYear()
            }
        });

        debugLog.log('AUTH', `[RESEND-VERIFICATION] Email reenviado a ${maskEmail(email)}`);

        res.json({
            success: true,
            message: 'Si el email existe y no está verificado, recibirás un nuevo enlace.'
        });

    } catch (error) {
        debugLog.error('AUTH', `[RESEND-VERIFICATION] Error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error interno',
            message: 'No se pudo procesar la solicitud.'
        });
    }
});

module.exports = router;