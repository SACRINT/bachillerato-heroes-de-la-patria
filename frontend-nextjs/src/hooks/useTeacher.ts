/**
 * 🎓 CUSTOM HOOKS FOR TEACHER PORTAL
 * React Query hooks para el portal de docentes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherApi } from '@/lib/teacher-api-client';

/**
 * Hook para obtener el dashboard del docente
 */
export function useTeacherDashboard() {
    return useQuery({
        queryKey: ['teacher', 'dashboard'],
        queryFn: () => teacherApi.getDashboard(),
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
}

/**
 * Hook para obtener las clases del docente
 */
export function useTeacherClasses() {
    return useQuery({
        queryKey: ['teacher', 'classes'],
        queryFn: () => teacherApi.getClasses(),
        staleTime: 10 * 60 * 1000, // 10 minutos
    });
}

/**
 * Hook para obtener estudiantes de una clase
 */
export function useClassStudents(classId: number | null) {
    return useQuery({
        queryKey: ['teacher', 'class', classId, 'students'],
        queryFn: () => teacherApi.getClassStudents(classId!),
        enabled: !!classId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook para obtener calificaciones de una clase
 */
export function useClassGrades(classId: number | null, periodo?: string) {
    return useQuery({
        queryKey: ['teacher', 'class', classId, 'grades', periodo],
        queryFn: () => teacherApi.getClassGrades(classId!, periodo),
        enabled: !!classId,
        staleTime: 2 * 60 * 1000, // 2 minutos
    });
}

/**
 * Hook para guardar una calificación
 */
export function useSaveGrade() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: teacherApi.saveGrade,
        onSuccess: (_, variables) => {
            // Invalidar las calificaciones de esa clase
            queryClient.invalidateQueries({
                queryKey: ['teacher', 'class', variables.materia_id, 'grades']
            });
        },
    });
}

/**
 * Hook para guardar calificaciones masivas
 */
export function useSaveBulkGrades() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: teacherApi.saveBulkGrades,
        onSuccess: () => {
            // Invalidar todas las calificaciones
            queryClient.invalidateQueries({ queryKey: ['teacher', 'class'] });
        },
    });
}

/**
 * Hook para obtener asistencia de una clase
 */
export function useClassAttendance(classId: number | null, fecha?: string) {
    return useQuery({
        queryKey: ['teacher', 'class', classId, 'attendance', fecha],
        queryFn: () => teacherApi.getClassAttendance(classId!, fecha),
        enabled: !!classId,
        staleTime: 1 * 60 * 1000, // 1 minuto
    });
}

/**
 * Hook para guardar asistencia
 */
export function useSaveAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: teacherApi.saveAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'class'] });
        },
    });
}

/**
 * Hook para obtener mensajes
 */
export function useTeacherMessages(params?: { tipo?: string; page?: number; limit?: number }) {
    return useQuery({
        queryKey: ['teacher', 'messages', params],
        queryFn: () => teacherApi.getMessages(params),
        staleTime: 30 * 1000, // 30 segundos
    });
}

/**
 * Hook para enviar mensaje
 */
export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: teacherApi.sendMessage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'messages'] });
        },
    });
}

/**
 * Hook para obtener notificaciones
 */
export function useTeacherNotifications() {
    return useQuery({
        queryKey: ['teacher', 'notifications'],
        queryFn: () => teacherApi.getNotifications(),
        staleTime: 30 * 1000, // 30 segundos
        refetchInterval: 60 * 1000, // Refetch cada minuto
    });
}

/**
 * Hook para marcar notificación como leída
 */
export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: number) => teacherApi.markNotificationAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teacher', 'notifications'] });
        },
    });
}
