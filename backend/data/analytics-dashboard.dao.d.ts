/**
 * 📊 ANALYTICS DASHBOARD DAO - TypeScript
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface DashboardStats {
    contactos: {
        total: number;
        pendientes: number;
        respondidos: number;
    };
    quejas: {
        total: number;
        pendientes: number;
    };
    inscripciones: {
        total: number;
        aprobadas: number;
        pendientes: number;
        rechazadas: number;
    };
    egresados: {
        total: number;
        verificados: number;
        con_cv: number;
    };
    solicitudes: {
        total: number;
        pendientes: number;
    };
    citas: {
        total: number;
        pendientes: number;
        confirmadas: number;
    };
    noticias: {
        total: number;
    };
    eventos: {
        total: number;
    };
    avisos: {
        total: number;
    };
    comunicados: {
        total: number;
    };
}
export interface ActivityLimits {
    contactos: number;
    quejas: number;
    inscripciones: number;
    egresados: number;
    citas: number;
}
export interface RecentActivityItem {
    tipo: string;
    nombre?: string;
    email?: string;
    timestamp: Date;
    accion: string;
    student_name?: string;
    student_email?: string;
    nombre_completo?: string;
}
export interface ChartsData {
    inscripcionesMes: Array<{
        mes: string;
        mes_num: number;
        total: number;
    }>;
    mensajesTipo: Array<{
        tipo: string;
        total: number;
    }>;
    contenidoCMS: {
        noticias: number;
        eventos: number;
        avisos: number;
        comunicados: number;
    };
}
declare class AnalyticsDashboardDAO {
    static getDashboardStats(): Promise<DashboardStats>;
    static getRecentActivity(limits?: ActivityLimits): Promise<RecentActivityItem[]>;
    static getChartsData(): Promise<ChartsData>;
    static getGeneralActivity(): Promise<number[]>;
}
export default AnalyticsDashboardDAO;
//# sourceMappingURL=analytics-dashboard.dao.d.ts.map