/**
 * 📧 CONTACT DAO - TypeScript
 * Capa de acceso a datos para mensajes de contacto.
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface ContactRow {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    tipo_consulta?: string;
    asunto: string;
    mensaje: string;
    form_type: string;
    ip_address?: string;
    user_agent?: string;
    email_sent: boolean;
    verificado: boolean;
    status: 'pendiente' | 'en_revision' | 'respondida';
    fecha_creacion: Date;
}

export interface ContactCreateData {
    nombre: string;
    email: string;
    telefono?: string;
    tipo_consulta?: string;
    asunto: string;
    mensaje: string;
    form_type: string;
    ip_address?: string;
    user_agent?: string;
    email_sent?: boolean;
    verificado?: boolean;
    status?: string;
}

export interface PendingSubmissionData {
    form_type: string;
    formData: Record<string, any>;
    token: string;
    email: string;
    ip_address?: string;
    user_agent?: string;
}

export interface ContactMessagesResult {
    messages: ContactRow[];
    total: number;
    page: number;
    totalPages: number;
}

export interface ContactStats {
    total: number;
    pendientes: number;
    en_revision: number;
    respondidas: number;
    hoy: number;
    esta_semana: number;
    este_mes: number;
    verificados: number;
    enviados: number;
}

// =====================================================
// CONTACT DAO CLASS
// =====================================================

class ContactDAO {

    static async create(contactData: ContactCreateData): Promise<ContactRow> {
        const {
            nombre, email, telefono, tipo_consulta, asunto, mensaje,
            form_type, ip_address, user_agent, email_sent = true,
            verificado = true, status = 'pendiente'
        } = contactData;

        const query = `
            INSERT INTO contactos (
                nombre, email, telefono, tipo_consulta, asunto, mensaje,
                form_type, ip_address, user_agent, email_sent, verificado, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;

        const result = await executeQuery(query, [
            nombre, email, telefono || null, tipo_consulta || null,
            asunto, mensaje, form_type, ip_address || null,
            user_agent || null, email_sent, verificado, status
        ]);

        return result[0];
    }

    static async createPendingSubmission(submissionData: PendingSubmissionData): Promise<{ id: number }> {
        const { form_type, formData, token, email, ip_address, user_agent } = submissionData;

        const query = `
            INSERT INTO pending_submissions (
                form_type, submission_data, verification_token,
                email_verified, verification_email, ip_address, user_agent, verified_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id;
        `;

        const result = await executeQuery(query, [
            form_type,
            JSON.stringify(formData),
            token,
            true,
            email,
            ip_address || null,
            user_agent || null
        ]);

        return result[0];
    }

    static async getMessages({ limit = 50, page = 1, status = null }: { limit?: number; page?: number; status?: string | null }): Promise<ContactMessagesResult> {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM contactos';
        const params: (string | number)[] = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ` ORDER BY fecha_creacion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const messages = await executeQuery(query, params);

        const countQuery = status ?
            'SELECT COUNT(*) FROM contactos WHERE status = $1' :
            'SELECT COUNT(*) FROM contactos';
        const countParams = status ? [status] : [];
        const countResult = await executeQuery(countQuery, countParams);
        const total = parseInt(countResult[0].count);

        return {
            messages,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    static async getStats(): Promise<ContactStats> {
        const query = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE status = 'en_revision') as en_revision,
                COUNT(*) FILTER (WHERE status = 'respondida') as respondidas,
                COUNT(*) FILTER (WHERE DATE(fecha_creacion) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_creacion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana,
                COUNT(*) FILTER (WHERE DATE(fecha_creacion) >= DATE_TRUNC('month', CURRENT_DATE)) as este_mes,
                COUNT(*) FILTER (WHERE verificado = true) as verificados,
                COUNT(*) FILTER (WHERE email_sent = true) as enviados
            FROM contactos;
        `;

        const result = await executeQuery(query, []);
        return result[0];
    }

    static async getStatsByType(): Promise<Record<string, number>> {
        const query = `
            SELECT tipo_consulta, COUNT(*) as cantidad
            FROM contactos
            WHERE tipo_consulta IS NOT NULL
            GROUP BY tipo_consulta
            ORDER BY cantidad DESC;
        `;

        const result = await executeQuery(query, []);
        return result.reduce((acc: Record<string, number>, row: any) => {
            acc[row.tipo_consulta] = parseInt(row.cantidad);
            return acc;
        }, {});
    }
}

export default ContactDAO;
module.exports = ContactDAO;
