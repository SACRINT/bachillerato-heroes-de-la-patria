/**
 * 📊 ATTENDANCE DAO - TypeScript
 * Gestión de asistencias escolares
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface AttendanceRow {
    id: number;
    estudiante_id: number;
    materia_id: number;
    fecha: Date;
    presente: boolean;
    justificada: boolean;
    motivo?: string;
    comentarios?: string;
    registrado_por: number;
    created_at: Date;
    updated_at?: Date;
    // Joined fields
    estudiante_nombre?: string;
    estudiante_apellido?: string;
    materia_nombre?: string;
}

export interface AttendanceCreateData {
    estudiante_id: number;
    materia_id: number;
    fecha: Date | string;
    presente: boolean;
    justificada?: boolean;
    motivo?: string;
    comentarios?: string;
    registrado_por: number;
}

export interface AttendanceUpdateData {
    presente?: boolean;
    justificada?: boolean;
    motivo?: string;
    comentarios?: string;
}

export interface AttendanceFilters {
    estudiante_id?: number;
    materia_id?: number;
    fecha_inicio?: Date | string;
    fecha_fin?: Date | string;
    presente?: boolean;
    limit?: number;
}

export interface AttendanceRate {
    total_registros: number;
    asistencias: number;
    faltas: number;
    justificadas: number;
    porcentaje_asistencia: number;
}

export interface BulkAttendanceRecord {
    estudiante_id: number;
    materia_id: number;
    fecha: Date | string;
    presente: boolean;
    registrado_por: number;
}

export interface AbsenteeismPattern {
    fecha: Date;
    presente: boolean;
    ventana_5_dias: number;
    faltas_consecutivas: number;
}

// =====================================================
// ATTENDANCE DAO CLASS
// =====================================================

class AttendanceDAO {

    static async create(data: AttendanceCreateData): Promise<AttendanceRow> {
        const query = `
            INSERT INTO asistencias (
                estudiante_id, materia_id, fecha, presente, 
                justificada, motivo, comentarios, registrado_por
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const result = await executeQuery(query, [
            data.estudiante_id,
            data.materia_id,
            data.fecha,
            data.presente,
            data.justificada || false,
            data.motivo || null,
            data.comentarios || null,
            data.registrado_por
        ]);

        return result[0];
    }

    static async update(id: number, data: AttendanceUpdateData): Promise<AttendanceRow> {
        const fields: string[] = [];
        const values: (boolean | string | number | null)[] = [];
        let paramCount = 1;

        if (data.presente !== undefined) {
            fields.push(`presente = $${paramCount++}`);
            values.push(data.presente);
        }
        if (data.justificada !== undefined) {
            fields.push(`justificada = $${paramCount++}`);
            values.push(data.justificada);
        }
        if (data.motivo !== undefined) {
            fields.push(`motivo = $${paramCount++}`);
            values.push(data.motivo);
        }
        if (data.comentarios !== undefined) {
            fields.push(`comentarios = $${paramCount++}`);
            values.push(data.comentarios);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `
            UPDATE asistencias
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await executeQuery(query, values);
        return result[0];
    }

    static async delete(id: number): Promise<boolean> {
        const query = `DELETE FROM asistencias WHERE id = $1 RETURNING id`;
        const result = await executeQuery(query, [id]);
        return result.length > 0;
    }

    static async get(id: number): Promise<AttendanceRow | undefined> {
        const query = `
            SELECT 
                a.*,
                e.nombre as estudiante_nombre,
                e.apellido as estudiante_apellido,
                m.nombre as materia_nombre
            FROM asistencias a
            LEFT JOIN estudiantes e ON a.estudiante_id = e.id
            LEFT JOIN materias m ON a.materia_id = m.id
            WHERE a.id = $1
        `;
        const result = await executeQuery(query, [id]);
        return result[0];
    }

    static async list(filters: AttendanceFilters = {}): Promise<AttendanceRow[]> {
        let query = `
            SELECT 
                a.*,
                e.nombre as estudiante_nombre,
                e.apellido as estudiante_apellido,
                m.nombre as materia_nombre
            FROM asistencias a
            LEFT JOIN estudiantes e ON a.estudiante_id = e.id
            LEFT JOIN materias m ON a.materia_id = m.id
            WHERE 1=1
        `;
        const params: (string | number | boolean | Date)[] = [];
        let paramCount = 1;

        if (filters.estudiante_id) {
            query += ` AND a.estudiante_id = $${paramCount++}`;
            params.push(filters.estudiante_id);
        }
        if (filters.materia_id) {
            query += ` AND a.materia_id = $${paramCount++}`;
            params.push(filters.materia_id);
        }
        if (filters.fecha_inicio) {
            query += ` AND a.fecha >= $${paramCount++}`;
            params.push(filters.fecha_inicio);
        }
        if (filters.fecha_fin) {
            query += ` AND a.fecha <= $${paramCount++}`;
            params.push(filters.fecha_fin);
        }
        if (filters.presente !== undefined) {
            query += ` AND a.presente = $${paramCount++}`;
            params.push(filters.presente);
        }

        query += ` ORDER BY a.fecha DESC`;

        if (filters.limit) {
            query += ` LIMIT $${paramCount++}`;
            params.push(filters.limit);
        }

        const result = await executeQuery(query, params);
        return result;
    }

    static async getByStudent(studentId: number, filters: AttendanceFilters = {}): Promise<AttendanceRow[]> {
        const extendedFilters = { ...filters, estudiante_id: studentId };
        return await this.list(extendedFilters);
    }

    static async getByClass(classId: number, date: Date | string): Promise<AttendanceRow[]> {
        const query = `
            SELECT 
                a.*,
                e.nombre as estudiante_nombre,
                e.apellido as estudiante_apellido
            FROM asistencias a
            INNER JOIN estudiantes e ON a.estudiante_id = e.id
            WHERE a.materia_id = $1 
            AND a.fecha = $2
            ORDER BY e.apellido, e.nombre
        `;
        const result = await executeQuery(query, [classId, date]);
        return result;
    }

    static async getMonthlyReport(studentId: number, year: number, month: number): Promise<AttendanceRow[]> {
        const query = `
            SELECT
                a.*,
                m.nombre as materia_nombre
            FROM asistencias a
            LEFT JOIN materias m ON a.materia_id = m.id
            WHERE a.estudiante_id = $1
            AND EXTRACT(YEAR FROM a.fecha) = $2
            AND EXTRACT(MONTH FROM a.fecha) = $3
            ORDER BY a.fecha DESC
        `;
        const result = await executeQuery(query, [studentId, year, month]);
        return result;
    }

    static async getAttendanceRate(studentId: number, startDate: Date | string, endDate: Date | string): Promise<AttendanceRate> {
        const query = `
            SELECT
                COUNT(*) as total_registros,
                SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END) as asistencias,
                SUM(CASE WHEN presente = FALSE THEN 1 ELSE 0 END) as faltas,
                SUM(CASE WHEN justificada = TRUE THEN 1 ELSE 0 END) as justificadas,
                ROUND(
                    (SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END)::decimal / 
                    NULLIF(COUNT(*), 0)) * 100, 
                    2
                ) as porcentaje_asistencia
            FROM asistencias
            WHERE estudiante_id = $1
            AND fecha BETWEEN $2 AND $3
        `;

        const result = await executeQuery(query, [studentId, startDate, endDate]);
        return result[0] || {
            total_registros: 0,
            asistencias: 0,
            faltas: 0,
            justificadas: 0,
            porcentaje_asistencia: 0
        };
    }

    static async markBulkAttendance(attendanceRecords: BulkAttendanceRecord[]): Promise<AttendanceRow[]> {
        const values = attendanceRecords.map((_, index) => {
            const offset = index * 5;
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
        }).join(', ');

        const params = attendanceRecords.flatMap(record => [
            record.estudiante_id,
            record.materia_id,
            record.fecha,
            record.presente,
            record.registrado_por
        ]);

        const query = `
            INSERT INTO asistencias (
                estudiante_id, materia_id, fecha, presente, registrado_por
            ) VALUES ${values}
            ON CONFLICT (estudiante_id, materia_id, fecha) 
            DO UPDATE SET 
                presente = EXCLUDED.presente,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await executeQuery(query, params);
        return result;
    }

    static async getSummaryByStudent(studentId: number): Promise<AttendanceRate> {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const query = `
            SELECT
                COUNT(*) as total_registros,
                SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END) as asistencias,
                SUM(CASE WHEN presente = FALSE THEN 1 ELSE 0 END) as faltas,
                ROUND((SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(*), 0)) * 100, 2) as porcentaje_asistencia
            FROM asistencias
            WHERE estudiante_id = $1
            AND EXTRACT(MONTH FROM fecha) = $2
            AND EXTRACT(YEAR FROM fecha) = $3
        `;
        const result = await executeQuery(query, [studentId, currentMonth, currentYear]);
        return result[0] || {
            total_registros: 0,
            asistencias: 0,
            faltas: 0,
            justificadas: 0,
            porcentaje_asistencia: 0
        };
    }

    static async detectAbsenteeismPatterns(studentId: number, days: number = 30): Promise<AbsenteeismPattern[]> {
        const query = `
            SELECT
                DATE(fecha) as fecha,
                presente,
                COUNT(*) OVER (
                    ORDER BY fecha 
                    ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
                ) as ventana_5_dias,
                SUM(CASE WHEN presente = FALSE THEN 1 ELSE 0 END) OVER (
                    ORDER BY fecha 
                    ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
                ) as faltas_consecutivas
            FROM asistencias
            WHERE estudiante_id = $1
            AND fecha >= CURRENT_DATE - INTERVAL '${days} days'
            ORDER BY fecha DESC
        `;

        const result = await executeQuery(query, [studentId]);
        return result;
    }
}

export default AttendanceDAO;
module.exports = AttendanceDAO;
