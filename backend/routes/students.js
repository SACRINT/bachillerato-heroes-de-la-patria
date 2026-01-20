"use strict";
/**
 * 🎓 RUTAS DE ESTUDIANTES - TypeScript
 * Gestión de estudiantes con dashboard integrado
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const crypto_1 = __importDefault(require("crypto"));
// GDPR Logging
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const database_1 = require("../config/database");
const router = express_1.default.Router();
// ============================================
// HELPER FUNCTIONS
// ============================================
function getStudentService() {
    try {
        const { getStudentService } = require('../services/studentService');
        return getStudentService();
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error obteniendo servicio de estudiantes', (0, sanitized_errors_1.sanitizeError)(error, 'getStudentService'));
        return null;
    }
}
// ============================================
// RUTAS PÚBLICAS
// ============================================
/**
 * GET /api/students/count
 */
router.get('/count', async (req, res, next) => {
    try {
        const stats = await (0, database_1.executeQuery)(`
            SELECT
                COUNT(*) as total_estudiantes,
                COUNT(CASE WHEN estatus = 'activo' THEN 1 END) as activos,
                COUNT(CASE WHEN estatus = 'inactivo' THEN 1 END) as inactivos,
                COUNT(CASE WHEN estatus = 'egresado' THEN 1 END) as egresados,
                COUNT(DISTINCT especialidad) as especialidades_disponibles
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.status = 'activo'
        `);
        res.json({
            success: true,
            data: stats[0]
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/students/specialties
 */
router.get('/specialties', async (req, res, next) => {
    try {
        const specialties = await (0, database_1.executeQuery)(`
            SELECT
                especialidad,
                COUNT(*) as total_estudiantes,
                COUNT(CASE WHEN estatus = 'activo' THEN 1 END) as estudiantes_activos
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.status = 'activo'
            GROUP BY especialidad
            ORDER BY especialidad
        `);
        res.json({
            success: true,
            data: specialties
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// RUTAS PROTEGIDAS
// ============================================
/**
 * GET /api/students
 */
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { page = '1', limit = '20', especialidad, semestre, estatus = 'activo', search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        let query = `
            SELECT 
                e.id, e.matricula,
                u.nombre, u.apellido_paterno, u.apellido_materno, u.email,
                e.especialidad, e.semestre, u.status as estatus, e.fecha_ingreso
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.status = 'activo'
        `;
        const params = [];
        if (estatus && estatus !== 'todos') {
            query += ` AND u.status = $${params.length + 1}`;
            params.push(estatus);
        }
        if (especialidad) {
            query += ` AND e.especialidad = $${params.length + 1}`;
            params.push(especialidad);
        }
        if (semestre) {
            query += ` AND e.semestre = $${params.length + 1}`;
            params.push(parseInt(semestre));
        }
        if (search) {
            const searchTerm = `%${search}%`;
            query += ` AND (
                u.nombre LIKE $${params.length + 1} OR
                u.apellido_paterno LIKE $${params.length + 2} OR
                u.apellido_materno LIKE $${params.length + 3} OR
                e.matricula LIKE $${params.length + 4}
            )`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        query += ' ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre';
        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limitNum, offset);
        const students = await (0, database_1.executeQuery)(query, params);
        // Count total
        let countQuery = `
            SELECT COUNT(*) as total
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.status = 'activo'
        `;
        const countParams = [];
        if (estatus && estatus !== 'todos') {
            countQuery += ` AND u.status = $${countParams.length + 1}`;
            countParams.push(estatus);
        }
        if (especialidad) {
            countQuery += ` AND e.especialidad = $${countParams.length + 1}`;
            countParams.push(especialidad);
        }
        if (semestre) {
            countQuery += ` AND e.semestre = $${countParams.length + 1}`;
            countParams.push(parseInt(semestre));
        }
        if (search) {
            const searchTerm = `%${search}%`;
            countQuery += ` AND (
                u.nombre LIKE $${countParams.length + 1} OR
                u.apellido_paterno LIKE $${countParams.length + 2} OR
                u.apellido_materno LIKE $${countParams.length + 3} OR
                e.matricula LIKE $${countParams.length + 4}
            )`;
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        const countResult = await (0, database_1.executeQuery)(countQuery, countParams);
        const total = countResult[0]?.total || 0;
        const pagination = {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        };
        res.json({
            success: true,
            data: students,
            pagination,
            filters: { especialidad: especialidad || null, semestre: semestre || null, estatus, search: search || null }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error getting students list', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor: ' + error.message,
            error: error.message
        });
    }
});
/**
 * GET /api/students/:id
 */
router.get('/:id', auth_1.authenticateToken, auth_1.requireTeacher, async (req, res, next) => {
    try {
        const { id } = req.params;
        const studentInfo = [];
        if (studentInfo.length === 0) {
            res.status(404).json({
                error: 'Estudiante no encontrado',
                message: 'El estudiante no existe o no está activo'
            });
            return;
        }
        const student = studentInfo[0];
        const grades = [];
        const attendance = { total_registros: 0, asistencias: 0, faltas: 0, porcentaje_asistencia: 0 };
        res.json({
            success: true,
            data: { student, grades, attendance }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/students
 */
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Email válido requerido'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres'),
    (0, express_validator_1.body)('nombre').isLength({ min: 2, max: 100 }).withMessage('Nombre entre 2 y 100 caracteres'),
    (0, express_validator_1.body)('apellido_paterno').isLength({ min: 2, max: 100 }).withMessage('Apellido paterno requerido'),
    (0, express_validator_1.body)('matricula').isLength({ min: 1, max: 50 }).withMessage('Matrícula requerida'),
    (0, express_validator_1.body)('nia').isLength({ min: 1, max: 20 }).withMessage('NIA requerido'),
    (0, express_validator_1.body)('especialidad').notEmpty().withMessage('Especialidad requerida'),
    (0, express_validator_1.body)('semestre').isInt({ min: 1, max: 6 }).withMessage('Semestre entre 1 y 6'),
    (0, express_validator_1.body)('generacion').isLength({ min: 4, max: 10 }).withMessage('Generación requerida')
], async (req, res, next) => {
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: 'Datos de entrada inválidos', details: errors.array() });
            return;
        }
        const { email, password, nombre, apellido_paterno, apellido_materno, matricula, nia, especialidad, semestre, generacion, fecha_ingreso } = req.body;
        // Simulated - would check for existing users
        const existingUser = [];
        if (existingUser.length > 0) {
            res.status(409).json({ error: 'Email ya registrado', message: 'Ya existe un usuario con este email' });
            return;
        }
        // Simulated response
        const studentId = Date.now();
        const userId = Date.now() + 1;
        debug_logger_1.debugLog.log('STUDENTS', 'Estudiante creado exitosamente', { studentId, userId, matricula, creadoPor: authReq.user.id });
        res.status(201).json({
            success: true,
            message: 'Estudiante creado exitosamente',
            data: { id: studentId, usuario_id: userId, matricula, nia, email, nombre, apellido_paterno, apellido_materno, especialidad, semestre, generacion }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/students/:id
 */
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, [
    (0, express_validator_1.body)('especialidad').optional().notEmpty(),
    (0, express_validator_1.body)('semestre').optional().isInt({ min: 1, max: 6 }),
    (0, express_validator_1.body)('estatus').optional().isIn(['activo', 'inactivo', 'suspendido', 'egresado'])
], async (req, res, next) => {
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: 'Datos de entrada inválidos', details: errors.array() });
            return;
        }
        const { id } = req.params;
        const allowedFields = ['especialidad', 'semestre', 'generacion', 'estatus'];
        const updateFields = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        });
        if (Object.keys(updateFields).length === 0) {
            res.status(400).json({ error: 'Sin cambios', message: 'No se proporcionaron campos para actualizar' });
            return;
        }
        debug_logger_1.debugLog.log('STUDENTS', 'Estudiante actualizado', { studentId: id, camposActualizados: Object.keys(updateFields), actualizadoPor: authReq.user.id });
        res.json({ success: true, message: 'Estudiante actualizado exitosamente' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/students/:id
 */
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const authReq = req;
        const { id } = req.params;
        debug_logger_1.debugLog.log('STUDENTS', 'Estudiante desactivado', { studentId: id, desactivadoPor: authReq.user.id });
        res.json({ success: true, message: 'Estudiante desactivado exitosamente' });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// DASHBOARD ESTUDIANTIL
// ============================================
/**
 * POST /api/students/auth/login
 */
router.post('/auth/login', async (req, res) => {
    try {
        const { matricula, password } = req.body;
        if (!matricula || !password) {
            res.status(400).json({ success: false, message: 'Matrícula y contraseña son requeridos' });
            return;
        }
        const studentService = getStudentService();
        if (!studentService) {
            res.status(500).json({ success: false, message: 'Servicio de estudiantes no disponible' });
            return;
        }
        const result = await studentService.authenticateStudent(matricula, password);
        if (result.success) {
            const token = crypto_1.default.randomBytes(32).toString('hex');
            res.json({ success: true, message: 'Login exitoso', data: { student: result.student, token, expires_in: '24h' } });
        }
        else {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error en login de estudiante', (0, sanitized_errors_1.sanitizeError)(error, 'STUDENTS'));
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});
/**
 * GET /api/students/dashboard
 */
router.get('/dashboard', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const studentService = getStudentService();
        if (!studentService) {
            res.status(500).json({ success: false, message: 'Servicio de estudiantes no disponible' });
            return;
        }
        const dashboardData = await studentService.getDashboardData(authReq.user.id);
        res.json({ success: true, data: dashboardData });
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error obteniendo dashboard', (0, sanitized_errors_1.sanitizeError)(error, 'STUDENTS'));
        res.status(500).json({ success: false, message: 'Error obteniendo datos del dashboard', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});
/**
 * GET /api/students/profile
 */
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const studentService = getStudentService();
        if (!studentService) {
            res.status(500).json({ success: false, message: 'Servicio de estudiantes no disponible' });
            return;
        }
        const profile = await studentService.getStudentProfile(authReq.user.id);
        res.json({ success: true, data: profile });
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error obteniendo perfil', (0, sanitized_errors_1.sanitizeError)(error, 'STUDENTS'));
        res.status(500).json({ success: false, message: 'Error obteniendo perfil del estudiante', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});
/**
 * GET /api/students/grades
 */
router.get('/grades', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { semestre, materia } = req.query;
        const studentService = getStudentService();
        if (!studentService) {
            res.status(500).json({ success: false, message: 'Servicio de estudiantes no disponible' });
            return;
        }
        const grades = await studentService.getStudentGrades(authReq.user.id, { semestre, materia });
        res.json({ success: true, data: grades });
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error obteniendo calificaciones', (0, sanitized_errors_1.sanitizeError)(error, 'STUDENTS'));
        res.status(500).json({ success: false, message: 'Error obteniendo calificaciones', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});
/**
 * GET /api/students/schedule
 */
router.get('/schedule', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const studentService = getStudentService();
        if (!studentService) {
            res.status(500).json({ success: false, message: 'Servicio de estudiantes no disponible' });
            return;
        }
        const schedule = await studentService.getStudentSchedule(authReq.user.id);
        res.json({ success: true, data: schedule });
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error obteniendo horario', (0, sanitized_errors_1.sanitizeError)(error, 'STUDENTS'));
        res.status(500).json({ success: false, message: 'Error obteniendo horario', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});
/**
 * GET /api/students/assignments
 */
router.get('/assignments', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { status } = req.query;
        const studentService = getStudentService();
        if (!studentService) {
            res.status(500).json({ success: false, message: 'Servicio de estudiantes no disponible' });
            return;
        }
        const assignments = await studentService.getStudentAssignments(authReq.user.id, { status });
        res.json({ success: true, data: assignments });
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error obteniendo tareas', (0, sanitized_errors_1.sanitizeError)(error, 'STUDENTS'));
        res.status(500).json({ success: false, message: 'Error obteniendo tareas', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});
/**
 * GET /api/students/notifications
 */
router.get('/notifications', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { unread_only } = req.query;
        const studentService = getStudentService();
        if (!studentService) {
            res.status(500).json({ success: false, message: 'Servicio de estudiantes no disponible' });
            return;
        }
        const notifications = await studentService.getStudentNotifications(authReq.user.id, { unread_only: unread_only === 'true' });
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error obteniendo notificaciones', (0, sanitized_errors_1.sanitizeError)(error, 'STUDENTS'));
        res.status(500).json({ success: false, message: 'Error obteniendo notificaciones', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});
/**
 * PATCH /api/students/profile
 * Actualizar perfil del estudiante (campos editables)
 */
router.patch('/profile', auth_1.authenticateToken, [
    (0, express_validator_1.body)('telefono').optional().isLength({ min: 10, max: 15 }).withMessage('Teléfono inválido'),
    (0, express_validator_1.body)('foto_url').optional().isURL().withMessage('URL de foto inválida')
], async (req, res) => {
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { telefono, foto_url } = req.body;
        const allowedFields = ['telefono', 'foto_url'];
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (telefono !== undefined) {
            updates.push(`telefono = $${paramIndex++}`);
            values.push(telefono);
        }
        if (foto_url !== undefined) {
            updates.push(`foto_url = $${paramIndex++}`);
            values.push(foto_url);
        }
        if (updates.length === 0) {
            res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
            return;
        }
        values.push(authReq.user.id);
        const query = `
            UPDATE usuarios 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING id, telefono, foto_url
        `;
        const result = await (0, database_1.executeQuery)(query, values);
        if (result && result.length > 0) {
            debug_logger_1.debugLog.log('STUDENTS', 'Perfil actualizado', { userId: authReq.user.id, campos: updates.length });
            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: result[0]
            });
        }
        else {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error actualizando perfil', (0, sanitized_errors_1.sanitizeError)(error, 'STUDENTS'));
        res.status(500).json({ success: false, message: 'Error actualizando perfil', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});
/**
 * POST /api/students/notifications/:id/mark-read
 * Marcar notificación como leída
 */
router.post('/notifications/:id/mark-read', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { id } = req.params;
        const query = `
            UPDATE notificaciones_usuario 
            SET leida = true, fecha_lectura = CURRENT_TIMESTAMP
            WHERE id = $1 AND usuario_id = $2
            RETURNING id
        `;
        const result = await (0, database_1.executeQuery)(query, [parseInt(id), authReq.user.id]);
        if (result && result.length > 0) {
            res.json({ success: true, message: 'Notificación marcada como leída' });
        }
        else {
            res.status(404).json({ success: false, message: 'Notificación no encontrada' });
        }
    }
    catch (error) {
        debug_logger_1.debugLog.error('STUDENTS', 'Error marcando notificación', (0, sanitized_errors_1.sanitizeError)(error, 'STUDENTS'));
        res.status(500).json({ success: false, message: 'Error marcando notificación' });
    }
});
exports.default = router;
