"use strict";
/**
 * 🔐 ADMIN DAO - TypeScript
 * Funciones administrativas para dashboard
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// ADMIN DAO CLASS
// =====================================================
class AdminDAO {
    static async getTeachers() {
        return await (0, database_1.executeQuery)('SELECT * FROM docentes ORDER BY apellido_paterno, apellido_materno, nombre ASC', []);
    }
    static async getStudents() {
        return await (0, database_1.executeQuery)('SELECT * FROM estudiantes ORDER BY apellido_paterno, apellido_materno, nombre ASC', []);
    }
    static async getParents() {
        return await (0, database_1.executeQuery)(`SELECT p.id, p.nombre, p.email, p.telefono, p.fecha_creacion as fecha_registro, p.activo 
             FROM parents p 
             ORDER BY p.nombre ASC`, []);
    }
    static async getUserById(id) {
        const result = await (0, database_1.executeQuery)('SELECT * FROM usuarios WHERE id = $1', [id]);
        return result[0] || null;
    }
}
exports.default = AdminDAO;
module.exports = AdminDAO;
//# sourceMappingURL=admin.dao.js.map