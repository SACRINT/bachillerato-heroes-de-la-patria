/**
 * 📊 ATTENDANCE SERVICE - TypeScript
 * Servicio de gestión de asistencias escolares
 *
 * Patrón Service Layer - Lógica de negocio independiente
 * Migración TypeScript: 07 Diciembre 2025
 */
import { AttendanceRow, AttendanceFilters, AttendanceRate, BulkAttendanceRecord } from '../data/attendance.dao';
export declare class ServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export interface AttendanceCreateData {
    estudiante_id: number;
    materia_id: number;
    fecha: Date | string;
    presente: boolean;
    justificada?: boolean;
    motivo?: string;
    comentarios?: string;
    registrado_por: number;
}
export interface BulkAttendanceResult {
    attendances: AttendanceRow[];
    stats: {
        total: number;
        present: number;
        absent: number;
    };
}
export interface AttendanceReportResult {
    studentId: number;
    period: {
        start: Date | string;
        end: Date | string;
    };
    stats: AttendanceRate;
    records: AttendanceRow[];
    hasIssues: boolean;
}
export interface ClassAttendanceResult {
    attendances: AttendanceRow[];
    stats: {
        total: number;
        present: number;
        absent: number;
        attendanceRate: string | number;
    };
    classId: number;
    date: Date | string;
}
declare class AttendanceService {
    /**
     * Marcar asistencia individual
     */
    markAttendance(data: AttendanceCreateData): Promise<AttendanceRow>;
    /**
     * Marcar asistencia masiva (lista de clase)
     */
    markBulkAttendance(attendanceRecords: BulkAttendanceRecord[], registeredBy: number): Promise<BulkAttendanceResult>;
    /**
     * Actualizar asistencia
     */
    updateAttendance(id: number, data: any, updatedBy: number): Promise<AttendanceRow>;
    /**
     * Eliminar asistencia
     */
    deleteAttendance(id: number, deletedBy: number): Promise<boolean>;
    /**
     * Obtener registro de asistencia
     */
    getAttendance(id: number): Promise<AttendanceRow>;
    /**
     * Listar asistencias con filtros
     */
    listAttendances(filters?: AttendanceFilters): Promise<AttendanceRow[]>;
    /**
     * Obtener asistencias de un estudiante
     */
    getStudentAttendances(studentId: number, filters?: AttendanceFilters): Promise<AttendanceRow[]>;
    /**
     * Generar reporte de asistencia
     */
    generateAttendanceReport(studentId: number, startDate: Date | string, endDate: Date | string): Promise<AttendanceReportResult>;
    /**
     * Obtener asistencia de una clase
     */
    getClassAttendance(classId: number, date: Date | string): Promise<ClassAttendanceResult>;
    /**
     * Verificar patrón de ausentismo
     */
    checkAbsenteeismPattern(studentId: number): Promise<{
        hasPattern: boolean;
        patterns: any[];
    }>;
    /**
     * Justificar falta
     */
    justifyAbsence(attendanceId: number, motivo: string, justifiedBy: number): Promise<AttendanceRow>;
    private _validateAttendanceData;
}
declare const _default: AttendanceService;
export default _default;
//# sourceMappingURL=attendance.service.d.ts.map