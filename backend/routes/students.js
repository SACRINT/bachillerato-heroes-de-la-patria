/**
 * 🎓 RUTAS DE ESTUDIANTES - Sistema de Dashboard Estudiantil
 * Gestión completa de estudiantes del plantel con dashboard integrado
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/auth');
const { logger } = require('../middleware/logger');
const crypto = require('crypto');
const router = express.Router();

// Obtener servicio de estudiantes
function getStudentService() {
    try {
        const { getStudentService } = require('../services/studentService');
        return getStudentService();
    } catch (error) {
        console.error('❌ Error obteniendo servicio de estudiantes:', error.message);
        return null;
    }
}

// ============================================
// RUTAS PÚBLICAS (información básica)
// ============================================

/**
 * GET /api/students/count
 * Obtener estadísticas básicas de estudiantes
 */
router.get('/count', async (req, res, next) => {
    try {
        const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total_estudiantes,
                COUNT(CASE WHEN estatus = 'activo' THEN 1 END) as activos,
                COUNT(CASE WHEN estatus = 'inactivo' THEN 1 END) as inactivos,
                COUNT(CASE WHEN estatus = 'egresado' THEN 1 END) as egresados,
                COUNT(DISTINCT especialidad) as especialidades_disponibles
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.activo = TRUE
        `);
        
        res.json({
            success: true,
            data: stats[0]
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/students/specialties
 * Obtener lista de especialidades disponibles
 */
router.get('/specialties', async (req, res, next) => {
    try {
        const specialties = await executeQuery(`
            SELECT 
                especialidad,
                COUNT(*) as total_estudiantes,
                COUNT(CASE WHEN estatus = 'activo' THEN 1 END) as estudiantes_activos
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.activo = TRUE
            GROUP BY especialidad
            ORDER BY especialidad
        `);
        
        res.json({
            success: true,
            data: specialties
        });
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// RUTAS PROTEGIDAS (docentes y administradores)
// ============================================

/**
 * GET /api/students
 * Obtener lista de estudiantes (con filtros y paginación)
 */
router.get('/', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            especialidad, 
            semestre, 
            estatus = 'activo',
            search 
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                e.id,
                e.matricula,
                e.nia,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.email,
                e.especialidad,
                e.semestre,
                e.generacion,
                e.estatus,
                e.fecha_ingreso
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.activo = TRUE
        `;
        
        const params = [];
        
        if (estatus && estatus !== 'todos') {
            query += ' AND e.estatus = ?';
            params.push(estatus);
        }
        
        if (especialidad) {
            query += ' AND e.especialidad = ?';
            params.push(especialidad);
        }
        
        if (semestre) {
            query += ' AND e.semestre = ?';
            params.push(parseInt(semestre));
        }
        
        if (search) {
            query += ` AND (
                u.nombre LIKE ? OR 
                u.apellido_paterno LIKE ? OR 
                u.apellido_materno LIKE ? OR 
                e.matricula LIKE ? OR
                e.nia LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        query += ' ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre';
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const students = await executeQuery(query, params);
        
        // Contar total para paginación
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.activo = TRUE
        `;
        
        const countParams = [];
        let paramIndex = 0;
        
        if (estatus && estatus !== 'todos') {
            countQuery += ' AND e.estatus = ?';
            countParams.push(params[paramIndex++]);
        }
        
        if (especialidad) {
            countQuery += ' AND e.especialidad = ?';
            countParams.push(params[paramIndex++]);
        }
        
        if (semestre) {
            countQuery += ' AND e.semestre = ?';
            countParams.push(params[paramIndex++]);
        }
        
        if (search) {
            countQuery += ` AND (
                u.nombre LIKE ? OR 
                u.apellido_paterno LIKE ? OR 
                u.apellido_materno LIKE ? OR 
                e.matricula LIKE ? OR
                e.nia LIKE ?
            )`;
            for (let i = 0; i < 5; i++) {
                countParams.push(params[paramIndex++]);
            }
        }
        
        const countResult = await executeQuery(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: students,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            },
            filters: {
                especialidad: especialidad || null,
                semestre: semestre || null,
                estatus: estatus,
                search: search || null
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/students/:id
 * Obtener información detallada de un estudiante
 */
router.get('/:id', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Información básica del estudiante
        const studentInfo = await executeQuery(`
            SELECT 
                e.*,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.email,
                u.fecha_creacion,
                u.ultimo_acceso
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE e.id = ? AND u.activo = TRUE
        `, [id]);
        
        if (studentInfo.length === 0) {
            return res.status(404).json({
                error: 'Estudiante no encontrado',
                message: 'El estudiante no existe o no está activo'
            });
        }
        
        const student = studentInfo[0];
        
        // Obtener calificaciones recientes
        const grades = await executeQuery(`
            SELECT 
                c.nombre as materia,
                c.creditos,
                c.tipo,
                cal.calificacion_final,
                cal.periodo,
                cal.fecha_evaluacion
            FROM calificaciones cal
            JOIN materias m ON cal.materia_id = m.id
            JOIN cursos c ON m.curso_id = c.id
            WHERE cal.estudiante_id = ?
            ORDER BY cal.fecha_evaluacion DESC
            LIMIT 10
        `, [id]);
        
        // Obtener asistencias del mes actual
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const attendance = await executeQuery(`
            SELECT 
                COUNT(*) as total_registros,
                SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END) as asistencias,
                SUM(CASE WHEN presente = FALSE THEN 1 ELSE 0 END) as faltas,
                ROUND((SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as porcentaje_asistencia
            FROM asistencias
            WHERE estudiante_id = ? 
            AND MONTH(fecha) = ? 
            AND YEAR(fecha) = ?
        `, [id, currentMonth, currentYear]);
        
        res.json({
            success: true,
            data: {
                student: student,
                grades: grades,
                attendance: attendance[0] || {
                    total_registros: 0,
                    asistencias: 0,
                    faltas: 0,
                    porcentaje_asistencia: 0
                }
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/students
 * Crear nuevo estudiante (solo administradores)
 */
router.post('/', authenticateToken, requireAdmin, [
    body('email').isEmail().normalizeEmail().withMessage('Email válido requerido'),
    body('password').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres'),
    body('nombre').isLength({ min: 2, max: 100 }).withMessage('Nombre entre 2 y 100 caracteres'),
    body('apellido_paterno').isLength({ min: 2, max: 100 }).withMessage('Apellido paterno requerido'),
    body('matricula').isLength({ min: 1, max: 50 }).withMessage('Matrícula requerida'),
    body('nia').isLength({ min: 1, max: 20 }).withMessage('NIA requerido'),
    body('especialidad').notEmpty().withMessage('Especialidad requerida'),
    body('semestre').isInt({ min: 1, max: 6 }).withMessage('Semestre entre 1 y 6'),
    body('generacion').isLength({ min: 4, max: 10 }).withMessage('Generación requerida')
], async (req, res, next) => {
    try {
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
            matricula,
            nia,
            especialidad,
            semestre,
            generacion,
            fecha_ingreso
        } = req.body;
        
        // Verificar que email no exista
        const existingUser = await executeQuery(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            return res.status(409).json({
                error: 'Email ya registrado',
                message: 'Ya existe un usuario con este email'
            });
        }
        
        // Verificar que matrícula no exista
        const existingStudent = await executeQuery(
            'SELECT id FROM estudiantes WHERE matricula = ? OR nia = ?',
            [matricula, nia]
        );
        
        if (existingStudent.length > 0) {
            return res.status(409).json({
                error: 'Datos duplicados',
                message: 'La matrícula o NIA ya están registrados'
            });
        }
        
        // Crear usuario
        const bcrypt = require('bcryptjs');
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const userResult = await executeQuery(
            `INSERT INTO usuarios (email, password_hash, nombre, apellido_paterno, apellido_materno, tipo_usuario) 
             VALUES (?, ?, ?, ?, ?, 'estudiante')`,
            [email, passwordHash, nombre, apellido_paterno, apellido_materno || null]
        );
        
        const userId = userResult.insertId;
        
        // Crear registro de estudiante
        const studentResult = await executeQuery(
            `INSERT INTO estudiantes (usuario_id, matricula, nia, especialidad, semestre, generacion, fecha_ingreso) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, matricula, nia, especialidad, semestre, generacion, fecha_ingreso || new Date()]
        );
        
        const studentId = studentResult.insertId;
        
        await logger.info('Estudiante creado exitosamente', {
            studentId: studentId,
            userId: userId,
            matricula: matricula,
            creadoPor: req.user.id
        });
        
        res.status(201).json({
            success: true,
            message: 'Estudiante creado exitosamente',
            data: {
                id: studentId,
                usuario_id: userId,
                matricula: matricula,
                nia: nia,
                email: email,
                nombre: nombre,
                apellido_paterno: apellido_paterno,
                apellido_materno: apellido_materno,
                especialidad: especialidad,
                semestre: semestre,
                generacion: generacion
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/students/:id
 * Actualizar información de estudiante
 */
router.put('/:id', authenticateToken, requireAdmin, [
    body('especialidad').optional().notEmpty(),
    body('semestre').optional().isInt({ min: 1, max: 6 }),
    body('estatus').optional().isIn(['activo', 'inactivo', 'suspendido', 'egresado'])
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }
        
        const { id } = req.params;
        const updateFields = {};
        const updateValues = [];
        
        const allowedFields = ['especialidad', 'semestre', 'generacion', 'estatus'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields[field] = '?';
                updateValues.push(req.body[field]);
            }
        });
        
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                error: 'Sin cambios',
                message: 'No se proporcionaron campos para actualizar'
            });
        }
        
        updateValues.push(id);
        
        const setClause = Object.keys(updateFields)
            .map(field => `${field} = ${updateFields[field]}`)
            .join(', ');
        
        const result = await executeQuery(
            `UPDATE estudiantes SET ${setClause} WHERE id = ?`,
            updateValues
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Estudiante no encontrado',
                message: 'El estudiante no existe'
            });
        }
        
        await logger.info('Estudiante actualizado', {
            studentId: id,
            camposActualizados: Object.keys(updateFields),
            actualizadoPor: req.user.id
        });
        
        res.json({
            success: true,
            message: 'Estudiante actualizado exitosamente'
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/students/:id
 * Desactivar estudiante (soft delete)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Desactivar usuario asociado
        const result = await executeQuery(`
            UPDATE usuarios u
            JOIN estudiantes e ON u.id = e.usuario_id
            SET u.activo = FALSE
            WHERE e.id = ?
        `, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Estudiante no encontrado',
                message: 'El estudiante no existe'
            });
        }
        
        await logger.info('Estudiante desactivado', {
            studentId: id,
            desactivadoPor: req.user.id
        });
        
        res.json({
            success: true,
            message: 'Estudiante desactivado exitosamente'
        });
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// RUTAS DEL DASHBOARD ESTUDIANTIL
// ============================================

/**
 * POST /api/students/auth/login
 * Autenticación de estudiante para dashboard
 */
router.post('/auth/login', async (req, res, next) => {
    try {
        const { matricula, password } = req.body;

        if (!matricula || !password) {
            return res.status(400).json({
                success: false,
                message: 'Matrícula y contraseña son requeridos'
            });
        }

        const studentService = getStudentService();
        if (!studentService) {
            return res.status(500).json({
                success: false,
                message: 'Servicio de estudiantes no disponible'
            });
        }

        const result = await studentService.authenticateStudent(matricula, password);

        if (result.success) {
            // Generar token JWT (simplificado para demo)
            const token = crypto.randomBytes(32).toString('hex');

            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    student: result.student,
                    token: token,
                    expires_in: '24h'
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
    } catch (error) {
        console.error('❌ Error en login de estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/students/dashboard
 * Obtener datos del dashboard estudiantil
 */
router.get('/dashboard', authenticateToken, async (req, res, next) => {
    try {
        const studentService = getStudentService();
        if (!studentService) {
            return res.status(500).json({
                success: false,
                message: 'Servicio de estudiantes no disponible'
            });
        }

        const dashboardData = await studentService.getDashboardData(req.user.id);

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('❌ Error obteniendo dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo datos del dashboard',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/students/profile
 * Obtener perfil del estudiante
 */
router.get('/profile', authenticateToken, async (req, res, next) => {
    try {
        const studentService = getStudentService();
        if (!studentService) {
            return res.status(500).json({
                success: false,
                message: 'Servicio de estudiantes no disponible'
            });
        }

        const profile = await studentService.getStudentProfile(req.user.id);

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo perfil del estudiante',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/students/grades
 * Obtener calificaciones del estudiante
 */
router.get('/grades', authenticateToken, async (req, res, next) => {
    try {
        const { semestre, materia } = req.query;

        const studentService = getStudentService();
        if (!studentService) {
            return res.status(500).json({
                success: false,
                message: 'Servicio de estudiantes no disponible'
            });
        }

        const grades = await studentService.getStudentGrades(req.user.id, { semestre, materia });

        res.json({
            success: true,
            data: grades
        });
    } catch (error) {
        console.error('❌ Error obteniendo calificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo calificaciones',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/students/schedule
 * Obtener horario del estudiante
 */
router.get('/schedule', authenticateToken, async (req, res, next) => {
    try {
        const studentService = getStudentService();
        if (!studentService) {
            return res.status(500).json({
                success: false,
                message: 'Servicio de estudiantes no disponible'
            });
        }

        const schedule = await studentService.getStudentSchedule(req.user.id);

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error('❌ Error obteniendo horario:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo horario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/students/assignments
 * Obtener tareas del estudiante
 */
router.get('/assignments', authenticateToken, async (req, res, next) => {
    try {
        const { status } = req.query;

        const studentService = getStudentService();
        if (!studentService) {
            return res.status(500).json({
                success: false,
                message: 'Servicio de estudiantes no disponible'
            });
        }

        const assignments = await studentService.getStudentAssignments(req.user.id, { status });

        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        console.error('❌ Error obteniendo tareas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo tareas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/students/notifications
 * Obtener notificaciones del estudiante
 */
router.get('/notifications', authenticateToken, async (req, res, next) => {
    try {
        const { unread_only } = req.query;

        const studentService = getStudentService();
        if (!studentService) {
            return res.status(500).json({
                success: false,
                message: 'Servicio de estudiantes no disponible'
            });
        }

        const notifications = await studentService.getStudentNotifications(req.user.id, {
            unread_only: unread_only === 'true'
        });

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('❌ Error obteniendo notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo notificaciones',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;