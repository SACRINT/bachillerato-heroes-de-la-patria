/**
 * 💼 BOLSA TRABAJO DAO - TypeScript
 * Data Access Object para bolsa de trabajo
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { executeQuery, pool } from '../config/database';
import { PoolClient } from 'pg';

// =====================================================
// INTERFACES
// =====================================================

export interface BolsaTrabajoRow {
    id: number;
    uuid?: string;
    nombre: string;
    email: string;
    telefono?: string;
    anio_egreso?: number;
    generacion?: string;
    area_interes?: string;
    resumen_profesional?: string;
    habilidades?: string;
    experiencia?: string;
    status: string;
    estado?: string;
    verificado: boolean;
    fecha_registro: Date;
    fecha_creacion: Date;
    fecha_actualizacion?: Date;
}

export interface BolsaTrabajoStats {
    total: number;
    activos?: number;
    inactivos?: number;
    contratados?: number;
    nuevos?: number;
    revisados?: number;
    contactados?: number;
    hoy: number;
    esta_semana: number;
    verificados?: number;
    byYear: Record<string, number>;
    byArea?: Record<string, number>;
    byExperiencia?: Record<string, number>;
}

export interface PendingApprovalRow {
    id: number;
    uuid: string;
    tipo_solicitud: string;
    email_usuario: string;
    datos_json: Record<string, any>;
    estado: string;
    email_confirmado: boolean;
    fecha_solicitud: Date;
    admin_id?: number;
    admin_notas?: string;
}

// =====================================================
// BOLSA TRABAJO DAO CLASS
// =====================================================

class BolsaTrabajoDAO {

    static async createPendingConfirmation(email: string, formData: Record<string, any>, token: string): Promise<{ confirmation_token: string }> {
        const query = `INSERT INTO bolsa_trabajo_pending_confirmation (email_usuario, datos_json, confirmation_token)
            VALUES ($1, $2, $3) ON CONFLICT (email_usuario) DO UPDATE SET datos_json = EXCLUDED.datos_json,
            confirmation_token = EXCLUDED.confirmation_token, token_expires_at = (now() + '24 hours'::interval),
            fecha_actualizacion = now() RETURNING confirmation_token`;
        const result = await executeQuery(query, [email, JSON.stringify(formData), token]);
        return result[0];
    }

    static async getPendingByToken(token: string): Promise<{ id: number; email_usuario: string; datos_json: Record<string, any>; token_expires_at: Date } | null> {
        const result = await executeQuery('SELECT id, email_usuario, datos_json, token_expires_at FROM bolsa_trabajo_pending_confirmation WHERE confirmation_token = $1', [token]);
        return result[0] || null;
    }

    static async deletePendingById(id: number): Promise<void> {
        await executeQuery('DELETE FROM bolsa_trabajo_pending_confirmation WHERE id = $1', [id]);
    }

    static async confirmEmail(pendingData: { id: number; email_usuario: string }, formData: Record<string, any>): Promise<{ id: number; uuid?: string; email_usuario: string; estado: string }> {
        const client: PoolClient = await pool.connect();
        const email = pendingData.email_usuario;
        try {
            await client.query('BEGIN');
            const existingApproval = await client.query(`SELECT id FROM pendientes_aprobacion WHERE email_usuario = $1 AND tipo_solicitud = $2`, [email, 'bolsa_trabajo']);
            let savedRecord;
            if (existingApproval.rows.length > 0) {
                const existingId = existingApproval.rows[0].id;
                const updateResult = await client.query(`UPDATE pendientes_aprobacion SET datos_json = $1, fecha_solicitud = NOW(), email_confirmado = $2, estado = $3 WHERE id = $4 RETURNING id, uuid, email_usuario, estado`, [JSON.stringify(formData), true, 'pendiente', existingId]);
                savedRecord = updateResult.rows[0];
            } else {
                const insertResult = await client.query(`INSERT INTO pendientes_aprobacion (email_usuario, tipo_solicitud, datos_json, estado, email_confirmado, fecha_solicitud) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, uuid, email_usuario, estado`, [email, 'bolsa_trabajo', JSON.stringify(formData), 'pendiente', true]);
                savedRecord = insertResult.rows[0];
            }
            await client.query('DELETE FROM bolsa_trabajo_pending_confirmation WHERE id = $1', [pendingData.id]);
            await client.query('COMMIT');
            return savedRecord;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getCvs(filters: { status?: string; limit?: number; offset?: number }): Promise<{ data: BolsaTrabajoRow[]; total: number }> {
        const { status, limit = 50, offset = 0 } = filters;
        let query = 'SELECT * FROM bolsa_trabajo';
        const params: (string | number)[] = [];
        if (status) { query += ' WHERE status = $1'; params.push(status); }
        query += ` ORDER BY fecha_registro DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const data = await executeQuery(query, params);
        const cq = status ? 'SELECT COUNT(*) FROM bolsa_trabajo WHERE status = $1' : 'SELECT COUNT(*) FROM bolsa_trabajo';
        const countResult = await executeQuery(cq, status ? [status] : []);
        return { data, total: parseInt(countResult[0].count) };
    }

    static async getCvStats(): Promise<BolsaTrabajoStats> {
        const query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'activo') as activos, COUNT(*) FILTER (WHERE status = 'inactivo') as inactivos, COUNT(*) FILTER (WHERE status = 'contratado') as contratados, COUNT(*) FILTER (WHERE DATE(fecha_creacion) = CURRENT_DATE) as hoy, COUNT(*) FILTER (WHERE DATE(fecha_creacion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana, COUNT(*) FILTER (WHERE verificado = true) as verificados FROM bolsa_trabajo`;
        const result = await executeQuery(query, []);
        const yearResult = await executeQuery('SELECT anio_egreso, COUNT(*) as cantidad FROM bolsa_trabajo GROUP BY anio_egreso ORDER BY anio_egreso DESC', []);
        const byYear = yearResult.reduce((acc: Record<string, number>, row: any) => { acc[row.anio_egreso] = parseInt(row.cantidad); return acc; }, {});
        const areaResult = await executeQuery('SELECT area_interes, COUNT(*) as cantidad FROM bolsa_trabajo WHERE area_interes IS NOT NULL GROUP BY area_interes ORDER BY cantidad DESC LIMIT 10', []);
        const byArea = areaResult.reduce((acc: Record<string, number>, row: any) => { acc[row.area_interes] = parseInt(row.cantidad); return acc; }, {});
        return { ...result[0], byYear, byArea };
    }

    static async getCvById(id: number): Promise<BolsaTrabajoRow | null> {
        const result = await executeQuery('SELECT * FROM bolsa_trabajo WHERE id = $1', [id]);
        return result[0] || null;
    }

    static async updateCv(id: number, data: Partial<BolsaTrabajoRow>): Promise<BolsaTrabajoRow | null> {
        const query = `UPDATE bolsa_trabajo SET nombre = COALESCE($1, nombre), email = COALESCE($2, email), telefono = COALESCE($3, telefono), anio_egreso = COALESCE($4, anio_egreso), area_interes = COALESCE($5, area_interes), resumen_profesional = COALESCE($6, resumen_profesional), habilidades = COALESCE($7, habilidades), status = COALESCE($8, status), fecha_actualizacion = NOW() WHERE id = $9 RETURNING *`;
        const result = await executeQuery(query, [data.nombre, data.email, data.telefono, data.anio_egreso, data.area_interes, data.resumen_profesional, data.habilidades, data.status, id]);
        return result[0] || null;
    }

    static async deleteCv(id: number): Promise<{ id: number } | null> {
        const result = await executeQuery('DELETE FROM bolsa_trabajo WHERE id = $1 RETURNING id', [id]);
        return result[0] || null;
    }

    static async getAll(filters: { estado?: string; limit?: number; offset?: number }): Promise<{ data: BolsaTrabajoRow[]; total: number }> {
        const { estado, limit = 50, offset = 0 } = filters;
        let query = 'SELECT * FROM bolsa_trabajo';
        const params: (string | number)[] = [];
        if (estado) { query += ' WHERE estado = $1'; params.push(estado); }
        query += ` ORDER BY fecha_registro DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const data = await executeQuery(query, params);
        const cq = estado ? 'SELECT COUNT(*) FROM bolsa_trabajo WHERE estado = $1' : 'SELECT COUNT(*) FROM bolsa_trabajo';
        const countResult = await executeQuery(cq, estado ? [estado] : []);
        return { data, total: parseInt(countResult[0].count) };
    }

    static async getGeneralStats(): Promise<BolsaTrabajoStats> {
        const query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE estado = 'nuevo') as nuevos, COUNT(*) FILTER (WHERE estado = 'revisado') as revisados, COUNT(*) FILTER (WHERE estado = 'contactado') as contactados, COUNT(*) FILTER (WHERE DATE(fecha_registro) = CURRENT_DATE) as hoy, COUNT(*) FILTER (WHERE DATE(fecha_registro) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana FROM bolsa_trabajo`;
        const result = await executeQuery(query, []);
        const yearResult = await executeQuery('SELECT generacion, COUNT(*) as cantidad FROM bolsa_trabajo WHERE generacion IS NOT NULL GROUP BY generacion ORDER BY generacion DESC', []);
        const byYear = yearResult.reduce((acc: Record<string, number>, row: any) => { acc[row.generacion] = parseInt(row.cantidad); return acc; }, {});
        const expResult = await executeQuery(`SELECT CASE WHEN experiencia IS NULL OR experiencia = '' THEN 'Sin experiencia' ELSE 'Con experiencia' END as tipo_experiencia, COUNT(*) as cantidad FROM bolsa_trabajo GROUP BY tipo_experiencia ORDER BY cantidad DESC`, []);
        const byExperiencia = expResult.reduce((acc: Record<string, number>, row: any) => { acc[row.tipo_experiencia] = parseInt(row.cantidad); return acc; }, {});
        return { ...result[0], byYear, byExperiencia };
    }

    static async getPendingApprovals(filters: { status?: string; email_confirmado?: string | boolean; limit?: number; offset?: number }): Promise<{ data: PendingApprovalRow[]; total: number }> {
        const { status, email_confirmado, limit = 50, offset = 0 } = filters;
        let query = `SELECT id, uuid, tipo_solicitud, email_usuario, datos_json, estado, email_confirmado, fecha_solicitud, admin_id, admin_notas FROM pendientes_aprobacion WHERE tipo_solicitud = 'bolsa_trabajo'`;
        const params: (string | number | boolean)[] = [];
        let pc = 0;
        if (status) { query += ` AND estado = $${++pc}`; params.push(status); }
        if (email_confirmado !== undefined && email_confirmado !== 'undefined') { query += ` AND email_confirmado = $${++pc}`; params.push(email_confirmado === 'true' || email_confirmado === true); }
        query += ` ORDER BY fecha_solicitud DESC LIMIT $${++pc} OFFSET $${++pc}`;
        params.push(limit, offset);
        const data = await executeQuery(query, params);

        let cq = `SELECT COUNT(*) FROM pendientes_aprobacion WHERE tipo_solicitud = 'bolsa_trabajo'`;
        const cp: (string | boolean)[] = [];
        let cpc = 0;
        if (status) { cq += ` AND estado = $${++cpc}`; cp.push(status); }
        if (email_confirmado !== undefined && email_confirmado !== 'undefined') { cq += ` AND email_confirmado = $${++cpc}`; cp.push(email_confirmado === 'true' || email_confirmado === true); }
        const countResult = await executeQuery(cq, cp);
        return { data, total: parseInt(countResult[0].count) };
    }

    static async getSolicitudById(id: number): Promise<{ id: number; uuid: string; email_usuario: string; datos_json: Record<string, any>; estado: string; tipo_solicitud: string } | null> {
        const result = await executeQuery(
            `SELECT id, uuid, email_usuario, datos_json, estado, tipo_solicitud FROM pendientes_aprobacion WHERE id = $1 AND tipo_solicitud = 'bolsa_trabajo'`,
            [id]
        );
        return result[0] || null;
    }

    static async updateSolicitudStatus(id: number, estado: string, adminNotas: string | null, adminId: number | null): Promise<{ id: number; uuid: string; estado: string; email_usuario: string } | null> {
        const result = await executeQuery(
            `UPDATE pendientes_aprobacion SET estado = $1, admin_notas = $2, admin_id = $3, fecha_procesado = NOW() WHERE id = $4 RETURNING id, uuid, estado, email_usuario`,
            [estado, adminNotas || null, adminId || null, id]
        );
        return result[0] || null;
    }

    static async insertCvFromApproval(formData: Record<string, any>): Promise<{ id: number; uuid?: string }> {
        const result = await executeQuery(
            `INSERT INTO bolsa_trabajo (nombre, email, telefono, anio_egreso, area_interes, resumen_profesional, habilidades, estado, verificado, fecha_creacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING id, uuid`,
            [formData.name, formData.email, formData.phone, formData.graduationYear, formData.subject, formData.message, formData.skills ? JSON.stringify(formData.skills) : null, 'activo', true]
        );
        return result[0];
    }
}

export default BolsaTrabajoDAO;
module.exports = BolsaTrabajoDAO;
