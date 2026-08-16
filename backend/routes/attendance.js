"use strict";
/**
 * 📊 RUTAS DE ASISTENCIA (ATTENDANCE) - TypeScript
 * Sistema de gestión de asistencia escolar
 * Migrado: 19 Enero 2026
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// ✅ TypeScript compatible imports
const { authenticateToken, requireRole } = require('../middleware/auth.js');
const AttendanceService = require('../services/attendance.service.js');
const debugLog = require('../utils/debug-logger.js');
const { sanitizeError } = require('../middleware/errorHandler.js');
const router = express_1.default.Router();
// ============================================
// ENDPOINTS DE ASISTENCIA
// ============================================
/**
 * GET /api/attendance
 * Listar asistencias con filtros
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { estudiante_id, materia_id, fecha_inicio, fecha_fin, page = '1', limit = '20' } = req.query;
        const filters = {};
        if (estudiante_id)
            filters.estudiante_id = parseInt(estudiante_id);
        if (materia_id)
            filters.materia_id = parseInt(materia_id);
        if (fecha_inicio)
            filters.fecha_inicio = fecha_inicio;
        if (fecha_fin)
            filters.fecha_fin = fecha_fin;
        filters.page = parseInt(page);
        filters.limit = parseInt(limit);
        const attendances = await AttendanceService.listAttendances(filters);
        res.json({
            success: true,
            data: attendances,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: attendances.length
            }
        });
    }
    catch (error) {
        debugLog.error('ATTENDANCE', 'Error listando asistencias', sanitizeError(error, 'ATTENDANCE'));
        res.json({
            success: true,
            data: [],
            pagination: {
                page: 1,
                limit: 20,
                total: 0
            }
        });
    }
});
/**
 * GET /api/attendance/student/:studentId
 * Obtener asistencias de un estudiante
 */
router.get('/student/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { fecha_inicio, fecha_fin, materia_id } = req.query;
        const filters = {};
        if (fecha_inicio)
            filters.fecha_inicio = fecha_inicio;
        if (fecha_fin)
            filters.fecha_fin = fecha_fin;
        if (materia_id)
            filters.materia_id = parseInt(materia_id);
        const attendances = await AttendanceService.getStudentAttendances(parseInt(studentId), filters);
        res.json({
            success: true,
            data: attendances
        });
    }
    catch (error) {
        debugLog.error('ATTENDANCE', 'Error obteniendo asistencias de estudiante', sanitizeError(error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencias del estudiante'
        });
    }
});
/**
 * GET /api/attendance/class/:classId
 * Obtener asistencia de una clase en una fecha específica
 */
router.get('/class/:classId', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
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
        debugLog.error('ATTENDANCE', 'Error obteniendo asistencia de clase', sanitizeError(error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencia de la clase'
        });
    }
});
/**
 * GET /api/attendance/report/:studentId
 * Generar reporte de asistencia de un estudiante
 */
router.get('/report/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { fecha_inicio, fecha_fin } = req.query;
        // Default: último mes
        const endDate = fecha_fin ? new Date(fecha_fin) : new Date();
        const startDate = fecha_inicio ?
            new Date(fecha_inicio) :
            new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const report = await AttendanceService.generateAttendanceReport(parseInt(studentId), startDate, endDate);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        debugLog.error('ATTENDANCE', 'Error generando reporte de asistencia', sanitizeError(error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de asistencia'
        });
    }
});
/**
 * POST /api/attendance
 * Registrar asistencia individual
 */
router.post('/', authenticateToken, requireRole(['docente', 'admin']), [
    (0, express_validator_1.body)('estudiante_id').isInt({ min: 1 }).withMessage('ID de estudiante requerido'),
    (0, express_validator_1.body)('materia_id').isInt({ min: 1 }).withMessage('ID de materia requerido'),
    (0, express_validator_1.body)('fecha').isISO8601().withMessage('Fecha válida requerida'),
    (0, express_validator_1.body)('presente').isBoolean().withMessage('Estado de asistencia requerido')
], async (req, res) => {
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { estudiante_id, materia_id, fecha, presente, justificada, motivo, comentarios } = req.body;
        const attendance = await AttendanceService.markAttendance({
            estudiante_id,
            materia_id,
            fecha,
            presente,
            justificada: justificada || false,
            motivo: motivo || null,
            comentarios: comentarios || null,
            registrado_por: authReq.user.id
        });
        res.status(201).json({
            success: true,
            message: 'Asistencia registrada exitosamente',
            data: attendance
        });
    }
    catch (error) {
        debugLog.error('ATTENDANCE', 'Error registrando asistencia', sanitizeError(error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al registrar asistencia'
        });
    }
});
/**
 * POST /api/attendance/bulk
 * Registrar asistencia masiva (lista de clase)
 */
router.post('/bulk', authenticateToken, requireRole(['docente', 'admin']), [
    (0, express_validator_1.body)('attendances').isArray({ min: 1 }).withMessage('Lista de asistencias requerida'),
    (0, express_validator_1.body)('attendances.*.estudiante_id').isInt({ min: 1 }),
    (0, express_validator_1.body)('attendances.*.materia_id').isInt({ min: 1 }),
    (0, express_validator_1.body)('attendances.*.presente').isBoolean()
], async (req, res) => {
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { attendances } = req.body;
        const result = await AttendanceService.markBulkAttendance(attendances, authReq.user.id);
        res.status(201).json({
            success: true,
            message: `${result.stats.total} asistencias registradas`,
            data: result
        });
    }
    catch (error) {
        debugLog.error('ATTENDANCE', 'Error registrando asistencias masivas', sanitizeError(error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al registrar asistencias'
        });
    }
});
/**
 * PUT /api/attendance/:id
 * Actualizar registro de asistencia
 */
router.put('/:id', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const authReq = req;
        const { id } = req.params;
        const { presente, justificada, motivo, comentarios } = req.body;
        const attendance = await AttendanceService.updateAttendance(parseInt(id), { presente, justificada, motivo, comentarios }, authReq.user.id);
        res.json({
            success: true,
            message: 'Asistencia actualizada',
            data: attendance
        });
    }
    catch (error) {
        debugLog.error('ATTENDANCE', 'Error actualizando asistencia', sanitizeError(error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al actualizar asistencia'
        });
    }
});
/**
 * POST /api/attendance/:id/justify
 * Justificar una falta
 */
router.post('/:id/justify', authenticateToken, requireRole(['docente', 'admin', 'padre']), [
    (0, express_validator_1.body)('motivo').notEmpty().withMessage('Motivo de justificación requerido')
], async (req, res) => {
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { id } = req.params;
        const { motivo } = req.body;
        const attendance = await AttendanceService.justifyAbsence(parseInt(id), motivo, authReq.user.id);
        res.json({
            success: true,
            message: 'Falta justificada exitosamente',
            data: attendance
        });
    }
    catch (error) {
        debugLog.error('ATTENDANCE', 'Error justificando falta', sanitizeError(error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al justificar falta'
        });
    }
});
/**
 * GET /api/attendance/pattern/:studentId
 * Verificar patrón de ausentismo
 */
router.get('/pattern/:studentId', authenticateToken, requireRole(['docente', 'admin', 'orientador']), async (req, res) => {
    try {
        const { studentId } = req.params;
        const pattern = await AttendanceService.checkAbsenteeismPattern(parseInt(studentId));
        res.json({
            success: true,
            data: pattern
        });
    }
    catch (error) {
        debugLog.error('ATTENDANCE', 'Error verificando patrón de ausentismo', sanitizeError(error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al verificar patrón de ausentismo'
        });
    }
});
/**
 * DELETE /api/attendance/:id
 * Eliminar registro de asistencia
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const authReq = req;
        const { id } = req.params;
        await AttendanceService.deleteAttendance(parseInt(id), authReq.user.id);
        res.json({
            success: true,
            message: 'Registro de asistencia eliminado'
        });
    }
    catch (error) {
        debugLog.error('ATTENDANCE', 'Error eliminando asistencia', sanitizeError(error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al eliminar registro de asistencia'
        });
    }
});
/**
 * GET /api/attendance/today
 * Obtener asistencia del día actual (para dashboard)
 */
router.get('/today', authenticateToken, requireRole(['docente', 'admin']), async (req, res) => {
    try {
        const authReq = req;
        const today = new Date().toISOString().split('T')[0];
        const filters = {
            fecha_inicio: today,
            fecha_fin: today,
            docente_id: authReq.user.role === 'docente' ? authReq.user.id : undefined
        };
        const attendances = await AttendanceService.listAttendances(filters);
        // Calculate stats
        const total = attendances.length;
        const present = attendances.filter((a) => a.presente).length;
        const absent = total - present;
        const rate = total > 0 ? (present / total * 100).toFixed(1) : '0';
        res.json({
            success: true,
            data: {
                date: today,
                attendances,
                stats: {
                    total,
                    present,
                    absent,
                    attendanceRate: rate
                }
            }
        });
    }
    catch (error) {
        debugLog.error('ATTENDANCE', 'Error obteniendo asistencia del día', sanitizeError(error, 'ATTENDANCE'));
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencia del día'
        });
    }
});
exports.default = router;
