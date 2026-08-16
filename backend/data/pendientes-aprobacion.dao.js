"use strict";
/**
 * 📋 PENDIENTES APROBACION DAO - TypeScript
 * Capa de acceso a datos para aprobaciones pendientes
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// PENDIENTES APROBACION DAO CLASS
// =====================================================
class PendientesAprobacionDAO {
    static async getAll({ tipo, estado, limit = 50, offset = 0 }) {
        let query = `SELECT * FROM pendientes_aprobacion WHERE estado IN ('pendiente_confirmacion', 'pendiente')`;
        const params = [];
        if (estado) {
            query += ` AND estado = $${params.length + 1}`;
            params.push(estado);
        }
        if (tipo) {
            query += ` AND tipo_solicitud = $${params.length + 1}`;
            params.push(tipo);
        }
        query += ` ORDER BY fecha_solicitud DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));
        const data = await (0, database_1.executeQuery)(query, params);
        let cq = `SELECT COUNT(*) as count FROM pendientes_aprobacion WHERE estado IN ('pendiente_confirmacion', 'pendiente')`;
        const cp = [];
        if (estado) {
            cq += ` AND estado = $${cp.length + 1}`;
            cp.push(estado);
        }
        if (tipo) {
            cq += ` AND tipo_solicitud = $${cp.length + 1}`;
            cp.push(tipo);
        }
        const countResult = await (0, database_1.executeQuery)(cq, cp);
        return { data: data, total: parseInt(countResult[0].count) };
    }
    static async getById(id) {
        const result = await (0, database_1.executeQuery)('SELECT * FROM pendientes_aprobacion WHERE id = $1', [id]);
        return result[0] || null;
    }
    static async delete(id) {
        const result = await (0, database_1.executeQuery)('DELETE FROM pendientes_aprobacion WHERE id = $1 RETURNING id', [id]);
        return result[0] || null;
    }
    static async getStats() {
        const query = `SELECT COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
            COUNT(*) FILTER (WHERE estado = 'aprobada') as aprobadas, COUNT(*) FILTER (WHERE estado = 'rechazada') as rechazadas,
            COUNT(*) FILTER (WHERE tipo_solicitud = 'egresado') as egresados, COUNT(*) FILTER (WHERE tipo_solicitud = 'bolsa_trabajo') as bolsa_trabajo,
            COUNT(*) FILTER (WHERE tipo_solicitud = 'egresado' AND estado = 'pendiente') as egresados_pendientes,
            COUNT(*) FILTER (WHERE tipo_solicitud = 'bolsa_trabajo' AND estado = 'pendiente') as bolsa_trabajo_pendientes,
            COUNT(*) as total FROM pendientes_aprobacion`;
        const result = await (0, database_1.executeQuery)(query, []);
        const row = result[0];
        return {
            pendientes: parseInt(row.pendientes),
            aprobadas: parseInt(row.aprobadas),
            rechazadas: parseInt(row.rechazadas),
            egresados: parseInt(row.egresados),
            bolsa_trabajo: parseInt(row.bolsa_trabajo),
            egresados_pendientes: parseInt(row.egresados_pendientes),
            bolsa_trabajo_pendientes: parseInt(row.bolsa_trabajo_pendientes),
            total: parseInt(row.total)
        };
    }
    // Métodos con transacciones usan pool.connect directamente
    static async aprobar(id, solicitud, datos) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            if (solicitud.tipo_solicitud === 'egresado') {
                await client.query(`INSERT INTO egresados (nombre, email, telefono, anio_egreso, carrera, generacion, ocupacion_actual, ciudad, verificado, fecha_registro, fecha_actualizacion)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) ON CONFLICT (email) DO NOTHING`, [datos.nombre_completo || datos.name || '', datos.email, datos.telefono || null, datos.anio_egreso || null,
                    datos.carrera_tecnica || datos.carrera || null, datos.generacion || null, datos.experiencia_laboral || datos.trabajo || null, datos.ciudad || null, true]);
            }
            else if (solicitud.tipo_solicitud === 'bolsa_trabajo') {
                await client.query(`INSERT INTO bolsa_trabajo (nombre_completo, email, telefono, generacion, experiencia, habilidades)
                    VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING`, [datos.name || datos.nombre_completo || '', datos.email, datos.phone || datos.telefono || null,
                    datos.graduationYear || datos.generacion || null, datos.message || datos.experiencia || null, datos.skills || datos.habilidades || null]);
            }
            await client.query('DELETE FROM pendientes_aprobacion WHERE id = $1', [id]);
            await client.query('COMMIT');
            return { success: true };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async rechazar(id) {
        const result = await (0, database_1.executeQuery)('DELETE FROM pendientes_aprobacion WHERE id = $1 RETURNING *', [id]);
        return result[0] || null;
    }
}
exports.default = PendientesAprobacionDAO;
module.exports = PendientesAprobacionDAO;
//# sourceMappingURL=pendientes-aprobacion.dao.js.map