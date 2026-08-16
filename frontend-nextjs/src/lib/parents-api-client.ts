/**
 * 👨‍👩‍👧‍👦 PARENTS API CLIENT
 * Cliente API para el portal de padres
 */

import { apiClient } from './api-client';

// ============================================
// INTERFACES
// ============================================

export interface ParentStudent {
    id: number;
    matricula: string;
    nombre_completo: string;
    grado: string;
    grupo: string;
    turno?: string;
    especialidad?: string;
    semestre?: number;
    tipo_relacion: string;
}

export interface ParentDashboard {
    students: ParentStudent[];
    summary: {
        total_students: number;
        unread_notifications: number;
        unread_messages: number;
        pending_payments: {
            count: number;
            total: number;
        };
    };
}

export interface StudentGrade {
    materia: string;
    calificacion: number;
    periodo: string;
    observaciones?: string;
}

export interface StudentAttendance {
    id: number;
    fecha: string;
    tipo: 'asistencia' | 'falta' | 'retardo' | 'justificada';
    materia?: string;
    hora?: string;
    justificada: boolean;
    motivo_justificacion?: string;
}

export interface AttendanceStats {
    asistencias: number;
    faltas: number;
    retardos: number;
    justificadas: number;
    porcentaje_asistencia: number;
}

// ============================================
// API CLIENT
// ============================================

export const parentsApiClient = {
    /**
     * Obtener datos del dashboard
     */
    async getDashboard(): Promise<ParentDashboard> {
        const response = await apiClient.get<any>('/api/parents/dashboard');
        return response.data?.data || response.data;
    },

    /**
     * Obtener lista de estudiantes (hijos) vinculados
     */
    async getMyStudents(): Promise<ParentStudent[]> {
        const response = await apiClient.get<any>('/api/parents/my-students');
        return response.data?.data || response.data;
    },

    /**
     * Obtener calificaciones de un estudiante
     */
    async getStudentGrades(
        studentId: number,
        params?: {
            periodo?: string;
            ciclo_escolar?: string;
        }
    ) {
        const response = await apiClient.get(`/api/parents/students/${studentId}/grades`, { params });
        return response.data;
    },

    /**
     * Obtener asistencia de un estudiante
     */
    async getStudentAttendance(
        studentId: number,
        params?: {
            start_date?: string;
            end_date?: string;
            limit?: number;
        }
    ) {
        const response = await apiClient.get(`/api/parents/students/${studentId}/attendance`, { params });
        return response.data;
    },

    /**
     * Obtener notificaciones del padre
     */
    async getNotifications(params?: { limit?: number; offset?: number }) {
        const response = await apiClient.get('/api/parents/notifications', { params });
        return response.data;
    },

    /**
     * Marcar notificación como leída
     */
    async markNotificationAsRead(notificationId: number) {
        const response = await apiClient.post(`/api/parents/notifications/${notificationId}/read`);
        return response.data;
    },

    /**
     * Obtener mensajes
     */
    async getMessages(params?: { limit?: number; offset?: number }) {
        const response = await apiClient.get('/api/parents/messages', { params });
        return response.data;
    },

    /**
     * Enviar mensaje
     */
    async sendMessage(data: {
        destinatario_id: number;
        asunto: string;
        contenido: string;
        tipo_destinatario: 'docente' | 'admin';
    }) {
        const response = await apiClient.post('/api/parents/messages', data);
        return response.data;
    },

    /**
     * Obtener pagos pendientes
     */
    async getPendingPayments(studentId?: number) {
        const params = studentId ? { student_id: studentId } : {};
        const response = await apiClient.get('/api/parents/payments/pending', { params });
        return response.data;
    },

    /**
     * Obtener historial de pagos
     */
    async getPaymentHistory(params?: {
        student_id?: number;
        start_date?: string;
        end_date?: string;
        limit?: number;
    }) {
        const response = await apiClient.get('/api/parents/payments/history', { params });
        return response.data;
    },
};
