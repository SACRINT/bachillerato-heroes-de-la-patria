"use strict";
/**
 * 👨‍🏫 TEACHER DAO - TypeScript
 * Capa de acceso a datos para Docentes.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// TEACHER DAO CLASS
// =====================================================
class TeacherDAO {
    static async get(id) {
        const query = `
            SELECT
                d.*,
                u.nombre, u.apellido_paterno, u.apellido_materno, u.email,
                u.created_at as fecha_creacion, u.last_login as ultimo_acceso
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE d.id = $1 AND u.status = 'activo'
        `;
        const result = await (0, database_1.executeQuery)(query, [id]);
        return result[0] || null;
    }
    static async getByEmail(email) {
        const query = `
            SELECT d.*, u.email, u.nombre, u.apellido_paterno, u.apellido_materno
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE u.email = $1 AND u.status = 'activo'
        `;
        const result = await (0, database_1.executeQuery)(query, [email]);
        return result[0] || null;
    }
    static async getByEmployeeNumber(numero_empleado) {
        const query = `SELECT * FROM docentes WHERE numero_empleado = $1`;
        const result = await (0, database_1.executeQuery)(query, [numero_empleado]);
        return result[0] || null;
    }
    static async list(filters = {}, limit = 20, offset = 0) {
        let query = `
            SELECT 
                d.id, d.numero_empleado, u.nombre, u.apellido_paterno, u.apellido_materno,
                u.email, d.especialidad, d.anos_experiencia, d.grado_academico,
                d.tipo_contrato, d.fecha_ingreso, d.telefono_oficina,
                d.horario_atencion, d.visible_directorio
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE u.status = 'activo'
        `;
        const params = [];
        if (filters.especialidad) {
            params.push(filters.especialidad);
            query += ` AND d.especialidad = $${params.length}`;
        }
        if (filters.tipo_contrato) {
            params.push(filters.tipo_contrato);
            query += ` AND d.tipo_contrato = $${params.length}`;
        }
        if (filters.search) {
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            const baseLen = params.length - 3;
            query += ` AND (
                u.nombre ILIKE $${baseLen} OR
                u.apellido_paterno ILIKE $${baseLen + 1} OR
                u.apellido_materno ILIKE $${baseLen + 2} OR
                d.numero_empleado ILIKE $${baseLen + 3}
            )`;
        }
        query += ` ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre`;
        params.push(limit, offset);
        query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
        const result = await (0, database_1.executeQuery)(query, params);
        return result;
    }
    static async count(filters = {}) {
        let query = `
            SELECT COUNT(*) as total
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE u.status = 'activo'
        `;
        const params = [];
        if (filters.especialidad) {
            params.push(filters.especialidad);
            query += ` AND d.especialidad = $${params.length}`;
        }
        if (filters.tipo_contrato) {
            params.push(filters.tipo_contrato);
            query += ` AND d.tipo_contrato = $${params.length}`;
        }
        if (filters.search) {
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            const baseLen = params.length - 3;
            query += ` AND (
                u.nombre ILIKE $${baseLen} OR
                u.apellido_paterno ILIKE $${baseLen + 1} OR
                u.apellido_materno ILIKE $${baseLen + 2} OR
                d.numero_empleado ILIKE $${baseLen + 3}
            )`;
        }
        const result = await (0, database_1.executeQuery)(query, params);
        return parseInt(result[0]?.total || '0', 10);
    }
    static async create(userId, data) {
        const query = `
            INSERT INTO docentes (
                usuario_id, numero_empleado, especialidad, anos_experiencia, 
                grado_academico, tipo_contrato, fecha_ingreso, telefono_oficina, 
                horario_atencion, visible_directorio
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const params = [
            userId,
            data.numero_empleado,
            data.especialidad,
            data.anos_experiencia || 0,
            data.grado_academico || null,
            data.tipo_contrato,
            data.fecha_ingreso || new Date(),
            data.telefono_oficina || null,
            data.horario_atencion || null,
            data.visible_directorio !== undefined ? data.visible_directorio : true
        ];
        const result = await (0, database_1.executeQuery)(query, params);
        return result[0];
    }
    static async update(id, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        const allowedFields = [
            'especialidad', 'anos_experiencia', 'grado_academico',
            'tipo_contrato', 'telefono_oficina', 'horario_atencion', 'visible_directorio'
        ];
        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${paramCount++}`);
                values.push(data[field]);
            }
        });
        if (fields.length === 0)
            return null;
        values.push(id);
        const query = `
            UPDATE docentes
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, values);
        return result[0];
    }
    static async deactivate(id) {
        const query = `
            UPDATE usuarios
            SET status = 'inactivo'
            WHERE id = (SELECT usuario_id FROM docentes WHERE id = $1)
        `;
        await (0, database_1.executeQuery)(query, [id]);
        return true;
    }
    static async getSubjects(teacherId) {
        const query = `
            SELECT
                m.id as materia_id, m.nombre as materia_nombre,
                m.grupo, m.semestre, m.horario, m.aula,
                COUNT(DISTINCT e.id) as total_estudiantes
            FROM materias m
            LEFT JOIN inscripciones_materias im ON m.id = im.materia_id
            LEFT JOIN estudiantes e ON im.estudiante_id = e.id
            WHERE m.docente_id = $1 AND m.activa = TRUE
            GROUP BY m.id
            ORDER BY m.nombre, m.grupo
        `;
        const result = await (0, database_1.executeQuery)(query, [teacherId]);
        return result;
    }
    static async getSchedule(teacherId) {
        const query = `
            SELECT
                m.id as materia_id, m.nombre as materia,
                m.grupo, m.semestre, m.horario, m.aula,
                COUNT(im.estudiante_id) as total_estudiantes
            FROM materias m
            LEFT JOIN inscripciones_materias im ON m.id = im.materia_id
            WHERE m.docente_id = $1 AND m.activa = TRUE
            GROUP BY m.id
            ORDER BY m.horario
        `;
        const result = await (0, database_1.executeQuery)(query, [teacherId]);
        return result;
    }
    static async getSpecialties() {
        const query = `
            SELECT
                especialidad,
                COUNT(*) as total_docentes,
                COUNT(CASE WHEN visible_directorio = TRUE THEN 1 END) as docentes_publicos
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE u.status = 'activo'
            GROUP BY especialidad
            ORDER BY especialidad
        `;
        const result = await (0, database_1.executeQuery)(query);
        return result;
    }
    static async getPublicDirectory(especialidadFilter = null) {
        let query = `
            SELECT 
                u.nombre, u.apellido_paterno, u.apellido_materno,
                d.especialidad, d.anos_experiencia, d.grado_academico,
                d.telefono_oficina, d.horario_atencion
            FROM docentes d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE u.status = 'activo' AND d.visible_directorio = TRUE
        `;
        const params = [];
        if (especialidadFilter) {
            params.push(especialidadFilter);
            query += ` AND d.especialidad = $1`;
        }
        query += ` ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre`;
        const result = await (0, database_1.executeQuery)(query, params);
        return result;
    }
}
exports.default = TeacherDAO;
module.exports = TeacherDAO;
//# sourceMappingURL=teacher.dao.js.map