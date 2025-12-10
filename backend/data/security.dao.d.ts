/**
 * 🔒 SECURITY DAO - TypeScript
 * Data Access Object para gestión de seguridad
 * Alertas, IPs bloqueadas y sesiones
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface SecurityAlert {
    id: number;
    status: 'new' | 'acknowledged' | 'resolved';
    severity: number;
    message: string;
    acknowledged_by?: number;
    acknowledged_at?: Date;
    resolved_by?: number;
    resolved_at?: Date;
    resolution_notes?: string;
    created_at: Date;
}
export interface BlockedIP {
    id: number;
    ip_address: string;
    reason: string;
    blocked_by: number;
    blocked_by_email?: string;
    is_permanent: boolean;
    blocked_until?: Date;
    created_at: Date;
}
export interface ActiveSession {
    id: number;
    session_id: string;
    user_id: number;
    email?: string;
    nombre?: string;
    ip_address?: string;
    user_agent?: string;
    is_active: boolean;
    last_activity: Date;
    created_at: Date;
}
export interface AlertFilters {
    status?: string;
    severity?: string | number;
    limit?: number;
    page?: number;
}
export interface SessionFilters {
    userId?: string | number;
    active?: boolean | string;
}
declare class SecurityDAO {
    static getAlerts(filters: AlertFilters): Promise<SecurityAlert[]>;
    static acknowledgeAlert(id: number, userId: number): Promise<SecurityAlert | null>;
    static resolveAlert(id: number, userId: number, notes: string | null): Promise<SecurityAlert | null>;
    static getBlockedIPs(): Promise<BlockedIP[]>;
    static blockIP(ip: string, reason: string | null, blockedBy: number, isPermanent: boolean, blockedUntil: Date | string | null): Promise<BlockedIP>;
    static unblockIP(ip: string): Promise<BlockedIP | null>;
    static getSessions(filters: SessionFilters): Promise<ActiveSession[]>;
    static terminateSession(sessionId: string): Promise<ActiveSession | null>;
    static cleanupExpiredSessions(): Promise<number>;
}
export default SecurityDAO;
//# sourceMappingURL=security.dao.d.ts.map