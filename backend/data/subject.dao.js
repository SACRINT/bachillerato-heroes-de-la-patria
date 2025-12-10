"use strict";
/**
 * 📚 SUBJECT DAO - TypeScript
 * Acceso a datos de Materias e Inscripciones
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// SUBJECT DAO CLASS
// =====================================================
class SubjectDAO {
    static async getByTeacher(docenteId, _cicloEscolar) {
        const query = `
            SELECT 
                m.id, 
                m.nombre, 
                m.clave, 
                m.semestre, 
                m.creditos,
                COUNT(im.estudiante_id) as total_estudiantes
            FROM materias m
            LEFT JOIN inscripciones_materias im ON m.id = im.materia_id
            WHERE m.docente_id = $1
            GROUP BY m.id
            ORDER BY m.nombre ASC
        `;
        return await (0, database_1.executeQuery)(query, [docenteId]);
    }
    static async getStudentsInSubject(materiaId) {
        const query = `
            SELECT 
                e.id as estudiante_id,
                e.matricula,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.email,
                im.id as inscripcion_id
            FROM inscripciones_materias im
            JOIN estudiantes e ON im.estudiante_id = e.id
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE im.materia_id = $1 AND u.status = 'activo'
            ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre
        `;
        return await (0, database_1.executeQuery)(query, [materiaId]);
    }
    static async listAll() {
        const query = `
             SELECT 
                m.id, 
                m.nombre, 
                m.clave, 
                m.semestre,
                u.nombre as docente_nombre,
                u.apellido_paterno as docente_apellido
            FROM materias m
            LEFT JOIN docentes d ON m.docente_id = d.id
            LEFT JOIN usuarios u ON d.usuario_id = u.id
            ORDER BY m.nombre ASC
        `;
        return await (0, database_1.executeQuery)(query, []);
    }
}
exports.default = SubjectDAO;
module.exports = SubjectDAO;
//# sourceMappingURL=subject.dao.js.map