/**
 * 📊 GRADES DAO - TypeScript
 * Data Access Object para calificaciones
 * 
 * Refactorizado: 06 Diciembre 2025 (Migración TypeScript)
 */

import { pool } from '../config/database';
import { PoolClient } from 'pg';

// =====================================================
// INTERFACES
// =====================================================

export interface GradeRow {
    id: number;
    estudiante_id: number;
    materia_id: number;
    calificacion: number;
    tipo_evaluacion: string;
    periodo_academico: string;
    observaciones?: string;
    docente_id: number;
    created_at: Date;
    updated_at?: Date;
    // Joined fields
    estudiante_nombre?: string;
    apellido_paterno?: string;
    materia_nombre?: string;
}

export interface GradeGetAllOptions {
    estudianteId?: number;
    materiaId?: number;
    periodo?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}

export interface GradeCreateData {
    estudianteId: number;
    materiaId: number;
    calificacion: number;
    tipoEvaluacion: string;
    periodoAcademico: string;
    observaciones?: string;
    docenteId: number;
}

export interface GradeUpdateData {
    calificacion?: number;
    observaciones?: string;
    tipoEvaluacion?: string;
}

export interface GradeStats {
    total: string;
    promedio: string | null;
    min: number | null;
    max: number | null;
    desviacion: string | null;
}

export interface GradesPaginatedResult {
    rows: GradeRow[];
    total: number;
}

// =====================================================
// GRADES DAO CLASS
// =====================================================

class GradesDAO {

    static async getAll(options: GradeGetAllOptions): Promise<GradesPaginatedResult> {
        const {
            estudianteId,
            materiaId,
            periodo,
            limit = 100,
            offset = 0,
            sortBy = 'created_at',
            order = 'DESC'
        } = options;

        let query = `SELECT c.*, e.nombre as estudiante_nombre, e.apellido_paterno, m.nombre as materia_nombre 
                     FROM calificaciones c 
                     LEFT JOIN estudiantes e ON c.estudiante_id = e.id 
                     LEFT JOIN materias m ON c.materia_id = m.id 
                     WHERE 1=1`;
        const params: (string | number)[] = [];
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

        const result = await pool.query(query, params);
        const countResult = await pool.query('SELECT COUNT(*) FROM calificaciones');

        return {
            rows: result.rows,
            total: parseInt(countResult.rows[0].count)
        };
    }

    static async getById(id: number): Promise<GradeRow | undefined> {
        const result = await pool.query(
            `SELECT c.*, e.nombre as estudiante_nombre, e.apellido_paterno, m.nombre as materia_nombre 
             FROM calificaciones c 
             LEFT JOIN estudiantes e ON c.estudiante_id = e.id 
             LEFT JOIN materias m ON c.materia_id = m.id 
             WHERE c.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async getByStudent(estudianteId: number): Promise<GradeRow[]> {
        const result = await pool.query(
            `SELECT c.*, m.nombre as materia_nombre, 
                    u.nombre as docente_nombre, u.apellido_paterno as docente_apellido
             FROM calificaciones c 
             LEFT JOIN materias m ON c.materia_id = m.id 
             LEFT JOIN usuarios u ON c.docente_id = u.id
             WHERE c.estudiante_id = $1 
             ORDER BY c.periodo_academico DESC, m.nombre`,
            [estudianteId]
        );
        return result.rows;
    }

    static async create(data: GradeCreateData): Promise<GradeRow> {
        const { estudianteId, materiaId, calificacion, tipoEvaluacion, periodoAcademico, observaciones, docenteId } = data;
        const result = await pool.query(
            `INSERT INTO calificaciones (estudiante_id, materia_id, calificacion, tipo_evaluacion, periodo_academico, observaciones, docente_id, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
             RETURNING *`,
            [estudianteId, materiaId, calificacion, tipoEvaluacion, periodoAcademico, observaciones, docenteId]
        );
        return result.rows[0];
    }

    static async update(id: number, data: GradeUpdateData): Promise<GradeRow | undefined> {
        const fields: string[] = [];
        const values: (string | number)[] = [];
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

        const result = await pool.query(
            `UPDATE calificaciones SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    static async delete(id: number): Promise<{ id: number } | undefined> {
        const result = await pool.query(
            'DELETE FROM calificaciones WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    static async getStats(options: Partial<GradeGetAllOptions>): Promise<GradeStats> {
        const { estudianteId, materiaId, periodo } = options;
        let whereClause = 'WHERE 1=1';
        const params: (string | number)[] = [];
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

        const result = await pool.query(
            `SELECT COUNT(*) as total, AVG(calificacion) as promedio, MIN(calificacion) as min, MAX(calificacion) as max, STDDEV(calificacion) as desviacion 
             FROM calificaciones ${whereClause}`,
            params
        );
        return result.rows[0];
    }

    static async bulkCreate(grades: GradeCreateData[]): Promise<GradeRow[]> {
        const client: PoolClient = await pool.connect();
        try {
            await client.query('BEGIN');
            const results: GradeRow[] = [];

            for (const grade of grades) {
                const result = await client.query(
                    `INSERT INTO calificaciones (estudiante_id, materia_id, calificacion, tipo_evaluacion, periodo_academico, docente_id, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
                     RETURNING *`,
                    [grade.estudianteId, grade.materiaId, grade.calificacion, grade.tipoEvaluacion, grade.periodoAcademico, grade.docenteId]
                );
                results.push(result.rows[0]);
            }

            await client.query('COMMIT');
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    static async exists(estudianteId: number, materiaId: number, periodo: string | number): Promise<GradeRow | null> {
        // Si es número, asumimos que es un ID de periodo que quizás no estamos guardando directamente,
        // o asumimos que se pasa el string. Por compatibilidad, manejamos string.

        let query = `SELECT * FROM calificaciones WHERE estudiante_id = $1 AND materia_id = $2`;
        const params: (string | number)[] = [estudianteId, materiaId];

        if (periodo) {
            query += ` AND periodo_academico = $3`;
            params.push(String(periodo));
        }

        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }
}


export default GradesDAO;

// CommonJS compatibility
module.exports = GradesDAO;
