/**
 * 📊 CHARTS DATA DAO
 * Data Access Object para estadísticas y gráficas del dashboard
 * 
 * Refactorizado: 05 Diciembre 2025
 */

const { pool } = require('../config/database');

class ChartsDataDAO {

    /**
     * Noticias publicadas por mes (últimos 12 meses)
     * @returns {Promise<Array>}
     */
    static async getNoticiasPorMes() {
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
        return result.rows;
    }

    /**
     * Eventos por categoría
     * @returns {Promise<Array>}
     */
    static async getEventosPorCategoria() {
        const result = await pool.query(`
            SELECT categoria, COUNT(*) as total
            FROM eventos
            WHERE estado = 'publicado'
            GROUP BY categoria
            ORDER BY total DESC
        `);
        return result.rows;
    }

    /**
     * Quejas por tipo (top 6)
     * @returns {Promise<Array>}
     */
    static async getQuejasPorTipo() {
        const result = await pool.query(`
            SELECT subject as tipo, COUNT(*) as total
            FROM quejas
            GROUP BY subject
            ORDER BY total DESC
            LIMIT 6
        `);
        return result.rows;
    }

    /**
     * Crecimiento de suscriptores (últimos 12 meses)
     * @returns {Promise<Array>}
     */
    static async getSuscriptoresCrecimiento() {
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
        return result.rows;
    }

    /**
     * Resumen general para dashboard (noticias, eventos, quejas, suscriptores)
     * @returns {Promise<Object>}
     */
    static async getResumenGeneral() {
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
            noticias: noticiasResult.rows,
            eventos: eventosResult.rows,
            quejas: quejasResult.rows,
            suscriptores: suscriptoresResult.rows
        };
    }
}

module.exports = ChartsDataDAO;
