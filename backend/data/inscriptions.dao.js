"use strict";
/**
 * 📝 INSCRIPTIONS DAO - TypeScript
 * Gestión de inscripciones a actividades
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// INSCRIPTIONS DAO CLASS
// =====================================================
class InscriptionsDAO {
    static async checkExisting(email, activityId) {
        const result = await (0, database_1.executeQuery)('SELECT id, status FROM inscripciones_actividades WHERE student_email = $1 AND activity_id = $2', [email, activityId]);
        return result[0] || null;
    }
    static async updateResubmit(id, data) {
        const query = `UPDATE inscripciones_actividades SET student_name = $1, student_id = $2, student_group = $3, emergency_contact = $4, additional_info = $5, status = 'pending', fecha_solicitud = NOW(), fecha_procesado = NULL, processed_by = NULL, admin_notes = NULL, ip_address = $6, user_agent = $7 WHERE id = $8 RETURNING *`;
        const result = await (0, database_1.executeQuery)(query, [
            data.studentName,
            data.studentId || 'Externo',
            data.studentGroup || 'No especificado',
            data.emergencyContact || 'No proporcionado',
            data.additionalInfo || '',
            data.ip_address,
            data.user_agent,
            id
        ]);
        return result[0];
    }
    static async create(data) {
        const query = `INSERT INTO inscripciones_actividades (activity_id, activity_name, student_id, student_name, student_email, student_group, emergency_contact, additional_info, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
        const result = await (0, database_1.executeQuery)(query, [
            data.activityId,
            data.activityName,
            data.studentId || 'Externo',
            data.studentName,
            data.studentEmail,
            data.studentGroup || 'No especificado',
            data.emergencyContact || 'No proporcionado',
            data.additionalInfo || '',
            data.ip_address,
            data.user_agent
        ]);
        return result[0];
    }
    static async getAll(filters) {
        const { status, activity_id, student_email, limit = 50, offset = 0 } = filters;
        let query = 'SELECT * FROM inscripciones_actividades WHERE 1=1';
        const params = [];
        let pc = 0;
        if (status) {
            pc++;
            query += ` AND status = $${pc}`;
            params.push(status);
        }
        if (activity_id) {
            pc++;
            query += ` AND activity_id = $${pc}`;
            params.push(activity_id);
        }
        if (student_email) {
            pc++;
            query += ` AND student_email ILIKE $${pc}`;
            params.push(`%${student_email}%`);
        }
        query += ` ORDER BY fecha_solicitud DESC LIMIT $${pc + 1} OFFSET $${pc + 2}`;
        params.push(limit, offset);
        const data = await (0, database_1.executeQuery)(query, params);
        let cq = 'SELECT COUNT(*) FROM inscripciones_actividades WHERE 1=1';
        const cp = [];
        let cpc = 0;
        if (status) {
            cpc++;
            cq += ` AND status = $${cpc}`;
            cp.push(status);
        }
        if (activity_id) {
            cpc++;
            cq += ` AND activity_id = $${cpc}`;
            cp.push(activity_id);
        }
        if (student_email) {
            cpc++;
            cq += ` AND student_email ILIKE $${cpc}`;
            cp.push(`%${student_email}%`);
        }
        const countResult = await (0, database_1.executeQuery)(cq, cp);
        return { data, total: parseInt(countResult[0]?.count || '0') };
    }
    static async list() {
        return await (0, database_1.executeQuery)('SELECT * FROM inscripciones_actividades ORDER BY fecha_solicitud DESC', []);
    }
    static async getStats() {
        const query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'pending') as pendientes, COUNT(*) FILTER (WHERE status = 'approved') as aprobadas, COUNT(*) FILTER (WHERE status = 'rejected') as rechazadas, COUNT(*) FILTER (WHERE status = 'cancelled') as canceladas, COUNT(*) FILTER (WHERE DATE(fecha_solicitud) = CURRENT_DATE) as hoy, COUNT(*) FILTER (WHERE DATE(fecha_solicitud) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana FROM inscripciones_actividades`;
        const result = await (0, database_1.executeQuery)(query, []);
        const actResult = await (0, database_1.executeQuery)('SELECT activity_name, COUNT(*) as cantidad, status FROM inscripciones_actividades GROUP BY activity_name, status ORDER BY cantidad DESC', []);
        return { ...result[0], byActivity: actResult };
    }
    static async getById(id) {
        const result = await (0, database_1.executeQuery)('SELECT * FROM inscripciones_actividades WHERE id = $1', [id]);
        return result[0] || null;
    }
    static async update(id, data) {
        const query = `UPDATE inscripciones_actividades SET status = COALESCE($1, status), admin_notes = COALESCE($2, admin_notes), processed_by = COALESCE($3, processed_by), fecha_procesado = CASE WHEN $1 IN ('approved', 'rejected') THEN NOW() ELSE fecha_procesado END WHERE id = $4 RETURNING *`;
        const result = await (0, database_1.executeQuery)(query, [data.status, data.admin_notes, data.processed_by, id]);
        return result[0] || null;
    }
    static async cancel(id) {
        const query = `UPDATE inscripciones_actividades SET status = 'cancelled', fecha_procesado = NOW() WHERE id = $1 RETURNING id, activity_name`;
        const result = await (0, database_1.executeQuery)(query, [id]);
        return result[0] || null;
    }
}
exports.default = InscriptionsDAO;
module.exports = InscriptionsDAO;
//# sourceMappingURL=inscriptions.dao.js.map