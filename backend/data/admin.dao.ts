/**
 * 🔐 ADMIN DAO - TypeScript
 * Funciones administrativas para dashboard
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { executeQuery } from '../config/database';
import { UserRow } from './user.dao';

// =====================================================
// INTERFACES
// =====================================================

export interface TeacherListItem {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email?: string;
    especialidad?: string;
}

export interface StudentListItem {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email?: string;
    grado?: string;
    grupo?: string;
}

export interface ParentListItem {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    fecha_registro: Date;
    activo: boolean;
}

// =====================================================
// ADMIN DAO CLASS
// =====================================================

class AdminDAO {

    static async getTeachers(): Promise<TeacherListItem[]> {
        return await executeQuery(
            'SELECT * FROM docentes ORDER BY apellido_paterno, apellido_materno, nombre ASC',
            []
        );
    }

    static async getStudents(): Promise<StudentListItem[]> {
        return await executeQuery(
            'SELECT * FROM estudiantes ORDER BY apellido_paterno, apellido_materno, nombre ASC',
            []
        );
    }

    static async getParents(): Promise<ParentListItem[]> {
        return await executeQuery(
            `SELECT p.id, p.nombre, p.email, p.telefono, p.fecha_creacion as fecha_registro, p.activo 
             FROM parents p 
             ORDER BY p.nombre ASC`,
            []
        );
    }

    static async getUserById(id: number): Promise<UserRow | null> {
        const result = await executeQuery('SELECT * FROM usuarios WHERE id = $1', [id]);
        return result[0] || null;
    }
}

export default AdminDAO;
module.exports = AdminDAO;
