"use strict";
/**
 * 📊 GRADES DAO - TypeScript
 * Data Access Object para calificaciones
 *
 * Refactorizado: 06 Diciembre 2025 (Migración TypeScript)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// GRADES DAO CLASS
// =====================================================
class GradesDAO {
    static async getAll(options) {
        const { estudianteId, materiaId, periodo, limit = 100, offset = 0, sortBy = 'created_at', order = 'DESC' } = options;
        let query = `SELECT c.*, e.nombre as estudiante_nombre, e.apellido_paterno, m.nombre as materia_nombre 
                     FROM calificaciones c 
                     LEFT JOIN estudiantes e ON c.estudiante_id = e.id 
                     LEFT JOIN materias m ON c.materia_id = m.id 
                     WHERE 1=1`;
        const params = [];
        let idx = 1;
        if (estudianteId) {
            query += ` AND c.estudiante_id = $${idx++}`;
            params.push(estudianteId);
        }
        if (materiaId) {
            query += ` AND c.materia_id = $${idx++}`;
            params.push(materiaId);
        }
        if (periodo) {
            query += ` AND c.periodo_academico = $${idx++}`;
            params.push(periodo);
        }
        query += ` ORDER BY c.${sortBy} ${order} LIMIT $${idx++} OFFSET $${idx}`;
        params.push(limit, offset);
        const result = await database_1.pool.query(query, params);
        const countResult = await database_1.pool.query('SELECT COUNT(*) FROM calificaciones');
        return {
            rows: result.rows,
            total: parseInt(countResult.rows[0].count)
        };
    }
    static async getById(id) {
        const result = await database_1.pool.query(`SELECT c.*, e.nombre as estudiante_nombre, e.apellido_paterno, m.nombre as materia_nombre 
             FROM calificaciones c 
             LEFT JOIN estudiantes e ON c.estudiante_id = e.id 
             LEFT JOIN materias m ON c.materia_id = m.id 
             WHERE c.id = $1`, [id]);
        return result.rows[0];
    }
    static async getByStudent(estudianteId) {
        const result = await database_1.pool.query(`SELECT c.*, m.nombre as materia_nombre, 
                    u.nombre as docente_nombre, u.apellido_paterno as docente_apellido
             FROM calificaciones c 
             LEFT JOIN materias m ON c.materia_id = m.id 
             LEFT JOIN usuarios u ON c.docente_id = u.id
             WHERE c.estudiante_id = $1 
             ORDER BY c.periodo_academico DESC, m.nombre`, [estudianteId]);
        return result.rows;
    }
    static async create(data) {
        const { estudianteId, materiaId, calificacion, tipoEvaluacion, periodoAcademico, observaciones, docenteId } = data;
        const result = await database_1.pool.query(`INSERT INTO calificaciones (estudiante_id, materia_id, calificacion, tipo_evaluacion, periodo_academico, observaciones, docente_id, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
             RETURNING *`, [estudianteId, materiaId, calificacion, tipoEvaluacion, periodoAcademico, observaciones, docenteId]);
        return result.rows[0];
    }
    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;
        if (data.calificacion !== undefined) {
            fields.push(`calificacion = $${idx++}`);
            values.push(data.calificacion);
        }
        if (data.observaciones !== undefined) {
            fields.push(`observaciones = $${idx++}`);
            values.push(data.observaciones);
        }
        if (data.tipoEvaluacion !== undefined) {
            fields.push(`tipo_evaluacion = $${idx++}`);
            values.push(data.tipoEvaluacion);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await database_1.pool.query(`UPDATE calificaciones SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
        return result.rows[0];
    }
    static async delete(id) {
        const result = await database_1.pool.query('DELETE FROM calificaciones WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }
    static async getStats(options) {
        const { estudianteId, materiaId, periodo } = options;
        let whereClause = 'WHERE 1=1';
        const params = [];
        let idx = 1;
        if (estudianteId) {
            whereClause += ` AND estudiante_id = $${idx++}`;
            params.push(estudianteId);
        }
        if (materiaId) {
            whereClause += ` AND materia_id = $${idx++}`;
            params.push(materiaId);
        }
        if (periodo) {
            whereClause += ` AND periodo_academico = $${idx++}`;
            params.push(periodo);
        }
        const result = await database_1.pool.query(`SELECT COUNT(*) as total, AVG(calificacion) as promedio, MIN(calificacion) as min, MAX(calificacion) as max, STDDEV(calificacion) as desviacion 
             FROM calificaciones ${whereClause}`, params);
        return result.rows[0];
    }
    static async bulkCreate(grades) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            const results = [];
            for (const grade of grades) {
                const result = await client.query(`INSERT INTO calificaciones (estudiante_id, materia_id, calificacion, tipo_evaluacion, periodo_academico, docente_id, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
                     RETURNING *`, [grade.estudianteId, grade.materiaId, grade.calificacion, grade.tipoEvaluacion, grade.periodoAcademico, grade.docenteId]);
                results.push(result.rows[0]);
            }
            await client.query('COMMIT');
            return results;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async exists(estudianteId, materiaId, periodo) {
        // Si es número, asumimos que es un ID de periodo que quizás no estamos guardando directamente,
        // o asumimos que se pasa el string. Por compatibilidad, manejamos string.
        let query = `SELECT * FROM calificaciones WHERE estudiante_id = $1 AND materia_id = $2`;
        const params = [estudianteId, materiaId];
        if (periodo) {
            query += ` AND periodo_academico = $3`;
            params.push(String(periodo));
        }
        const result = await database_1.pool.query(query, params);
        return result.rows[0] || null;
    }
}
exports.default = GradesDAO;
// CommonJS compatibility
module.exports = GradesDAO;
