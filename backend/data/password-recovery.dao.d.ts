/**
 * 🔑 PASSWORD RECOVERY DAO - TypeScript
 * Data Access Object para recuperación de contraseña
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface PasswordRecoveryRow {
    id: number;
    email: string;
    student_id?: string;
    ip_address?: string;
    user_agent?: string;
    token?: string;
    token_expires_at?: Date;
    status: 'pending' | 'processed' | 'expired';
    notas_admin?: string;
    procesado_por?: number;
    fecha_solicitud: Date;
    fecha_procesado?: Date;
}
export interface PasswordRecoveryCreateData {
    email: string;
    student_id?: string;
    ip_address?: string;
    user_agent?: string;
}
export interface PasswordRecoveryStats {
    total: number;
    pendientes: number;
    procesados: number;
    expirados: number;
    hoy: number;
    esta_semana: number;
}
export interface PasswordRecoveryUpdateData {
    status?: string;
    notas_admin?: string;
    procesado_por?: number;
}
declare class PasswordRecoveryDAO {
    static create(data: PasswordRecoveryCreateData): Promise<PasswordRecoveryRow>;
    static updateToken(id: number, token: string, expiresAt: Date): Promise<void>;
    static getAll(filters: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: PasswordRecoveryRow[];
        total: number;
    }>;
    static getStats(): Promise<PasswordRecoveryStats>;
    static update(id: number, data: PasswordRecoveryUpdateData): Promise<PasswordRecoveryRow | null>;
}
export default PasswordRecoveryDAO;
//# sourceMappingURL=password-recovery.dao.d.ts.map