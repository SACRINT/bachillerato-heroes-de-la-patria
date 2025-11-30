/**
 * Student Data Access Object
 * Capa de acceso a datos para estudiantes
 * 
 * Responsabilidades:
 * - Ejecutar consultas SQL a la tabla estudiantes
 * - Transformar datos de base de datos a objetos JavaScript
 * - NO contiene lógica de negocio
 */

const { pool } = require('../config/database');

class StudentDAO {
    /**
     * Obtener estudiante por ID
     * @param {number} id - ID del estudiante
     * @returns {Promise<Object|null>}
     */
    static async get(id) {
        const query = `
            SELECT 
                id,
                nombre,
                apellido_paterno,
                apellido_materno,
                email,
                telefono,
                fecha_nacimiento,
                curp,
                grado,
                grupo,
                turno,
                status,
                fecha_inscripcion,
                created_at,
                updated_at
            FROM estudiantes
            WHERE id = $1
        `;

        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Listar estudiantes con filtros y paginación
     * @param {Object} filters - Filtros de búsqueda
     * @param {number} limit - Límite de registros
     * @param {number} offset - Offset para paginación
     * @returns {Promise<Array>}
     */
    static async list(filters = {}, limit = 20, offset = 0) {
        let query = `
            SELECT 
                id,
                nombre,
                apellido_paterno,
                apellido_materno,
                email,
                grado,
                grupo,
                turno,
                status
            FROM estudiantes
            WHERE 1=1
        `;
        const params = [];

        // Filtro por grado
        if (filters.grado) {
            params.push(filters.grado);
            query += ` AND grado = $${params.length}`;
        }

        // Filtro por grupo
        if (filters.grupo) {
            params.push(filters.grupo);
            query += ` AND grupo = $${params.length}`;
        }

        // Filtro por turno
        if (filters.turno) {
            params.push(filters.turno);
            query += ` AND turno = $${params.length}`;
        }

        // Filtro por status
        if (filters.status) {
            params.push(filters.status);
            query += ` AND status = $${params.length}`;
        }

        // Búsqueda por nombre
        if (filters.search) {
            params.push(`%${filters.search}%`);
            query += ` AND (
                nombre ILIKE $${params.length} OR
                apellido_paterno ILIKE $${params.length} OR
                apellido_materno ILIKE $${params.length} OR
                email ILIKE $${params.length}
            )`;
        }

        // Ordenamiento y paginación
        query += ` ORDER BY apellido_paterno, apellido_materno, nombre`;
        params.push(limit, offset);
        query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Contar total de estudiantes con filtros
     * @param {Object} filters - Filtros de búsqueda
     * @returns {Promise<number>}
     */
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM estudiantes WHERE 1=1`;
        const params = [];

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

    /**
     * Buscar estudiante por email
     * @param {string} email - Email del estudiante
     * @returns {Promise<Object|null>}
     */
    static async getByEmail(email) {
        const query = `
            SELECT * FROM estudiantes
            WHERE LOWER(email) = LOWER($1)
        `;
        const result = await pool.query(query, [email]);
        return result.rows[0] || null;
    }

    /**
     * Buscar estudiante por CURP
     * @param {string} curp - CURP del estudiante
     * @returns {Promise<Object|null>}
     */
    static async getByCURP(curp) {
        const query = `
            SELECT * FROM estudiantes
            WHERE UPPER(curp) = UPPER($1)
        `;
        const result = await pool.query(query, [curp]);
        return result.rows[0] || null;
    }

    /**
     * Crear nuevo estudiante
     * @param {Object} data - Datos del estudiante
     * @returns {Promise<Object>}
     */
    static async create(data) {
        const query = `
            INSERT INTO estudiantes (
                nombre,
                apellido_paterno,
                apellido_materno,
                email,
                telefono,
                fecha_nacimiento,
                curp,
                grado,
                grupo,
                turno,
                status,
                fecha_inscripcion,
                created_at,
                updated_at
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

    /**
     * Actualizar estudiante
     * @param {number} id - ID del estudiante
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object>}
     */
    static async update(id, data) {
        const query = `
            UPDATE estudiantes
            SET
                nombre = $1,
                apellido_paterno = $2,
                apellido_materno = $3,
                email = $4,
                telefono = $5,
                fecha_nacimiento = $6,
                curp = $7,
                grado = $8,
                grupo = $9,
                turno = $10,
                status = $11,
                updated_at = NOW()
            WHERE id = $12
            RETURNING *
        `;

        const params = [
            data.nombre,
            data.apellido_paterno,
            data.apellido_materno,
            data.email,
            data.telefono,
            data.fecha_nacimiento,
            data.curp,
            data.grado,
            data.grupo,
            data.turno,
            data.status,
            id
        ];

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Soft delete de estudiante
     * @param {number} id - ID del estudiante
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
        const query = `
            UPDATE estudiantes
            SET status = 'inactivo', updated_at = NOW()
            WHERE id = $1
        `;
        await pool.query(query, [id]);
        return true;
    }

    /**
     * Hard delete de estudiante (solo para testing)
     * @param {number} id - ID del estudiante
     * @returns {Promise<boolean>}
     */
    static async hardDelete(id) {
        const query = `DELETE FROM estudiantes WHERE id = $1`;
        await pool.query(query, [id]);
        return true;
    }

    /**
     * Obtener estudiantes por grado y grupo
     * @param {string} grado - Grado (1, 2, 3, 4, 5, 6)
     * @param {string} grupo - Grupo (A, B, C, etc.)
     * @returns {Promise<Array>}
     */
    static async getByGroup(grado, grupo) {
        const query = `
            SELECT * FROM estudiantes
            WHERE grado = $1 AND grupo = $2 AND status = 'activo'
            ORDER BY apellido_paterno, apellido_materno, nombre
        `;
        const result = await pool.query(query, [grado, grupo]);
        return result.rows;
    }
}

module.exports = StudentDAO;
