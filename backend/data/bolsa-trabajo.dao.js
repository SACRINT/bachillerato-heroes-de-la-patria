/**
 * 💼 BOLSA TRABAJO DAO @author Gemini Code @date 2025-12-05
 */
const { executeQuery, pool } = require('../config/database');

class BolsaTrabajoDAO {
    // Tabla temporal de confirmación
    static async createPendingConfirmation(email, formData, token) {
        const query = `INSERT INTO bolsa_trabajo_pending_confirmation (email_usuario, datos_json, confirmation_token)
            VALUES ($1, $2, $3) ON CONFLICT (email_usuario) DO UPDATE SET datos_json = EXCLUDED.datos_json,
            confirmation_token = EXCLUDED.confirmation_token, token_expires_at = (now() + '24 hours'::interval),
            fecha_actualizacion = now() RETURNING confirmation_token`;
        const result = await executeQuery(query, [email, JSON.stringify(formData), token]);
        return result[0];
    }

    static async getPendingByToken(token) {
        const result = await executeQuery('SELECT id, email_usuario, datos_json, token_expires_at FROM bolsa_trabajo_pending_confirmation WHERE confirmation_token = $1', [token]);
        return result[0] || null;
    }

    static async deletePendingById(id) {
        await executeQuery('DELETE FROM bolsa_trabajo_pending_confirmation WHERE id = $1', [id]);
    }

    // Método con transacción para confirmar email
    static async confirmEmail(pendingData, formData) {
        const client = await pool.connect();
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

    // CVs en bolsa_trabajo final
    static async getCvs({ status, limit = 50, offset = 0 }) {
        let query = 'SELECT * FROM bolsa_trabajo'; const params = [];
        if (status) { query += ' WHERE status = $1'; params.push(status); }
        query += ` ORDER BY fecha_registro DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));
        const data = await executeQuery(query, params);
        const cq = status ? 'SELECT COUNT(*) FROM bolsa_trabajo WHERE status = $1' : 'SELECT COUNT(*) FROM bolsa_trabajo';
        const countResult = await executeQuery(cq, status ? [status] : []);
        return { data, total: parseInt(countResult[0].count) };
    }

    static async getCvStats() {
        const query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'activo') as activos, COUNT(*) FILTER (WHERE status = 'inactivo') as inactivos, COUNT(*) FILTER (WHERE status = 'contratado') as contratados, COUNT(*) FILTER (WHERE DATE(fecha_creacion) = CURRENT_DATE) as hoy, COUNT(*) FILTER (WHERE DATE(fecha_creacion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana, COUNT(*) FILTER (WHERE verificado = true) as verificados FROM bolsa_trabajo`;
        const result = await executeQuery(query, []);
        const yearResult = await executeQuery('SELECT anio_egreso, COUNT(*) as cantidad FROM bolsa_trabajo GROUP BY anio_egreso ORDER BY anio_egreso DESC', []);
        const byYear = yearResult.reduce((acc, row) => { acc[row.anio_egreso] = parseInt(row.cantidad); return acc; }, {});
        const areaResult = await executeQuery('SELECT area_interes, COUNT(*) as cantidad FROM bolsa_trabajo WHERE area_interes IS NOT NULL GROUP BY area_interes ORDER BY cantidad DESC LIMIT 10', []);
        const byArea = areaResult.reduce((acc, row) => { acc[row.area_interes] = parseInt(row.cantidad); return acc; }, {});
        return { ...result[0], byYear, byArea };
    }

    static async getCvById(id) {
        const result = await executeQuery('SELECT * FROM bolsa_trabajo WHERE id = $1', [id]);
        return result[0] || null;
    }

    static async updateCv(id, data) {
        const query = `UPDATE bolsa_trabajo SET nombre = COALESCE($1, nombre), email = COALESCE($2, email), telefono = COALESCE($3, telefono), anio_egreso = COALESCE($4, anio_egreso), area_interes = COALESCE($5, area_interes), resumen_profesional = COALESCE($6, resumen_profesional), habilidades = COALESCE($7, habilidades), status = COALESCE($8, status), fecha_actualizacion = NOW() WHERE id = $9 RETURNING *`;
        const result = await executeQuery(query, [data.nombre, data.email, data.telefono, data.anio_egreso, data.area_interes, data.resumen_profesional, data.habilidades, data.status, id]);
        return result[0] || null;
    }

    static async deleteCv(id) {
        const result = await executeQuery('DELETE FROM bolsa_trabajo WHERE id = $1 RETURNING id', [id]);
        return result[0] || null;
    }

    static async getAll({ estado, limit = 50, offset = 0 }) {
        let query = 'SELECT * FROM bolsa_trabajo'; const params = [];
        if (estado) { query += ' WHERE estado = $1'; params.push(estado); }
        query += ` ORDER BY fecha_registro DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));
        const data = await executeQuery(query, params);
        const cq = estado ? 'SELECT COUNT(*) FROM bolsa_trabajo WHERE estado = $1' : 'SELECT COUNT(*) FROM bolsa_trabajo';
        const countResult = await executeQuery(cq, estado ? [estado] : []);
        return { data, total: parseInt(countResult[0].count) };
    }

    static async getGeneralStats() {
        const query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE estado = 'nuevo') as nuevos, COUNT(*) FILTER (WHERE estado = 'revisado') as revisados, COUNT(*) FILTER (WHERE estado = 'contactado') as contactados, COUNT(*) FILTER (WHERE DATE(fecha_registro) = CURRENT_DATE) as hoy, COUNT(*) FILTER (WHERE DATE(fecha_registro) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana FROM bolsa_trabajo`;
        const result = await executeQuery(query, []);
        const yearResult = await executeQuery('SELECT generacion, COUNT(*) as cantidad FROM bolsa_trabajo WHERE generacion IS NOT NULL GROUP BY generacion ORDER BY generacion DESC', []);
        const byYear = yearResult.reduce((acc, row) => { acc[row.generacion] = parseInt(row.cantidad); return acc; }, {});
        const expResult = await executeQuery(`SELECT CASE WHEN experiencia IS NULL OR experiencia = '' THEN 'Sin experiencia' ELSE 'Con experiencia' END as tipo_experiencia, COUNT(*) as cantidad FROM bolsa_trabajo GROUP BY tipo_experiencia ORDER BY cantidad DESC`, []);
        const byExperiencia = expResult.reduce((acc, row) => { acc[row.tipo_experiencia] = parseInt(row.cantidad); return acc; }, {});
        return { ...result[0], byYear, byExperiencia };
    }

    static async getPendingApprovals({ status, email_confirmado, limit = 50, offset = 0 }) {
        let query = `SELECT id, uuid, tipo_solicitud, email_usuario, datos_json, estado, email_confirmado, fecha_solicitud, admin_id, admin_notas FROM pendientes_aprobacion WHERE tipo_solicitud = 'bolsa_trabajo'`;
        const params = []; let pc = 0;
        if (status) { query += ` AND estado = $${++pc}`; params.push(status); }
        if (email_confirmado !== undefined && email_confirmado !== 'undefined') { query += ` AND email_confirmado = $${++pc}`; params.push(email_confirmado === 'true' || email_confirmado === true); }
        query += ` ORDER BY fecha_solicitud DESC LIMIT $${++pc} OFFSET $${++pc}`;
        params.push(parseInt(limit), parseInt(offset));
        const data = await executeQuery(query, params);

        let cq = `SELECT COUNT(*) FROM pendientes_aprobacion WHERE tipo_solicitud = 'bolsa_trabajo'`;
        const cp = []; let cpc = 0;
        if (status) { cq += ` AND estado = $${++cpc}`; cp.push(status); }
        if (email_confirmado !== undefined && email_confirmado !== 'undefined') { cq += ` AND email_confirmado = $${++cpc}`; cp.push(email_confirmado === 'true' || email_confirmado === true); }
        const countResult = await executeQuery(cq, cp);
        return { data, total: parseInt(countResult[0].count) };
    }

    /**
     * Obtener solicitud pendiente por ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async getSolicitudById(id) {
        const result = await executeQuery(
            `SELECT id, uuid, email_usuario, datos_json, estado, tipo_solicitud FROM pendientes_aprobacion WHERE id = $1 AND tipo_solicitud = 'bolsa_trabajo'`,
            [id]
        );
        return result[0] || null;
    }

    /**
     * Actualizar estado de solicitud
     * @param {number} id
     * @param {string} estado
     * @param {string|null} adminNotas
     * @param {number|null} adminId
     * @returns {Promise<Object|null>}
     */
    static async updateSolicitudStatus(id, estado, adminNotas, adminId) {
        const result = await executeQuery(
            `UPDATE pendientes_aprobacion SET estado = $1, admin_notas = $2, admin_id = $3, fecha_procesado = NOW() WHERE id = $4 RETURNING id, uuid, estado, email_usuario`,
            [estado, adminNotas || null, adminId || null, id]
        );
        return result[0] || null;
    }

    /**
     * Insertar CV desde aprobación
     * @param {Object} formData
     * @returns {Promise<Object>}
     */
    static async insertCvFromApproval(formData) {
        const result = await executeQuery(
            `INSERT INTO bolsa_trabajo (nombre, email, telefono, anio_egreso, area_interes, resumen_profesional, habilidades, estado, verificado, fecha_creacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING id, uuid`,
            [formData.name, formData.email, formData.phone, formData.graduationYear, formData.subject, formData.message, formData.skills ? JSON.stringify(formData.skills) : null, 'activo', true]
        );
        return result[0];
    }
}
module.exports = BolsaTrabajoDAO;
