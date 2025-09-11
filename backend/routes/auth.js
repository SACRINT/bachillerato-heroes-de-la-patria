/**
 * 🔐 RUTAS DE AUTENTICACIÓN
 * Login, registro y gestión de tokens
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const { logger } = require('../middleware/logger');
const router = express.Router();

// ============================================
// VALIDACIONES
// ============================================

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email válido requerido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Contraseña mínimo 6 caracteres')
];

const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email válido requerido'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y número'),
    body('nombre')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nombre entre 2 y 100 caracteres'),
    body('apellido_paterno')
        .isLength({ min: 2, max: 100 })
        .withMessage('Apellido paterno entre 2 y 100 caracteres'),
    body('tipo_usuario')
        .isIn(['estudiante', 'docente', 'administrativo', 'padre_familia'])
        .withMessage('Tipo de usuario inválido')
];

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', loginValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { email, password } = req.body;

        // Buscar usuario
        const users = await executeQuery(
            'SELECT id, email, password_hash, nombre, apellido_paterno, apellido_materno, tipo_usuario, activo FROM usuarios WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            await logger.warning('Intento de login con email inexistente', { email });
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        const user = users[0];

        // Verificar si el usuario está activo
        if (!user.activo) {
            await logger.warning('Intento de login con usuario inactivo', { email, userId: user.id });
            return res.status(401).json({
                error: 'Cuenta inactiva',
                message: 'Tu cuenta está desactivada. Contacta al administrador.'
            });
        }

        // Verificar contraseña
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            await logger.warning('Intento de login con contraseña incorrecta', { email, userId: user.id });
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        // Generar tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        // Actualizar último acceso
        await executeQuery(
            'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Log exitoso
        await logger.info('Login exitoso', { 
            userId: user.id, 
            email: user.email, 
            tipo_usuario: user.tipo_usuario 
        });

        // Respuesta exitosa (sin enviar contraseña)
        const { password_hash, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            message: 'Login exitoso',
            user: userWithoutPassword,
            token: token,
            refreshToken: refreshToken,
            expiresIn: '24h'
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/register
 * Registrar nuevo usuario (solo para administradores)
 */
router.post('/register', authenticateToken, registerValidation, async (req, res, next) => {
    try {
        // Verificar que solo administradores puedan registrar usuarios
        if (!['administrativo', 'directivo'].includes(req.user.tipo_usuario)) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Solo administradores pueden registrar nuevos usuarios'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { 
            email, 
            password, 
            nombre, 
            apellido_paterno, 
            apellido_materno, 
            tipo_usuario 
        } = req.body;

        // Verificar que el email no exista
        const existingUsers = await executeQuery(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                error: 'Email ya registrado',
                message: 'Ya existe un usuario con este email'
            });
        }

        // Hashear contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Crear usuario
        const result = await executeQuery(
            `INSERT INTO usuarios (email, password_hash, nombre, apellido_paterno, apellido_materno, tipo_usuario) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [email, passwordHash, nombre, apellido_paterno, apellido_materno || null, tipo_usuario]
        );

        const newUserId = result.insertId;

        // Log de creación
        await logger.info('Usuario registrado exitosamente', {
            newUserId: newUserId,
            email: email,
            tipo_usuario: tipo_usuario,
            registradoPor: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: newUserId,
                email: email,
                nombre: nombre,
                apellido_paterno: apellido_paterno,
                apellido_materno: apellido_materno,
                tipo_usuario: tipo_usuario,
                activo: true
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/refresh
 * Renovar token de acceso
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                error: 'Refresh token requerido',
                message: 'Debes proporcionar un refresh token'
            });
        }

        // Verificar refresh token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        if (decoded.type !== 'refresh') {
            return res.status(403).json({
                error: 'Token inválido',
                message: 'El token proporcionado no es un refresh token'
            });
        }

        // Buscar usuario
        const users = await executeQuery(
            'SELECT id, email, nombre, apellido_paterno, apellido_materno, tipo_usuario, activo FROM usuarios WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0 || !users[0].activo) {
            return res.status(401).json({
                error: 'Usuario inválido',
                message: 'El usuario no existe o está inactivo'
            });
        }

        const user = users[0];

        // Generar nuevo token
        const newToken = generateToken(user);

        res.json({
            success: true,
            token: newToken,
            expiresIn: '24h'
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({
                error: 'Refresh token inválido',
                message: 'El refresh token ha expirado o es inválido'
            });
        }
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión (invalidar token)
 */
router.post('/logout', authenticateToken, async (req, res, next) => {
    try {
        // Log de logout
        await logger.info('Logout exitoso', {
            userId: req.user.id,
            email: req.user.email
        });

        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', authenticateToken, async (req, res, next) => {
    try {
        // Obtener información completa del usuario
        const users = await executeQuery(
            `SELECT u.id, u.email, u.nombre, u.apellido_paterno, u.apellido_materno, 
                    u.tipo_usuario, u.activo, u.ultimo_acceso, u.fecha_creacion
             FROM usuarios u 
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                message: 'El usuario no existe'
            });
        }

        const user = users[0];

        // Obtener información adicional según el tipo de usuario
        let additionalInfo = {};

        if (user.tipo_usuario === 'estudiante') {
            const estudiantes = await executeQuery(
                'SELECT matricula, nia, especialidad, semestre, generacion, estatus FROM estudiantes WHERE usuario_id = ?',
                [user.id]
            );
            if (estudiantes.length > 0) {
                additionalInfo = estudiantes[0];
            }
        } else if (user.tipo_usuario === 'docente') {
            const docentes = await executeQuery(
                'SELECT numero_empleado, especialidad, anos_experiencia, tipo_contrato FROM docentes WHERE usuario_id = ?',
                [user.id]
            );
            if (docentes.length > 0) {
                additionalInfo = docentes[0];
            }
        }

        res.json({
            success: true,
            user: {
                ...user,
                ...additionalInfo
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/auth/change-password
 * Cambiar contraseña
 */
router.put('/change-password', authenticateToken, [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Nueva contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y número')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Obtener contraseña actual
        const users = await executeQuery(
            'SELECT password_hash FROM usuarios WHERE id = ?',
            [req.user.id]
        );

        const user = users[0];

        // Verificar contraseña actual
        const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!passwordValid) {
            return res.status(400).json({
                error: 'Contraseña incorrecta',
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Hashear nueva contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar contraseña
        await executeQuery(
            'UPDATE usuarios SET password_hash = ? WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        // Log de cambio de contraseña
        await logger.info('Contraseña cambiada exitosamente', {
            userId: req.user.id,
            email: req.user.email
        });

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;