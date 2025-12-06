/**
 * 🔐 ADMIN DAO @author Gemini Code @date 2025-12-05
 */
const { executeQuery } = require('../config/database');

class AdminDAO {
    static async getTeachers() {
        return await executeQuery('SELECT * FROM docentes ORDER BY apellido_paterno, apellido_materno, nombre ASC', []);
    }

    static async getStudents() {
        return await executeQuery('SELECT * FROM estudiantes ORDER BY apellido_paterno, apellido_materno, nombre ASC', []);
    }

    static async getParents() {
        return await executeQuery(`SELECT p.id, p.nombre, p.email, p.telefono, p.fecha_creacion as fecha_registro, p.activo FROM parents p ORDER BY p.nombre ASC`, []);
    }

    static async getUserById(id) {
        const result = await executeQuery('SELECT * FROM usuarios WHERE id = $1', [id]);
        return result[0] || null;
    }
}
module.exports = AdminDAO;
