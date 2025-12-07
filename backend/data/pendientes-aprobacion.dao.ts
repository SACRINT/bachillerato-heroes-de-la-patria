/**
 * 📋 PENDIENTES APROBACION DAO - TypeScript
 * Capa de acceso a datos para aprobaciones pendientes
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery, pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface PendienteAprobacion {
    id: number; // or string uuid
    tipo_solicitud: string; // 'egresado', 'bolsa_trabajo'
    estado: string; // 'pendiente', 'aprobada', 'rechazada'
    fecha_solicitud: Date;
    datos?: any; // JSON
    [key: string]: any;
}

export interface PendienteFilter {
    tipo?: string;
    estado?: string;
    limit?: number;
    offset?: number;
}

export interface PendienteListResult {
    data: PendienteAprobacion[];
    total: number;
}

export interface PendienteStats {
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
    egresados: number;
    bolsa_trabajo: number;
    egresados_pendientes: number;
    bolsa_trabajo_pendientes: number;
    total: number;
}

export interface AprobacionResult {
    success: boolean;
}

// =====================================================
// PENDIENTES APROBACION DAO CLASS
// =====================================================

class PendientesAprobacionDAO {
    static async getAll({ tipo, estado, limit = 50, offset = 0 }: PendienteFilter): Promise<PendienteListResult> {
        let query = `SELECT * FROM pendientes_aprobacion WHERE estado IN ('pendiente_confirmacion', 'pendiente')`;
        const params: any[] = [];
        if (estado) { query += ` AND estado = $${params.length + 1}`; params.push(estado); }
        if (tipo) { query += ` AND tipo_solicitud = $${params.length + 1}`; params.push(tipo); }
        query += ` ORDER BY fecha_solicitud DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit as any), parseInt(offset as any));
        const data = await executeQuery(query, params);

        let cq = `SELECT COUNT(*) as count FROM pendientes_aprobacion WHERE estado IN ('pendiente_confirmacion', 'pendiente')`;
        const cp: any[] = [];
        if (estado) { cq += ` AND estado = $${cp.length + 1}`; cp.push(estado); }
        if (tipo) { cq += ` AND tipo_solicitud = $${cp.length + 1}`; cp.push(tipo); }
        const countResult = await executeQuery(cq, cp);
        return { data: data as PendienteAprobacion[], total: parseInt(countResult[0].count) };
    }

    static async getById(id: number | string): Promise<PendienteAprobacion | null> {
        const result = await executeQuery('SELECT * FROM pendientes_aprobacion WHERE id = $1', [id]);
        return result[0] || null;
    }

    static async delete(id: number | string): Promise<{ id: number | string } | null> {
        const result = await executeQuery('DELETE FROM pendientes_aprobacion WHERE id = $1 RETURNING id', [id]);
        return result[0] || null;
    }

    static async getStats(): Promise<PendienteStats> {
        const query = `SELECT COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
            COUNT(*) FILTER (WHERE estado = 'aprobada') as aprobadas, COUNT(*) FILTER (WHERE estado = 'rechazada') as rechazadas,
            COUNT(*) FILTER (WHERE tipo_solicitud = 'egresado') as egresados, COUNT(*) FILTER (WHERE tipo_solicitud = 'bolsa_trabajo') as bolsa_trabajo,
            COUNT(*) FILTER (WHERE tipo_solicitud = 'egresado' AND estado = 'pendiente') as egresados_pendientes,
            COUNT(*) FILTER (WHERE tipo_solicitud = 'bolsa_trabajo' AND estado = 'pendiente') as bolsa_trabajo_pendientes,
            COUNT(*) as total FROM pendientes_aprobacion`;
        const result = await executeQuery(query, []);
        const row = result[0];
        return {
            pendientes: parseInt(row.pendientes),
            aprobadas: parseInt(row.aprobadas),
            rechazadas: parseInt(row.rechazadas),
            egresados: parseInt(row.egresados),
            bolsa_trabajo: parseInt(row.bolsa_trabajo),
            egresados_pendientes: parseInt(row.egresados_pendientes),
            bolsa_trabajo_pendientes: parseInt(row.bolsa_trabajo_pendientes),
            total: parseInt(row.total)
        };
    }

    // Métodos con transacciones usan pool.connect directamente
    static async aprobar(id: number | string, solicitud: PendienteAprobacion, datos: any): Promise<AprobacionResult> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            if (solicitud.tipo_solicitud === 'egresado') {
                await client.query(`INSERT INTO egresados (nombre, email, telefono, anio_egreso, carrera, generacion, ocupacion_actual, ciudad, verificado, fecha_registro, fecha_actualizacion)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) ON CONFLICT (email) DO NOTHING`,
                    [datos.nombre_completo || datos.name || '', datos.email, datos.telefono || null, datos.anio_egreso || null,
                    datos.carrera_tecnica || datos.carrera || null, datos.generacion || null, datos.experiencia_laboral || datos.trabajo || null, datos.ciudad || null, true]);
            } else if (solicitud.tipo_solicitud === 'bolsa_trabajo') {
                await client.query(`INSERT INTO bolsa_trabajo (nombre_completo, email, telefono, generacion, experiencia, habilidades)
                    VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING`,
                    [datos.name || datos.nombre_completo || '', datos.email, datos.phone || datos.telefono || null,
                    datos.graduationYear || datos.generacion || null, datos.message || datos.experiencia || null, datos.skills || datos.habilidades || null]);
            }
            await client.query('DELETE FROM pendientes_aprobacion WHERE id = $1', [id]);
            await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async rechazar(id: number | string): Promise<PendienteAprobacion | null> {
        const result = await executeQuery('DELETE FROM pendientes_aprobacion WHERE id = $1 RETURNING *', [id]);
        return result[0] || null;
    }
}

export default PendientesAprobacionDAO;
module.exports = PendientesAprobacionDAO;
