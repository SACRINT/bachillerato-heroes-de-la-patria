/**
 * 📊 REPORTING DAO - TypeScript
 * Data Access Object para reportes
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
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
    mes: Date;
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
declare class ReportingDAO {
    static getStudentsReport(status?: string): Promise<StudentReportRow[]>;
    static getFinancialReport(from?: Date | string, to?: Date | string): Promise<FinancialReportRow[]>;
    static getApprovalsReport(): Promise<ApprovalReportRow[]>;
    static getAttendanceReport(studentId?: number, dateFrom?: Date | string, dateTo?: Date | string): Promise<AttendanceReportRow[]>;
    static getEnrollmentTrend(): Promise<TrendRow[]>;
    static getAttendanceTrend(): Promise<TrendRow[]>;
    static getGradesTrend(): Promise<TrendRow[]>;
    static scheduleReport(reportType: string, frequency: string, recipients: string[], filters: any): Promise<ScheduledReport | null>;
}
export default ReportingDAO;
//# sourceMappingURL=reporting.dao.d.ts.map