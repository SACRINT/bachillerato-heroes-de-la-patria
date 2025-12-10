"use strict";
/**
 * 📄 SOLICITUDES DOCUMENTOS DAO - TypeScript
 * Capa de acceso a datos para solicitudes de documentos.
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// SOLICITUDES DOCUMENTOS DAO CLASS
// =====================================================
class SolicitudesDocumentosDAO {
    static async create(data) {
        const query = `
            INSERT INTO solicitudes_documentos (nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        `;
        const result = await (0, database_1.executeQuery)(query, [
            data.nombre, data.email, data.tipo_usuario, data.documento_solicitado,
            data.motivo, data.nivel_urgencia, data.ip_address, data.user_agent
        ]);
        return result[0];
    }
    static async getAll({ status, tipo_usuario, nivel_urgencia, limit = 50, offset = 0 }) {
        let query = 'SELECT * FROM solicitudes_documentos WHERE 1=1';
        const params = [];
        let pc = 0;
        if (status) {
            pc++;
            query += ` AND status = $${pc}`;
            params.push(status);
        }
        if (tipo_usuario) {
            pc++;
            query += ` AND tipo_usuario = $${pc}`;
            params.push(tipo_usuario);
        }
        if (nivel_urgencia) {
            pc++;
            query += ` AND nivel_urgencia = $${pc}`;
            params.push(nivel_urgencia);
        }
        query += ` ORDER BY fecha_solicitud DESC LIMIT $${pc + 1} OFFSET $${pc + 2}`;
        params.push(parseInt(limit), parseInt(offset));
        const data = await (0, database_1.executeQuery)(query, params);
        // Count
        let cq = 'SELECT COUNT(*) FROM solicitudes_documentos WHERE 1=1';
        const cp = [];
        let cpc = 0;
        if (status) {
            cpc++;
            cq += ` AND status = $${cpc}`;
            cp.push(status);
        }
        if (tipo_usuario) {
            cpc++;
            cq += ` AND tipo_usuario = $${cpc}`;
            cp.push(tipo_usuario);
        }
        if (nivel_urgencia) {
            cpc++;
            cq += ` AND nivel_urgencia = $${cpc}`;
            cp.push(nivel_urgencia);
        }
        const countResult = await (0, database_1.executeQuery)(cq, cp);
        return { data: data, total: parseInt(countResult[0].count) };
    }
    static async getStats() {
        const query = `
            SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE status = 'en_proceso') as en_proceso,
                COUNT(*) FILTER (WHERE status = 'completado') as completados,
                COUNT(*) FILTER (WHERE status = 'rechazado') as rechazados,
                COUNT(*) FILTER (WHERE nivel_urgencia = 'urgent') as urgentes,
                COUNT(*) FILTER (WHERE nivel_urgencia = 'high') as alta_urgencia,
                COUNT(*) FILTER (WHERE DATE(fecha_solicitud) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_solicitud) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana
            FROM solicitudes_documentos;
        `;
        const result = await (0, database_1.executeQuery)(query, []);
        const tipoResult = await (0, database_1.executeQuery)('SELECT tipo_usuario, COUNT(*) as cantidad FROM solicitudes_documentos GROUP BY tipo_usuario ORDER BY cantidad DESC', []);
        const byTipoUsuario = tipoResult.reduce((acc, row) => { acc[row.tipo_usuario] = parseInt(row.cantidad); return acc; }, {});
        const docResult = await (0, database_1.executeQuery)('SELECT documento_solicitado, COUNT(*) as cantidad FROM solicitudes_documentos GROUP BY documento_solicitado ORDER BY cantidad DESC LIMIT 10', []);
        const documentosMasSolicitados = docResult.reduce((acc, row) => { acc[row.documento_solicitado] = parseInt(row.cantidad); return acc; }, {});
        const row = result[0];
        return {
            total: parseInt(row.total),
            pendientes: parseInt(row.pendientes),
            en_proceso: parseInt(row.en_proceso),
            completados: parseInt(row.completados),
            rechazados: parseInt(row.rechazados),
            urgentes: parseInt(row.urgentes),
            alta_urgencia: parseInt(row.alta_urgencia),
            hoy: parseInt(row.hoy),
            esta_semana: parseInt(row.esta_semana),
            byTipoUsuario,
            documentosMasSolicitados
        };
    }
    static async getById(id) {
        const result = await (0, database_1.executeQuery)('SELECT * FROM solicitudes_documentos WHERE id = $1', [id]);
        return result[0] || null;
    }
    static async update(id, data) {
        const query = `
            UPDATE solicitudes_documentos SET
                status = COALESCE($1, status), notas_admin = COALESCE($2, notas_admin),
                procesado_por = COALESCE($3, procesado_por),
                fecha_procesado = CASE WHEN $1 IN ('completado', 'rechazado') THEN NOW() ELSE fecha_procesado END
            WHERE id = $4 RETURNING *;
        `;
        const result = await (0, database_1.executeQuery)(query, [data.status, data.notas_admin, data.procesado_por, id]);
        return result[0] || null;
    }
    static async approve(id, notas_admin) {
        const query = `UPDATE solicitudes_documentos SET status = 'aprobada', notas_admin = $1, fecha_procesado = NOW() WHERE id = $2 RETURNING *`;
        const result = await (0, database_1.executeQuery)(query, [notas_admin || null, id]);
        return result[0] || null;
    }
    static async reject(id, motivo) {
        const query = `UPDATE solicitudes_documentos SET status = 'rechazada', notas_admin = $1, fecha_procesado = NOW() WHERE id = $2 RETURNING *`;
        const result = await (0, database_1.executeQuery)(query, [motivo, id]);
        return result[0] || null;
    }
}
exports.default = SolicitudesDocumentosDAO;
module.exports = SolicitudesDocumentosDAO;
//# sourceMappingURL=solicitudes-documentos.dao.js.map