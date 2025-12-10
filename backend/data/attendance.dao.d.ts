/**
 * 📊 ATTENDANCE DAO - TypeScript
 * Gestión de asistencias escolares
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface AttendanceRow {
    id: number;
    estudiante_id: number;
    materia_id: number;
    fecha: Date;
    presente: boolean;
    justificada: boolean;
    motivo?: string;
    comentarios?: string;
    registrado_por: number;
    created_at: Date;
    updated_at?: Date;
    estudiante_nombre?: string;
    estudiante_apellido?: string;
    materia_nombre?: string;
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
export interface AttendanceUpdateData {
    presente?: boolean;
    justificada?: boolean;
    motivo?: string;
    comentarios?: string;
}
export interface AttendanceFilters {
    estudiante_id?: number;
    materia_id?: number;
    fecha_inicio?: Date | string;
    fecha_fin?: Date | string;
    presente?: boolean;
    limit?: number;
}
export interface AttendanceRate {
    total_registros: number;
    asistencias: number;
    faltas: number;
    justificadas: number;
    porcentaje_asistencia: number;
}
export interface BulkAttendanceRecord {
    estudiante_id: number;
    materia_id: number;
    fecha: Date | string;
    presente: boolean;
    registrado_por: number;
}
export interface AbsenteeismPattern {
    fecha: Date;
    presente: boolean;
    ventana_5_dias: number;
    faltas_consecutivas: number;
}
declare class AttendanceDAO {
    static create(data: AttendanceCreateData): Promise<AttendanceRow>;
    static update(id: number, data: AttendanceUpdateData): Promise<AttendanceRow>;
    static delete(id: number): Promise<boolean>;
    static get(id: number): Promise<AttendanceRow | undefined>;
    static list(filters?: AttendanceFilters): Promise<AttendanceRow[]>;
    static getByStudent(studentId: number, filters?: AttendanceFilters): Promise<AttendanceRow[]>;
    static getByClass(classId: number, date: Date | string): Promise<AttendanceRow[]>;
    static getMonthlyReport(studentId: number, year: number, month: number): Promise<AttendanceRow[]>;
    static getAttendanceRate(studentId: number, startDate: Date | string, endDate: Date | string): Promise<AttendanceRate>;
    static markBulkAttendance(attendanceRecords: BulkAttendanceRecord[]): Promise<AttendanceRow[]>;
    static getSummaryByStudent(studentId: number): Promise<AttendanceRate>;
    static detectAbsenteeismPatterns(studentId: number, days?: number): Promise<AbsenteeismPattern[]>;
}
export default AttendanceDAO;
//# sourceMappingURL=attendance.dao.d.ts.map