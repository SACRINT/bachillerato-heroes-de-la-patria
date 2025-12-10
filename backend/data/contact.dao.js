"use strict";
/**
 * 📧 CONTACT DAO - TypeScript
 * Capa de acceso a datos para mensajes de contacto.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// CONTACT DAO CLASS
// =====================================================
class ContactDAO {
    static async create(contactData) {
        const { nombre, email, telefono, tipo_consulta, asunto, mensaje, form_type, ip_address, user_agent, email_sent = true, verificado = true, status = 'pendiente' } = contactData;
        const query = `
            INSERT INTO contactos (
                nombre, email, telefono, tipo_consulta, asunto, mensaje,
                form_type, ip_address, user_agent, email_sent, verificado, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;
        const result = await (0, database_1.executeQuery)(query, [
            nombre, email, telefono || null, tipo_consulta || null,
            asunto, mensaje, form_type, ip_address || null,
            user_agent || null, email_sent, verificado, status
        ]);
        return result[0];
    }
    static async createPendingSubmission(submissionData) {
        const { form_type, formData, token, email, ip_address, user_agent } = submissionData;
        const query = `
            INSERT INTO pending_submissions (
                form_type, submission_data, verification_token,
                email_verified, verification_email, ip_address, user_agent, verified_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id;
        `;
        const result = await (0, database_1.executeQuery)(query, [
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
    static async getMessages({ limit = 50, page = 1, status = null }) {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM contactos';
        const params = [];
        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }
        query += ` ORDER BY fecha_creacion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const messages = await (0, database_1.executeQuery)(query, params);
        const countQuery = status ?
            'SELECT COUNT(*) FROM contactos WHERE status = $1' :
            'SELECT COUNT(*) FROM contactos';
        const countParams = status ? [status] : [];
        const countResult = await (0, database_1.executeQuery)(countQuery, countParams);
        const total = parseInt(countResult[0].count);
        return {
            messages,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
    static async getStats() {
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
        const result = await (0, database_1.executeQuery)(query, []);
        return result[0];
    }
    static async getStatsByType() {
        const query = `
            SELECT tipo_consulta, COUNT(*) as cantidad
            FROM contactos
            WHERE tipo_consulta IS NOT NULL
            GROUP BY tipo_consulta
            ORDER BY cantidad DESC;
        `;
        const result = await (0, database_1.executeQuery)(query, []);
        return result.reduce((acc, row) => {
            acc[row.tipo_consulta] = parseInt(row.cantidad);
            return acc;
        }, {});
    }
}
exports.default = ContactDAO;
module.exports = ContactDAO;
//# sourceMappingURL=contact.dao.js.map