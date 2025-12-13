"use strict";
/**
 * 🔐 RUTAS DE AUTENTICACIÓN JWT - BGE HÉROES DE LA PATRIA
 * Sistema completo con roles, seguridad y gestión avanzada de tokens
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// @ts-ignore
const express_validator_1 = require("express-validator");
// @ts-ignore
const authService_1 = require("../services/authService");
// @ts-ignore
const jwtUtils_1 = require("../utils/jwtUtils");
const auth_1 = require("../middleware/auth");
// GDPR Logging - Debug condicional y sanitización
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
// ✅ SEMANA 25: 2FA Service integration
// @ts-ignore
const twoFactorService_1 = __importDefault(require("../services/twoFactorService"));
// ✅ SEMANA 25: WebAuthn Service integration
// @ts-ignore
const webauthnService_1 = __importDefault(require("../services/webauthnService"));
// ✅ FASE 3: DAO Layer for data access
// @ts-ignore
const user_dao_1 = __importDefault(require("../data/user.dao"));
// @ts-ignore
const passwordGenerator_1 = require("../utils/passwordGenerator");
// @ts-ignore
const emailService_1 = __importDefault(require("../services/emailService"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = express_1.default.Router();
// Instancias de servicios
const authService = (0, authService_1.getAuthService)();
const jwtUtils = (0, jwtUtils_1.getJWTUtils)();
const passwordGenerator = (0, passwordGenerator_1.getPasswordGenerator)();
// ============================================
// RATE LIMITING ESPECÍFICO
// ============================================
// Rate limiting para login
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 5, // 5 intentos por ventana
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
const registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hora
    limit: 3, // 3 registros por hora por IP
    message: {
        error: 'Demasiados registros',
        message: 'Solo se permiten 3 registros por hora.',
        retryAfter: '1 hora'
    }
});
// Rate limiting para refresh token
const refreshLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minuto
    limit: 10, // 10 renovaciones por minuto
    message: {
        error: 'Demasiadas renovaciones',
        message: 'Espera un momento antes de renovar el token nuevamente.'
    }
});
// ============================================
// VALIDACIONES
// ============================================
const loginValidation = [
    (0, express_validator_1.body)('username')
        .isLength({ min: 3 })
        .trim()
        .withMessage('Nombre de usuario mínimo 3 caracteres'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Contraseña mínimo 6 caracteres'),
    (0, express_validator_1.body)('rememberMe')
        .optional()
        .isBoolean()
        .withMessage('RememberMe debe ser verdadero o falso')
];
const registerValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email válido requerido'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        .withMessage('Contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo especial'),
    (0, express_validator_1.body)('username')
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9_.-]+$/)
        .withMessage('Username debe tener 3-50 caracteres alfanuméricos'),
    (0, express_validator_1.body)('nombre')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nombre entre 2 y 100 caracteres'),
    (0, express_validator_1.body)('apellido_paterno')
        .isLength({ min: 2, max: 100 })
        .withMessage('Apellido paterno entre 2 y 100 caracteres'),
    (0, express_validator_1.body)('role')
        .isIn(['admin', 'docente', 'estudiante', 'padre_familia'])
        .withMessage('Rol inválido')
];
const passwordChangeValidation = [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Contraseña actual requerida'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        .withMessage('Nueva contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo especial')
];
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            error: 'Datos de entrada inválidos',
            details: errors.array()
        });
        return;
    }
    next();
};
// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================
/**
 * POST /api/auth/login
 * Iniciar sesión con JWT
 */
router.post('/login', loginLimiter, loginValidation, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, error: 'Datos de entrada inválidos', details: errors.array() });
            return;
        }
        const { username, password, rememberMe = false } = req.body;
        debug_logger_1.debugLog.log('AUTH', `Intento de login para username=${username}`);
        const user = await authService.authenticateUser(username, password);
        // ✅ SEMANA 25: Check 2FA
        // const has2FA = await twoFactorService.isEnabled(user.id);
        const has2FA = false; // TEMPORARILY DISABLED
        if (has2FA) {
            debug_logger_1.debugLog.log('AUTH', `Usuario ${username} tiene 2FA habilitado - requiere verificación`);
            res.json({
                success: true,
                requires2FA: true,
                message: 'Se requiere verificación de segundo factor',
                userId: user.id,
                user: {
                    username: user.username,
                    email: (0, sanitized_errors_1.maskEmail)(user.email),
                    role: user.role
                }
            });
            return;
        }
        const userPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: authService.permissions[user.role] || []
        };
        const tokenPair = jwtUtils.generateTokenPair(userPayload, rememberMe);
        debug_logger_1.debugLog.log('AUTH', `Login exitoso para username=${username}, email=${(0, sanitized_errors_1.maskEmail)(user.email)}, role=${user.role}`);
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error en login', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(401).json({ success: false, error: 'Credenciales inválidas', message: 'Email o contraseña incorrectos' });
    }
});
/**
 * ✅ SEMANA 25: POST /api/auth/verify-2fa
 */
router.post('/verify-2fa', loginLimiter, [
    (0, express_validator_1.body)('userId').isInt().withMessage('ID de usuario requerido'),
    (0, express_validator_1.body)('token').isString().isLength({ min: 6, max: 6 }).withMessage('Código de 6 dígitos requerido'),
    (0, express_validator_1.body)('rememberMe').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, error: 'Datos de entrada inválidos', details: errors.array() });
            return;
        }
        const { userId, token, rememberMe = false, useBackupCode = false } = req.body;
        debug_logger_1.debugLog.log('AUTH', `Verificando 2FA para userId=${userId}, useBackupCode=${useBackupCode}`);
        let verificationResult;
        if (useBackupCode) {
            verificationResult = await twoFactorService_1.default.verifyBackupCode(userId, token);
        }
        else {
            verificationResult = await twoFactorService_1.default.verify(userId, token);
        }
        if (!verificationResult.success) {
            debug_logger_1.debugLog.warn('AUTH', `❌ 2FA verification failed for userId=${userId}`);
            res.status(401).json({
                success: false,
                error: 'Código 2FA inválido',
                message: verificationResult.message || 'El código ingresado es incorrecto o ha expirado',
                remainingCodes: verificationResult.remainingCodes
            });
            return;
        }
        const user = await user_dao_1.default.get(userId);
        if (!user) {
            res.status(404).json({ success: false, error: 'Usuario no encontrado' });
            return;
        }
        const userPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: authService.permissions[user.role] || []
        };
        const tokenPair = jwtUtils.generateTokenPair(userPayload, rememberMe);
        debug_logger_1.debugLog.log('AUTH', `✅ Login exitoso con 2FA para username=${user.username}, email=${(0, sanitized_errors_1.maskEmail)(user.email)}, role=${user.role}`);
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error en verificación 2FA', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(500).json({ success: false, error: 'Error en la verificación', message: 'Ocurrió un error al verificar el código 2FA' });
    }
});
/**
 * ✅ SEMANA 25: POST /api/auth/2fa/enable
 */
router.post('/2fa/enable', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        debug_logger_1.debugLog.log('AUTH', `Habilitando 2FA para userId=${userId}`);
        const result = await twoFactorService_1.default.enable(userId);
        res.json({
            success: true,
            message: '2FA habilitado exitosamente. Escanea el código QR con tu app de autenticación.',
            secret: result.secret,
            qrUri: result.qrUri,
            backupCodes: result.backupCodes
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error al habilitar 2FA', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(500).json({ success: false, error: 'Error al habilitar 2FA', message: 'No se pudo habilitar la autenticación de dos factores' });
    }
});
/**
 * ✅ SEMANA 25: POST /api/auth/2fa/disable
 */
router.post('/2fa/disable', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        debug_logger_1.debugLog.log('AUTH', `Deshabilitando 2FA para userId=${userId}`);
        await twoFactorService_1.default.disable(userId);
        res.json({ success: true, message: '2FA deshabilitado exitosamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error al deshabilitar 2FA', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(500).json({ success: false, error: 'Error al deshabilitar 2FA', message: 'No se pudo deshabilitar la autenticación de dos factores' });
    }
});
/**
 * ✅ SEMANA 25: POST /api/auth/2fa/regenerate-backup-codes
 */
router.post('/2fa/regenerate-backup-codes', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        debug_logger_1.debugLog.log('AUTH', `Regenerando backup codes para userId=${userId}`);
        const result = await twoFactorService_1.default.regenerateBackupCodes(userId);
        res.json({ success: true, message: 'Códigos de respaldo regenerados exitosamente', backupCodes: result.backupCodes });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error al regenerar backup codes', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(500).json({ success: false, error: 'Error al regenerar códigos', message: 'No se pudieron regenerar los códigos de respaldo' });
    }
});
/**
 * ✅ SEMANA 25: GET /api/auth/2fa/status
 */
router.get('/2fa/status', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const isEnabled = await twoFactorService_1.default.isEnabled(userId);
        res.json({ success: true, enabled: isEnabled });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error al verificar estado 2FA', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(500).json({ success: false, error: 'Error al verificar estado', enabled: false });
    }
});
/**
 * ✅ SEMANA 25: POST /api/auth/2fa/verify-setup
 */
router.post('/2fa/verify-setup', auth_1.authenticateToken, [
    (0, express_validator_1.body)('token').isString().isLength({ min: 6, max: 6 }).withMessage('Código de 6 dígitos requerido')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
            return;
        }
        const userId = req.user.userId || req.user.id;
        const { token } = req.body;
        debug_logger_1.debugLog.log('AUTH', `Verificando código de setup 2FA para userId=${userId}`);
        const result = await twoFactorService_1.default.verify(userId, token);
        if (result.success) {
            res.json({ success: true, message: 'Código verificado exitosamente. 2FA habilitado.' });
        }
        else {
            res.status(400).json({ success: false, error: 'Código inválido', message: result.message || 'El código ingresado es incorrecto' });
        }
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error verificando código de setup', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(500).json({ success: false, error: 'Error en la verificación', message: 'Ocurrió un error al verificar el código' });
    }
});
// ============================================
// ✅ SEMANA 25: WEBAUTHN (BIOMETRIC AUTH)
// ============================================
router.post('/webauthn/register/options', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = req.user;
        debug_logger_1.debugLog.log('WEBAUTHN', `Generando opciones de registro para userId=${userId}`);
        const result = await webauthnService_1.default.generateRegistrationOptions(userId, user.username || user.name || 'User', user.email);
        res.json(result);
    }
    catch (error) {
        debug_logger_1.debugLog.error('WEBAUTHN', '❌ Error generando opciones de registro', (0, sanitized_errors_1.sanitizeError)(error, 'webauthn'));
        res.status(500).json({ success: false, error: 'Error al generar opciones de registro', message: error.message });
    }
});
router.post('/webauthn/register/verify', auth_1.authenticateToken, [
    (0, express_validator_1.body)('response').isObject().withMessage('Respuesta WebAuthn requerida'),
    (0, express_validator_1.body)('deviceName').optional().isString().isLength({ max: 255 })
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
            return;
        }
        const userId = req.user.userId || req.user.id;
        const { response, deviceName } = req.body;
        debug_logger_1.debugLog.log('WEBAUTHN', `Verificando registro de dispositivo para userId=${userId}`);
        const result = await webauthnService_1.default.verifyRegistrationResponse(userId, response, deviceName || 'Dispositivo Biométrico');
        res.json({ success: true, message: 'Dispositivo biométrico registrado exitosamente', credentialId: result.credentialId });
    }
    catch (error) {
        debug_logger_1.debugLog.error('WEBAUTHN', '❌ Error verificando registro', (0, sanitized_errors_1.sanitizeError)(error, 'webauthn'));
        res.status(400).json({ success: false, error: 'Error al verificar registro', message: error.message });
    }
});
router.post('/webauthn/authenticate/options', async (req, res) => {
    try {
        const { userId } = req.body;
        debug_logger_1.debugLog.log('WEBAUTHN', `Generando opciones de autenticación${userId ? ` para userId=${userId}` : ''}`);
        const result = await webauthnService_1.default.generateAuthenticationOptions(userId || null);
        res.json(result);
    }
    catch (error) {
        debug_logger_1.debugLog.error('WEBAUTHN', '❌ Error generando opciones de autenticación', (0, sanitized_errors_1.sanitizeError)(error, 'webauthn'));
        res.status(500).json({ success: false, error: 'Error al generar opciones de autenticación', message: error.message });
    }
});
router.post('/webauthn/authenticate/verify', loginLimiter, [
    (0, express_validator_1.body)('response').isObject().withMessage('Respuesta WebAuthn requerida'),
    (0, express_validator_1.body)('userId').optional().isInt(),
    (0, express_validator_1.body)('rememberMe').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
            return;
        }
        const { response, userId, rememberMe = false } = req.body;
        debug_logger_1.debugLog.log('WEBAUTHN', 'Verificando autenticación biométrica');
        const verificationResult = await webauthnService_1.default.verifyAuthenticationResponse(response, userId || null);
        if (!verificationResult.verified) {
            res.status(401).json({ success: false, error: 'Autenticación biométrica fallida' });
            return;
        }
        const user = await user_dao_1.default.get(verificationResult.userId);
        if (!user) {
            res.status(404).json({ success: false, error: 'Usuario no encontrado' });
            return;
        }
        const userPayload = {
            userId: user.id, email: user.email, username: user.username, role: user.role,
            permissions: authService.permissions[user.role] || []
        };
        const tokenPair = jwtUtils.generateTokenPair(userPayload, rememberMe);
        debug_logger_1.debugLog.log('WEBAUTHN', `✅ Autenticación biométrica exitosa para userId=${user.id}`);
        res.json({
            success: true, message: 'Autenticación biométrica exitosa',
            user: { id: user.id, username: user.username, email: user.email, nombre: user.nombre, apellido_paterno: user.apellido_paterno, role: user.role, permissions: userPayload.permissions },
            tokens: tokenPair,
            sessionInfo: { loginTime: new Date().toISOString(), rememberMe: rememberMe, expiresAt: new Date(tokenPair.accessTokenExpiry * 1000).toISOString(), biometricAuth: true }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('WEBAUTHN', '❌ Error en autenticación biométrica', (0, sanitized_errors_1.sanitizeError)(error, 'webauthn'));
        res.status(401).json({ success: false, error: 'Error en la autenticación', message: error.message });
    }
});
router.get('/webauthn/credentials', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const credentials = await webauthnService_1.default.getUserCredentials(userId);
        const sanitizedCredentials = credentials.map((cred) => ({
            id: cred.id, deviceName: cred.device_name, transports: cred.transports, createdAt: cred.created_at, lastUsedAt: cred.last_used_at
        }));
        res.json({ success: true, credentials: sanitizedCredentials, count: sanitizedCredentials.length });
    }
    catch (error) {
        debug_logger_1.debugLog.error('WEBAUTHN', '❌ Error listando credenciales', (0, sanitized_errors_1.sanitizeError)(error, 'webauthn'));
        res.status(500).json({ success: false, error: 'Error al listar dispositivos', credentials: [] });
    }
});
router.delete('/webauthn/credentials/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const credentialId = parseInt(req.params.id);
        if (isNaN(credentialId)) {
            res.status(400).json({ success: false, error: 'ID de credencial inválido' });
            return;
        }
        const deleted = await webauthnService_1.default.deleteCredential(credentialId, userId);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Credencial no encontrada' });
            return;
        }
        debug_logger_1.debugLog.log('WEBAUTHN', `Dispositivo eliminado: credentialId=${credentialId} para userId=${userId}`);
        res.json({ success: true, message: 'Dispositivo biométrico eliminado exitosamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('WEBAUTHN', '❌ Error eliminando credencial', (0, sanitized_errors_1.sanitizeError)(error, 'webauthn'));
        res.status(500).json({ success: false, error: 'Error al eliminar dispositivo' });
    }
});
/**
 * POST /api/auth/refresh
 */
router.post('/refresh', refreshLimiter, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({ success: false, error: 'Token de refresh requerido', message: 'Debes proporcionar un token de refresh válido' });
            return;
        }
        const newTokenPair = jwtUtils.renewTokenPair(refreshToken);
        debug_logger_1.debugLog.log('AUTH', '🔄 Tokens renovados exitosamente');
        res.json({ success: true, message: 'Tokens renovados exitosamente', tokens: newTokenPair });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', 'Error renovando token', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(403).json({ success: false, error: 'Token de refresh inválido', message: error.message });
    }
});
/**
 * POST /api/auth/logout
 */
router.post('/logout', auth_1.authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = jwtUtils.extractTokenFromHeader(authHeader);
        jwtUtils.blacklistToken(token);
        await authService.invalidateUserSessions(req.user.id);
        debug_logger_1.debugLog.log('AUTH', `Logout exitoso para userId=${req.user.id}`);
        res.json({ success: true, message: 'Sesión cerrada exitosamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error en logout', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(500).json({ success: false, error: 'Error cerrando sesión', message: error.message });
    }
});
/**
 * POST /api/auth/register (Admin)
 */
router.post('/register', auth_1.authenticateToken, auth_1.requireAdmin, registerLimiter, registerValidation, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, error: 'Datos de entrada inválidos', details: errors.array() });
            return;
        }
        const { email, password, username, nombre, apellido_paterno, apellido_materno, role } = req.body;
        debug_logger_1.debugLog.log('AUTH', `Admin creando usuario: username=${username}, email=${(0, sanitized_errors_1.maskEmail)(email)}, role=${role}`);
        const newUser = await authService.createUser({ email, password, username, nombre, apellido_paterno, apellido_materno, role });
        debug_logger_1.debugLog.log('AUTH', `Usuario creado exitosamente: id=${newUser.id}, username=${newUser.username}, role=${newUser.role}`);
        res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', user: newUser });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error registrando usuario', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        const errorMessage = error.message;
        if (errorMessage.includes('ya está registrado')) {
            res.status(409).json({ success: false, error: 'Email ya registrado', message: errorMessage });
        }
        else {
            res.status(400).json({ success: false, error: 'Error registrando usuario', message: errorMessage });
        }
    }
});
/**
 * GET /api/auth/profile
 */
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const userProfile = await authService.getUserProfile(req.user.id);
        res.json({ success: true, message: 'Perfil obtenido exitosamente', user: userProfile });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error obteniendo perfil', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(404).json({ success: false, error: 'Usuario no encontrado', message: error.message });
    }
});
/**
 * PUT /api/auth/change-password
 */
router.put('/change-password', auth_1.authenticateToken, passwordChangeValidation, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, error: 'Datos de entrada inválidos', details: errors.array() });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        debug_logger_1.debugLog.log('AUTH', `Usuario cambiando contraseña: userId=${req.user.id}`);
        await authService.changePassword(req.user.id, currentPassword, newPassword);
        await authService.invalidateUserSessions(req.user.id);
        debug_logger_1.debugLog.log('AUTH', `Contraseña cambiada exitosamente para userId=${req.user.id}`);
        res.json({ success: true, message: 'Contraseña actualizada exitosamente. Por seguridad, debes iniciar sesión nuevamente.' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error cambiando contraseña', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        const errorMessage = error.message;
        if (errorMessage.includes('incorrecta')) {
            res.status(400).json({ success: false, error: 'Contraseña incorrecta', message: errorMessage });
        }
        else {
            res.status(500).json({ success: false, error: 'Error interno', message: 'No se pudo actualizar la contraseña' });
        }
    }
});
/**
 * GET /api/auth/verify
 */
router.get('/verify', auth_1.authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Token válido', user: req.user, isAuthenticated: true });
});
/**
 * GET /api/auth/permissions
 */
router.get('/permissions', auth_1.authenticateToken, (req, res) => {
    const userPermissions = authService.permissions[req.user.role] || [];
    res.json({ success: true, permissions: userPermissions, role: req.user.role, hasPermission: (permission) => authService.hasPermission(req.user.role, permission) });
});
/**
 * POST /api/auth/check-permission
 */
router.post('/check-permission', auth_1.authenticateToken, [(0, express_validator_1.body)('permission').notEmpty().withMessage('Permiso requerido')], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
        return;
    }
    const { permission } = req.body;
    const hasPermission = authService.hasPermission(req.user.role, permission);
    res.json({ success: true, hasPermission, permission, role: req.user.role });
});
/**
 * GET /api/auth/stats
 */
router.get('/stats', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => {
    const stats = jwtUtils.getStats();
    res.json({ success: true, message: 'Estadísticas del sistema de autenticación', stats: { ...stats, systemInfo: { version: '1.0.0', environment: process.env.NODE_ENV || 'development', uptime: process.uptime(), timestamp: new Date().toISOString() } } });
});
/**
 * POST /api/auth/invalidate-user-sessions
 */
router.post('/invalidate-user-sessions', auth_1.authenticateToken, auth_1.requireAdmin, [(0, express_validator_1.body)('userId').isInt().withMessage('ID de usuario requerido')], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
            return;
        }
        const { userId } = req.body;
        await authService.invalidateUserSessions(userId);
        debug_logger_1.debugLog.log('AUTH', `Admin invalidó sesiones de usuario: userId=${userId}, admin=${req.user.id}`);
        res.json({ success: true, message: 'Sesiones invalidadas exitosamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error invalidando sesiones', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(500).json({ success: false, error: 'Error interno', message: error.message });
    }
});
// ============================================
// SISTEMA DE SOLICITUDES DE REGISTRO
// ============================================
const REGISTRATION_REQUESTS_PATH = path_1.default.join(__dirname, '../data/registration-requests.json');
const registrationRequestLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    message: { error: 'Demasiadas solicitudes de registro', message: 'Solo puedes enviar 3 solicitudes por hora. Intenta de nuevo más tarde.', retryAfter: '1 hora' },
    standardHeaders: true, legacyHeaders: false
});
const requestRegistrationValidation = [
    (0, express_validator_1.body)('fullName').trim().isLength({ min: 5, max: 200 }).matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/).withMessage('Nombre completo debe tener entre 5 y 200 caracteres y solo contener letras'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Email válido requerido').custom((value) => {
        const allowedDomains = ['@bge.edu.mx', '@bgeheroespatria.edu.mx', '@heroespatria.edu.mx'];
        if (!allowedDomains.some(domain => value.endsWith(domain))) {
            throw new Error('Solo se permiten correos institucionales');
        }
        return true;
    }),
    (0, express_validator_1.body)('requestedRole').isIn(['docente', 'estudiante', 'administrativo']).withMessage('Rol debe ser: docente, estudiante o administrativo'),
    (0, express_validator_1.body)('reason').trim().isLength({ min: 50, max: 1000 }).withMessage('El motivo debe tener entre 50 y 1000 caracteres'),
    (0, express_validator_1.body)('phone').optional().matches(/^[0-9]{10}$/).withMessage('Teléfono debe tener 10 dígitos')
];
const RegistrationHelpers = {
    async readRegistrationRequests() {
        try {
            const data = await promises_1.default.readFile(REGISTRATION_REQUESTS_PATH, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            const initialData = { requests: [], lastId: 0 };
            await promises_1.default.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(initialData, null, 2));
            return initialData;
        }
    },
    async writeRegistrationRequests(data) {
        await promises_1.default.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(data, null, 2));
    },
    sanitizeInput(text) {
        return text.trim().replace(/[<>]/g, '');
    },
    async hasPendingRequest(email) {
        const data = await this.readRegistrationRequests();
        return data.requests.some((req) => req.email.toLowerCase() === email.toLowerCase() && req.status === 'pending');
    }
};
router.post('/request-registration', registrationRequestLimiter, requestRegistrationValidation, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, error: 'Datos de entrada inválidos', details: errors.array() });
            return;
        }
        const { fullName, email, requestedRole, reason, phone } = req.body;
        if (await RegistrationHelpers.hasPendingRequest(email)) {
            res.status(409).json({ success: false, error: 'Solicitud duplicada', message: 'Ya existe una solicitud pendiente.' });
            return;
        }
        try {
            const jsonUsers = await authService.loadUsersFromJson();
            if (jsonUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
                res.status(409).json({ success: false, error: 'Email ya registrado', message: 'Este email ya está registrado.' });
                return;
            }
        }
        catch (error) {
            debug_logger_1.debugLog.log('AUTH', `⚠️ No se pudo verificar usuarios existentes: ${error.message}`);
        }
        const data = await RegistrationHelpers.readRegistrationRequests();
        const newRequest = {
            id: `req_${Date.now()}_${++data.lastId}`,
            fullName: RegistrationHelpers.sanitizeInput(fullName),
            email: email.toLowerCase(),
            requestedRole,
            reason: RegistrationHelpers.sanitizeInput(reason),
            phone: phone || null,
            status: 'pending', createdAt: new Date().toISOString(), reviewedBy: null, reviewedAt: null, reviewNotes: null, ipAddress: req.ip
        };
        data.requests.push(newRequest);
        await RegistrationHelpers.writeRegistrationRequests(data);
        debug_logger_1.debugLog.log('AUTH', `Nueva solicitud de registro: email=${(0, sanitized_errors_1.maskEmail)(email)}, role=${requestedRole}, requestId=${newRequest.id}`);
        res.status(201).json({ success: true, message: 'Solicitud enviada exitosamente', requestId: newRequest.id, data: { id: newRequest.id, email: newRequest.email, status: newRequest.status, createdAt: newRequest.createdAt } });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ Error procesando solicitud de registro', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(500).json({ success: false, error: 'Error interno del servidor', message: 'No se pudo procesar la solicitud.' });
    }
});
// ============================================
// GOOGLE OAUTH
// ============================================
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            res.status(400).json({ success: false, error: 'Token de Google requerido' });
            return;
        }
        debug_logger_1.debugLog.log('AUTH', '[GOOGLE-AUTH] Verificando token de Google');
        // @ts-ignore
        const { OAuth2Client } = require('google-auth-library');
        const clientId = process.env.GOOGLE_CLIENT_ID || '411638938693-87nmapmm146kci8i0p80jo745cost08h.apps.googleusercontent.com';
        const client = new OAuth2Client(clientId);
        let googleTicket;
        try {
            googleTicket = await client.verifyIdToken({ idToken: credential, audience: clientId });
        }
        catch (error) {
            debug_logger_1.debugLog.error('AUTH', '[GOOGLE-AUTH] Token inválido', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
            res.status(401).json({ success: false, error: 'Token de Google inválido', message: error.message });
            return;
        }
        const payload = googleTicket.getPayload();
        const { email: googleEmail, name: googleName, picture, sub } = payload;
        debug_logger_1.debugLog.log('AUTH', `[GOOGLE-AUTH] Token verificado para email=${(0, sanitized_errors_1.maskEmail)(googleEmail)}`);
        // @ts-ignore
        const { getUserByEmail, createUserFromGoogle } = require('../data/database-access');
        let user = await getUserByEmail(googleEmail);
        if (!user) {
            debug_logger_1.debugLog.log('AUTH', `[GOOGLE-AUTH] Creando nuevo usuario para email=${(0, sanitized_errors_1.maskEmail)(googleEmail)}`);
            user = await createUserFromGoogle({ email: googleEmail, name: googleName, picture, sub });
            debug_logger_1.debugLog.log('AUTH', `[GOOGLE-AUTH] Usuario creado exitosamente: userId=${user.id}, role=${user.role}`);
        }
        else {
            debug_logger_1.debugLog.log('AUTH', `[GOOGLE-AUTH] Usuario existente encontrado: userId=${user.id}`);
        }
        const token = jwtUtils.generateToken(user.id, user.email, user.role);
        debug_logger_1.debugLog.log('AUTH', '[GOOGLE-AUTH] Token JWT generado exitosamente');
        res.json({ success: true, message: 'Autenticación con Google exitosa', data: { user: { id: user.id, email: user.email, username: user.username, role: user.role, profilePicture: user.profile_picture || picture } }, token, expiresIn: 3600 });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', '❌ [GOOGLE-AUTH] Error procesando autenticación', (0, sanitized_errors_1.sanitizeError)(error, 'auth'));
        res.status(500).json({ success: false, error: 'Error procesando autenticación con Google', message: error.message });
    }
});
// ============================================
// REGISTRO PÚBLICO
// ============================================
const publicRegisterValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Email válido requerido'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'),
    (0, express_validator_1.body)('nombre').isLength({ min: 2, max: 100 }).withMessage('Nombre entre 2 y 100 caracteres'),
    (0, express_validator_1.body)('apellido_paterno').isLength({ min: 2, max: 100 }).withMessage('Apellido paterno entre 2 y 100 caracteres')
];
router.post('/public-register', registerLimiter, publicRegisterValidation, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, error: 'Datos de entrada inválidos', details: errors.array() });
            return;
        }
        const { email, password, nombre, apellido_paterno, apellido_materno = '' } = req.body;
        debug_logger_1.debugLog.log('AUTH', `[PUBLIC-REGISTER] Intento de registro para email=${(0, sanitized_errors_1.maskEmail)(email)}`);
        const existingUser = await user_dao_1.default.checkEmailExists(email);
        if (existingUser) {
            if (existingUser.email_verified) {
                res.status(409).json({ success: false, error: 'Email ya registrado', message: 'Este email ya está registrado. Intenta iniciar sesión o recuperar tu contraseña.' });
                return;
            }
            else {
                debug_logger_1.debugLog.log('AUTH', `[PUBLIC-REGISTER] Reenviando verificación para email=${(0, sanitized_errors_1.maskEmail)(email)}`);
            }
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
        let userId;
        if (existingUser) {
            userId = existingUser.id;
            await user_dao_1.default.updateUserRegistration(userId, passwordHash, nombre, apellido_paterno, apellido_materno);
        }
        else {
            userId = await user_dao_1.default.createPendingUser(email, username, passwordHash, nombre, apellido_paterno, apellido_materno);
        }
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user_dao_1.default.deleteVerificationTokens(userId);
        await user_dao_1.default.createVerificationToken(userId, verificationToken, 'registration', expiresAt);
        const baseUrl = process.env.APP_URL || 'https://bge-heroesdelapatria.vercel.app';
        const verificationUrl = `${baseUrl}/verify-email.html?token=${verificationToken}`;
        try {
            await emailService_1.default.sendEmail({
                to: email, subject: 'Verifica tu Email - BGE Héroes de la Patria', template: 'email-verification',
                data: { nombre, verificationUrl, expiresIn: '24 horas', currentYear: new Date().getFullYear() }
            });
            debug_logger_1.debugLog.log('AUTH', `[PUBLIC-REGISTER] Email de verificación enviado a ${(0, sanitized_errors_1.maskEmail)(email)}`);
        }
        catch (emailError) {
            debug_logger_1.debugLog.error('AUTH', `[PUBLIC-REGISTER] Error enviando email: ${emailError.message}`);
        }
        res.status(201).json({ success: true, message: 'Registro exitoso. Revisa tu correo electrónico.', data: { email, requiresVerification: true } });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', `[PUBLIC-REGISTER] Error: ${error.message}`);
        res.status(500).json({ success: false, error: 'Error en el registro', message: 'No se pudo completar el registro.' });
    }
});
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ success: false, error: 'Token requerido', message: 'Debes proporcionar el token de verificación.' });
            return;
        }
        debug_logger_1.debugLog.log('AUTH', `[VERIFY-EMAIL] Verificando token=${(0, sanitized_errors_1.maskToken)(token)}`);
        const verificationData = await user_dao_1.default.getVerificationToken(token);
        if (!verificationData) {
            res.status(400).json({ success: false, error: 'Token inválido', message: 'El enlace de verificación no es válido o ya fue utilizado.' });
            return;
        }
        if (new Date() > new Date(verificationData.expires_at)) {
            res.status(400).json({ success: false, error: 'Token expirado', message: 'El enlace de verificación ha expirado.' });
            return;
        }
        await user_dao_1.default.activateUser(verificationData.user_id);
        await user_dao_1.default.markTokenUsed(token);
        debug_logger_1.debugLog.log('AUTH', `[VERIFY-EMAIL] Email verificado para userId=${verificationData.user_id}`);
        res.json({ success: true, message: '¡Tu email ha sido verificado exitosamente!', data: { email: verificationData.email, verified: true } });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', `[VERIFY-EMAIL] Error: ${error.message}`);
        res.status(500).json({ success: false, error: 'Error en la verificación', message: 'No se pudo verificar el email.' });
    }
});
router.post('/resend-verification', registerLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, error: 'Email requerido' });
            return;
        }
        const user = await user_dao_1.default.getUnverifiedUser(email);
        if (!user) {
            res.json({ success: true, message: 'Si el email existe y no está verificado, recibirás un nuevo enlace.' });
            return;
        }
        if (user.email_verified) {
            res.status(400).json({ success: false, error: 'Email ya verificado', message: 'Este email ya está verificado.' });
            return;
        }
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user_dao_1.default.deleteVerificationTokens(user.id);
        await user_dao_1.default.createVerificationToken(user.id, verificationToken, 'registration', expiresAt);
        const baseUrl = process.env.APP_URL || 'https://bge-heroesdelapatria.vercel.app';
        const verificationUrl = `${baseUrl}/verify-email.html?token=${verificationToken}`;
        await emailService_1.default.sendEmail({
            to: email, subject: 'Verifica tu Email - BGE Héroes de la Patria', template: 'email-verification',
            data: { nombre: user.nombre, verificationUrl, expiresIn: '24 horas', currentYear: new Date().getFullYear() }
        });
        debug_logger_1.debugLog.log('AUTH', `[RESEND-VERIFICATION] Email reenviado a ${(0, sanitized_errors_1.maskEmail)(email)}`);
        res.json({ success: true, message: 'Si el email existe y no está verificado, recibirás un nuevo enlace.' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AUTH', `[RESEND-VERIFICATION] Error: ${error.message}`);
        res.status(500).json({ success: false, error: 'Error interno', message: 'No se pudo procesar la solicitud.' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map