/**
 * 🎓 AUTENTICACIÓN DE ESTUDIANTES
 * Sistema de login simple para estudiantes
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

// 📁 Archivo de estudiantes
const STUDENTS_FILE = path.join(__dirname, '../data/students.json');

// 📖 Leer estudiantes
async function readStudents() {
    try {
        const data = await fs.readFile(STUDENTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Estudiantes demo por defecto
        const demoStudents = {
            students: [
                {
                    id: 'EST-2025-001',
                    name: 'Juan Pérez García',
                    email: 'juan.perez@estudiante.com',
                    group: '3-A',
                    password: 'demo123', // En producción debería estar hash
                    phone: '222-123-4567',
                    enrollmentYear: 2023,
                    status: 'active'
                },
                {
                    id: 'EST-2025-002',
                    name: 'María López Martínez',
                    email: 'maria.lopez@estudiante.com',
                    group: '3-B',
                    password: 'demo123',
                    phone: '222-234-5678',
                    enrollmentYear: 2023,
                    status: 'active'
                },
                {
                    id: 'EST-2025-003',
                    name: 'Carlos Hernández Silva',
                    email: 'carlos.hernandez@estudiante.com',
                    group: '2-A',
                    password: 'demo123',
                    phone: '222-345-6789',
                    enrollmentYear: 2024,
                    status: 'active'
                }
            ]
        };
        await fs.writeFile(STUDENTS_FILE, JSON.stringify(demoStudents, null, 2));
        return demoStudents;
    }
}

/**
 * 🔐 POST /api/students-auth/login
 * Login de estudiante
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').trim().notEmpty().withMessage('Contraseña requerida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Leer estudiantes
        const studentsData = await readStudents();

        // Buscar estudiante por email
        const student = studentsData.students.find(s => s.email === email);

        if (!student) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña (en producción usar bcrypt)
        if (student.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar estado activo
        if (student.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Cuenta inactiva. Contacta a administración.'
            });
        }

        // Crear sesión (guardar en session)
        req.session.student = {
            id: student.id,
            name: student.name,
            email: student.email,
            group: student.group,
            loginAt: new Date().toISOString()
        };

        // Log de acceso
        console.log(`✅ [STUDENT LOGIN] ${student.name} (${student.id}) - ${student.email}`);

        // Respuesta exitosa (sin enviar la contraseña)
        res.json({
            success: true,
            message: 'Login exitoso',
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                group: student.group,
                enrollmentYear: student.enrollmentYear
            }
        });

    } catch (error) {
        console.error('❌ Error en login de estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar el login'
        });
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
                console.error('❌ Error cerrando sesión:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al cerrar sesión'
                });
            }
            console.log(`👋 [STUDENT LOGOUT] ${studentName}`);
            res.json({
                success: true,
                message: 'Sesión cerrada exitosamente'
            });
        });
    } else {
        res.json({
            success: true,
            message: 'No había sesión activa'
        });
    }
});

/**
 * 👤 GET /api/students-auth/me
 * Obtener datos del estudiante logueado
 */
router.get('/me', (req, res) => {
    if (!req.session.student) {
        return res.status(401).json({
            success: false,
            message: 'No hay sesión activa',
            isAuthenticated: false
        });
    }

    res.json({
        success: true,
        isAuthenticated: true,
        student: req.session.student
    });
});

/**
 * 🔍 GET /api/students-auth/check
 * Verificar si hay sesión activa
 */
router.get('/check', (req, res) => {
    res.json({
        success: true,
        isAuthenticated: !!req.session.student,
        student: req.session.student || null
    });
});

module.exports = router;