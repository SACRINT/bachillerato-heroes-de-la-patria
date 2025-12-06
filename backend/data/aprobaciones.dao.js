/**
 * ✅ APROBACIONES DAO (Diagnóstico y Fix)
 * Data Access Object para operaciones de aprobaciones pendientes
 * ✅ FASE 3 DAL
 * 
 * @date 05 Diciembre 2025
 */

const { pool } = require('../config/database');

class AprobacionesDAO {

    /**
     * Obtener estadísticas actuales de aprobaciones
     */
    static async getEstadisticas() {
        const result = await pool.query(`
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = true) as confirmados,
                COUNT(*) FILTER (WHERE estado = 'pendiente' AND email_confirmado = false) as no_confirmados,
                COUNT(*) FILTER (WHERE estado = 'aprobada') as aprobadas,
                COUNT(*) FILTER (WHERE estado = 'rechazada') as rechazadas
            FROM pendientes_aprobacion
        `);
        return result.rows[0];
    }

    /**
     * Forzar email_confirmado=true para todos los pendientes
     * @returns {Array} IDs de registros actualizados
     */
    static async sincronizarPendientes() {
        const result = await pool.query(`
            UPDATE pendientes_aprobacion
            SET email_confirmado = true, updated_at = NOW()
            WHERE estado = 'pendiente' AND email_confirmado = false
            RETURNING id
        `);
        return result.rows;
    }

    /**
     * Listar registros pendientes (limitado)
     */
    static async listarPendientes(limit = 10) {
        const result = await pool.query(`
            SELECT
                id,
                tipo_solicitud,
                email_usuario,
                estado,
                email_confirmado,
                fecha_solicitud
            FROM pendientes_aprobacion
            WHERE estado = 'pendiente'
            ORDER BY fecha_solicitud DESC
            LIMIT $1
        `, [limit]);
        return result.rows;
    }

    /**
     * Obtener resumen completo con contadores
     */
    static async getResumenCompleto() {
        const result = await pool.query(`
            SELECT
                COUNT(*) as total_registros,
                COUNT(*) FILTER (WHERE estado='pendiente') as pendiente_count,
                COUNT(*) FILTER (WHERE estado='aprobada') as aprobada_count,
                COUNT(*) FILTER (WHERE estado='rechazada') as rechazada_count,
                COUNT(*) FILTER (WHERE email_confirmado=true) as confirmados_count,
                COUNT(*) FILTER (WHERE email_confirmado=false) as no_confirmados_count
            FROM pendientes_aprobacion
        `);
        return result.rows[0];
    }

    /**
     * Desglose por estado
     */
    static async getDesglosePorEstado() {
        const result = await pool.query(`
            SELECT estado, COUNT(*) as cantidad
            FROM pendientes_aprobacion
            GROUP BY estado
            ORDER BY cantidad DESC
        `);
        return result.rows;
    }

    /**
     * Listar todos los registros (para diagnóstico)
     */
    static async listarTodos() {
        const result = await pool.query(`
            SELECT
                id,
                tipo_solicitud,
                email_usuario,
                estado,
                email_confirmado,
                fecha_solicitud,
                created_at
            FROM pendientes_aprobacion
            ORDER BY fecha_solicitud DESC
        `);
        return result.rows;
    }

    /**
     * Contar pendientes totales
     */
    static async contarPendientes() {
        const result = await pool.query(`
            SELECT COUNT(*) as total
            FROM pendientes_aprobacion
            WHERE estado = 'pendiente'
        `);
        return parseInt(result.rows[0].total);
    }

    /**
     * Listar pendientes con límite (para comparación)
     */
    static async listarPendientesParaEndpoint(limit = 100) {
        const result = await pool.query(`
            SELECT * FROM pendientes_aprobacion
            WHERE estado = 'pendiente'
            ORDER BY fecha_solicitud DESC
            LIMIT $1
        `, [limit]);
        return result.rows;
    }
}

module.exports = AprobacionesDAO;
