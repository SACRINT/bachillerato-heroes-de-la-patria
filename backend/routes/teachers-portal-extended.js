"use strict";
/**
 * Teacher Portal Extended Routes
 * Rutas adicionales para planeación, tareas, comunicación y reportes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const { authenticateToken, requireRole } = require('../middleware/auth');
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const lesson_planning_service_1 = __importDefault(require("../services/lesson-planning.service"));
const assignment_service_1 = __importDefault(require("../services/assignment.service"));
const mass_communication_service_1 = __importDefault(require("../services/mass-communication.service"));
const automated_reports_service_1 = __importDefault(require("../services/automated-reports.service"));
const router = (0, express_1.Router)();
// ============================================
// PLANEACIÓN DE CLASES
// ============================================
/**
 * POST /api/teachers-portal-ext/lessons/plan
 * Crear nueva planeación de clase
 */
router.post('/lessons/plan', authenticateToken, requireRole(['docente', 'admin']), [
    (0, express_validator_1.body)('materia_id').isInt({ min: 1 }),
    (0, express_validator_1.body)('fecha').isISO8601(),
    (0, express_validator_1.body)('unidad').notEmpty(),
    (0, express_validator_1.body)('tema').notEmpty(),
    (0, express_validator_1.body)('objetivos').isArray({ min: 1 }),
    (0, express_validator_1.body)('contenido').notEmpty()
], async (req, res) => {
    var _a;
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        // Resolve Docente ID
        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        const lessonPlan = await lesson_planning_service_1.default.createLessonPlan({
            ...req.body,
            docente_id: docenteId
        });
        res.status(201).json({
            success: true,
            message: 'Planeación creada exitosamente',
            data: lessonPlan
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error creando planeación', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al crear planeación' });
    }
});
/**
 * GET /api/teachers-portal-ext/lessons/plans
 * Obtener planeaciones del docente
 */
router.get('/lessons/plans', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    var _a;
    try {
        const authReq = req;
        const { materia_id, fecha_inicio, fecha_fin, status } = req.query;
        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        const filters = {};
        if (materia_id)
            filters.materia_id = parseInt(materia_id);
        if (fecha_inicio)
            filters.fecha_inicio = new Date(fecha_inicio);
        if (fecha_fin)
            filters.fecha_fin = new Date(fecha_fin);
        if (status)
            filters.status = status;
        const plans = await lesson_planning_service_1.default.getTeacherLessonPlans(docenteId, filters);
        res.json({
            success: true,
            data: plans
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo planeaciones', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener planeaciones' });
    }
});
/**
 * GET /api/teachers-portal-ext/lessons/weekly
 * Obtener planeaciones de la semana
 */
router.get('/lessons/weekly', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    var _a;
    try {
        const authReq = req;
        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        const plans = await lesson_planning_service_1.default.getWeeklyPlans(docenteId);
        res.json({
            success: true,
            data: plans
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo planeaciones semanales', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener planeaciones de la semana' });
    }
});
/**
 * PUT /api/teachers-portal-ext/lessons/plan/:id
 * Actualizar planeación
 */
router.put('/lessons/plan/:id', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await lesson_planning_service_1.default.updateLessonPlan(parseInt(id), req.body);
        res.json({
            success: true,
            message: 'Planeación actualizada',
            data: updated
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error actualizando planeación', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al actualizar planeación' });
    }
});
/**
 * POST /api/teachers-portal-ext/lessons/duplicate/:id
 * Duplicar planeación
 */
router.post('/lessons/duplicate/:id', authenticateToken, requireRole(['docente', 'admin']), [
    (0, express_validator_1.body)('nueva_fecha').isISO8601()
], async (req, res) => {
    try {
        const { id } = req.params;
        const { nueva_fecha } = req.body;
        const duplicated = await lesson_planning_service_1.default.duplicateLessonPlan(parseInt(id), new Date(nueva_fecha));
        res.json({
            success: true,
            message: 'Planeación duplicada',
            data: duplicated
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error duplicando planeación', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al duplicar planeación' });
    }
});
// ============================================
// ASIGNACIÓN DE TAREAS
// ============================================
/**
 * POST /api/teachers-portal-ext/assignments
 * Crear nueva tarea
 */
router.post('/assignments', authenticateToken, requireRole(['docente', 'admin']), [
    (0, express_validator_1.body)('materia_id').isInt({ min: 1 }),
    (0, express_validator_1.body)('titulo').notEmpty(),
    (0, express_validator_1.body)('descripcion').notEmpty(),
    (0, express_validator_1.body)('tipo').isIn(['tarea', 'proyecto', 'investigacion', 'practica', 'examen']),
    (0, express_validator_1.body)('fecha_entrega').isISO8601(),
    (0, express_validator_1.body)('puntaje_maximo').isFloat({ min: 0 })
], async (req, res) => {
    var _a;
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        const assignment = await assignment_service_1.default.createAssignment({
            ...req.body,
            docente_id: docenteId
        });
        res.status(201).json({
            success: true,
            message: 'Tarea creada exitosamente',
            data: assignment
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error creando tarea', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al crear tarea' });
    }
});
/**
 * GET /api/teachers-portal-ext/assignments
 * Obtener tareas del docente
 */
router.get('/assignments', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    var _a;
    try {
        const authReq = req;
        const { materia_id, tipo, status } = req.query;
        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        const filters = {};
        if (materia_id)
            filters.materia_id = parseInt(materia_id);
        if (tipo)
            filters.tipo = tipo;
        if (status)
            filters.status = status;
        const assignments = await assignment_service_1.default.getTeacherAssignments(docenteId, filters);
        res.json({
            success: true,
            data: assignments
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo tareas', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener tareas' });
    }
});
/**
 * GET /api/teachers-portal-ext/assignments/:id/submissions
 * Obtener entregas de una tarea
 */
router.get('/assignments/:id/submissions', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const submissions = await assignment_service_1.default.getAssignmentSubmissions(parseInt(id));
        res.json({
            success: true,
            data: submissions
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo entregas', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener entregas' });
    }
});
/**
 * POST /api/teachers-portal-ext/assignments/submissions/:id/grade
 * Calificar entrega
 */
router.post('/assignments/submissions/:id/grade', authenticateToken, requireRole(['docente', 'admin']), [
    (0, express_validator_1.body)('calificacion').isFloat({ min: 0 }),
    (0, express_validator_1.body)('retroalimentacion').optional()
], async (req, res) => {
    try {
        const { id } = req.params;
        const { calificacion, retroalimentacion } = req.body;
        const graded = await assignment_service_1.default.gradeSubmission(parseInt(id), calificacion, retroalimentacion);
        res.json({
            success: true,
            message: 'Entrega calificada',
            data: graded
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error calificando entrega', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al calificar entrega' });
    }
});
/**
 * POST /api/teachers-portal-ext/assignments/:id/publish
 * Publicar tarea
 */
router.post('/assignments/:id/publish', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const published = await assignment_service_1.default.publishAssignment(parseInt(id));
        res.json({
            success: true,
            message: 'Tarea publicada',
            data: published
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error publicando tarea', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al publicar tarea' });
    }
});
/**
 * POST /api/teachers-portal-ext/assignments/:id/remind
 * Enviar recordatorio
 */
router.post('/assignments/:id/remind', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const sent = await assignment_service_1.default.sendReminders(parseInt(id));
        res.json({
            success: true,
            message: `${sent} recordatorios enviados`
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error enviando recordatorios', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al enviar recordatorios' });
    }
});
// ============================================
// COMUNICACIÓN MASIVA
// ============================================
/**
 * POST /api/teachers-portal-ext/communication/mass-message
 * Crear mensaje masivo
 */
router.post('/communication/mass-message', authenticateToken, requireRole(['docente', 'admin']), [
    (0, express_validator_1.body)('destinatarios_tipo').isIn(['padres', 'estudiantes', 'ambos', 'grupo_especifico']),
    (0, express_validator_1.body)('asunto').notEmpty(),
    (0, express_validator_1.body)('mensaje').notEmpty(),
    (0, express_validator_1.body)('tipo').isIn(['aviso', 'urgente', 'recordatorio', 'felicitacion', 'citatorio']),
    (0, express_validator_1.body)('canales').isArray({ min: 1 })
], async (req, res) => {
    var _a;
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        const message = await mass_communication_service_1.default.createMassMessage({
            ...req.body,
            docente_id: docenteId
        });
        res.status(201).json({
            success: true,
            message: 'Mensaje masivo creado',
            data: message
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error creando mensaje', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al crear mensaje masivo' });
    }
});
/**
 * POST /api/teachers-portal-ext/communication/:id/send
 * Enviar mensaje masivo
 */
router.post('/communication/:id/send', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await mass_communication_service_1.default.sendMassMessage(parseInt(id));
        res.json({
            success: true,
            message: 'Mensaje enviado',
            data: result
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error enviando mensaje', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al enviar mensaje masivo' });
    }
});
/**
 * GET /api/teachers-portal-ext/communication/messages
 * Obtener mensajes masivos
 */
router.get('/communication/messages', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    var _a;
    try {
        const authReq = req;
        const { materia_id, status } = req.query;
        const { executeQuery } = require('../config/database');
        const docenteRes = await executeQuery('SELECT id FROM docentes WHERE usuario_id = $1', [authReq.user.id]);
        const docenteId = ((_a = docenteRes[0]) === null || _a === void 0 ? void 0 : _a.id) || 0;
        const filters = {};
        if (materia_id)
            filters.materia_id = parseInt(materia_id);
        if (status)
            filters.status = status;
        const messages = await mass_communication_service_1.default.getTeacherMessages(docenteId, filters);
        res.json({
            success: true,
            data: messages
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo mensajes', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener mensajes' });
    }
});
/**
 * GET /api/teachers-portal-ext/communication/:id/stats
 * Obtener estadísticas de entrega
 */
router.get('/communication/:id/stats', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const stats = await mass_communication_service_1.default.getMessageStats(parseInt(id));
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo estadísticas', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
});
// ============================================
// REPORTES AUTOMÁTICOS
// ============================================
/**
 * GET /api/teachers-portal-ext/reports/grades/:materia_id/:periodo
 * Generar reporte de calificaciones
 */
router.get('/reports/grades/:materia_id/:periodo', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const authReq = req;
        const { materia_id, periodo } = req.params;
        const pdf = await automated_reports_service_1.default.generateGradesReport(authReq.user.id, parseInt(materia_id), periodo);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=calificaciones_${materia_id}_${periodo}.pdf`);
        res.send(pdf);
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error generando reporte', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al generar reporte de calificaciones' });
    }
});
/**
 * GET /api/teachers-portal-ext/reports/performance/:materia_id
 * Generar reporte de rendimiento
 */
router.get('/reports/performance/:materia_id', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const authReq = req;
        const { materia_id } = req.params;
        const report = await automated_reports_service_1.default.generatePerformanceReport(authReq.user.id, parseInt(materia_id));
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error generando reporte', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al generar reporte de rendimiento' });
    }
});
/**
 * POST /api/teachers-portal-ext/reports/configure
 * Configurar reporte automático
 */
router.post('/reports/configure', authenticateToken, requireRole(['docente', 'admin']), [
    (0, express_validator_1.body)('tipo_reporte').isIn(['calificaciones', 'asistencia', 'rendimiento', 'completo']),
    (0, express_validator_1.body)('periodo').notEmpty(),
    (0, express_validator_1.body)('frecuencia').isIn(['semanal', 'quincenal', 'mensual']),
    (0, express_validator_1.body)('destinatarios').isArray({ min: 1 }),
    (0, express_validator_1.body)('formato').isIn(['pdf', 'excel', 'ambos'])
], async (req, res) => {
    try {
        const authReq = req;
        const config = await automated_reports_service_1.default.configureAutomaticReport({
            ...req.body,
            docente_id: authReq.user.id
        });
        res.json({
            success: true,
            message: 'Reporte automático configurado',
            data: config
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error configurando reporte', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al configurar reporte automático' });
    }
});
/**
 * GET /api/teachers-portal-ext/reports/configs
 * Obtener configuraciones de reportes
 */
router.get('/reports/configs', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const authReq = req;
        const configs = await automated_reports_service_1.default.getTeacherReportConfigs(authReq.user.id);
        res.json({
            success: true,
            data: configs
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('TEACHERS-PORTAL-EXT', 'Error obteniendo configuraciones', (0, sanitized_errors_1.sanitizeError)(error, 'TEACHERS-PORTAL-EXT'));
        res.status(500).json({ success: false, message: 'Error al obtener configuraciones de reportes' });
    }
});
exports.default = router;
