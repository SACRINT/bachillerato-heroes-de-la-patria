/**
 * 🗑️ ERASURE DAO - TypeScript
 * Data Access Object para derecho al olvido GDPR
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface ErasureLog {
    id: number;
    user_id: number;
    requested_by: number;
    reason: string;
    validation_result: any;
    executed_at: Date;
}
export interface DsarRequest {
    id: string;
    user_id: number;
    request_type: string;
    email: string;
    status: string;
    metadata: any;
    created_at: Date;
    due_date: Date;
    nombre?: string;
    apellido_paterno?: string;
    user_email?: string;
    role?: string;
    user_status?: string;
}
export interface UserOriginalData {
    email: string;
    nombre: string;
    apellido_paterno: string;
}
declare class ErasureDAO {
    static getActivePayments(userId: number): Promise<number>;
    static getRecentGrades(userId: number): Promise<number>;
    static getActiveLegalCases(userId: number): Promise<number>;
    static getPublicContent(userId: number): Promise<number>;
    static pseudonymizeUser(client: any, userId: number, pseudonym: string): Promise<void>;
    static deleteNonEssentialData(client: any, userId: number): Promise<void>;
    static anonymizePublicContent(client: any, userId: number, pseudonym: string): Promise<void>;
    static logErasureAction(client: any, userId: number, requestedBy: number, reason: string, validation: any): Promise<void>;
    static getErasureLog(userId: number): Promise<ErasureLog | null>;
    static restoreUser(userId: number, originalData: UserOriginalData): Promise<void>;
    static getConnection(): Promise<any>;
    /**
     * Crear solicitud de eliminación DSAR
     */
    static createDsarErasureRequest(requestId: string, userId: number, email: string, metadata: any): Promise<void>;
    /**
     * Registrar restauración en audit_logs
     */
    static logErasureRestoration(adminId: number, userId: string, reason: string): Promise<void>;
    /**
     * Obtener solicitudes de eliminación pendientes
     */
    static getPendingErasureRequests(): Promise<DsarRequest[]>;
}
export default ErasureDAO;
//# sourceMappingURL=erasure.dao.d.ts.map