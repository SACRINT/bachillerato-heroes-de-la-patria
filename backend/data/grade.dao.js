/**
 * 📊 GRADE DAO (Data Access Object)
 * Capa de acceso a datos para Calificaciones.
 * Abstrae las consultas SQL y se adapta al esquema v2 (Periodos de Evaluación).
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
                c.periodo_evaluacion_id,
                pe.nombre as periodo_nombre,
                pe.codigo as periodo_codigo,
                pe.ciclo_escolar,
                c.calificacion,
                c.faltas,
                c.observaciones,
                c.created_at,
                c.updated_at,
                m.nombre as materia_nombre,
                m.clave as materia_clave,
                e.curp as estudiante_curp,
                e.nombre as estudiante_nombre,
                e.apellido_paterno as estudiante_apellido
            FROM calificaciones c
            JOIN periodos_evaluacion pe ON c.periodo_evaluacion_id = pe.id
            JOIN materias m ON c.materia_id = m.id
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE c.id = $1
        `;
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    /**
     * Verificar existencia de calificación (Unique constraint check)
     */
    static async exists(estudianteId, materiaId, periodoEvaluacionId) {
        const query = `
            SELECT id, calificacion 
            FROM calificaciones
            WHERE estudiante_id = $1 AND materia_id = $2 AND periodo_evaluacion_id = $3
        `;
        const result = await executeQuery(query, [estudianteId, materiaId, periodoEvaluacionId]);
        return result[0] || null;
    }

    /**
     * Crear calificación
     */
    static async create(data) {
        const query = `
            INSERT INTO calificaciones (
                estudiante_id, materia_id, periodo_evaluacion_id, 
                calificacion, faltas, observaciones, 
                captured_by, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING *
        `;
        const params = [
            data.estudiante_id,
            data.materia_id,
            data.periodo_evaluacion_id,
            data.calificacion,
            data.faltas || 0,
            data.observaciones || '',
            data.captured_by || null
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
        if (data.faltas !== undefined) {
            fields.push(`faltas = $${paramCount++}`);
            values.push(data.faltas);
        }
        if (data.observaciones !== undefined) {
            fields.push(`observaciones = $${paramCount++}`);
            values.push(data.observaciones);
        }
        // Permitir actualizar quién modificó
        if (data.captured_by !== undefined) {
            fields.push(`captured_by = $${paramCount++}`);
            values.push(data.captured_by);
        }

        fields.push(`updated_at = NOW()`);
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
     * Listar calificaciones con filtros y joins completos
     */
    static async list(filters = {}, limit = 50, offset = 0) {
        let query = `
            SELECT 
                c.id, 
                c.calificacion, 
                pe.codigo as periodo,
                pe.ciclo_escolar,
                m.nombre as materia_nombre,
                e.nombre as estudiante_nombre, 
                e.apellido_paterno as estudiante_apellido
            FROM calificaciones c
            JOIN periodos_evaluacion pe ON c.periodo_evaluacion_id = pe.id
            JOIN materias m ON c.materia_id = m.id
            JOIN estudiantes e ON c.estudiante_id = e.id
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
        if (filters.periodoId) {
            params.push(filters.periodoId);
            query += ` AND c.periodo_evaluacion_id = $${params.length}`;
        }
        if (filters.cicloEscolar) { // Filtro por texto en tabla relacionada
            params.push(filters.cicloEscolar);
            query += ` AND pe.ciclo_escolar = $${params.length}`;
        }

        query += ` ORDER BY c.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await executeQuery(query, params);
        return result;
    }

    /**
     * Obtener calificaciones de un estudiante (Vista detallada para historial/boleta)
     */
    static async getByStudent(estudianteId, filters = {}) {
        let query = `
            SELECT
                c.id,
                pe.nombre as periodo_nombre,
                pe.codigo as periodo_codigo,
                c.calificacion,
                pe.ciclo_escolar,
                c.updated_at as fecha_captura,
                c.observaciones,
                m.nombre as materia_nombre,
                m.clave as materia_clave,
                m.semestre,
                m.creditos
            FROM calificaciones c
            JOIN periodos_evaluacion pe ON c.periodo_evaluacion_id = pe.id
            JOIN materias m ON c.materia_id = m.id
            WHERE c.estudiante_id = $1
        `;
        const params = [estudianteId];

        if (filters.cicloEscolar) {
            params.push(filters.cicloEscolar);
            query += ` AND pe.ciclo_escolar = $${params.length}`;
        }
        // Filtro por semestre de la materia si es necesario
        if (filters.semestre) {
            params.push(filters.semestre);
            query += ` AND m.semestre = $${params.length}`;
        }

        query += ` ORDER BY pe.ciclo_escolar DESC, m.semestre ASC, m.nombre ASC, pe.id ASC`;

        const result = await executeQuery(query, params);
        return result;
    }

    /**
     * Calcular promedio de estudiante en un ciclo/periodo
     */
    static async getAverage(estudianteId, cicloEscolar) {
        const query = `
            SELECT AVG(c.calificacion) as promedio
            FROM calificaciones c
            JOIN periodos_evaluacion pe ON c.periodo_evaluacion_id = pe.id
            WHERE c.estudiante_id = $1 AND pe.ciclo_escolar = $2
        `;
        const result = await executeQuery(query, [estudianteId, cicloEscolar]);
        return result[0] ? parseFloat(result[0].promedio) : 0;
    }
}

module.exports = GradeDAO;
