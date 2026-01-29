/**
 * 👨‍👩‍👧‍👦 PARENTS HOOKS
 * Custom React Query hooks para el portal de padres
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parentsApiClient } from '@/lib/parents-api-client';

// ============================================
// QUERY KEYS
// ============================================

export const parentsKeys = {
    all: ['parents'] as const,
    dashboard: () => [...parentsKeys.all, 'dashboard'] as const,
    students: () => [...parentsKeys.all, 'students'] as const,
    student: (studentId: number) => [...parentsKeys.students(), studentId] as const,
    grades: (studentId: number, periodo?: string, ciclo?: string) =>
        [...parentsKeys.student(studentId), 'grades', periodo, ciclo] as const,
    attendance: (studentId: number, startDate?: string, endDate?: string) =>
        [...parentsKeys.student(studentId), 'attendance', startDate, endDate] as const,
    notifications: () => [...parentsKeys.all, 'notifications'] as const,
    messages: () => [...parentsKeys.all, 'messages'] as const,
    payments: () => [...parentsKeys.all, 'payments'] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook para obtener datos del dashboard principal
 */
export function useParentDashboard() {
    return useQuery({
        queryKey: parentsKeys.dashboard(),
        queryFn: () => parentsApiClient.getDashboard(),
    });
}

/**
 * Hook para obtener lista de estudiantes (hijos)
 */
export function useMyStudents() {
    return useQuery({
        queryKey: parentsKeys.students(),
        queryFn: () => parentsApiClient.getMyStudents(),
    });
}

/**
 * Hook para obtener calificaciones de un estudiante
 */
export function useStudentGrades(
    studentId: number,
    periodo?: string,
    cicloEscolar?: string
) {
    return useQuery({
        queryKey: parentsKeys.grades(studentId, periodo, cicloEscolar),
        queryFn: () =>
            parentsApiClient.getStudentGrades(studentId, {
                periodo,
                ciclo_escolar: cicloEscolar,
            }),
        enabled: !!studentId,
    });
}

/**
 * Hook para obtener asistencia de un estudiante
 */
export function useStudentAttendance(
    studentId: number,
    startDate?: string,
    endDate?: string,
    limit?: number
) {
    return useQuery({
        queryKey: parentsKeys.attendance(studentId, startDate, endDate),
        queryFn: () =>
            parentsApiClient.getStudentAttendance(studentId, {
                start_date: startDate,
                end_date: endDate,
                limit,
            }),
        enabled: !!studentId,
    });
}

/**
 * Hook para obtener notificaciones
 */
export function useParentNotifications(limit?: number, offset?: number) {
    return useQuery({
        queryKey: parentsKeys.notifications(),
        queryFn: () => parentsApiClient.getNotifications({ limit, offset }),
    });
}

/**
 * Hook para obtener mensajes
 */
export function useParentMessages(limit?: number, offset?: number) {
    return useQuery({
        queryKey: parentsKeys.messages(),
        queryFn: () => parentsApiClient.getMessages({ limit, offset }),
    });
}

/**
 * Hook para obtener pagos pendientes
 */
export function usePendingPayments(studentId?: number) {
    return useQuery({
        queryKey: [...parentsKeys.payments(), 'pending', studentId],
        queryFn: () => parentsApiClient.getPendingPayments(studentId),
    });
}

/**
 * Hook para obtener historial de pagos
 */
export function usePaymentHistory(params?: {
    student_id?: number;
    start_date?: string;
    end_date?: string;
    limit?: number;
}) {
    return useQuery({
        queryKey: [...parentsKeys.payments(), 'history', params],
        queryFn: () => parentsApiClient.getPaymentHistory(params),
    });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook para marcar notificación como leída
 */
export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: number) =>
            parentsApiClient.markNotificationAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: parentsKeys.notifications() });
            queryClient.invalidateQueries({ queryKey: parentsKeys.dashboard() });
        },
    });
}

/**
 * Hook para enviar mensaje
 */
export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            destinatario_id: number;
            asunto: string;
            contenido: string;
            tipo_destinatario: 'docente' | 'admin';
        }) => parentsApiClient.sendMessage(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: parentsKeys.messages() });
        },
    });
}
