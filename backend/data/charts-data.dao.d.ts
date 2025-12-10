/**
 * 📊 CHARTS DATA DAO - TypeScript
 * Data Access Object para estadísticas y gráficas del dashboard
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface NoticiasPorMes {
    mes: string;
    fecha_mes: Date;
    total: number;
}
export interface EventosPorCategoria {
    categoria: string;
    total: number;
}
export interface QuejasPorTipo {
    tipo: string;
    total: number;
}
export interface SuscriptoresCrecimiento {
    mes: string;
    fecha_mes: Date;
    nuevos: number;
    acumulado: number;
}
export interface ResumenGeneral {
    noticias: Array<{
        estado: string;
        total: number;
    }>;
    eventos: Array<{
        tipo: string;
        total: number;
    }>;
    quejas: Array<{
        status: string;
        total: number;
    }>;
    suscriptores: Array<{
        estado_sub: string;
        total: number;
    }>;
}
declare class ChartsDataDAO {
    /**
     * Noticias publicadas por mes (últimos 12 meses)
     */
    static getNoticiasPorMes(): Promise<NoticiasPorMes[]>;
    /**
     * Eventos por categoría
     */
    static getEventosPorCategoria(): Promise<EventosPorCategoria[]>;
    /**
     * Quejas por tipo (top 6)
     */
    static getQuejasPorTipo(): Promise<QuejasPorTipo[]>;
    /**
     * Crecimiento de suscriptores (últimos 12 meses)
     */
    static getSuscriptoresCrecimiento(): Promise<SuscriptoresCrecimiento[]>;
    /**
     * Resumen general para dashboard (noticias, eventos, quejas, suscriptores)
     */
    static getResumenGeneral(): Promise<ResumenGeneral>;
}
export default ChartsDataDAO;
//# sourceMappingURL=charts-data.dao.d.ts.map