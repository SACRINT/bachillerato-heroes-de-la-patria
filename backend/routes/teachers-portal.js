"use strict";
/**
 * 👨‍🏫 TEACHERS PORTAL ROUTES - TypeScript
 * Rutas para el Portal de Docentes
 * Creado: 19 Enero 2026
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// ✅ TypeScript compatible imports
const { authenticateToken, requireRole } = require('../middleware/auth.js');
const { executeQuery } = require('../config/database.js');
const GradesService = require('../services/grades.service.js').default;
const AttendanceService = require('../services/attendance.service.js');
const { debugLog } = require('../utils/debug-logger.js');
const { sanitizeError } = require('../utils/sanitized-errors.js');
const router = express_1.default.Router();
// ============================================
// AUTENTICACIÓN DE DOCENTES
// ============================================
/**
 * POST /api/teachers-portal/login
 * Login de docentes
 */
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Email válido requerido'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Contraseña requerida')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { email, password } = req.body;
        // Demo mode for testing
        if (email === 'docente@demo.com' && password === 'demo123') {
            const demoToken = 'demo_teacher_token_' + Date.now();
            res.json({
                success: true,
                token: demoToken,
                teacher: {
                    id: 1,
                    nombre: 'Prof. Juan García',
                    email: 'docente@demo.com',
                    especialidad: 'Matemáticas',
                    numero_empleado: 'DOC-001'
                }
            });
            return;
        }
        // Real authentication
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        // ✅ FIXED SCHEMA: password_hash instead of password, status='activo' instead of activo=true
        // ✅ ALLOW ADMIN: u.role IN ('docente', 'admin')
        const userResult = await executeQuery(`
            SELECT u.*, d.especialidad, d.numero_empleado
            FROM usuarios u
            LEFT JOIN docentes d ON u.id = d.usuario_id
            WHERE u.email = $1 AND u.role IN ('docente', 'admin') AND u.status = 'activo'
        `, [email]);
        if (!userResult || userResult.length === 0) {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            return;
        }
        const user = userResult[0];
        // Compares with password_hash
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            return;
        }
        // ✅ JWT Fix: Add audience, issuer, type='access', userId
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            type: 'access'
        }, process.env.JWT_SECRET || 'bge-secret-key-2025', {
            expiresIn: '8h',
            audience: 'bge-users',
            issuer: 'bge-heroes-patria'
        });
        res.json({
            success: true,
            token,
            teacher: {
                id: user.id,
                nombre: `${user.nombre} ${user.apellido_paterno || ''}`.trim(),
                email: user.email,
                especialidad: user.especialidad,
                numero_empleado: user.numero_empleado
            }
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error en login', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error de autenticación' });
    }
});
// ============================================
// DASHBOARD
// ============================================
/**
 * GET /api/teachers-portal/dashboard
 * Obtener datos del dashboard del docente
 */
router.get('/dashboard', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    var _a, _b, _c, _d, _e;
    try {
        const authReq = req;
        const userId = authReq.user.id;
        // Resolve Docente ID
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [userId]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        // Get teacher info
        const teacherInfo = await executeQuery(`
            SELECT nombre, apellido_paterno, apellido_materno
            FROM usuarios
            WHERE id = $1
        `, [userId]);
        // Get teacher's classes
        const classes = await executeQuery(`
            SELECT 
                m.id, m.nombre as materia, COALESCE(m.grupo, 'A') as grupo, 
                m.semestre as grado, 'Matutino' as turno, '2025-2026' as ciclo_escolar,
                (SELECT COUNT(*) FROM inscripciones_materias WHERE materia_id = m.id AND status = 'activo') as estudiantes
            FROM materias m
            WHERE m.docente_id = $1 AND m.activa = true
            ORDER BY m.semestre, m.nombre
        `, [docenteId]);
        // Get today's schedule (Empty for now as horarios table is missing)
        const schedule = [];
        // Get pending grades count
        const pendingGrades = await executeQuery(`
            SELECT COUNT(*) as count
            FROM inscripciones_materias im
            JOIN materias m ON im.materia_id = m.id
            JOIN estudiantes e ON im.estudiante_id = e.id
            LEFT JOIN calificaciones c ON c.estudiante_id = e.id AND c.materia_id = m.id
            WHERE m.docente_id = $1 AND im.status = 'activo' AND c.id IS NULL
        `, [docenteId]);
        // Get unread messages count
        const unreadMessages = await executeQuery(`
            SELECT total_no_leidos as count
            FROM v_teacher_unread_messages
            WHERE teacher_id = $1
        `, [docenteId]);
        // Get unread notifications count
        const unreadNotifications = await executeQuery(`
            SELECT COUNT(*) as count
            FROM teacher_notifications
            WHERE teacher_id = $1 AND leida = false
        `, [docenteId]);
        // Stats
        const totalStudents = classes.reduce((acc, c) => acc + (parseInt(c.estudiantes) || 0), 0);
        const teacherProfile = teacherInfo[0] || {};
        res.json({
            success: true,
            data: {
                teacher: {
                    nombre: teacherProfile.nombre || 'Docente',
                    apellido_paterno: teacherProfile.apellido_paterno || ''
                },
                stats: {
                    classes: classes.length,
                    students: totalStudents,
                    messages: parseInt((_b = unreadMessages[0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
                    notifications: parseInt((_c = unreadNotifications[0]) === null || _c === void 0 ? void 0 : _c.count) || 0,
                    totalClasses: classes.length,
                    totalStudents,
                    pendingReviews: parseInt((_d = pendingGrades[0]) === null || _d === void 0 ? void 0 : _d.count) || 0,
                    unreadMessages: parseInt((_e = unreadMessages[0]) === null || _e === void 0 ? void 0 : _e.count) || 0
                },
                classes: classes || [],
                upcomingClasses: schedule || [],
                pendingTasks: []
            }
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error obteniendo dashboard', sanitizeError(error, 'TEACHERS-PORTAL'));
        // Fallback demo data
        res.json({
            success: true,
            data: {
                stats: { totalClasses: 4, totalStudents: 120, pendingReviews: 15, unreadMessages: 3 },
                classes: [],
                upcomingClasses: [
                    { hora_inicio: '08:00', hora_fin: '09:00', materia: 'Matemáticas III', grupo: '3A', salon: 'Aula 101' },
                    { hora_inicio: '09:00', hora_fin: '10:00', materia: 'Matemáticas II', grupo: '2B', salon: 'Aula 103' }
                ],
                pendingTasks: []
            }
        });
    }
});
// ============================================
// CLASES
// ============================================
/**
 * GET /api/teachers-portal/classes
 * Obtener clases del docente
 */
router.get('/classes', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const authReq = req;
        const classes = await executeQuery(`
            SELECT 
                m.id, m.nombre as materia, m.descripcion,
                0 as grupo_id, COALESCE(m.grupo, 'A') as grupo, m.semestre as grado, 'Matutino' as turno,
                '2025-2026' as ciclo_escolar, m.aula as salon,
                (SELECT COUNT(*) FROM inscripciones_materias WHERE materia_id = m.id AND status = 'activo') as total_estudiantes
            FROM materias m
            WHERE m.docente_id = $1 AND m.activa = true
            ORDER BY m.semestre, m.nombre
        `, [authReq.user.id]);
        res.json({
            success: true,
            data: classes || []
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error obteniendo clases', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al obtener clases' });
    }
});
/**
 * GET /api/teachers-portal/classes/:id/students
 * Obtener estudiantes de una clase
 */
router.get('/classes/:id/students', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const students = await executeQuery(`
            SELECT 
                e.usuario_id as id, e.nombre, e.apellido_paterno, e.apellido_materno,
                'email@placeholder' as email, e.matricula, e.foto_url
            FROM inscripciones_materias im
            JOIN estudiantes e ON im.estudiante_id = e.id
            WHERE im.materia_id = $1 AND im.status = 'activo'
            ORDER BY e.apellido_paterno, e.apellido_materno, e.nombre
        `, [parseInt(id)]);
        res.json({
            success: true,
            data: students || []
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error obteniendo estudiantes', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al obtener estudiantes' });
    }
});
// ============================================
// CALIFICACIONES
// ============================================
/**
 * GET /api/teachers-portal/grades/:classId
 * Obtener calificaciones de una clase
 */
router.get('/grades/:classId', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { classId } = req.params;
        const { periodo } = req.query;
        const grades = await executeQuery(`
            SELECT 
                e.id as estudiante_id, e.nombre, e.apellido_paterno, e.apellido_materno,
                e.matricula,
                c.id as calificacion_id, c.calificacion, c.periodo, c.observaciones,
                c.fecha_registro
            FROM inscripciones_materias im
            JOIN estudiantes e ON im.estudiante_id = e.id
            LEFT JOIN calificaciones c ON c.estudiante_id = e.id 
                AND c.materia_id = im.materia_id 
                ${periodo ? 'AND c.periodo = $2' : ''}
            WHERE im.materia_id = $1 AND im.status = 'activo'
            ORDER BY e.apellido_paterno, e.apellido_materno, e.nombre
        `, periodo ? [parseInt(classId), periodo] : [parseInt(classId)]);
        res.json({
            success: true,
            data: grades || []
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error obteniendo calificaciones', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al obtener calificaciones' });
    }
});
/**
 * POST /api/teachers-portal/grades
 * Guardar calificación
 */
router.post('/grades', authenticateToken, requireRole(['docente', 'admin']), [
    (0, express_validator_1.body)('estudiante_id').isInt({ min: 1 }),
    (0, express_validator_1.body)('materia_id').isInt({ min: 1 }),
    (0, express_validator_1.body)('calificacion').isFloat({ min: 0, max: 10 }),
    (0, express_validator_1.body)('periodo').notEmpty()
], async (req, res) => {
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { estudiante_id, materia_id, calificacion, periodo, observaciones } = req.body;
        // Check if grade exists, update or insert
        const existing = await executeQuery(`
            SELECT id FROM calificaciones 
            WHERE estudiante_id = $1 AND materia_id = $2 AND periodo = $3
        `, [estudiante_id, materia_id, periodo]);
        let result;
        if (existing && existing.length > 0) {
            // Update
            result = await executeQuery(`
                UPDATE calificaciones 
                SET calificacion = $1, observaciones = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `, [calificacion, observaciones || null, existing[0].id]);
        }
        else {
            // Insert
            result = await executeQuery(`
                INSERT INTO calificaciones (estudiante_id, materia_id, calificacion, periodo, observaciones, registrado_por)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [estudiante_id, materia_id, calificacion, periodo, observaciones || null, authReq.user.id]);
        }
        res.json({
            success: true,
            message: 'Calificación guardada exitosamente',
            data: result === null || result === void 0 ? void 0 : result[0]
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error guardando calificación', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al guardar calificación' });
    }
});
/**
 * POST /api/teachers-portal/grades/bulk
 * Guardar calificaciones masivas
 */
router.post('/grades/bulk', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const authReq = req;
        const { grades } = req.body;
        if (!grades || !Array.isArray(grades)) {
            res.status(400).json({ success: false, message: 'Lista de calificaciones requerida' });
            return;
        }
        let saved = 0;
        for (const grade of grades) {
            try {
                const existing = await executeQuery(`
                    SELECT id FROM calificaciones 
                    WHERE estudiante_id = $1 AND materia_id = $2 AND periodo = $3
                `, [grade.estudiante_id, grade.materia_id, grade.periodo]);
                if (existing && existing.length > 0) {
                    await executeQuery(`
                        UPDATE calificaciones 
                        SET calificacion = $1, observaciones = $2, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $3
                    `, [grade.calificacion, grade.observaciones || null, existing[0].id]);
                }
                else {
                    await executeQuery(`
                        INSERT INTO calificaciones (estudiante_id, materia_id, calificacion, periodo, observaciones, registrado_por)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [grade.estudiante_id, grade.materia_id, grade.calificacion, grade.periodo, grade.observaciones || null, authReq.user.id]);
                }
                saved++;
            }
            catch (e) {
                debugLog.warn('TEACHERS-PORTAL', `Error guardando calificación para estudiante ${grade.estudiante_id}`);
            }
        }
        res.json({
            success: true,
            message: `${saved} calificaciones guardadas exitosamente`,
            data: { saved, total: grades.length }
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error guardando calificaciones masivas', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al guardar calificaciones' });
    }
});
// ============================================
// ASISTENCIA
// ============================================
/**
 * GET /api/teachers-portal/attendance/:classId
 * Obtener asistencia de una clase
 */
router.get('/attendance/:classId', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { classId } = req.params;
        const { fecha } = req.query;
        const date = fecha ? new Date(fecha) : new Date();
        const result = await AttendanceService.getClassAttendance(parseInt(classId), date);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error obteniendo asistencia', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al obtener asistencia' });
    }
});
/**
 * POST /api/teachers-portal/attendance
 * Registrar asistencia
 */
router.post('/attendance', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const authReq = req;
        const { attendances } = req.body;
        if (!attendances || !Array.isArray(attendances)) {
            res.status(400).json({ success: false, message: 'Lista de asistencias requerida' });
            return;
        }
        const result = await AttendanceService.markBulkAttendance(attendances, authReq.user.id);
        res.json({
            success: true,
            message: `${result.stats.total} registros de asistencia guardados`,
            data: result
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error registrando asistencia', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al registrar asistencia' });
    }
});
// ============================================
// RECURSOS
// ============================================
/**
 * GET /api/teachers-portal/resources
 * Obtener recursos educativos
 */
router.get('/resources', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        // Return empty list for now as table structure is being finalized
        res.json({
            success: true,
            data: []
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error obteniendo recursos', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al obtener recursos' });
    }
});
// ============================================
// MENSAJERÍA
// ============================================
/**
 * GET /api/teachers-portal/messages
 * Obtener mensajes del docente
 */
router.get('/messages', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    var _a;
    try {
        const authReq = req;
        const { tipo, page = '1', limit = '20' } = req.query;
        // Resolve Docente ID
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        const messages = await executeQuery(`
            SELECT 
                id, asunto, mensaje as contenido, created_at as fecha_envio, leido,
                recipient_id as remitente_id, 'Usuario' as remitente_nombre, 'user' as remitente_rol
            FROM teacher_messages
            WHERE teacher_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [docenteId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
        res.json({
            success: true,
            data: messages || []
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error obteniendo mensajes', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al obtener mensajes' });
    }
});
/**
 * POST /api/teachers-portal/messages
 * Enviar mensaje
 */
router.post('/messages', authenticateToken, requireRole(['docente', 'admin']), [
    (0, express_validator_1.body)('destinatario_id').isInt({ min: 1 }),
    (0, express_validator_1.body)('asunto').notEmpty(),
    (0, express_validator_1.body)('contenido').notEmpty()
], async (req, res) => {
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { destinatario_id, asunto, contenido } = req.body;
        const result = await executeQuery(`
            INSERT INTO mensajes (remitente_id, destinatario_id, asunto, contenido, fecha_envio)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING *
        `, [authReq.user.id, destinatario_id, asunto, contenido]);
        res.status(201).json({
            success: true,
            message: 'Mensaje enviado exitosamente',
            data: result === null || result === void 0 ? void 0 : result[0]
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error enviando mensaje', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al enviar mensaje' });
    }
});
/**
 * GET /api/teachers-portal/parents/:studentId
 * Obtener padres de un estudiante (para mensajería)
 */
router.get('/parents/:studentId', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { studentId } = req.params;
        const parents = await executeQuery(`
            SELECT 
                u.id, u.nombre, u.apellido_paterno, u.apellido_materno, u.email,
                pe.parentesco
            FROM padres_estudiantes pe
            JOIN usuarios u ON pe.padre_id = u.id
            WHERE pe.estudiante_id = $1
        `, [parseInt(studentId)]);
        res.json({
            success: true,
            data: parents || []
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error obteniendo padres', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al obtener padres del estudiante' });
    }
});
// ============================================
// NOTIFICACIONES
// ============================================
/**
 * GET /api/teachers-portal/notifications
 * Obtener notificaciones del docente
 */
router.get('/notifications', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    var _a;
    try {
        const authReq = req;
        // Resolve Docente ID
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        const notifications = await executeQuery(`
            SELECT 
                id, titulo, mensaje, tipo, prioridad, leida, created_at as fecha_creacion
            FROM teacher_notifications
            WHERE teacher_id = $1
            ORDER BY created_at DESC
            LIMIT 20
        `, [docenteId]);
        res.json({
            success: true,
            data: notifications || []
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error obteniendo notificaciones', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
    }
});
/**
 * POST /api/teachers-portal/notifications/:id/read
 * Marcar notificación como leída
 */
router.post('/notifications/:id/read', authenticateToken, async (req, res) => {
    var _a;
    try {
        const authReq = req;
        const { id } = req.params;
        // Resolve Docente ID
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        await executeQuery(`
            UPDATE teacher_notifications 
            SET leida = true, fecha_lectura = CURRENT_TIMESTAMP
            WHERE id = $1 AND teacher_id = $2
        `, [parseInt(id), docenteId]);
        res.json({
            success: true,
            message: 'Notificación marcada como leída'
        });
    }
    catch (error) {
        debugLog.error('TEACHERS-PORTAL', 'Error marcando notificación', sanitizeError(error, 'TEACHERS-PORTAL'));
        res.status(500).json({ success: false, message: 'Error al marcar notificación' });
    }
});
exports.default = router;
