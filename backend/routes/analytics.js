"use strict";
/**
 * 📊 RUTAS DE ANALÍTICAS Y REPORTES
 * Dashboard de métricas institucionales
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const debug_logger_1 = require("../utils/debug-logger");
const router = express_1.default.Router();
// ============================================
// MÉTRICAS GENERALES (Admin y Docentes)
// ============================================
/**
 * GET /api/analytics/dashboard
 * Métricas principales del dashboard
 */
router.get('/dashboard', auth_1.authenticateToken, auth_1.requireTeacher, async (req, res, next) => {
    try {
        // Estadísticas de estudiantes (simuladas)
        const studentStats = {
            total_estudiantes: 450,
            estudiantes_activos: 420,
            egresados: 85,
            suspendidos: 5,
            especialidades_activas: 6
        };
        // Estadísticas de docentes (simuladas)
        const teacherStats = {
            total_docentes: 45,
            docentes_base: 30,
            docentes_contrato: 10,
            docentes_honorarios: 5,
            promedio_experiencia: 8.5
        };
        // Estadísticas académicas actuales (simuladas)
        const academicStats = {
            materias_activas: 48,
            cursos_disponibles: 24,
            inscripciones_totales: 1250,
            promedio_general: 8.3
        };
        // Actividad del chatbot (últimos 30 días) - simulada
        const chatbotStats = {
            total_mensajes: 1250,
            conversaciones_unicas: 380,
            satisfaccion_promedio: 4.2,
            mensajes_semana: 285
        };
        res.json({
            success: true,
            data: {
                students: studentStats,
                teachers: teacherStats,
                academic: academicStats,
                chatbot: chatbotStats
            },
            generated_at: new Date().toISOString()
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/enrollment-trends
 * Tendencias de inscripción por período
 */
router.get('/enrollment-trends', auth_1.authenticateToken, auth_1.requireTeacher, async (req, res, next) => {
    try {
        const { months = '12' } = req.query;
        // Datos simulados
        const trends = [];
        // Resumen por especialidad - simulado
        const specialtyTrends = [];
        res.json({
            success: true,
            data: {
                monthly_trends: trends,
                specialty_summary: specialtyTrends
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/academic-performance
 * Análisis de rendimiento académico
 */
router.get('/academic-performance', auth_1.authenticateToken, auth_1.requireTeacher, async (req, res, next) => {
    try {
        const { periodo, especialidad } = req.query;
        // Datos simulados
        const performance = [];
        const topStudents = [];
        res.json({
            success: true,
            data: {
                course_performance: performance,
                top_students: topStudents
            },
            filters: {
                periodo: periodo || 'último período',
                especialidad: especialidad || 'todas'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/chatbot-metrics
 * Métricas del sistema de chatbot
 */
router.get('/chatbot-metrics', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { days = '30' } = req.query;
        // Métricas generales - simuladas
        const generalMetrics = [{ total_mensajes: 500, conversaciones_totales: 120, satisfaccion_promedio: 4.1, mensajes_hoy: 45, mensajes_semana: 210 }];
        const frequentQueries = [];
        const hourlyActivity = [];
        const userTypeActivity = [];
        const dailyTrend = [];
        res.json({
            success: true,
            data: {
                general: generalMetrics[0],
                frequent_queries: frequentQueries,
                hourly_activity: hourlyActivity,
                user_types: userTypeActivity,
                daily_trend: dailyTrend
            },
            period: `${days} días`
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/attendance-summary
 * Resumen de asistencias
 */
router.get('/attendance-summary', auth_1.authenticateToken, auth_1.requireTeacher, async (req, res, next) => {
    try {
        const { mes, especialidad } = req.query;
        const currentMonth = mes || new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        // Datos simulados
        const attendanceSummary = [];
        const highAbsenteeism = [];
        res.json({
            success: true,
            data: {
                specialty_summary: attendanceSummary,
                high_absenteeism: highAbsenteeism
            },
            period: {
                mes: currentMonth,
                año: currentYear,
                especialidad: especialidad || 'todas'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/system-logs
 * Análisis de logs del sistema (solo admin)
 */
router.get('/system-logs', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { days = '7', nivel } = req.query;
        // Datos simulados
        const logsSummary = [];
        const frequentErrors = [];
        const userActivity = [];
        res.json({
            success: true,
            data: {
                logs_summary: logsSummary,
                frequent_errors: frequentErrors,
                user_activity: userActivity
            },
            period: `${days} días`,
            filters: {
                nivel: nivel || 'todos'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/analytics/custom-report
 * Generar reporte personalizado
 */
router.post('/custom-report', auth_1.authenticateToken, auth_1.requireAdmin, [
    (0, express_validator_1.body)('report_type').isIn(['academic', 'attendance', 'chatbot', 'users']).withMessage('Tipo de reporte inválido'),
    (0, express_validator_1.body)('date_from').isISO8601().withMessage('Fecha inicial inválida'),
    (0, express_validator_1.body)('date_to').isISO8601().withMessage('Fecha final inválida')
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Parámetros inválidos',
                details: errors.array()
            });
            return;
        }
        const { report_type, date_from, date_to, filters = {} } = req.body;
        const authReq = req;
        let reportData = {};
        switch (report_type) {
            case 'academic':
                reportData = await generateAcademicReport(date_from, date_to, filters);
                break;
            case 'attendance':
                reportData = await generateAttendanceReport(date_from, date_to, filters);
                break;
            case 'chatbot':
                reportData = await generateChatbotReport(date_from, date_to, filters);
                break;
            case 'users':
                reportData = await generateUsersReport(date_from, date_to, filters);
                break;
        }
        // Registrar generación del reporte
        debug_logger_1.debugLog.log('ANALYTICS', 'Reporte personalizado generado', {
            tipo: report_type,
            periodo: `${date_from} - ${date_to}`,
            generadoPor: authReq.user.id
        });
        res.json({
            success: true,
            report_type: report_type,
            period: { from: date_from, to: date_to },
            data: reportData,
            generated_at: new Date().toISOString(),
            generated_by: authReq.user.email
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================
// FUNCIONES AUXILIARES PARA REPORTES
// ============================================
async function generateAcademicReport(dateFrom, dateTo, filters) {
    return { message: 'Reporte académico en desarrollo' };
}
async function generateAttendanceReport(dateFrom, dateTo, filters) {
    return { message: 'Reporte de asistencias en desarrollo' };
}
async function generateChatbotReport(dateFrom, dateTo, filters) {
    return { message: 'Reporte de chatbot en desarrollo' };
}
async function generateUsersReport(dateFrom, dateTo, filters) {
    return { message: 'Reporte de usuarios en desarrollo' };
}
exports.default = router;
//# sourceMappingURL=analytics.js.map