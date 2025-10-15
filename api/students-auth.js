import { body, validationResult } from 'express-validator';
import fs from 'fs'.promises;
import path from 'path';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { URL } from 'url';

// Archivo de estudiantes (asumiendo que está en la raíz del proyecto o en /data)
const STUDENTS_FILE = path.join(process.cwd(), 'data/students.json');
const JWT_SECRET = process.env.JWT_SECRET;

// ============================================
// HELPERS
// ============================================

async function readStudents() {
    try {
        const data = await fs.readFile(STUDENTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error leyendo students.json:', error);
        // Estudiantes demo por defecto si el archivo no existe
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
        // En un entorno serverless, no podemos escribir el archivo directamente
        // Esto solo funcionaría en desarrollo local si el archivo no existe
        // await fs.writeFile(STUDENTS_FILE, JSON.stringify(demoStudents, null, 2));
        return demoStudents;
    }
}

const authenticateStudentToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.studentAuthToken;

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    try {
        const student = jwt.verify(token, JWT_SECRET);
        req.student = student;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido.' });
    }
};

// ============================================
// HANDLER PRINCIPAL PARA /api/students-auth
// ============================================

export default async function handler(req, res) {
    // Inicializar cookieParser para que req.cookies funcione
    const cookiesMiddleware = cookieParser();
    await new Promise(resolve => cookiesMiddleware(req, res, resolve));

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/students-auth', '');

    try {
        if (!JWT_SECRET) {
            return res.status(500).json({
                success: false,
                error: 'Error de configuración del servidor',
                code: 'CONFIG_ERROR',
                message: 'Variable de entorno JWT_SECRET no configurada.'
            });
        }

        switch (path) {
            case '/login':
                if (req.method === 'POST') {
                    await Promise.all(loginValidation.map(validation => validation.run(req)));
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ success: false, errors: errors.array() });
                    }

                    const { email, password } = req.body;
                    const studentsData = await readStudents();
                    const student = studentsData.students.find(s => s.email === email);

                    if (!student || student.password !== password) {
                        return res.status(401).json({
                            success: false,
                            message: 'Credenciales inválidas'
                        });
                    }

                    if (student.status !== 'active') {
                        return res.status(403).json({
                            success: false,
                            message: 'Cuenta inactiva. Contacta a administración.'
                        });
                    }

                    const payload = {
                        id: student.id,
                        name: student.name,
                        email: student.email,
                        group: student.group,
                        role: 'student'
                    };

                    const token = jwt.sign(
                        payload,
                        JWT_SECRET,
                        { expiresIn: process.env.JWT_STUDENT_EXPIRES_IN || '1h' }
                    );

                    res.setHeader('Set-Cookie', `studentAuthToken=${token}; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Max-Age=${60 * 60}`);

                    return res.status(200).json({
                        success: true,
                        message: 'Login exitoso',
                        token: token,
                        student: {
                            id: student.id,
                            name: student.name,
                            email: student.email,
                            group: student.group,
                            enrollmentYear: student.enrollmentYear
                        }
                    });
                }
                break;

            case '/logout':
                if (req.method === 'POST') {
                    res.setHeader('Set-Cookie', `studentAuthToken=; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Max-Age=0`);
                    return res.status(200).json({
                        success: true,
                        message: 'Sesión cerrada exitosamente'
                    });
                }
                break;

            case '/me':
                if (req.method === 'GET') {
                    let authError = null;
                    await new Promise(resolve => authenticateStudentToken(req, res, () => resolve()));
                    if (!req.student) return; // authenticateStudentToken ya envió la respuesta

                    return res.status(200).json({
                        success: true,
                        isAuthenticated: true,
                        student: req.student
                    });
                }
                break;

            case '/check':
                if (req.method === 'GET') {
                    let isAuthenticated = false;
                    let studentData = null;
                    try {
                        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.studentAuthToken;
                        if (token) {
                            const student = jwt.verify(token, JWT_SECRET);
                            isAuthenticated = true;
                            studentData = student;
                        }
                    } catch (err) {
                        // Token inválido o expirado
                        isAuthenticated = false;
                    }

                    return res.status(200).json({
                        success: true,
                        isAuthenticated: isAuthenticated,
                        student: studentData
                    });
                }
                break;

            default:
                res.status(404).json({ error: 'Endpoint no encontrado', path: url.pathname });
                break;
        }
    } catch (error) {
        console.error('❌ Error en la función students-auth:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
}

// Validaciones para login
const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').trim().notEmpty().withMessage('Contraseña requerida')
];