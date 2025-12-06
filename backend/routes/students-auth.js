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
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        // ✅ FASE 3: Using UserDAO instead of direct pool.query
        const user = await UserDAO.getByEmail(email);

        if (!user || user.role !== 'estudiante') {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas o el usuario no es un estudiante.' });
        }

        // Verificar la contraseña hasheada
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        // Verificar que el usuario esté activo
        if (user.status !== 'activo') {
            return res.status(403).json({ success: false, message: 'Esta cuenta se encuentra inactiva.' });
        }

        // ✅ FASE 3: Using StudentDAO instead of direct pool.query
        const student = await StudentDAO.getByUserId(user.id);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Datos del estudiante no encontrados.' });
        }

        // Crear la sesión del estudiante
        req.session.student = {
            id: student.id,
            usuario_id: user.id,
            matricula: student.matricula,
            name: student.nombre_completo,
            email: user.email,
            group: student.grupo,
            loginAt: new Date().toISOString()
        };

        debugLog.log('STUDENTS_AUTH', `✅ [STUDENT LOGIN] ${student.nombre_completo} (${student.matricula}) ha iniciado sesión.`);

        res.json({
            success: true,
            message: 'Login exitoso',
            student: {
                id: student.id,
                name: student.nombre_completo,
                email: user.email,
                group: student.grupo
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
