/**
 * ⚙️ ADMIN API CLIENT
 * Cliente API para el panel de administración
 */

import { apiClient } from './api-client';

// ============================================
// INTERFACES
// ============================================

export interface AdminDashboardStats {
    totalEstudiantes: number;
    totalDocentes: number;
    totalPadres?: number;
    ingresosMes: number;
    asistenciaHoy: number;
    estudiantesActivos: number;
    docentesActivos: number;
}

export interface RecentActivity {
    tipo: string;
    descripcion: string;
    timestamp: string;
    usuario?: string;
}

export interface UpcomingEvent {
    titulo: string;
    fecha: string;
    hora: string;
    tipo: string;
    descripcion?: string;
}

export interface FinancialSummary {
    categoria: string;
    monto: number;
    porcentaje: number;
}

// ============================================
// API CLIENT
// ============================================

export const adminApiClient = {
    /**
     * Obtener estadísticas del dashboard principal
     */
    async getDashboardStats(): Promise<AdminDashboardStats> {
        const response = await apiClient.get('/api/admin/dashboard-summary');
        return response.data;
    },

    /**
     * Obtener actividad reciente del sistema
     */
    async getRecentActivity(limit = 10) {
        const response = await apiClient.get('/api/admin/activity', {
            params: { limit }
        });
        return response.data;
    },

    /**
     * Obtener próximos eventos
     */
    async getUpcomingEvents(limit = 5) {
        const response = await apiClient.get('/api/admin/events/upcoming', {
            params: { limit }
        });
        return response.data;
    },

    /**
     * Obtener resumen financiero
     */
    async getFinancialSummary(month?: string, year?: number) {
        const response = await apiClient.get('/api/admin/financial/summary', {
            params: { month, year }
        });
        return response.data;
    },

    /**
     * Obtener lista de estudiantes
     */
    async getStudents(params?: {
        page?: number;
        limit?: number;
        search?: string;
        grado?: string;
        grupo?: string;
    }) {
        const response = await apiClient.get('/api/admin/students', { params });
        return response.data;
    },

    /**
     * Obtener lista de docentes
     */
    async getTeachers(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const response = await apiClient.get('/api/admin/teachers', { params });
        return response.data;
    },

    /**
     * Obtener lista de padres
     */
    async getParents(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const response = await apiClient.get('/api/parents', { params });
        return response.data;
    },

    /**
     * Crear nuevo estudiante
     */
    async createStudent(data: any) {
        const response = await apiClient.post('/api/admin/students', data);
        return response.data;
    },

    /**
     * Crear nuevo docente
     */
    async createTeacher(data: any) {
        const response = await apiClient.post('/api/admin/teachers', data);
        return response.data;
    },

    /**
     * Crear nuevo padre
     */
    async createParent(data: any) {
        const response = await apiClient.post('/api/parents', data);
        return response.data;
    },

    /**
     * Actualizar estudiante
     */
    async updateStudent(id: number, data: any) {
        const response = await apiClient.put(`/api/admin/students/${id}`, data);
        return response.data;
    },

    /**
     * Actualizar docente
     */
    async updateTeacher(id: number, data: any) {
        const response = await apiClient.put(`/api/admin/teachers/${id}`, data);
        return response.data;
    },

    /**
     * Eliminar estudiante
     */
    async deleteStudent(id: number) {
        const response = await apiClient.delete(`/api/admin/students/${id}`);
        return response.data;
    },

    /**
     * Eliminar docente
     */
    async deleteTeacher(id: number) {
        const response = await apiClient.delete(`/api/admin/teachers/${id}`);
        return response.data;
    },

    /**
     * Obtener configuración del sistema
     */
    async getSystemConfig() {
        const response = await apiClient.get('/api/admin/config');
        return response.data;
    },

    /**
     * Actualizar configuración del sistema
     */
    async updateSystemConfig(data: any) {
        const response = await apiClient.put('/api/admin/config', data);
        return response.data;
    },
};
