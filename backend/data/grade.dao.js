/**
 * 📊 GRADE DAO (Data Access Object)
 * Capa de acceso a datos para Calificaciones.
 * Abstrae las consultas SQL.
 */

const { executeQuery, executeTransaction } = require('../config/database');

class GradeDAO {

    /**
     * Obtener calificación por ID
     * @param {number} id
     */
    static async get(id) {
        const query = `
            SELECT
                c.id,
                c.estudiante_id,
                c.materia_id,
                c.docente_id,
                c.parcial,
                c.calificacion,
                c.ciclo_escolar,
                c.fecha_captura,
                c.observaciones,
                c.tipo_evaluacion,
                c.is_final,
                c.created_at,
                c.updated_at,
                m.nombre as materia_nombre,
                m.clave as materia_clave,
                e.matricula as estudiante_matricula,
                ue.nombre as estudiante_nombre,
                ue.apellido_paterno as estudiante_apellido,
                ud.nombre as docente_nombre,
                ud.apellido_paterno as docente_apellido
            FROM calificaciones c
            LEFT JOIN materias m ON c.materia_id = m.id
            LEFT JOIN estudiantes e ON c.estudiante_id = e.id
            LEFT JOIN usuarios ue ON e.usuario_id = ue.id
            LEFT JOIN docentes d ON c.docente_id = d.id
            LEFT JOIN usuarios ud ON d.usuario_id = ud.id
            WHERE c.id = $1
        `;
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    /**
     * Verificar existencia de calificación
     */
    static async exists(estudianteId, materiaId, parcial, cicloEscolar) {
        const query = `
            SELECT id, calificacion, estudiante_id, ciclo_escolar 
            FROM calificaciones
            WHERE estudiante_id = $1 AND materia_id = $2 AND parcial = $3 AND ciclo_escolar = $4
        `;
        const result = await executeQuery(query, [estudianteId, materiaId, parcial, cicloEscolar]);
        return result[0] || null;
    }

    /**
     * Crear calificación
     */
    static async create(data) {
        const query = `
            INSERT INTO calificaciones (
                estudiante_id, materia_id, parcial, calificacion, 
                ciclo_escolar, docente_id, observaciones, fecha_captura, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
            RETURNING *
        `;
        const params = [
            data.estudiante_id,
            data.materia_id,
            data.parcial,
            data.calificacion,
            data.ciclo_escolar,
            data.docente_id,
            data.observaciones || ''
        ];
        const result = await executeQuery(query, params);
        return result[0];
    }

    /**
     * Actualizar calificación
     */
    static async update(id, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (data.calificacion !== undefined) {
            fields.push(`calificacion = $${paramCount++}`);
            values.push(data.calificacion);
        }
        if (data.observaciones !== undefined) {
            fields.push(`observaciones = $${paramCount++}`);
            values.push(data.observaciones);
        }
        if (data.docente_id !== undefined) {
            fields.push(`docente_id = $${paramCount++}`);
            values.push(data.docente_id);
        }
        if (data.tipo_evaluacion !== undefined) {
            fields.push(`tipo_evaluacion = $${paramCount++}`);
            values.push(data.tipo_evaluacion);
        }
        if (data.is_final !== undefined) {
            fields.push(`is_final = $${paramCount++}`);
            values.push(data.is_final);
        }

        fields.push(`updated_at = NOW()`);

        // Si se actualiza calificación, actualizar fecha de captura también (opcional, según lógica original)
        if (data.calificacion !== undefined) {
            fields.push(`fecha_captura = NOW()`);
        }

        values.push(id);

        const query = `
            UPDATE calificaciones
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await executeQuery(query, values);
        return result[0];
    }

    /**
     * Eliminar calificación
     */
    static async delete(id) {
        const query = `DELETE FROM calificaciones WHERE id = $1`;
        await executeQuery(query, [id]);
        return true;
    }

    /**
     * Listar calificaciones con filtros
     */
    static async list(filters = {}, limit = 50, offset = 0) {
        let query = `
            SELECT 
                c.id, c.parcial, c.calificacion, c.ciclo_escolar,
                m.nombre as materia_nombre,
                u.nombre as estudiante_nombre, u.apellido_paterno
            FROM calificaciones c
            JOIN materias m ON c.materia_id = m.id
            JOIN estudiantes e ON c.estudiante_id = e.id
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.estudianteId) {
            params.push(filters.estudianteId);
            query += ` AND c.estudiante_id = $${params.length}`;
        }
        if (filters.materiaId) {
            params.push(filters.materiaId);
            query += ` AND c.materia_id = $${params.length}`;
        }
        if (filters.parcial) {
            params.push(filters.parcial);
            query += ` AND c.parcial = $${params.length}`;
        }
        if (filters.cicloEscolar) {
            params.push(filters.cicloEscolar);
            query += ` AND c.ciclo_escolar = $${params.length}`;
        }

        query += ` ORDER BY c.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await executeQuery(query, params);
        return result;
    }

    /**
     * Obtener calificaciones detalladas de un estudiante
     */
    static async getByStudent(estudianteId, filters = {}) {
        let query = `
            SELECT
                c.id,
                c.parcial,
                c.calificacion,
                c.ciclo_escolar,
                c.fecha_captura,
                c.observaciones,
                m.nombre as materia_nombre,
                m.clave as materia_clave,
                m.creditos,
                u.nombre as docente_nombre,
                u.apellido_paterno as docente_apellido
            FROM calificaciones c
            JOIN materias m ON c.materia_id = m.id
            LEFT JOIN docentes d ON c.docente_id = d.id
            LEFT JOIN usuarios u ON d.usuario_id = u.id
            WHERE c.estudiante_id = $1
        `;
        const params = [estudianteId];

        if (filters.cicloEscolar) {
            params.push(filters.cicloEscolar);
            query += ` AND c.ciclo_escolar = $${params.length}`;
        }
        if (filters.parcial) {
            params.push(filters.parcial);
            query += ` AND c.parcial = $${params.length}`;
        }

        query += ` ORDER BY c.ciclo_escolar DESC, m.nombre, c.parcial`;

        const result = await executeQuery(query, params);
        return result;
    }

    /**
     * Obtener calificaciones por grupo
     */
    static async getByGroup(grupo, filters = {}) {
        let query = `
            SELECT
                e.matricula,
                u.nombre as estudiante_nombre,
                u.apellido_paterno as estudiante_apellido,
                c.parcial,
                c.calificacion,
                c.ciclo_escolar,
                m.nombre as materia_nombre,
                m.clave as materia_clave
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            LEFT JOIN calificaciones c ON e.id = c.estudiante_id
            LEFT JOIN materias m ON c.materia_id = m.id
            WHERE e.grupo = $1
        `;
        const params = [grupo];

        if (filters.materiaId) {
            params.push(filters.materiaId);
            query += ` AND c.materia_id = $${params.length}`;
        }
        if (filters.parcial) {
            params.push(filters.parcial);
            query += ` AND c.parcial = $${params.length}`;
        }
        if (filters.cicloEscolar) {
            params.push(filters.cicloEscolar);
            query += ` AND c.ciclo_escolar = $${params.length}`;
        }

        query += ` ORDER BY u.apellido_paterno, u.nombre, m.nombre, c.parcial`;

        const result = await executeQuery(query, params);
        return result;
    }

    /**
     * Obtener promedio de un estudiante en un ciclo
     */
    static async getAverage(estudianteId, cicloEscolar) {
        const query = `
            SELECT AVG(calificacion) as promedio
            FROM calificaciones
            WHERE estudiante_id = $1 AND ciclo_escolar = $2
        `;
        const result = await executeQuery(query, [estudianteId, cicloEscolar]);
        return result[0] ? parseFloat(result[0].promedio) : 0;
    }

    /**
     * Registrar historial de cambios
     */
    static async logHistory(data) {
        const query = `
            INSERT INTO calificaciones_historial
            (calificacion_id, calificacion_anterior, calificacion_nueva, modificado_por, motivo_cambio, fecha_modificacion)
            VALUES ($1, $2, $3, $4, $5, NOW())
        `;
        await executeQuery(query, [
            data.calificacion_id,
            data.calificacion_anterior,
            data.calificacion_nueva,
            data.modificado_por,
            data.motivo_cambio
        ]);
    }
}

module.exports = GradeDAO;
