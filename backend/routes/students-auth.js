/**
 * 🎓 AUTENTICACIÓN DE ESTUDIANTES - Versión PostgreSQL
 * Sistema de login para estudiantes conectado a la base de datos real.
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

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

        // Buscar al usuario en la tabla de usuarios con el rol de estudiante
        const userQuery = 'SELECT * FROM usuarios WHERE email = $1 AND role = \'estudiante\';
        const userResult = await pool.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas o el usuario no es un estudiante.' });
        }

        const user = userResult.rows[0];

        // Verificar la contraseña hasheada
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        // Verificar que el usuario esté activo
        if (user.status !== 'activo') {
            return res.status(403).json({ success: false, message: 'Esta cuenta se encuentra inactiva.' });
        }

        // Si las credenciales son correctas, buscar los detalles en la tabla de estudiantes
        const studentQuery = 'SELECT * FROM estudiantes WHERE usuario_id = $1';
        const studentResult = await pool.query(studentQuery, [user.id]);

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Datos del estudiante no encontrados.' });
        }

        const student = studentResult.rows[0];

        // Crear la sesión del estudiante
        if (!req.session) {
            console.error('❌ Error: req.session no está disponible. El middleware de sesión no está configurado correctamente.');
            return res.status(500).json({ success: false, message: 'Error interno: Configuración de sesión incorrecta.' });
        }
        req.session.student = {
            id: student.id,
            usuario_id: user.id,
            matricula: student.matricula,
            name: student.nombre_completo,
            email: user.email,
            group: student.grupo,
            loginAt: new Date().toISOString()
        };

        console.log(`✅ [STUDENT LOGIN] ${student.nombre_completo} (${student.matricula}) ha iniciado sesión.`);

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
        console.error('❌ Error en login de estudiante:', error);
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
                console.error('❌ Error cerrando sesión de estudiante:', err);
                return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
            }
            console.log(`👋 [STUDENT LOGOUT] ${studentName}`);
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