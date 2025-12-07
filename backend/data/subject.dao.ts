/**
 * 📚 SUBJECT DAO - TypeScript
 * Acceso a datos de Materias e Inscripciones
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface SubjectRow {
    id: number;
    nombre: string;
    clave: string;
    semestre: string;
    creditos: number;
    docente_id?: number;
    total_estudiantes?: number;
    docente_nombre?: string;
    docente_apellido?: string;
}

export interface StudentInSubject {
    estudiante_id: number;
    matricula: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    inscripcion_id: number;
}

// =====================================================
// SUBJECT DAO CLASS
// =====================================================

class SubjectDAO {

    static async getByTeacher(docenteId: number, _cicloEscolar?: string): Promise<SubjectRow[]> {
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
        return await executeQuery(query, [docenteId]);
    }

    static async getStudentsInSubject(materiaId: number): Promise<StudentInSubject[]> {
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

    static async listAll(): Promise<SubjectRow[]> {
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

export default SubjectDAO;
module.exports = SubjectDAO;
