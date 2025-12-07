/**
 * 📱 SMS NOTIFICATION DAO - TypeScript
 * Data Access Object para notificaciones SMS
 * Abstrae todas las queries SQL de SMSNotificationService
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface StudentParentInfo {
    student_name: string;
    apellido_paterno: string;
    parent_phone: string;
    idioma_preferido: string;
}

export interface AppointmentInfo {
    id: number;
    phone: string; // Joined alias 'telefono' but typically mapped
    telefono: string;
    idioma_preferido: string;
    [key: string]: any; // Other appointment fields
}

export interface VerificationCode {
    id: number;
    phone: string;
    code: string;
    expires_at: Date;
    created_at: Date;
}

export interface SMSLogEntry {
    id: number;
    phone_to: string;
    message: string;
    template: string;
    status: string;
    priority: string;
    provider_id?: string;
    created_at: Date;
    updated_at?: Date;
}

export interface SMSInput {
    to: string;
    message: string;
    template: string;
    status: string;
    priority: string;
}

export interface SMSStats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    day: Date;
}

// =====================================================
// SMS NOTIFICATION DAO CLASS
// =====================================================

class SMSNotificationDAO {

    // ==========================================
    // ALERTAS Y DATOS
    // ==========================================

    static async getStudentParents(studentId: number): Promise<StudentParentInfo[]> {
        const result = await pool.query(`
            SELECT e.nombre as student_name, e.apellido_paterno, p.telefono as parent_phone, p.idioma_preferido
            FROM estudiantes e JOIN padres p ON e.id = p.estudiante_id
            WHERE e.id = $1 AND p.telefono IS NOT NULL
        `, [studentId]);
        return result.rows;
    }

    static async getAppointment(appointmentId: number): Promise<AppointmentInfo | null> {
        const result = await pool.query(`
            SELECT c.*, u.telefono, u.idioma_preferido
            FROM citas c JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.id = $1 AND u.telefono IS NOT NULL
        `, [appointmentId]);
        return result.rows[0] || null;
    }

    // ==========================================
    // CÓDIGOS DE VERIFICACIÓN
    // ==========================================

    static async saveVerificationCode(phone: string, code: string): Promise<void> {
        await pool.query(`
            INSERT INTO verification_codes (phone, code, expires_at)
            VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
            ON CONFLICT (phone) DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '10 minutes'
        `, [phone, code]);
    }

    static async getValidCode(phone: string, code: string): Promise<VerificationCode | null> {
        const result = await pool.query(`
            SELECT * FROM verification_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW()
        `, [phone, code]);
        return result.rows[0] || null;
    }

    static async deleteCode(phone: string): Promise<void> {
        await pool.query('DELETE FROM verification_codes WHERE phone = $1', [phone]);
    }

    // ==========================================
    // LOG DE SMS
    // ==========================================

    static async logSMS(data: SMSInput): Promise<number> {
        const result = await pool.query(`
            INSERT INTO sms_log (phone_to, message, template, status, priority, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id
        `, [data.to, data.message, data.template, data.status, data.priority]);
        return result.rows[0].id;
    }

    static async updateSMSStatus(id: number, status: string, providerId: string): Promise<void> {
        await pool.query(`
            UPDATE sms_log SET status = $2, provider_id = $3, updated_at = NOW() WHERE id = $1
        `, [id, status, providerId]);
    }

    static async getHistory(whereClause: string, params: any[], limit: number, offset: number): Promise<SMSLogEntry[]> {
        const query = `SELECT * FROM sms_log WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getHistoryCount(whereClause: string, params: any[]): Promise<number> {
        const query = `SELECT COUNT(*) FROM sms_log WHERE ${whereClause}`;
        const result = await pool.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }

    static async getStats(): Promise<SMSStats[]> {
        const result = await pool.query(`
            SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                DATE_TRUNC('day', created_at) as day
            FROM sms_log WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE_TRUNC('day', created_at) ORDER BY day DESC
        `);
        return result.rows.map((row: any) => ({
            total: parseInt(row.total),
            sent: parseInt(row.sent),
            failed: parseInt(row.failed),
            pending: parseInt(row.pending),
            day: row.day
        }));
    }
}

export default SMSNotificationDAO;
module.exports = SMSNotificationDAO;
