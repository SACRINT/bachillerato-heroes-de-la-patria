/**
 * 📊 REPORTING SERVICE - v2.0.0
 * Refactorizado: 04 Diciembre 2025
 */

const ReportingDAO = require('../data/reporting.dao.js');
const devLogger = require('../utils/devLogger.js');

class ReportingService {
    async generateStudentsReport(filters = {}) {
        try {
            const data = await ReportingDAO.getStudentsReport(filters.status);
            return { success: true, type: 'students', data, count: data.length, generatedAt: new Date().toISOString() };
        } catch (error) { devLogger.error('[REPORTING] Error generando reporte estudiantes:', error); throw error; }
    }

    async generateFinancialReport(dateRange = {}) {
        try {
            const data = await ReportingDAO.getFinancialReport(dateRange.from, dateRange.to);
            const totalIngresos = data.reduce((sum, row) => sum + parseFloat(row.ingresos_totales || 0), 0);
            return { success: true, type: 'financial', data, summary: { totalIngresos: totalIngresos.toFixed(2), periodos: data.length }, generatedAt: new Date().toISOString() };
        } catch (error) { devLogger.error('[REPORTING] Error generando reporte financiero:', error); throw error; }
    }

    async generateApprovalsReport() {
        try {
            const data = await ReportingDAO.getApprovalsReport();
            const total = data.reduce((sum, row) => sum + parseInt(row.pending_count), 0);
            return { success: true, type: 'approvals', data, summary: { totalPending: total, categories: data.length }, generatedAt: new Date().toISOString() };
        } catch (error) { devLogger.error('[REPORTING] Error generando reporte aprobaciones:', error); throw error; }
    }

    async generateAttendanceReport(filters = {}) {
        try {
            const { studentId, dateRange = {} } = filters;
            const data = await ReportingDAO.getAttendanceReport(studentId, dateRange.from, dateRange.to);
            return { success: true, type: 'attendance', data, count: data.length, generatedAt: new Date().toISOString() };
        } catch (error) { devLogger.error('[REPORTING] Error generando reporte asistencia:', error); throw error; }
    }

    async predictTrend(metric) {
        try {
            let data;
            switch (metric) {
                case 'enrollment': data = await ReportingDAO.getEnrollmentTrend(); break;
                case 'attendance': data = await ReportingDAO.getAttendanceTrend(); break;
                case 'grades': data = await ReportingDAO.getGradesTrend(); break;
                default: throw new Error(`Métrica desconocida: ${metric}`);
            }
            if (data.length < 6) return { success: true, metric, trend: 'insufficient_data', data };
            const recent = data.slice(-3).reduce((sum, row) => sum + parseFloat(row.cantidad || row.promedio), 0) / 3;
            const previous = data.slice(-6, -3).reduce((sum, row) => sum + parseFloat(row.cantidad || row.promedio), 0) / 3;
            const change = ((recent - previous) / previous) * 100;
            return { success: true, metric, trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable', changePercent: change.toFixed(2), recent: recent.toFixed(2), previous: previous.toFixed(2), data };
        } catch (error) { devLogger.error('[REPORTING] Error prediciendo tendencia:', error); throw error; }
    }

    async scheduleReport(schedule) {
        const { reportType, frequency, recipients, filters = {} } = schedule;
        const result = await ReportingDAO.scheduleReport(reportType, frequency, recipients, filters);
        if (result) { devLogger.log(`[REPORTING] Reporte programado: ${reportType} cada ${frequency}`); return { success: true, schedule: result }; }
        devLogger.warn('[REPORTING] Tabla scheduled_reports no existe');
        return { success: false, error: 'Scheduled reports table not created yet' };
    }
}

module.exports = new ReportingService();
