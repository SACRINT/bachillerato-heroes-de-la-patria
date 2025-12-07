/**
 * ✅ APPROVALS DAO - TypeScript
 * Data Access Object para aprobaciones pendientes
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface ApprovalStats {
    total: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
    emails_verificados: number;
    hoy: number;
    esta_semana: number;
    byFormType: Array<{ form_type: string; status: string; cantidad: number }>;
}

export interface ApprovalRow {
    id: number;
    form_type: string;
    submission_data: Record<string, any>;
    email: string;
    status: 'pending' | 'approved' | 'rejected';
    email_verified: boolean;
    reviewed_by?: string;
    review_notes?: string;
    rejection_reason?: string;
    reviewed_at?: Date;
    created_at: Date;
}

export interface ApprovalHistoryFilters {
    status?: string;
    form_type?: string;
    limit?: number;
    offset?: number;
}

// =====================================================
// APPROVALS DAO CLASS
// =====================================================

class ApprovalsDAO {

    static async getStats(): Promise<ApprovalStats> {
        const query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
            COUNT(*) FILTER (WHERE status = 'approved') as aprobadas, COUNT(*) FILTER (WHERE status = 'rejected') as rechazadas,
            COUNT(*) FILTER (WHERE email_verified = true) as emails_verificados,
            COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as hoy,
            COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana FROM pending_approvals`;
        const result = await executeQuery(query, []);
        const typeQuery = `SELECT form_type, status, COUNT(*) as cantidad FROM pending_approvals GROUP BY form_type, status ORDER BY cantidad DESC`;
        const typeResult = await executeQuery(typeQuery, []);
        return { ...result[0], byFormType: typeResult };
    }

    static async getById(id: number): Promise<ApprovalRow | null> {
        const result = await executeQuery("SELECT * FROM pending_approvals WHERE id = $1 AND status = 'pending'", [id]);
        return result[0] || null;
    }

    static async saveToBolsaTrabajo(data: Record<string, any>, ipAddress: string, userAgent: string): Promise<number | null> {
        const query = `INSERT INTO bolsa_trabajo_cv (nombre, email, telefono, puesto_deseado, cv_path, nivel_experiencia, disponibilidad, comentarios_adicionales, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`;
        const result = await executeQuery(query, [
            data.name || data.nombre, data.email, data.phone || data.telefono || '', data.position || data.puesto_deseado || 'No especificado',
            data.cv || data.cv_path || '', data.experience || data.nivel_experiencia || 'Sin experiencia',
            data.availability || data.disponibilidad || 'Inmediata', data.comments || data.comentarios_adicionales || '', ipAddress, userAgent
        ]);
        return result[0]?.id || null;
    }

    static async saveToEgresados(data: Record<string, any>, ipAddress: string, userAgent: string): Promise<number | null> {
        const query = `INSERT INTO egresados (nombre_completo, email, telefono, generacion, ocupacion_actual, empresa, ciudad, estado, comentarios, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`;
        const result = await executeQuery(query, [
            data.name || data.nombre_completo, data.email, data.phone || data.telefono || '',
            data.graduationYear || data.generacion || new Date().getFullYear(), data.currentJob || data.ocupacion_actual || 'No especificado',
            data.company || data.empresa || '', data.city || data.ciudad || '', data.state || data.estado || '',
            data.message || data.comentarios || '', ipAddress, userAgent
        ]);
        return result[0]?.id || null;
    }

    static async approve(id: number, reviewedBy: string | null, reviewNotes: string | null): Promise<ApprovalRow | null> {
        const query = `UPDATE pending_approvals SET status = 'approved', reviewed_by = $1, review_notes = $2, reviewed_at = NOW() WHERE id = $3 RETURNING *`;
        const result = await executeQuery(query, [reviewedBy || 'Administrador', reviewNotes, id]);
        return result[0] || null;
    }

    static async reject(id: number, reviewedBy: string | null, reviewNotes: string | null, rejectionReason: string | null): Promise<ApprovalRow | null> {
        const query = `UPDATE pending_approvals SET status = 'rejected', reviewed_by = $1, review_notes = $2, rejection_reason = $3, reviewed_at = NOW() WHERE id = $4 RETURNING *`;
        const result = await executeQuery(query, [reviewedBy || 'Administrador', reviewNotes || '', rejectionReason || 'Información incompleta o incorrecta', id]);
        return result[0] || null;
    }

    static async getHistory(filters: ApprovalHistoryFilters): Promise<{ data: ApprovalRow[]; total: number }> {
        const { status, form_type, limit = 50, offset = 0 } = filters;

        let query = "SELECT * FROM pending_approvals WHERE status != 'pending'";
        const params: (string | number)[] = [];
        let pc = 0;

        if (status) { query += ` AND status = $${++pc}`; params.push(status); }
        if (form_type) { query += ` AND form_type = $${++pc}`; params.push(form_type); }

        query += ` ORDER BY reviewed_at DESC LIMIT $${++pc} OFFSET $${++pc}`;
        params.push(limit, offset);
        const data = await executeQuery(query, params);

        let cq = "SELECT COUNT(*) FROM pending_approvals WHERE status != 'pending'";
        const cp: string[] = [];
        let cpc = 0;
        if (status) { cq += ` AND status = $${++cpc}`; cp.push(status); }
        if (form_type) { cq += ` AND form_type = $${++cpc}`; cp.push(form_type); }
        const countResult = await executeQuery(cq, cp);

        return { data, total: parseInt(countResult[0].count) };
    }
}

export default ApprovalsDAO;
module.exports = ApprovalsDAO;
