import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

// ==================== STUDENTS ====================

export interface Student {
    id: number;
    matricula: string;
    nombre: string;
    email: string;
    nivel: string;
    grado: string;
    grupo: string;
}

export interface Grade {
    id: number;
    materia: string;
    calificacion: number;
    periodo: string;
    fecha: string;
}

export interface Assignment {
    id: number;
    materia: string;
    titulo: string;
    descripcion: string;
    fechaEntrega: string;
    estado: 'pendiente' | 'entregada' | 'calificada';
    calificacion?: number;
}

// Fetch current student profile
export function useStudentProfile() {
    return useQuery({
        queryKey: ['student', 'profile'],
        queryFn: async () => {
            const { data } = await apiClient.get<Student>('/api/students/profile');
            return data;
        },
    });
}

// Fetch student grades
export function useStudentGrades(periodo?: string) {
    return useQuery({
        queryKey: ['student', 'grades', periodo],
        queryFn: async () => {
            const { data } = await apiClient.get<Grade[]>('/api/students/grades', {
                params: { periodo },
            });
            return data;
        },
    });
}

// Fetch student assignments
export function useStudentAssignments(estado?: string) {
    return useQuery({
        queryKey: ['student', 'assignments', estado],
        queryFn: async () => {
            const { data } = await apiClient.get<Assignment[]>('/api/students/assignments', {
                params: { estado },
            });
            return data;
        },
    });
}

// Fetch student schedule
export function useStudentSchedule() {
    return useQuery({
        queryKey: ['student', 'schedule'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/students/schedule');
            return data;
        },
    });
}

// Fetch student notifications
export function useStudentNotifications() {
    return useQuery({
        queryKey: ['student', 'notifications'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/students/notifications');
            return data;
        },
    });
}

// Mark notification as read
export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (notificationId: number) => {
            await apiClient.patch(`/api/students/notifications/${notificationId}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] });
        },
    });
}

// ==================== IACOINS ====================

export interface IACoinsBalance {
    total: number;
    ganados: number;
    gastados: number;
    ranking: number;
}

export interface StoreItem {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    rareza: 'comun' | 'raro' | 'epico' | 'legendario';
    tipo: string;
    imagen: string;
    stock: number;
}

export interface Transaction {
    id: number;
    tipo: 'ganancia' | 'gasto';
    descripcion: string;
    coins: number;
    fecha: string;
}

// Fetch IA Coins balance
export function useIACoinsBalance() {
    return useQuery({
        queryKey: ['iacoins', 'balance'],
        queryFn: async () => {
            const { data } = await apiClient.get<IACoinsBalance>('/api/iacoins/balance');
            return data;
        },
    });
}

// Fetch store items
export function useStoreItems() {
    return useQuery({
        queryKey: ['iacoins', 'store'],
        queryFn: async () => {
            const { data } = await apiClient.get<StoreItem[]>('/api/iacoins/store');
            return data;
        },
    });
}

// Purchase item
export function usePurchaseItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (itemId: number) => {
            const { data } = await apiClient.post(`/api/iacoins/store/${itemId}/purchase`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['iacoins'] });
        },
    });
}

// Fetch transactions
export function useIACoinsTransactions(limit = 10) {
    return useQuery({
        queryKey: ['iacoins', 'transactions', limit],
        queryFn: async () => {
            const { data } = await apiClient.get<Transaction[]>('/api/iacoins/transactions', {
                params: { limit },
            });
            return data;
        },
    });
}

// Fetch leaderboard
export function useLeaderboard(limit = 10) {
    return useQuery({
        queryKey: ['iacoins', 'leaderboard', limit],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/iacoins/leaderboard', {
                params: { limit },
            });
            return data;
        },
    });
}

// ==================== AI CHATBOT ====================

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export function useSendChatMessage() {
    return useMutation({
        mutationFn: async (message: string) => {
            const { data } = await apiClient.post('/api/ai-chatbot', {
                message,
            });
            return data;
        },
    });
}

// ==================== TEACHERS ====================

export interface Teacher {
    id: number;
    nombre: string;
    email: string;
    materias: string[];
}

export interface TeacherClass {
    id: number;
    materia: string;
    grado: string;
    grupo: string;
    totalEstudiantes: number;
}

export function useTeacherProfile() {
    return useQuery({
        queryKey: ['teacher', 'profile'],
        queryFn: async () => {
            const { data } = await apiClient.get<Teacher>('/api/teachers/profile');
            return data;
        },
    });
}

export function useTeacherClasses() {
    return useQuery({
        queryKey: ['teacher', 'classes'],
        queryFn: async () => {
            const { data } = await apiClient.get<TeacherClass[]>('/api/teachers/classes');
            return data;
        },
    });
}

// ==================== PARENTS ====================

export interface Parent {
    id: number;
    nombre: string;
    email: string;
    telefono: string;
}

export interface ParentStudent {
    id: number;
    nombre: string;
    matricula: string;
    nivel: string;
    grado: string;
    grupo: string;
    promedio: number;
}

export function useParentProfile() {
    return useQuery({
        queryKey: ['parent', 'profile'],
        queryFn: async () => {
            const { data } = await apiClient.get<Parent>('/api/parents/profile');
            return data;
        },
    });
}

export function useParentStudents() {
    return useQuery({
        queryKey: ['parent', 'students'],
        queryFn: async () => {
            const { data } = await apiClient.get<ParentStudent[]>('/api/parents/my-students');
            return data;
        },
    });
}

export function useStudentGradesForParent(studentId: number) {
    return useQuery({
        queryKey: ['parent', 'student', studentId, 'grades'],
        queryFn: async () => {
            const { data } = await apiClient.get<Grade[]>(
                `/api/parents/students/${studentId}/grades`
            );
            return data;
        },
        enabled: !!studentId,
    });
}

// ==================== ADMIN ====================

export interface AdminStats {
    totalEstudiantes: number;
    totalDocentes: number;
    totalIngresos: number;
    promedioAsistencia: number;
}

export function useAdminStats() {
    return useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: async () => {
            const { data } = await apiClient.get<AdminStats>('/api/admin/stats');
            return data;
        },
    });
}

export function useAdminDashboardSummary() {
    return useQuery({
        queryKey: ['admin', 'dashboard-summary'],
        queryFn: async () => {
            const { data } = await apiClient.get('/api/admin/dashboard-summary');
            return data;
        },
    });
}
