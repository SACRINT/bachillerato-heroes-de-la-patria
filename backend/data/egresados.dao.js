"use strict";
/**
 * 🎓 EGRESADOS DAO - TypeScript
 * Capa de acceso a datos para egresados.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// EGRESADOS DAO CLASS
// =====================================================
class EgresadosDAO {
    static async getAprobados(limit = 50, offset = 0) {
        const query = `
            SELECT * FROM pendientes_aprobacion
            WHERE tipo_solicitud = 'egresados' AND estado = 'aprobado'
            ORDER BY fecha_solicitud DESC LIMIT $1 OFFSET $2
        `;
        return await (0, database_1.executeQuery)(query, [limit, offset]);
    }
    static async getStats() {
        const query = `
            SELECT COUNT(*) as total,
                SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
            FROM pendientes_aprobacion WHERE tipo_solicitud = 'egresados'
        `;
        const result = await (0, database_1.executeQuery)(query, []);
        return result[0] || { total: 0, aprobados: 0, pendientes: 0 };
    }
    static async createPendingConfirmation(email, datosJSON, confirmationToken) {
        const client = await database_1.pool.connect();
        try {
            const insertQuery = `
                INSERT INTO egresados_pending_confirmation (email_usuario, datos_json, confirmation_token)
                VALUES ($1, $2, $3)
                ON CONFLICT (email_usuario) DO UPDATE SET
                    datos_json = EXCLUDED.datos_json,
                    confirmation_token = EXCLUDED.confirmation_token,
                    token_expires_at = (now() + '24 hours'::interval),
                    fecha_actualizacion = now()
                RETURNING confirmation_token;
            `;
            const result = await client.query(insertQuery, [email, JSON.stringify(datosJSON), confirmationToken]);
            return result.rows[0].confirmation_token;
        }
        finally {
            client.release();
        }
    }
    static async getPendingByToken(token) {
        const result = await (0, database_1.executeQuery)('SELECT * FROM egresados_pending_confirmation WHERE confirmation_token = $1', [token]);
        return result[0] || null;
    }
    static async confirmEmail(token) {
        const client = await database_1.pool.connect();
        try {
            const pending = await client.query('SELECT * FROM egresados_pending_confirmation WHERE confirmation_token = $1', [token]);
            if (pending.rows.length === 0)
                return { success: false, error: 'Token inválido o expirado.' };
            const pendingData = pending.rows[0];
            if (new Date() > new Date(pendingData.token_expires_at)) {
                await client.query('DELETE FROM egresados_pending_confirmation WHERE id = $1', [pendingData.id]);
                return { success: false, error: 'Token expirado.' };
            }
            const datosJSON = pendingData.datos_json;
            const email = pendingData.email_usuario;
            await client.query('BEGIN');
            try {
                const existing = await client.query('SELECT id FROM pendientes_aprobacion WHERE email_usuario = $1 AND tipo_solicitud = $2', [email, 'egresados']);
                if (existing.rows.length > 0) {
                    await client.query('UPDATE pendientes_aprobacion SET datos_json = $1, fecha_solicitud = NOW(), email_confirmado = $2, estado = $3 WHERE id = $4', [JSON.stringify(datosJSON), true, 'pendiente', existing.rows[0].id]);
                }
                else {
                    await client.query('INSERT INTO pendientes_aprobacion (tipo_solicitud, email_usuario, datos_json, estado, email_confirmado, fecha_solicitud) VALUES ($1, $2, $3, $4, $5, NOW())', ['egresados', email, JSON.stringify(datosJSON), 'pendiente', true]);
                }
                await client.query('DELETE FROM egresados_pending_confirmation WHERE id = $1', [pendingData.id]);
                await client.query('COMMIT');
                return { success: true, datos: datosJSON };
            }
            catch (innerError) {
                await client.query('ROLLBACK');
                throw innerError;
            }
        }
        finally {
            client.release();
        }
    }
}
exports.default = EgresadosDAO;
module.exports = EgresadosDAO;
//# sourceMappingURL=egresados.dao.js.map