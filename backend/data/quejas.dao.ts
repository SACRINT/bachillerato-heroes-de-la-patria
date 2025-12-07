/**
 * 📝 QUEJAS DAO - TypeScript
 * Data Access Object para quejas y sugerencias
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface QuejaRow {
    id: number;
    nombre: string;
    email: string;
    subject: 'queja' | 'sugerencia' | 'felicitacion';
    message: string;
    form_type: string;
    ip_address?: string;
    user_agent?: string;
    status: 'pendiente' | 'en_revision' | 'respondida';
    respuesta?: string;
    respondido_por?: number;
    fecha_creacion: Date;
    fecha_respuesta?: Date;
    fecha_actualizacion?: Date;
}

export interface QuejaCreateData {
    nombre: string;
    email: string;
    subject: string;
    message: string;
    form_type?: string;
    ip_address?: string;
    user_agent?: string;
}

export interface QuejaStats {
    total: number;
    pendientes: number;
    en_revision: number;
    respondidas: number;
    quejas: number;
    sugerencias: number;
    felicitaciones: number;
    hoy: number;
    esta_semana: number;
}

// =====================================================
// QUEJAS DAO CLASS
// =====================================================

class QuejasDAO {

    static async create(data: QuejaCreateData): Promise<QuejaRow> {
        const query = `INSERT INTO quejas (nombre, email, subject, message, form_type, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
        const result = await executeQuery(query, [data.nombre, data.email, data.subject, data.message, data.form_type || 'quejas', data.ip_address, data.user_agent]);
        return result[0];
    }

    static async getAll(filters: { status?: string; limit?: number; offset?: number }): Promise<QuejaRow[]> {
        const { status, limit = 50, offset = 0 } = filters;
        let query = 'SELECT * FROM quejas';
        const params: (string | number)[] = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ` ORDER BY fecha_creacion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        return await executeQuery(query, params);
    }

    static async getStats(): Promise<QuejaStats> {
        const query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes,
            COUNT(*) FILTER (WHERE status = 'en_revision') as en_revision, COUNT(*) FILTER (WHERE status = 'respondida') as respondidas,
            COUNT(*) FILTER (WHERE subject = 'queja') as quejas, COUNT(*) FILTER (WHERE subject = 'sugerencia') as sugerencias,
            COUNT(*) FILTER (WHERE subject = 'felicitacion') as felicitaciones,
            COUNT(*) FILTER (WHERE DATE(fecha_creacion) = CURRENT_DATE) as hoy,
            COUNT(*) FILTER (WHERE DATE(fecha_creacion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana FROM quejas`;
        const result = await executeQuery(query, []);
        return result[0];
    }

    static async getById(id: number): Promise<QuejaRow | null> {
        const result = await executeQuery('SELECT * FROM quejas WHERE id = $1', [id]);
        return result[0] || null;
    }

    static async update(id: number, data: { status?: string; respuesta?: string; respondido_por?: number }): Promise<QuejaRow | null> {
        const query = `UPDATE quejas SET status = COALESCE($1, status), respuesta = COALESCE($2, respuesta),
            respondido_por = COALESCE($3, respondido_por), fecha_respuesta = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE fecha_respuesta END,
            fecha_actualizacion = NOW() WHERE id = $4 RETURNING *`;
        const result = await executeQuery(query, [data.status, data.respuesta, data.respondido_por, id]);
        return result[0] || null;
    }

    static async delete(id: number): Promise<{ id: number } | null> {
        const result = await executeQuery('DELETE FROM quejas WHERE id = $1 RETURNING id', [id]);
        return result[0] || null;
    }
}

export default QuejasDAO;
module.exports = QuejasDAO;
