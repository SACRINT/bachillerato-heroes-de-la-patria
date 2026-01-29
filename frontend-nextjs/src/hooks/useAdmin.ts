/**
 * ⚙️ ADMIN HOOKS
 * Custom React Query hooks para el panel de administración
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApiClient } from '@/lib/admin-api-client';

// ============================================
// QUERY KEYS
// ============================================

export const adminKeys = {
    all: ['admin'] as const,
    dashboardStats: () => [...adminKeys.all, 'dashboard-stats'] as const,
    activity: () => [...adminKeys.all, 'activity'] as const,
    events: () => [...adminKeys.all, 'events'] as const,
    financialSummary: (month?: string, year?: number) =>
        [...adminKeys.all, 'financial-summary', month, year] as const,
    students: (params?: any) => [...adminKeys.all, 'students', params] as const,
    teachers: (params?: any) => [...adminKeys.all, 'teachers', params] as const,
    parents: (params?: any) => [...adminKeys.all, 'parents', params] as const,
    config: () => [...adminKeys.all, 'config'] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook para obtener estadísticas del dashboard
 */
export function useAdminDashboardStats() {
    return useQuery({
        queryKey: adminKeys.dashboardStats(),
        queryFn: () => adminApiClient.getDashboardStats(),
    });
}

/**
 * Hook para obtener actividad reciente
 */
export function useRecentActivity(limit = 10) {
    return useQuery({
        queryKey: [...adminKeys.activity(), limit],
        queryFn: () => adminApiClient.getRecentActivity(limit),
    });
}

/**
 * Hook para obtener próximos eventos
 */
export function useUpcomingEvents(limit = 5) {
    return useQuery({
        queryKey: [...adminKeys.events(), limit],
        queryFn: () => adminApiClient.getUpcomingEvents(limit),
    });
}

/**
 * Hook para obtener resumen financiero
 */
export function useFinancialSummary(month?: string, year?: number) {
    return useQuery({
        queryKey: adminKeys.financialSummary(month, year),
        queryFn: () => adminApiClient.getFinancialSummary(month, year),
    });
}

/**
 * Hook para obtener lista de estudiantes
 */
export function useAdminStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    grado?: string;
    grupo?: string;
}) {
    return useQuery({
        queryKey: adminKeys.students(params),
        queryFn: () => adminApiClient.getStudents(params),
    });
}

/**
 * Hook para obtener lista de docentes
 */
export function useAdminTeachers(params?: {
    page?: number;
    limit?: number;
    search?: string;
}) {
    return useQuery({
        queryKey: adminKeys.teachers(params),
        queryFn: () => adminApiClient.getTeachers(params),
    });
}

/**
 * Hook para obtener lista de padres
 */
export function useAdminParents(params?: {
    page?: number;
    limit?: number;
    search?: string;
}) {
    return useQuery({
        queryKey: adminKeys.parents(params),
        queryFn: () => adminApiClient.getParents(params),
    });
}

/**
 * Hook para obtener configuración del sistema
 */
export function useSystemConfig() {
    return useQuery({
        queryKey: adminKeys.config(),
        queryFn: () => adminApiClient.getSystemConfig(),
    });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook para crear estudiante
 */
export function useCreateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => adminApiClient.createStudent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.students() });
            queryClient.invalidateQueries({ queryKey: adminKeys.dashboardStats() });
        },
    });
}

/**
 * Hook para crear docente
 */
export function useCreateTeacher() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => adminApiClient.createTeacher(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.teachers() });
            queryClient.invalidateQueries({ queryKey: adminKeys.dashboardStats() });
        },
    });
}

/**
 * Hook para crear padre
 */
export function useCreateParent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => adminApiClient.createParent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.parents() });
        },
    });
}

/**
 * Hook para actualizar estudiante
 */
export function useUpdateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            adminApiClient.updateStudent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.students() });
        },
    });
}

/**
 * Hook para actualizar docente
 */
export function useUpdateTeacher() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            adminApiClient.updateTeacher(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.teachers() });
        },
    });
}

/**
 * Hook para eliminar estudiante
 */
export function useDeleteStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => adminApiClient.deleteStudent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.students() });
            queryClient.invalidateQueries({ queryKey: adminKeys.dashboardStats() });
        },
    });
}

/**
 * Hook para eliminar docente
 */
export function useDeleteTeacher() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => adminApiClient.deleteTeacher(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.teachers() });
            queryClient.invalidateQueries({ queryKey: adminKeys.dashboardStats() });
        },
    });
}

/**
 * Hook para actualizar configuración del sistema
 */
export function useUpdateSystemConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => adminApiClient.updateSystemConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.config() });
        },
    });
}
