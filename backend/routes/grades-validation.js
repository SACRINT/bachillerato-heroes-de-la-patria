"use strict";
/**
 * Grades Validation Routes
 * API para validación y aprobación de calificaciones
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const grades_validation_service_1 = __importDefault(require("../services/grades-validation.service"));
const { authenticateToken, requireRole } = require('../middleware/auth');
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const router = (0, express_1.Router)();
// ============================================
// VALIDACIÓN DE CALIFICACIONES
// ============================================
/**
 * GET /api/grades-validation/pending
 * Obtener calificaciones pendientes de validación
 */
router.get('/pending', authenticateToken, requireRole(['coordinador', 'admin']), async (req, res) => {
    try {
        const authReq = req;
        const pendingGrades = await grades_validation_service_1.default.getPendingValidations(authReq.user.id);
        res.json({
            success: true,
            data: pendingGrades,
            total: pendingGrades.length
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('GRADES-VALIDATION', 'Error obteniendo calificaciones pendientes', (0, sanitized_errors_1.sanitizeError)(error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al obtener calificaciones pendientes' });
    }
});
/**
 * POST /api/grades-validation/validate
 * Validar (aprobar o rechazar) una calificación
 */
router.post('/validate', authenticateToken, requireRole(['coordinador', 'admin']), [
    (0, express_validator_1.body)('calificacion_id').isInt({ min: 1 }),
    (0, express_validator_1.body)('estado').isIn(['aprobado', 'rechazado']),
    (0, express_validator_1.body)('comentarios').optional().isString()
], async (req, res) => {
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { calificacion_id, estado, comentarios } = req.body;
        await grades_validation_service_1.default.validateGrade({
            calificacion_id,
            validador_id: authReq.user.id,
            estado,
            comentarios
        });
        res.json({
            success: true,
            message: `Calificación ${estado === 'aprobado' ? 'aprobada' : 'rechazada'} exitosamente`
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('GRADES-VALIDATION', 'Error validando calificación', (0, sanitized_errors_1.sanitizeError)(error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al validar calificación' });
    }
});
/**
 * POST /api/grades-validation/bulk-validate
 * Validar múltiples calificaciones en lote
 */
router.post('/bulk-validate', authenticateToken, requireRole(['coordinador', 'admin']), async (req, res) => {
    try {
        const authReq = req;
        const { calificaciones, estado, comentarios } = req.body;
        if (!calificaciones || !Array.isArray(calificaciones)) {
            res.status(400).json({ success: false, message: 'Lista de calificaciones requerida' });
            return;
        }
        let validated = 0;
        let errors = 0;
        for (const id of calificaciones) {
            try {
                await grades_validation_service_1.default.validateGrade({
                    calificacion_id: id,
                    validador_id: authReq.user.id,
                    estado,
                    comentarios
                });
                validated++;
            }
            catch (e) {
                errors++;
                debug_logger_1.debugLog.warn('GRADES-VALIDATION', `Error validando calificación ${id}`);
            }
        }
        res.json({
            success: true,
            message: `${validated} calificaciones validadas exitosamente`,
            data: {
                validated,
                errors,
                total: calificaciones.length
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('GRADES-VALIDATION', 'Error en validación masiva', (0, sanitized_errors_1.sanitizeError)(error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error en validación masiva' });
    }
});
/**
 * GET /api/grades-validation/audit/:calificacion_id
 * Obtener historial de auditoría de una calificación
 */
router.get('/audit/:calificacion_id', authenticateToken, requireRole(['docente', 'coordinador', 'admin']), async (req, res) => {
    try {
        const { calificacion_id } = req.params;
        const history = await grades_validation_service_1.default.getAuditHistory(parseInt(calificacion_id));
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('GRADES-VALIDATION', 'Error obteniendo auditoría', (0, sanitized_errors_1.sanitizeError)(error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al obtener historial de auditoría' });
    }
});
// ============================================
// PROMEDIOS Y ESTADÍSTICAS
// ============================================
/**
 * GET /api/grades-validation/average/student/:student_id
 * Calcular promedio de un estudiante
 */
router.get('/average/student/:student_id', authenticateToken, async (req, res) => {
    try {
        const { student_id } = req.params;
        const { periodo } = req.query;
        const promedio = await grades_validation_service_1.default.calculateStudentAverage(parseInt(student_id), periodo);
        res.json({
            success: true,
            data: {
                estudiante_id: parseInt(student_id),
                periodo: periodo || 'general',
                promedio: parseFloat(promedio.toFixed(2))
            }
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('GRADES-VALIDATION', 'Error calculando promedio', (0, sanitized_errors_1.sanitizeError)(error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al calcular promedio' });
    }
});
/**
 * GET /api/grades-validation/report/:periodo
 * Generar reporte de calificaciones por periodo
 */
router.get('/report/:periodo', authenticateToken, requireRole(['coordinador', 'admin']), async (req, res) => {
    try {
        const { periodo } = req.params;
        const { grupo_id } = req.query;
        const report = await grades_validation_service_1.default.generatePeriodReport(periodo, grupo_id ? parseInt(grupo_id) : undefined);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('GRADES-VALIDATION', 'Error generando reporte', (0, sanitized_errors_1.sanitizeError)(error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al generar reporte de calificaciones' });
    }
});
// ============================================
// ALERTAS DE ESTUDIANTES EN RIESGO
// ============================================
/**
 * GET /api/grades-validation/alerts
 * Obtener alertas activas de estudiantes en riesgo
 */
router.get('/alerts', authenticateToken, requireRole(['docente', 'coordinador', 'admin']), async (req, res) => {
    try {
        const { estudiante_id, severidad } = req.query;
        const filters = {};
        if (estudiante_id)
            filters.estudiante_id = parseInt(estudiante_id);
        if (severidad)
            filters.severidad = severidad;
        const alerts = await grades_validation_service_1.default.getActiveAlerts(filters);
        res.json({
            success: true,
            data: alerts,
            total: alerts.length
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('GRADES-VALIDATION', 'Error obteniendo alertas', (0, sanitized_errors_1.sanitizeError)(error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al obtener alertas' });
    }
});
/**
 * POST /api/grades-validation/alerts/check/:student_id
 * Verificar y generar alertas para un estudiante específico
 */
router.post('/alerts/check/:student_id', authenticateToken, requireRole(['coordinador', 'admin']), async (req, res) => {
    try {
        const { student_id } = req.params;
        await grades_validation_service_1.default.checkAndCreateRiskAlerts(parseInt(student_id));
        res.json({
            success: true,
            message: 'Alertas verificadas y actualizadas'
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('GRADES-VALIDATION', 'Error verificando alertas', (0, sanitized_errors_1.sanitizeError)(error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al verificar alertas' });
    }
});
/**
 * POST /api/grades-validation/alerts/dismiss/:alert_id
 * Descartar/cerrar una alerta
 */
router.post('/alerts/dismiss/:alert_id', authenticateToken, requireRole(['coordinador', 'admin']), async (req, res) => {
    try {
        const { alert_id } = req.params;
        const { motivo } = req.body;
        const { executeQuery } = require('../config/database');
        await executeQuery(`
            UPDATE alertas_estudiantes
            SET estado = 'cerrada', motivo_cierre = $1, fecha_cierre = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [motivo || 'Desestimada por coordinador', parseInt(alert_id)]);
        res.json({
            success: true,
            message: 'Alerta cerrada exitosamente'
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('GRADES-VALIDATION', 'Error cerrando alerta', (0, sanitized_errors_1.sanitizeError)(error, 'GRADES-VALIDATION'));
        res.status(500).json({ success: false, message: 'Error al cerrar alerta' });
    }
});
exports.default = router;
