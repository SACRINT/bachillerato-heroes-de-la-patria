/**
 * 📊 REPORTING DAO - TypeScript
 * Data Access Object para reportes
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface StudentReportRow {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    email: string;
    status: string;
    created_at: Date;
    promedio: number;
}

export interface FinancialReportRow {
    mes: Date;
    total_pagos: number;
    ingresos_totales: number;
    promedio_pago: number;
}

export interface ApprovalReportRow {
    form_type: string;
    pending_count: number;
    oldest: Date;
    newest: Date;
}

export interface AttendanceReportRow {
    estudiante_id: number;
    mes: Date;
    total_dias: number;
    dias_asistidos: number;
    porcentaje_asistencia: number;
}

export interface TrendRow {
    mes: Date; // or 'YYYY-MM' string depending on query
    cantidad?: number;
    promedio?: number;
}

export interface ScheduledReport {
    id: number;
    report_type: string;
    frequency: string;
    recipients: string[];
    filters: any;
    next_run: Date;
    active: boolean;
    created_at: Date;
}

// =====================================================
// REPORTING DAO CLASS
// =====================================================

class ReportingDAO {

    static async getStudentsReport(status?: string): Promise<StudentReportRow[]> {
        let query = `SELECT id, nombre, apellido_paterno, apellido_materno, email, status, created_at, (SELECT AVG(calificacion) FROM calificaciones WHERE estudiante_id = usuarios.id) as promedio FROM usuarios WHERE role = 'estudiante'`;
        const params: any[] = [];
        if (status) { query += ' AND status = $1'; params.push(status); }
        query += ' ORDER BY apellido_paterno, apellido_materno, nombre';
        const result = await pool.query(query, params);
        return result.rows.map((row: any) => ({
            ...row,
            promedio: parseFloat(row.promedio)
        }));
    }

    static async getFinancialReport(from?: Date | string, to?: Date | string): Promise<FinancialReportRow[]> {
        let query = `SELECT DATE_TRUNC('month', fecha_pago) as mes, COUNT(*) as total_pagos, SUM(monto) as ingresos_totales, AVG(monto) as promedio_pago FROM pagos_pendientes WHERE estado = 'pagado'`;
        const params: any[] = []; let idx = 1;
        if (from) { query += ` AND fecha_pago >= $${idx++}`; params.push(from); }
        if (to) { query += ` AND fecha_pago <= $${idx++}`; params.push(to); }
        query += ' GROUP BY mes ORDER BY mes DESC';
        const result = await pool.query(query, params);
        return result.rows.map((row: any) => ({
            mes: row.mes,
            total_pagos: parseInt(row.total_pagos),
            ingresos_totales: parseFloat(row.ingresos_totales),
            promedio_pago: parseFloat(row.promedio_pago)
        }));
    }

    static async getApprovalsReport(): Promise<ApprovalReportRow[]> {
        const result = await pool.query(`SELECT form_type, COUNT(*) as pending_count, MIN(created_at) as oldest, MAX(created_at) as newest FROM pending_approvals WHERE status = 'pending' GROUP BY form_type ORDER BY pending_count DESC`);
        return result.rows.map((row: any) => ({
            form_type: row.form_type,
            pending_count: parseInt(row.pending_count),
            oldest: row.oldest,
            newest: row.newest
        }));
    }

    static async getAttendanceReport(studentId?: number, dateFrom?: Date | string, dateTo?: Date | string): Promise<AttendanceReportRow[]> {
        let query = `SELECT estudiante_id, DATE_TRUNC('month', fecha) as mes, COUNT(*) as total_dias, SUM(CASE WHEN asistio = true THEN 1 ELSE 0 END) as dias_asistidos, ROUND((SUM(CASE WHEN asistio = true THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 2) as porcentaje_asistencia FROM asistencia WHERE 1=1`;
        const params: any[] = []; let idx = 1;
        if (studentId) { query += ` AND estudiante_id = $${idx++}`; params.push(studentId); }
        if (dateFrom) { query += ` AND fecha >= $${idx++}`; params.push(dateFrom); }
        if (dateTo) { query += ` AND fecha <= $${idx++}`; params.push(dateTo); }
        query += ' GROUP BY estudiante_id, mes ORDER BY estudiante_id, mes DESC';
        const result = await pool.query(query, params);
        return result.rows.map((row: any) => ({
            estudiante_id: parseInt(row.estudiante_id),
            mes: row.mes,
            total_dias: parseInt(row.total_dias),
            dias_asistidos: parseInt(row.dias_asistidos),
            porcentaje_asistencia: parseFloat(row.porcentaje_asistencia)
        }));
    }

    static async getEnrollmentTrend(): Promise<TrendRow[]> {
        const result = await pool.query(`SELECT DATE_TRUNC('month', created_at) as mes, COUNT(*) as cantidad FROM usuarios WHERE role = 'estudiante' AND created_at >= NOW() - INTERVAL '12 months' GROUP BY mes ORDER BY mes`);
        return result.rows.map((row: any) => ({
            mes: row.mes,
            cantidad: parseInt(row.cantidad)
        }));
    }

    static async getAttendanceTrend(): Promise<TrendRow[]> {
        const result = await pool.query(`SELECT DATE_TRUNC('month', fecha) as mes, ROUND(AVG(CASE WHEN asistio = true THEN 100 ELSE 0 END), 2) as promedio FROM asistencia WHERE fecha >= NOW() - INTERVAL '12 months' GROUP BY mes ORDER BY mes`);
        return result.rows.map((row: any) => ({
            mes: row.mes,
            promedio: parseFloat(row.promedio)
        }));
    }

    static async getGradesTrend(): Promise<TrendRow[]> {
        const result = await pool.query(`SELECT periodo_academico as mes, ROUND(AVG(calificacion), 2) as promedio FROM calificaciones WHERE periodo_academico >= TO_CHAR(NOW() - INTERVAL '12 months', 'YYYY-MM') GROUP BY periodo_academico ORDER BY periodo_academico`);
        return result.rows.map((row: any) => ({
            mes: row.mes, // string 'YYYY-MM'
            promedio: parseFloat(row.promedio)
        }));
    }

    static async scheduleReport(reportType: string, frequency: string, recipients: string[], filters: any): Promise<ScheduledReport | null> {
        try {
            const validFrequencies: Record<string, string> = {
                daily: '1 day',
                weekly: '1 week',
                monthly: '1 month',
                day: '1 day',
                week: '1 week',
                month: '1 month'
            };
            const intervalStr = validFrequencies[frequency] || '1 week';
            const result = await pool.query(
                `INSERT INTO scheduled_reports (report_type, frequency, recipients, filters, next_run, active, created_at) VALUES ($1, $2, $3, $4, NOW() + ($5::text)::INTERVAL, true, NOW()) RETURNING *`,
                [reportType, frequency, JSON.stringify(recipients), JSON.stringify(filters), intervalStr]
            );
            return result.rows[0];
        } catch { return null; }
    }
}

export default ReportingDAO;
module.exports = ReportingDAO;
