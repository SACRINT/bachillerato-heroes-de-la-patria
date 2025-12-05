/**
 * 📅 APPOINTMENT DAO - Data Access Object
 * Gestión de citas y agenda
 * 
 * Patrón DAO - Abstrae el acceso a la tabla 'citas'
 */

const { executeQuery } = require('../config/database');
const devLogger = require('../utils/devLogger');

class AppointmentDAO {

    /**
     * Crear nueva cita
     * @param {Object} data - Datos de la cita
     */
    static async create(data) {
        const query = `
            INSERT INTO citas (
                cita_id, nombre_completo, email, telefono, 
                tipo_persona, motivo, descripcion, 
                fecha_solicitada, hora_solicitada, 
                token_confirmacion, estado, metadata,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
            RETURNING *
        `;

        const result = await executeQuery(query, [
            data.cita_id,
            data.nombre_completo,
            data.email,
            data.telefono || null,
            data.tipo_persona,
            data.motivo,
            data.descripcion || null,
            data.fecha_solicitada,
            data.hora_solicitada,
            data.token_confirmacion,
            data.estado || 'pendiente',
            data.metadata ? JSON.stringify(data.metadata) : '{}'
        ]);

        return result[0];
    }

    /**
     * Obtener cita por ID (interno o cita_id)
     */
    static async get(id) {
        let query = `SELECT * FROM citas WHERE `;
        const params = [id];

        if (typeof id === 'string' && id.startsWith('CITA-')) {
            query += `cita_id = $1`;
        } else {
            query += `id = $1`;
        }

        const result = await executeQuery(query, params);
        return result[0];
    }

    /**
     * Obtener cita por Token de Confirmación
     */
    static async getByToken(token) {
        const query = `SELECT * FROM citas WHERE token_confirmacion = $1`;
        const result = await executeQuery(query, [token]);
        return result[0];
    }

    /**
     * Actualizar cita
     */
    static async update(id, data) {
        // Construcción dinámica de query
        const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'cita_id');
        if (keys.length === 0) return null;

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = keys.map(key => {
            return (key === 'metadata' && typeof data[key] === 'object')
                ? JSON.stringify(data[key])
                : data[key];
        });

        const query = `
            UPDATE citas 
            SET ${setClause}, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const result = await executeQuery(query, [id, ...values]);
        return result[0];
    }

    /**
     * Eliminar cita
     */
    static async delete(id) {
        const query = `DELETE FROM citas WHERE id = $1 RETURNING id`;
        const result = await executeQuery(query, [id]);
        return result.length > 0;
    }

    /**
     * Listar citas con filtros
     */
    static async list(filters = {}) {
        let query = `SELECT * FROM citas WHERE 1=1`;
        const params = [];
        let paramCount = 1;

        if (filters.email) {
            query += ` AND email = $${paramCount++}`;
            params.push(filters.email);
        }
        if (filters.estado) {
            query += ` AND estado = $${paramCount++}`;
            params.push(filters.estado);
        }
        if (filters.fecha_inicio && filters.fecha_fin) {
            query += ` AND fecha_solicitada BETWEEN $${paramCount++} AND $${paramCount++}`;
            params.push(filters.fecha_inicio);
            params.push(filters.fecha_fin);
        } else if (filters.fecha) {
            query += ` AND fecha_solicitada = $${paramCount++}`;
            params.push(filters.fecha);
        }
        if (filters.tipo_persona) {
            query += ` AND tipo_persona = $${paramCount++}`;
            params.push(filters.tipo_persona);
        }

        query += ` ORDER BY fecha_solicitada ASC, hora_solicitada ASC`;

        if (filters.limit) {
            query += ` LIMIT $${paramCount++}`;
            params.push(filters.limit);
        }

        const result = await executeQuery(query, params);
        return result;
    }

    /**
     * Verificar disponibilidad de horario
     * Verifica si hay citas APROBADAS o PENDIENTES en ese horario
     */
    static async checkAvailability(fecha, hora) {
        const query = `
            SELECT COUNT(*) as count 
            FROM citas 
            WHERE fecha_solicitada = $1 
            AND hora_solicitada = $2
            AND estado IN ('pendiente', 'aprobada')
        `;
        const result = await executeQuery(query, [fecha, hora]);
        return parseInt(result[0].count) === 0;
    }

    /**
     * Contar citas de un usuario en una fecha específica
     * Para rate limiting diario
     */
    static async countByUserAndDate(email, fecha) {
        const query = `
            SELECT COUNT(*) as count 
            FROM citas 
            WHERE email = $1 
            AND fecha_solicitada = $2
            AND estado != 'cancelada'
        `;
        const result = await executeQuery(query, [email, fecha]);
        return parseInt(result[0].count);
    }

    /**
     * Obtener último ID para generar el siguiente consecutivo
     */
    static async getLastCitaId() {
        const query = `SELECT cita_id FROM citas ORDER BY id DESC LIMIT 1`;
        const result = await executeQuery(query);
        return result[0] ? result[0].cita_id : null;
    }
}

module.exports = AppointmentDAO;
