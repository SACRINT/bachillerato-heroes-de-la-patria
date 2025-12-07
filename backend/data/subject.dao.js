/**
 * 📚 SUBJECT DAO (Data Access Object)
 * Acceso a datos de Materias e Inscripciones
 */
const { executeQuery } = require('../config/database');

class SubjectDAO {

    /**
     * Obtener materias asignadas a un docente en un ciclo escolar
     */
    static async getByTeacher(docenteId, cicloEscolar) {
        // Asumiendo que 'ciclo_escolar' está en la tabla materias o se filtra de otra manera.
        // Por ahora, filar por docente_id es lo principal.
        // Si la tabla materias no tiene ciclo, quizás se asume las activas.
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
        // Nota: Si se requiere filtrar por ciclo, agregar WHERE m.ciclo = $2
        return await executeQuery(query, [docenteId]);
    }

    /**
     * Obtener estudiantes inscritos en una materia
     */
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
        return await executeQuery(query, [materiaId]);
    }

    /**
     * Obtener todas las materias (Solo Admin)
     */
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
        return await executeQuery(query, []);
    }
}

module.exports = SubjectDAO;
