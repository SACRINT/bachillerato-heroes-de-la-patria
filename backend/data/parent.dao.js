/**
 * 👨‍👩‍👧 PARENT DAO - Data Access Object
 * Gestión de padres y portal familiar
 * 
 * Abstrae el acceso a las tablas:
 * - parents
 * - parents_students
 * - parent_notifications
 * - parent_messages
 */

const { executeQuery } = require('../config/database');
const devLogger = require('../utils/devLogger');

class ParentDAO {

    /**
     * Crear nuevo padre
     */
    static async create(data) {
        // Adaptación a esquema actual (simplificado)
        const query = `
            INSERT INTO parents (
                nombre, email, password_hash, created_at, updated_at
            )
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id, nombre, email
        `;

        // Concatenar nombres si vienen separados, o usar nombre completo
        const nombreCompleto = data.nombre_completo ||
            `${data.nombre} ${data.apellido_paterno || ''} ${data.apellido_materno || ''}`.trim();

        const params = [
            nombreCompleto,
            data.email.toLowerCase(),
            data.password_hash
        ];

        const result = await executeQuery(query, params);
        return result[0];
    }

    /**
     * Buscar por ID
     */
    static async findById(id) {
        const query = `SELECT * FROM parents WHERE id = $1`;
        const result = await executeQuery(query, [id]);
        return result[0];
    }

    /**
     * Buscar por Email
     */
    static async findByEmail(email) {
        const query = `SELECT * FROM parents WHERE email = $1`;
        const result = await executeQuery(query, [email.toLowerCase()]);
        return result[0];
    }

    /**
     * Actualizar padre
     */
    static async update(id, data) {
        const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
        if (keys.length === 0) return null;

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = keys.map(key => data[key]);

        const query = `
            UPDATE parents 
            SET ${setClause}, updated_at = NOW()
            WHERE id = $1
            RETURNING id, nombre, email, updated_at
        `;

        const result = await executeQuery(query, [id, ...values]);
        return result[0];
    }

    /**
     * Eliminar padre
     */
    static async delete(id) {
        const query = `DELETE FROM parents WHERE id = $1 RETURNING id`;
        const result = await executeQuery(query, [id]);
        return result.length > 0;
    }

    /**
     * Listar todos los padres (Admin)
     */
    static async findAll() {
        const query = `
            SELECT id, nombre, email, created_at, updated_at, activo
            FROM parents
            ORDER BY created_at DESC
        `;
        const result = await executeQuery(query);
        return result;
    }

    // ==========================================
    // RELACIÓN PADRES - ESTUDIANTES
    // ==========================================

    /**
     * Obtener estudiantes asociados a un padre
     */
    static async getStudentsByParentId(parentId) {
        const query = `
            SELECT
                s.id,
                s.matricula,
                s.nombre || ' ' || s.apellido_paterno || ' ' || COALESCE(s.apellido_materno, '') as nombre_completo,
                s.semestre as grado,
                s.especialidad
            FROM estudiantes s
            INNER JOIN student_parents ps ON s.id = ps.student_id
            WHERE ps.parent_id = $1
            ORDER BY s.semestre DESC, s.nombre
        `;
        const result = await executeQuery(query, [parentId]);
        return result;
    }

    /**
     * Verificar permisos sobre un estudiante
     */
    static async checkPermission(parentId, studentId) {
        const query = `
            SELECT *
            FROM student_parents
            WHERE parent_id = $1 AND student_id = $2
        `;
        const result = await executeQuery(query, [parentId, studentId]);
        return result[0];
    }

    // ==========================================
    // NOTIFICACIONES Y MENSAJES
    // ==========================================

    /**
     * Obtener conteo de notificaciones no leídas
     */
    static async countUnreadNotifications(parentId) {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM parent_notifications
                WHERE parent_id = $1
                AND leida = FALSE
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            `;
            const result = await executeQuery(query, [parentId]);
            return parseInt(result[0].count);
        } catch (error) {
            // Si la tabla no existe, devolvemos 0
            if (error.message.includes('does not exist')) return 0;
            throw error;
        }
    }

    /**
     * Obtener conteo de mensajes no leídos
     */
    static async countUnreadMessages(parentId) {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM parent_messages
                WHERE parent_id = $1
                AND leido = FALSE
                AND tipo = 'saliente'
            `;
            const result = await executeQuery(query, [parentId]);
            return parseInt(result[0].count);
        } catch (error) {
            if (error.message.includes('does not exist')) return 0;
            throw error;
        }
    }

    // ==========================================
    // PAGOS (Consulta básica para dashboard)
    // ==========================================

    /**
     * Obtener resumen de pagos pendientes
     */
    static async getPendingPaymentsSummary(parentId) {
        try {
            const query = `
                SELECT COUNT(*) as count, SUM(monto) as total
                FROM payments
                WHERE student_id IN (
                    SELECT student_id FROM student_parents
                    WHERE parent_id = $1
                )
                AND estatus = 'pendiente'
            `;
            const result = await executeQuery(query, [parentId]);
            return {
                count: parseInt(result[0].count || 0),
                total: parseFloat(result[0].total || 0)
            };
        } catch (error) {
            if (error.message.includes('does not exist')) return { count: 0, total: 0 };
            throw error;
        }
    }
}

module.exports = ParentDAO;
