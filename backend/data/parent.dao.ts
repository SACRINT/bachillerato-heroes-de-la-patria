/**
 * 👨‍👩‍👧 PARENT DAO - TypeScript
 * Gestión de padres y portal familiar
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface ParentRow {
    id: number;
    nombre: string;
    email: string;
    password_hash: string;
    telefono?: string;
    activo: boolean;
    email_verified?: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ParentCreateData {
    nombre?: string;
    nombre_completo?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    email: string;
    password_hash: string;
}

export interface ParentUpdateData {
    [key: string]: any;
}

export interface StudentSummary {
    id: number;
    matricula: string;
    nombre_completo: string;
    grado: string;
    especialidad?: string;
}

export interface ParentStudentPermission {
    parent_id: number;
    student_id: number;
    ver_calificaciones?: boolean;
    ver_asistencia?: boolean;
}

export interface PaymentsSummary {
    count: number;
    total: number;
}

// =====================================================
// PARENT DAO CLASS
// =====================================================

class ParentDAO {

    static async create(data: ParentCreateData): Promise<Pick<ParentRow, 'id' | 'nombre' | 'email'>> {
        const query = `
            INSERT INTO parents (
                nombre, email, password_hash, created_at, updated_at
            )
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id, nombre, email
        `;

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

    static async findById(id: number): Promise<ParentRow | undefined> {
        const query = `SELECT * FROM parents WHERE id = $1`;
        const result = await executeQuery(query, [id]);
        return result[0];
    }

    static async findByEmail(email: string): Promise<ParentRow | undefined> {
        const query = `SELECT * FROM parents WHERE email = $1`;
        const result = await executeQuery(query, [email.toLowerCase()]);
        return result[0];
    }

    static async update(id: number, data: ParentUpdateData): Promise<Pick<ParentRow, 'id' | 'nombre' | 'email' | 'updated_at'> | null> {
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

    static async delete(id: number): Promise<boolean> {
        const query = `DELETE FROM parents WHERE id = $1 RETURNING id`;
        const result = await executeQuery(query, [id]);
        return result.length > 0;
    }

    static async findAll(): Promise<ParentRow[]> {
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

    static async getStudentsByParentId(parentId: number): Promise<StudentSummary[]> {
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

    static async checkPermission(parentId: number, studentId: number): Promise<ParentStudentPermission | undefined> {
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

    static async countUnreadNotifications(parentId: number): Promise<number> {
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
        } catch (error: any) {
            if (error.message?.includes('does not exist')) return 0;
            throw error;
        }
    }

    static async countUnreadMessages(parentId: number): Promise<number> {
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
        } catch (error: any) {
            if (error.message?.includes('does not exist')) return 0;
            throw error;
        }
    }

    // ==========================================
    // PAGOS
    // ==========================================

    static async getPendingPaymentsSummary(parentId: number): Promise<PaymentsSummary> {
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
                count: parseInt(result[0].count || '0'),
                total: parseFloat(result[0].total || '0')
            };
        } catch (error: any) {
            if (error.message?.includes('does not exist')) return { count: 0, total: 0 };
            throw error;
        }
    }
}

export default ParentDAO;
module.exports = ParentDAO;
