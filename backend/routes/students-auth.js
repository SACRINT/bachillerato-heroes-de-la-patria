/**
 * 🎓 AUTENTICACIÓN DE ESTUDIANTES - Versión PostgreSQL
 * Sistema de login para estudiantes conectado a la base de datos real.
 * ✅ FASE 3 DAL - Refactorizado para usar DAOs
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// ✅ FASE 3: Using DAO layer instead of direct pool access
const UserDAO = require('../data/user.dao');
const StudentDAO = require('../data/student.dao');

/**
 * 🔐 POST /api/students-auth/login
 * Login de estudiante contra la base de datos PostgreSQL.
 */
router.post('/login', [
    body('password').notEmpty().withMessage('Contraseña requerida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const identifier = (req.body.email || req.body.username || req.body.matricula || '').trim();
        const { password } = req.body;

        if (!identifier) {
            return res.status(400).json({ success: false, message: 'Por favor ingresa tu matrícula o correo institucional.' });
        }

        // ✅ FASE 3: Using UserDAO instead of direct pool.query
        let user = await UserDAO.findByUsernameOrEmail(identifier);
        
        // Si no se encuentra en usuarios por matrícula directa, buscar en estudiantes
        let student = null;
        if (user) {
            student = await StudentDAO.getByUserId(user.id);
        } else {
            student = await StudentDAO.getByMatricula(identifier);
            if (student && student.usuario_id) {
                user = await UserDAO.get(student.usuario_id);
            }
        }

        if (!user || user.role !== 'estudiante') {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas o el usuario no es un estudiante.' });
        }

        // Verificar la contraseña hasheada
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        // Verificar que el usuario esté activo
        if (user.status !== 'activo' && user.active === false) {
            return res.status(403).json({ success: false, message: 'Esta cuenta se encuentra inactiva.' });
        }

        if (!student) {
            student = await StudentDAO.getByUserId(user.id);
        }

        const studentData = student || {
            id: user.id,
            usuario_id: user.id,
            matricula: user.username || 'MAT-' + user.id,
            nombre_completo: `${user.nombre || ''} ${user.apellido_paterno || ''}`.trim(),
            grupo: '1-A'
        };

        // Generar JWT Token
        let token = 'session_' + Date.now();
        try {
            const { getJWTUtils } = require('../utils/jwtUtils');
            const jwtUtils = getJWTUtils();
            const tokenPair = jwtUtils.generateTokenPair({
                userId: user.id,
                studentId: studentData.id,
                email: user.email,
                username: user.username,
                role: 'estudiante',
                permissions: ['read_own_profile', 'read_own_grades', 'read_calendar']
            }, false);
            token = tokenPair.accessToken;
        } catch (jwtErr) {
            debugLog.warn('STUDENTS_AUTH', 'JWT utils not available, using session token');
        }

        // Crear la sesión del estudiante
        if (req.session) {
            req.session.student = {
                id: studentData.id,
                usuario_id: user.id,
                matricula: studentData.matricula,
                name: studentData.nombre_completo,
                email: user.email,
                group: studentData.grupo,
                loginAt: new Date().toISOString()
            };
        }

        debugLog.log('STUDENTS_AUTH', `✅ [STUDENT LOGIN] ${studentData.nombre_completo} (${studentData.matricula}) ha iniciado sesión.`);

        res.json({
            success: true,
            message: 'Login exitoso',
            token: token,
            student: {
                id: studentData.id,
                matricula: studentData.matricula,
                name: studentData.nombre_completo,
                email: user.email,
                group: studentData.grupo
            }
        });

    } catch (error) {
        debugLog.error('STUDENTS_AUTH', '❌ Error en login de estudiante:', sanitizeError(error, 'students-auth'));
        res.status(500).json({ success: false, message: 'Error interno al procesar el login.' });
    }
});

/**
 * 🔐 POST /api/students-auth/logout
 * Logout de estudiante
 */
router.post('/logout', (req, res) => {
    if (req.session.student) {
        const studentName = req.session.student.name;
        req.session.destroy((err) => {
            if (err) {
                debugLog.error('STUDENTS_AUTH', '❌ Error cerrando sesión de estudiante:', err);
                return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
            }
            debugLog.log('STUDENTS_AUTH', `👋 [STUDENT LOGOUT] ${studentName}`);
            res.clearCookie('connect.sid'); // Limpiar la cookie de sesión
            res.json({ success: true, message: 'Sesión cerrada exitosamente' });
        });
    } else {
        res.json({ success: true, message: 'No había sesión activa' });
    }
});

/**
 * 🔍 GET /api/students-auth/check
 * Verificar si hay una sesión de estudiante activa. Ahora funciona con la sesión de PostgreSQL.
 */
router.get('/check', (req, res) => {
    if (req.session && req.session.student) {
        res.json({
            success: true,
            isAuthenticated: true,
            student: req.session.student
        });
    } else {
        res.json({
            success: true,
            isAuthenticated: false,
            student: null
        });
    }
});

module.exports = router;
