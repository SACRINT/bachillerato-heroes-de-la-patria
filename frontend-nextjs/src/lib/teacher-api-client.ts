/**
 * 👨‍🏫 TEACHER API CLIENT
 * Cliente API para el portal de docentes
 */

import { apiClient } from './api-client';

export interface TeacherClass {
    id: number;
    materia: string;
    grupo: string;
    estudiantes: number;
    promedio?: number;
    horario?: string;
    aula?: string;
    progreso?: number;
    siguienteClase?: string;
}

export interface DashboardStats {
    totalClasses: number;
    totalStudents: number;
    pendingReviews: number;
    unreadMessages: number;
}

export interface Student {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    matricula: string;
    email?: string;
    foto_url?: string;
}

export interface Grade {
    estudiante_id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    matricula: string;
    calificacion_id?: number;
    calificacion?: number;
    periodo: string;
    observaciones?: string;
}

export interface Attendance {
    estudiante_id: number;
    nombre: string;
    apellido_paterno: string;
    matricula: string;
    estado: 'presente' | 'ausente' | 'retardo' | 'justificado';
}

export const teacherApi = {
    /**
     * Obtener datos del dashboard
     */
    async getDashboard() {
        const response = await apiClient.get('/api/teachers-portal/dashboard');
        return response.data;
    },

    /**
     * Obtener clases del docente
     */
    async getClasses(): Promise<TeacherClass[]> {
        const response = await apiClient.get('/api/teachers-portal/classes');
        return response.data?.data || [];
    },

    /**
     * Obtener estudiantes de una clase
     */
    async getClassStudents(classId: number): Promise<Student[]> {
        const response = await apiClient.get(`/api/teachers-portal/classes/${classId}/students`);
        return response.data?.data || [];
    },

    /**
     * Obtener calificaciones de una clase
     */
    async getClassGrades(classId: number, periodo?: string): Promise<Grade[]> {
        const params = periodo ? { periodo } : {};
        const response = await apiClient.get(`/api/teachers-portal/grades/${classId}`, { params });
        return response.data?.data || [];
    },

    /**
     * Guardar una calificación
     */
    async saveGrade(data: {
        estudiante_id: number;
        materia_id: number;
        calificacion: number;
        periodo: string;
        observaciones?: string;
    }) {
        const response = await apiClient.post('/api/teachers-portal/grades', data);
        return response.data;
    },

    /**
     * Guardar calificaciones masivas
     */
    async saveBulkGrades(grades: Array<{
        estudiante_id: number;
        materia_id: number;
        calificacion: number;
        periodo: string;
        observaciones?: string;
    }>) {
        const response = await apiClient.post('/api/teachers-portal/grades/bulk', { grades });
        return response.data;
    },

    /**
     * Obtener asistencia de una clase
     */
    async getClassAttendance(classId: number, fecha?: string) {
        const params = fecha ? { fecha } : {};
        const response = await apiClient.get(`/api/teachers-portal/attendance/${classId}`, { params });
        return response.data;
    },

    /**
     * Registrar asistencia
     */
    async saveAttendance(attendances: Array<{
        estudiante_id: number;
        materia_id: number;
        fecha: string;
        estado: 'presente' | 'ausente' | 'retardo' | 'justificado';
        observaciones?: string;
    }>) {
        const response = await apiClient.post('/api/teachers-portal/attendance', { attendances });
        return response.data;
    },

    /**
     * Obtener mensajes
     */
    async getMessages(params?: { tipo?: string; page?: number; limit?: number }) {
        const response = await apiClient.get('/api/teachers-portal/messages', { params });
        return response.data?.data || [];
    },

    /**
     * Enviar mensaje
     */
    async sendMessage(data: {
        destinatario_id: number;
        asunto: string;
        contenido: string;
    }) {
        const response = await apiClient.post('/api/teachers-portal/messages', data);
        return response.data;
    },

    /**
     * Obtener padres de un estudiante
     */
    async getStudentParents(studentId: number) {
        const response = await apiClient.get(`/api/teachers-portal/parents/${studentId}`);
        return response.data?.data || [];
    },

    /**
     * Obtener notificaciones
     */
    async getNotifications() {
        const response = await apiClient.get('/api/teachers-portal/notifications');
        return response.data?.data || [];
    },

    /**
     * Marcar notificación como leída
     */
    async markNotificationAsRead(notificationId: number) {
        const response = await apiClient.post(`/api/teachers-portal/notifications/${notificationId}/read`);
        return response.data;
    },

    /**
     * Obtener recursos educativos
     */
    async getResources() {
        const response = await apiClient.get('/api/teachers-portal/resources');
        return response.data?.data || [];
    }
};
