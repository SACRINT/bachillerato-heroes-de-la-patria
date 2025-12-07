/**
 * ✅ APROBACIONES DAO (Diagnóstico y Fix) - TypeScript
 * Data Access Object para operaciones de aprobaciones pendientes
 * ✅ FASE 3 DAL
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface AprobacionStats {
    total: number;
    pendientes: number;
    confirmados: number;
    no_confirmados: number;
    aprobadas: number;
    rechazadas: number;
}

export interface PendienteAprobacion {
    id: number;
    tipo_solicitud: string;
    email_usuario: string;
    estado: string;
    email_confirmado: boolean;
    fecha_solicitud: Date;
    created_at?: Date;
}

export interface ResumenCompleto {
    total_registros: number;
    pendiente_count: number;
    aprobada_count: number;
    rechazada_count: number;
    confirmados_count: number;
    no_confirmados_count: number;
}

export interface DesgloseEstado {
    estado: string;
    cantidad: number;
}

// =====================================================
// APROBACIONES DAO CLASS
// =====================================================

class AprobacionesDAO {

    /**
     * Obtener estadísticas actuales de aprobaciones
     */
    static async getEstadisticas(): Promise<AprobacionStats> {
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
        // Ensure numbers are parsed from string (postgres default for COUNT is bigint/string)
        const row = result.rows[0];
        return {
            total: parseInt(row.total),
            pendientes: parseInt(row.pendientes),
            confirmados: parseInt(row.confirmados),
            no_confirmados: parseInt(row.no_confirmados),
            aprobadas: parseInt(row.aprobadas),
            rechazadas: parseInt(row.rechazadas)
        };
    }

    /**
     * Forzar email_confirmado=true para todos los pendientes
     * @returns {Array} IDs de registros actualizados
     */
    static async sincronizarPendientes(): Promise<{ id: number }[]> {
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
    static async listarPendientes(limit: number = 10): Promise<PendienteAprobacion[]> {
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
    static async getResumenCompleto(): Promise<ResumenCompleto> {
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
        const row = result.rows[0];
        return {
            total_registros: parseInt(row.total_registros),
            pendiente_count: parseInt(row.pendiente_count),
            aprobada_count: parseInt(row.aprobada_count),
            rechazada_count: parseInt(row.rechazada_count),
            confirmados_count: parseInt(row.confirmados_count),
            no_confirmados_count: parseInt(row.no_confirmados_count)
        };
    }

    /**
     * Desglose por estado
     */
    static async getDesglosePorEstado(): Promise<DesgloseEstado[]> {
        const result = await pool.query(`
            SELECT estado, COUNT(*) as cantidad
            FROM pendientes_aprobacion
            GROUP BY estado
            ORDER BY cantidad DESC
        `);
        return result.rows.map(row => ({
            estado: row.estado,
            cantidad: parseInt(row.cantidad)
        }));
    }

    /**
     * Listar todos los registros (para diagnóstico)
     */
    static async listarTodos(): Promise<PendienteAprobacion[]> {
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
    static async contarPendientes(): Promise<number> {
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
    static async listarPendientesParaEndpoint(limit: number = 100): Promise<any[]> {
        const result = await pool.query(`
            SELECT * FROM pendientes_aprobacion
            WHERE estado = 'pendiente'
            ORDER BY fecha_solicitud DESC
            LIMIT $1
        `, [limit]);
        return result.rows;
    }
}

export default AprobacionesDAO;
module.exports = AprobacionesDAO;
