/**
 * 📊 CHARTS DATA DAO - TypeScript
 * Data Access Object para estadísticas y gráficas del dashboard
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

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
    noticias: Array<{ estado: string; total: number }>;
    eventos: Array<{ tipo: string; total: number }>;
    quejas: Array<{ status: string; total: number }>;
    suscriptores: Array<{ estado_sub: string; total: number }>;
}

// =====================================================
// CHARTS DATA DAO CLASS
// =====================================================

class ChartsDataDAO {

    /**
     * Noticias publicadas por mes (últimos 12 meses)
     */
    static async getNoticiasPorMes(): Promise<NoticiasPorMes[]> {
        const result = await pool.query(`
            SELECT
                TO_CHAR(fecha_publicacion, 'Mon YYYY') as mes,
                DATE_TRUNC('month', fecha_publicacion) as fecha_mes,
                COUNT(*) as total
            FROM noticias
            WHERE fecha_publicacion >= CURRENT_DATE - INTERVAL '12 months'
            AND estado = 'publicada'
            GROUP BY DATE_TRUNC('month', fecha_publicacion), TO_CHAR(fecha_publicacion, 'Mon YYYY')
            ORDER BY fecha_mes ASC
        `);
        return result.rows.map(row => ({
            mes: row.mes,
            fecha_mes: row.fecha_mes,
            total: parseInt(row.total)
        }));
    }

    /**
     * Eventos por categoría
     */
    static async getEventosPorCategoria(): Promise<EventosPorCategoria[]> {
        const result = await pool.query(`
            SELECT categoria, COUNT(*) as total
            FROM eventos
            WHERE estado = 'publicado'
            GROUP BY categoria
            ORDER BY total DESC
        `);
        return result.rows.map(row => ({
            categoria: row.categoria,
            total: parseInt(row.total)
        }));
    }

    /**
     * Quejas por tipo (top 6)
     */
    static async getQuejasPorTipo(): Promise<QuejasPorTipo[]> {
        const result = await pool.query(`
            SELECT subject as tipo, COUNT(*) as total
            FROM quejas
            GROUP BY subject
            ORDER BY total DESC
            LIMIT 6
        `);
        return result.rows.map(row => ({
            tipo: row.tipo,
            total: parseInt(row.total)
        }));
    }

    /**
     * Crecimiento de suscriptores (últimos 12 meses)
     */
    static async getSuscriptoresCrecimiento(): Promise<SuscriptoresCrecimiento[]> {
        const result = await pool.query(`
            SELECT
                TO_CHAR(fecha_registro, 'Mon YYYY') as mes,
                DATE_TRUNC('month', fecha_registro) as fecha_mes,
                COUNT(*) as nuevos,
                SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', fecha_registro)) as acumulado
            FROM suscriptores_notificaciones
            WHERE fecha_registro >= CURRENT_DATE - INTERVAL '12 months'
            AND estado = 'activo'
            GROUP BY DATE_TRUNC('month', fecha_registro), TO_CHAR(fecha_registro, 'Mon YYYY')
            ORDER BY fecha_mes ASC
        `);
        return result.rows.map(row => ({
            mes: row.mes,
            fecha_mes: row.fecha_mes,
            nuevos: parseInt(row.nuevos),
            acumulado: parseInt(row.acumulado)
        }));
    }

    /**
     * Resumen general para dashboard (noticias, eventos, quejas, suscriptores)
     */
    static async getResumenGeneral(): Promise<ResumenGeneral> {
        const [noticiasResult, eventosResult, quejasResult, suscriptoresResult] = await Promise.all([
            pool.query(`SELECT estado, COUNT(*) as total FROM noticias GROUP BY estado`),
            pool.query(`
                SELECT
                    CASE
                        WHEN fecha_inicio > CURRENT_DATE THEN 'Próximos'
                        WHEN fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE THEN 'En curso'
                        ELSE 'Pasados'
                    END as tipo,
                    COUNT(*) as total
                FROM eventos
                WHERE estado = 'publicado'
                GROUP BY tipo
            `),
            pool.query(`SELECT status, COUNT(*) as total FROM quejas GROUP BY status`),
            pool.query(`
                SELECT
                    CASE WHEN estado = 'activo' THEN 'Activos' ELSE 'Inactivos' END as estado_sub,
                    COUNT(*) as total
                FROM suscriptores_notificaciones
                GROUP BY estado
            `)
        ]);

        return {
            noticias: noticiasResult.rows.map(r => ({ estado: r.estado, total: parseInt(r.total) })),
            eventos: eventosResult.rows.map(r => ({ tipo: r.tipo, total: parseInt(r.total) })),
            quejas: quejasResult.rows.map(r => ({ status: r.status, total: parseInt(r.total) })),
            suscriptores: suscriptoresResult.rows.map(r => ({ estado_sub: r.estado_sub, total: parseInt(r.total) }))
        };
    }
}

export default ChartsDataDAO;
module.exports = ChartsDataDAO;
