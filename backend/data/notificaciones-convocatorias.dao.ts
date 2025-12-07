/**
 * 🔔 NOTIFICACIONES CONVOCATORIAS DAO - TypeScript
 * Capa de acceso a datos para suscripciones a convocatorias.
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface ConvocatoriaSubscription {
    id: number;
    nombre: string;
    email: string;
    tipo_interes: string;
    status: string; // 'activo', 'inactivo', 'cancelado'
    ip_address: string;
    user_agent: string;
    fecha_suscripcion: Date;
    fecha_baja?: Date;
    verificado?: boolean;
}

export interface CreateSubscriptionInput {
    nombre: string;
    email: string;
    tipo_interes: string;
    ip_address: string;
    user_agent: string;
}

export interface SubscriptionFilter {
    status?: string;
    limit?: number;
    offset?: number;
}

export interface SubscriptionListResult {
    data: ConvocatoriaSubscription[];
    total: number;
}

export interface SubscriptionStats {
    total: number;
    activos: number;
    inactivos: number;
    cancelados: number;
    hoy: number;
    esta_semana: number;
    verificados: number;
    byTipo: Record<string, number>;
}

// =====================================================
// NOTIFICACIONES CONVOCATORIAS DAO CLASS
// =====================================================

class NotificacionesConvocatoriasDAO {

    static async getByEmail(email: string): Promise<{ id: number; status: string } | null> {
        const result = await executeQuery('SELECT id, status FROM notificaciones_convocatorias WHERE email = $1', [email]);
        return result[0] || null;
    }

    static async reactivate(email: string, data: Partial<CreateSubscriptionInput>): Promise<ConvocatoriaSubscription> {
        const query = `
            UPDATE notificaciones_convocatorias SET
                nombre = COALESCE($1, nombre), tipo_interes = COALESCE($2, tipo_interes),
                status = 'activo', fecha_suscripcion = NOW(), fecha_baja = NULL,
                ip_address = $3, user_agent = $4
            WHERE email = $5 RETURNING *;
        `;
        const result = await executeQuery(query, [data.nombre, data.tipo_interes, data.ip_address, data.user_agent, email]);
        return result[0];
    }

    static async create(data: CreateSubscriptionInput): Promise<ConvocatoriaSubscription> {
        const query = `
            INSERT INTO notificaciones_convocatorias (nombre, email, tipo_interes, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const result = await executeQuery(query, [data.nombre, data.email, data.tipo_interes, data.ip_address, data.user_agent]);
        return result[0];
    }

    static async getAll({ status, limit = 50, offset = 0 }: SubscriptionFilter): Promise<SubscriptionListResult> {
        let query = 'SELECT * FROM notificaciones_convocatorias';
        const params: any[] = [];
        if (status) { query += ' WHERE status = $1'; params.push(status); }
        query += ` ORDER BY fecha_suscripcion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit as any), parseInt(offset as any));

        const data = await executeQuery(query, params);
        const countQuery = status ? 'SELECT COUNT(*) FROM notificaciones_convocatorias WHERE status = $1' : 'SELECT COUNT(*) FROM notificaciones_convocatorias';
        const countResult = await executeQuery(countQuery, status ? [status] : []);
        return { data: data as ConvocatoriaSubscription[], total: parseInt(countResult[0].count) };
    }

    static async getStats(): Promise<SubscriptionStats> {
        const query = `
            SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'activo') as activos,
                COUNT(*) FILTER (WHERE status = 'inactivo') as inactivos,
                COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
                COUNT(*) FILTER (WHERE DATE(fecha_suscripcion) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_suscripcion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana,
                COUNT(*) FILTER (WHERE verificado = true) as verificados
            FROM notificaciones_convocatorias;
        `;
        const result = await executeQuery(query, []);

        const tipoQuery = `
            SELECT tipo_interes, COUNT(*) as cantidad FROM notificaciones_convocatorias
            WHERE tipo_interes IS NOT NULL AND status = 'activo' GROUP BY tipo_interes ORDER BY cantidad DESC;
        `;
        const tipoResult = await executeQuery(tipoQuery, []);
        const byTipo = tipoResult.reduce((acc: any, row: any) => { acc[row.tipo_interes] = parseInt(row.cantidad); return acc; }, {});

        const row = result[0];
        return {
            total: parseInt(row.total),
            activos: parseInt(row.activos),
            inactivos: parseInt(row.inactivos),
            cancelados: parseInt(row.cancelados),
            hoy: parseInt(row.hoy),
            esta_semana: parseInt(row.esta_semana),
            verificados: parseInt(row.verificados),
            byTipo
        };
    }

    static async getById(id: number): Promise<ConvocatoriaSubscription | null> {
        const result = await executeQuery('SELECT * FROM notificaciones_convocatorias WHERE id = $1', [id]);
        return result[0] || null;
    }

    static async update(id: number, data: Partial<ConvocatoriaSubscription>): Promise<ConvocatoriaSubscription | null> {
        const query = `
            UPDATE notificaciones_convocatorias SET
                nombre = COALESCE($1, nombre), tipo_interes = COALESCE($2, tipo_interes),
                status = COALESCE($3, status),
                fecha_baja = CASE WHEN $3 IN ('inactivo', 'cancelado') THEN NOW() ELSE fecha_baja END
            WHERE id = $4 RETURNING *;
        `;
        const result = await executeQuery(query, [data.nombre, data.tipo_interes, data.status, id]);
        return result[0] || null;
    }

    static async cancel(id: number): Promise<{ id: number; email: string } | null> {
        const query = `UPDATE notificaciones_convocatorias SET status = 'cancelado', fecha_baja = NOW() WHERE id = $1 RETURNING id, email`;
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    static async unsubscribeByEmail(email: string): Promise<{ id: number } | null> {
        const query = `UPDATE notificaciones_convocatorias SET status = 'cancelado', fecha_baja = NOW() WHERE email = $1 AND status = 'activo' RETURNING id`;
        const result = await executeQuery(query, [email]);
        return result[0] || null;
    }
}

export default NotificacionesConvocatoriasDAO;
module.exports = NotificacionesConvocatoriasDAO;
