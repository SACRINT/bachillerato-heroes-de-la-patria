/**
 * 📋 PENDIENTES APROBACION DAO @author Gemini Code @date 2025-12-05
 */
const { executeQuery, pool } = require('../config/database');

class PendientesAprobacionDAO {
    static async getAll({ tipo, estado, limit = 50, offset = 0 }) {
        let query = `SELECT * FROM pendientes_aprobacion WHERE estado IN ('pendiente_confirmacion', 'pendiente')`;
        const params = [];
        if (estado) { query += ` AND estado = $${params.length + 1}`; params.push(estado); }
        if (tipo) { query += ` AND tipo_solicitud = $${params.length + 1}`; params.push(tipo); }
        query += ` ORDER BY fecha_solicitud DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));
        const data = await executeQuery(query, params);

        let cq = `SELECT COUNT(*) as count FROM pendientes_aprobacion WHERE estado IN ('pendiente_confirmacion', 'pendiente')`;
        const cp = [];
        if (estado) { cq += ` AND estado = $${cp.length + 1}`; cp.push(estado); }
        if (tipo) { cq += ` AND tipo_solicitud = $${cp.length + 1}`; cp.push(tipo); }
        const countResult = await executeQuery(cq, cp);
        return { data, total: parseInt(countResult[0].count) };
    }

    static async getById(id) {
        const result = await executeQuery('SELECT * FROM pendientes_aprobacion WHERE id = $1', [id]);
        return result[0] || null;
    }

    static async delete(id) {
        const result = await executeQuery('DELETE FROM pendientes_aprobacion WHERE id = $1 RETURNING id', [id]);
        return result[0] || null;
    }

    static async getStats() {
        const query = `SELECT COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
            COUNT(*) FILTER (WHERE estado = 'aprobada') as aprobadas, COUNT(*) FILTER (WHERE estado = 'rechazada') as rechazadas,
            COUNT(*) FILTER (WHERE tipo_solicitud = 'egresado') as egresados, COUNT(*) FILTER (WHERE tipo_solicitud = 'bolsa_trabajo') as bolsa_trabajo,
            COUNT(*) FILTER (WHERE tipo_solicitud = 'egresado' AND estado = 'pendiente') as egresados_pendientes,
            COUNT(*) FILTER (WHERE tipo_solicitud = 'bolsa_trabajo' AND estado = 'pendiente') as bolsa_trabajo_pendientes,
            COUNT(*) as total FROM pendientes_aprobacion`;
        const result = await executeQuery(query, []);
        return result[0];
    }

    // Métodos con transacciones usan pool.connect directamente
    static async aprobar(id, solicitud, datos) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            if (solicitud.tipo_solicitud === 'egresado') {
                await client.query(`INSERT INTO egresados (nombre, email, telefono, anio_egreso, carrera, generacion, ocupacion_actual, ciudad, verificado, fecha_registro, fecha_actualizacion)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) ON CONFLICT (email) DO NOTHING`,
                    [datos.nombre_completo || datos.name || '', datos.email, datos.telefono || null, datos.anio_egreso || null,
                    datos.carrera_tecnica || datos.carrera || null, datos.generacion || null, datos.experiencia_laboral || datos.trabajo || null, datos.ciudad || null, true]);
            } else if (solicitud.tipo_solicitud === 'bolsa_trabajo') {
                await client.query(`INSERT INTO bolsa_trabajo (nombre_completo, email, telefono, generacion, experiencia, habilidades)
                    VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING`,
                    [datos.name || datos.nombre_completo || '', datos.email, datos.phone || datos.telefono || null,
                    datos.graduationYear || datos.generacion || null, datos.message || datos.experiencia || null, datos.skills || datos.habilidades || null]);
            }
            await client.query('DELETE FROM pendientes_aprobacion WHERE id = $1', [id]);
            await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async rechazar(id) {
        const result = await executeQuery('DELETE FROM pendientes_aprobacion WHERE id = $1 RETURNING *', [id]);
        return result[0] || null;
    }
}
module.exports = PendientesAprobacionDAO;
