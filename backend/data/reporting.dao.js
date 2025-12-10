"use strict";
/**
 * 📊 REPORTING DAO - TypeScript
 * Data Access Object para reportes
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// REPORTING DAO CLASS
// =====================================================
class ReportingDAO {
    static async getStudentsReport(status) {
        let query = `SELECT id, nombre, apellido_paterno, apellido_materno, email, status, created_at, (SELECT AVG(calificacion) FROM calificaciones WHERE estudiante_id = usuarios.id) as promedio FROM usuarios WHERE role = 'estudiante'`;
        const params = [];
        if (status) {
            query += ' AND status = $1';
            params.push(status);
        }
        query += ' ORDER BY apellido_paterno, apellido_materno, nombre';
        const result = await database_1.pool.query(query, params);
        return result.rows.map((row) => ({
            ...row,
            promedio: parseFloat(row.promedio)
        }));
    }
    static async getFinancialReport(from, to) {
        let query = `SELECT DATE_TRUNC('month', fecha_pago) as mes, COUNT(*) as total_pagos, SUM(monto) as ingresos_totales, AVG(monto) as promedio_pago FROM pagos_pendientes WHERE estado = 'pagado'`;
        const params = [];
        let idx = 1;
        if (from) {
            query += ` AND fecha_pago >= $${idx++}`;
            params.push(from);
        }
        if (to) {
            query += ` AND fecha_pago <= $${idx++}`;
            params.push(to);
        }
        query += ' GROUP BY mes ORDER BY mes DESC';
        const result = await database_1.pool.query(query, params);
        return result.rows.map((row) => ({
            mes: row.mes,
            total_pagos: parseInt(row.total_pagos),
            ingresos_totales: parseFloat(row.ingresos_totales),
            promedio_pago: parseFloat(row.promedio_pago)
        }));
    }
    static async getApprovalsReport() {
        const result = await database_1.pool.query(`SELECT form_type, COUNT(*) as pending_count, MIN(created_at) as oldest, MAX(created_at) as newest FROM pending_approvals WHERE status = 'pending' GROUP BY form_type ORDER BY pending_count DESC`);
        return result.rows.map((row) => ({
            form_type: row.form_type,
            pending_count: parseInt(row.pending_count),
            oldest: row.oldest,
            newest: row.newest
        }));
    }
    static async getAttendanceReport(studentId, dateFrom, dateTo) {
        let query = `SELECT estudiante_id, DATE_TRUNC('month', fecha) as mes, COUNT(*) as total_dias, SUM(CASE WHEN asistio = true THEN 1 ELSE 0 END) as dias_asistidos, ROUND((SUM(CASE WHEN asistio = true THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 2) as porcentaje_asistencia FROM asistencia WHERE 1=1`;
        const params = [];
        let idx = 1;
        if (studentId) {
            query += ` AND estudiante_id = $${idx++}`;
            params.push(studentId);
        }
        if (dateFrom) {
            query += ` AND fecha >= $${idx++}`;
            params.push(dateFrom);
        }
        if (dateTo) {
            query += ` AND fecha <= $${idx++}`;
            params.push(dateTo);
        }
        query += ' GROUP BY estudiante_id, mes ORDER BY estudiante_id, mes DESC';
        const result = await database_1.pool.query(query, params);
        return result.rows.map((row) => ({
            estudiante_id: parseInt(row.estudiante_id),
            mes: row.mes,
            total_dias: parseInt(row.total_dias),
            dias_asistidos: parseInt(row.dias_asistidos),
            porcentaje_asistencia: parseFloat(row.porcentaje_asistencia)
        }));
    }
    static async getEnrollmentTrend() {
        const result = await database_1.pool.query(`SELECT DATE_TRUNC('month', created_at) as mes, COUNT(*) as cantidad FROM usuarios WHERE role = 'estudiante' AND created_at >= NOW() - INTERVAL '12 months' GROUP BY mes ORDER BY mes`);
        return result.rows.map((row) => ({
            mes: row.mes,
            cantidad: parseInt(row.cantidad)
        }));
    }
    static async getAttendanceTrend() {
        const result = await database_1.pool.query(`SELECT DATE_TRUNC('month', fecha) as mes, ROUND(AVG(CASE WHEN asistio = true THEN 100 ELSE 0 END), 2) as promedio FROM asistencia WHERE fecha >= NOW() - INTERVAL '12 months' GROUP BY mes ORDER BY mes`);
        return result.rows.map((row) => ({
            mes: row.mes,
            promedio: parseFloat(row.promedio)
        }));
    }
    static async getGradesTrend() {
        const result = await database_1.pool.query(`SELECT periodo_academico as mes, ROUND(AVG(calificacion), 2) as promedio FROM calificaciones WHERE periodo_academico >= TO_CHAR(NOW() - INTERVAL '12 months', 'YYYY-MM') GROUP BY periodo_academico ORDER BY periodo_academico`);
        return result.rows.map((row) => ({
            mes: row.mes, // string 'YYYY-MM'
            promedio: parseFloat(row.promedio)
        }));
    }
    static async scheduleReport(reportType, frequency, recipients, filters) {
        try {
            const result = await database_1.pool.query(`INSERT INTO scheduled_reports (report_type, frequency, recipients, filters, next_run, active, created_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 ${frequency}', true, NOW()) RETURNING *`, [reportType, frequency, JSON.stringify(recipients), JSON.stringify(filters)]);
            return result.rows[0];
        }
        catch {
            return null;
        }
    }
}
exports.default = ReportingDAO;
module.exports = ReportingDAO;
//# sourceMappingURL=reporting.dao.js.map