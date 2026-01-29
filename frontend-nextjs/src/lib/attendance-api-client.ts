/**
 * 📊 ATTENDANCE API CLIENT
 * Cliente para gestión de asistencia escolar
 */

import { apiClient } from './api-client';

// ============================================
// INTERFACES
// ============================================

export interface AttendanceRecord {
    id: number;
    estudiante_id: number;
    materia_id: number;
    fecha: string;
    presente: boolean;
    justificada: boolean;
    motivo?: string;
    comentarios?: string;
    registrado_por: number;
    created_at: string;
    updated_at: string;
}

export interface AttendanceFilters {
    estudiante_id?: number;
    materia_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    limit?: number;
}

export interface BulkAttendanceItem {
    estudiante_id: number;
    materia_id: number;
    fecha: string;
    presente: boolean;
    justificada?: boolean;
    motivo?: string;
    comentarios?: string;
}

export interface AttendanceStats {
    total: number;
    present: number;
    absent: number;
    attendanceRate: string;
}

export interface AttendanceReport {
    estudiante_id: number;
    periodo: {
        inicio: string;
        fin: string;
    };
    estadisticas: {
        total_clases: number;
        asistencias: number;
        faltas: number;
        faltas_justificadas: number;
        porcentaje_asistencia: number;
    };
    por_materia: Array<{
        materia: string;
        total: number;
        presentes: number;
        ausentes: number;
        porcentaje: number;
    }>;
    detalles: AttendanceRecord[];
}

export interface ClassAttendance {
    clase_id: number;
    fecha: string;
    estudiantes: Array<{
        id: number;
        nombre: string;
        apellido: string;
        presente?: boolean;
        justificada?: boolean;
        motivo?: string;
    }>;
}

// ============================================
// API CLIENT
// ============================================

export const attendanceApiClient = {
    /**
     * Listar asistencias con filtros
     */
    async listAttendances(filters: AttendanceFilters = {}) {
        const params = new URLSearchParams();
        if (filters.estudiante_id) params.append('estudiante_id', filters.estudiante_id.toString());
        if (filters.materia_id) params.append('materia_id', filters.materia_id.toString());
        if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
        if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const response = await apiClient.get<{ data: AttendanceRecord[]; pagination: any }>(
            `/attendance?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Obtener asistencias de un estudiante
     */
    async getStudentAttendances(studentId: number, filters: Omit<AttendanceFilters, 'estudiante_id'> = {}) {
        const params = new URLSearchParams();
        if (filters.materia_id) params.append('materia_id', filters.materia_id.toString());
        if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
        if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);

        const response = await apiClient.get<{ data: AttendanceRecord[] }>(
            `/attendance/student/${studentId}?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Obtener asistencia de una clase en una fecha
     */
    async getClassAttendance(classId: number, fecha?: string) {
        const params = fecha ? `?fecha=${fecha}` : '';
        const response = await apiClient.get<{ data: ClassAttendance }>(
            `/attendance/class/${classId}${params}`
        );
        return response.data;
    },

    /**
     * Generar reporte de asistencia de un estudiante
     */
    async generateReport(studentId: number, fechaInicio?: string, fechaFin?: string) {
        const params = new URLSearchParams();
        if (fechaInicio) params.append('fecha_inicio', fechaInicio);
        if (fechaFin) params.append('fecha_fin', fechaFin);

        const response = await apiClient.get<{ data: AttendanceReport }>(
            `/attendance/report/${studentId}?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Registrar asistencia individual
     */
    async markAttendance(data: Omit<BulkAttendanceItem, 'materia_id'> & { materia_id: number }) {
        const response = await apiClient.post<{ data: AttendanceRecord }>('/attendance', data);
        return response.data;
    },

    /**
     * Registrar asistencia masiva (lista completa de clase)
     */
    async markBulkAttendance(attendances: BulkAttendanceItem[]) {
        const response = await apiClient.post<{ data: any }>('/attendance/bulk', { attendances });
        return response.data;
    },

    /**
     * Actualizar registro de asistencia
     */
    async updateAttendance(
        id: number,
        data: {
            presente?: boolean;
            justificada?: boolean;
            motivo?: string;
            comentarios?: string;
        }
    ) {
        const response = await apiClient.put<{ data: AttendanceRecord }>(`/attendance/${id}`, data);
        return response.data;
    },

    /**
     * Justificar una falta
     */
    async justifyAbsence(id: number, motivo: string) {
        const response = await apiClient.post<{ data: AttendanceRecord }>(
            `/attendance/${id}/justify`,
            { motivo }
        );
        return response.data;
    },

    /**
     * Verificar patrón de ausentismo de un estudiante
     */
    async checkAbsenteeismPattern(studentId: number) {
        const response = await apiClient.get<{ data: any }>(`/attendance/pattern/${studentId}`);
        return response.data;
    },

    /**
     * Obtener asistencia del día actual
     */
    async getTodayAttendance() {
        const response = await apiClient.get<{
            data: {
                date: string;
                attendances: AttendanceRecord[];
                stats: AttendanceStats;
            };
        }>('/attendance/today');
        return response.data;
    },

    /**
     * Eliminar registro de asistencia (solo admin)
     */
    async deleteAttendance(id: number) {
        const response = await apiClient.delete<{ success: boolean }>(`/attendance/${id}`);
        return response;
    },
};
