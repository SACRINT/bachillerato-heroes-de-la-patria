/**
 * 👨‍🎓 STUDENT DAO - TypeScript
 * Data Access Object para estudiantes
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface StudentRow {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    telefono?: string;
    fecha_nacimiento: Date;
    curp: string;
    grado: string;
    grupo: string;
    turno: 'matutino' | 'vespertino';
    status: 'activo' | 'inactivo' | 'baja';
    fecha_inscripcion: Date;
    usuario_id?: number;
    created_at: Date;
    updated_at: Date;
}

export interface StudentFilters {
    grado?: string;
    grupo?: string;
    turno?: string;
    status?: string;
    search?: string;
}

export interface StudentCreateData {
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    telefono?: string;
    fecha_nacimiento: Date | string;
    curp: string;
    grado: string;
    grupo: string;
    turno?: string;
    status?: string;
    fecha_inscripcion?: Date;
}

export interface StudentUpdateData extends Partial<StudentCreateData> { }

// =====================================================
// STUDENT DAO CLASS
// =====================================================

class StudentDAO {

    static async get(id: number): Promise<StudentRow | null> {
        const query = `
            SELECT 
                id, nombre, apellido_paterno, apellido_materno,
                email, telefono, fecha_nacimiento, curp,
                grado, grupo, turno, status, fecha_inscripcion,
                created_at, updated_at
            FROM estudiantes
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    static async list(filters: StudentFilters = {}, limit: number = 20, offset: number = 0): Promise<StudentRow[]> {
        let query = `
            SELECT 
                id, nombre, apellido_paterno, apellido_materno,
                email, grado, grupo, turno, status
            FROM estudiantes
            WHERE 1=1
        `;
        const params: (string | number)[] = [];

        if (filters.grado) {
            params.push(filters.grado);
            query += ` AND grado = $${params.length}`;
        }

        if (filters.grupo) {
            params.push(filters.grupo);
            query += ` AND grupo = $${params.length}`;
        }

        if (filters.turno) {
            params.push(filters.turno);
            query += ` AND turno = $${params.length}`;
        }

        if (filters.status) {
            params.push(filters.status);
            query += ` AND status = $${params.length}`;
        }

        if (filters.search) {
            params.push(`%${filters.search}%`);
            query += ` AND (
                nombre ILIKE $${params.length} OR
                apellido_paterno ILIKE $${params.length} OR
                apellido_materno ILIKE $${params.length} OR
                email ILIKE $${params.length}
            )`;
        }

        query += ` ORDER BY apellido_paterno, apellido_materno, nombre`;
        params.push(limit, offset);
        query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async count(filters: StudentFilters = {}): Promise<number> {
        let query = `SELECT COUNT(*) as total FROM estudiantes WHERE 1=1`;
        const params: (string | number)[] = [];

        if (filters.grado) {
            params.push(filters.grado);
            query += ` AND grado = $${params.length}`;
        }

        if (filters.grupo) {
            params.push(filters.grupo);
            query += ` AND grupo = $${params.length}`;
        }

        if (filters.status) {
            params.push(filters.status);
            query += ` AND status = $${params.length}`;
        }

        if (filters.search) {
            params.push(`%${filters.search}%`);
            query += ` AND (
                nombre ILIKE $${params.length} OR
                apellido_paterno ILIKE $${params.length} OR
                apellido_materno ILIKE $${params.length}
            )`;
        }

        const result = await pool.query(query, params);
        return parseInt(result.rows[0].total, 10);
    }

    static async getByEmail(email: string): Promise<StudentRow | null> {
        const query = `SELECT * FROM estudiantes WHERE LOWER(email) = LOWER($1)`;
        const result = await pool.query(query, [email]);
        return result.rows[0] || null;
    }

    static async getByCURP(curp: string): Promise<StudentRow | null> {
        const query = `SELECT * FROM estudiantes WHERE UPPER(curp) = UPPER($1)`;
        const result = await pool.query(query, [curp]);
        return result.rows[0] || null;
    }

    static async create(data: StudentCreateData): Promise<StudentRow> {
        const query = `
            INSERT INTO estudiantes (
                nombre, apellido_paterno, apellido_materno, email, telefono,
                fecha_nacimiento, curp, grado, grupo, turno, status,
                fecha_inscripcion, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
            RETURNING *
        `;

        const params = [
            data.nombre,
            data.apellido_paterno,
            data.apellido_materno || null,
            data.email,
            data.telefono || null,
            data.fecha_nacimiento,
            data.curp,
            data.grado,
            data.grupo,
            data.turno || 'matutino',
            data.status || 'activo',
            data.fecha_inscripcion || new Date()
        ];

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    static async update(id: number, data: StudentUpdateData): Promise<StudentRow> {
        const query = `
            UPDATE estudiantes
            SET
                nombre = $1, apellido_paterno = $2, apellido_materno = $3,
                email = $4, telefono = $5, fecha_nacimiento = $6,
                curp = $7, grado = $8, grupo = $9, turno = $10,
                status = $11, updated_at = NOW()
            WHERE id = $12
            RETURNING *
        `;

        const params = [
            data.nombre, data.apellido_paterno, data.apellido_materno,
            data.email, data.telefono, data.fecha_nacimiento,
            data.curp, data.grado, data.grupo, data.turno,
            data.status, id
        ];

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    static async delete(id: number): Promise<boolean> {
        const query = `UPDATE estudiantes SET status = 'inactivo', updated_at = NOW() WHERE id = $1`;
        await pool.query(query, [id]);
        return true;
    }

    static async hardDelete(id: number): Promise<boolean> {
        const query = `DELETE FROM estudiantes WHERE id = $1`;
        await pool.query(query, [id]);
        return true;
    }

    static async getByGroup(grado: string, grupo: string): Promise<StudentRow[]> {
        const query = `
            SELECT * FROM estudiantes
            WHERE grado = $1 AND grupo = $2 AND status = 'activo'
            ORDER BY apellido_paterno, apellido_materno, nombre
        `;
        const result = await pool.query(query, [grado, grupo]);
        return result.rows;
    }

    static async getByUserId(usuarioId: number): Promise<StudentRow | null> {
        const query = `SELECT * FROM estudiantes WHERE usuario_id = $1`;
        const result = await pool.query(query, [usuarioId]);
        return result.rows[0] || null;
    }
}

export default StudentDAO;
module.exports = StudentDAO;
