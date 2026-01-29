/**
 * 📊 ATTENDANCE HOOKS
 * Custom React Query hooks para gestión de asistencia
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApiClient, type AttendanceFilters, type BulkAttendanceItem } from '@/lib/attendance-api-client';

// ============================================
// QUERY KEYS
// ============================================

export const attendanceKeys = {
    all: ['attendance'] as const,
    lists: () => [...attendanceKeys.all, 'list'] as const,
    list: (filters: AttendanceFilters) => [...attendanceKeys.lists(), filters] as const,
    student: (studentId: number) => [...attendanceKeys.all, 'student', studentId] as const,
    class: (classId: number, fecha?: string) => [...attendanceKeys.all, 'class', classId, fecha] as const,
    report: (studentId: number, fechaInicio?: string, fechaFin?: string) =>
        [...attendanceKeys.all, 'report', studentId, fechaInicio, fechaFin] as const,
    today: () => [...attendanceKeys.all, 'today'] as const,
    pattern: (studentId: number) => [...attendanceKeys.all, 'pattern', studentId] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook para listar asistencias con filtros
 */
export function useAttendances(filters: AttendanceFilters = {}) {
    return useQuery({
        queryKey: attendanceKeys.list(filters),
        queryFn: () => attendanceApiClient.listAttendances(filters),
    });
}

/**
 * Hook para obtener asistencias de un estudiante específico
 */
export function useStudentAttendances(
    studentId: number,
    filters: Omit<AttendanceFilters, 'estudiante_id'> = {}
) {
    return useQuery({
        queryKey: attendanceKeys.student(studentId),
        queryFn: () => attendanceApiClient.getStudentAttendances(studentId, filters),
        enabled: !!studentId,
    });
}

/**
 * Hook para obtener asistencia de una clase en una fecha
 */
export function useClassAttendance(classId: number, fecha?: string) {
    return useQuery({
        queryKey: attendanceKeys.class(classId, fecha),
        queryFn: () => attendanceApiClient.getClassAttendance(classId, fecha),
        enabled: !!classId,
    });
}

/**
 * Hook para generar reporte de asistencia
 */
export function useAttendanceReport(
    studentId: number,
    fechaInicio?: string,
    fechaFin?: string
) {
    return useQuery({
        queryKey: attendanceKeys.report(studentId, fechaInicio, fechaFin),
        queryFn: () => attendanceApiClient.generateReport(studentId, fechaInicio, fechaFin),
        enabled: !!studentId,
    });
}

/**
 * Hook para obtener asistencia del día actual
 */
export function useTodayAttendance() {
    return useQuery({
        queryKey: attendanceKeys.today(),
        queryFn: () => attendanceApiClient.getTodayAttendance(),
        // Refetch cada 5 minutos
        refetchInterval: 5 * 60 * 1000,
    });
}

/**
 * Hook para verificar patrón de ausentismo
 */
export function useAbsenteeismPattern(studentId: number) {
    return useQuery({
        queryKey: attendanceKeys.pattern(studentId),
        queryFn: () => attendanceApiClient.checkAbsenteeismPattern(studentId),
        enabled: !!studentId,
    });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook para registrar asistencia individual
 */
export function useMarkAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: attendanceApiClient.markAttendance,
        onSuccess: () => {
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
        },
    });
}

/**
 * Hook para registrar asistencia masiva
 */
export function useMarkBulkAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (attendances: BulkAttendanceItem[]) =>
            attendanceApiClient.markBulkAttendance(attendances),
        onSuccess: () => {
            // Invalidar todas las queries de asistencia
            queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
        },
    });
}

/**
 * Hook para actualizar un registro de asistencia
 */
export function useUpdateAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: number;
            data: {
                presente?: boolean;
                justificada?: boolean;
                motivo?: string;
                comentarios?: string;
            };
        }) => attendanceApiClient.updateAttendance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
        },
    });
}

/**
 * Hook para justificar una falta
 */
export function useJustifyAbsence() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
            attendanceApiClient.justifyAbsence(id, motivo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
        },
    });
}

/**
 * Hook para eliminar registro de asistencia (solo admin)
 */
export function useDeleteAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => attendanceApiClient.deleteAttendance(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
        },
    });
}
