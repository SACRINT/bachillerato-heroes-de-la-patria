/**
 * ✅ APPROVALS DAO - TypeScript
 * Data Access Object para aprobaciones pendientes
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface ApprovalStats {
    total: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
    emails_verificados: number;
    hoy: number;
    esta_semana: number;
    byFormType: Array<{
        form_type: string;
        status: string;
        cantidad: number;
    }>;
}
export interface ApprovalRow {
    id: number;
    form_type: string;
    submission_data: Record<string, any>;
    email: string;
    status: 'pending' | 'approved' | 'rejected';
    email_verified: boolean;
    reviewed_by?: string;
    review_notes?: string;
    rejection_reason?: string;
    reviewed_at?: Date;
    created_at: Date;
}
export interface ApprovalHistoryFilters {
    status?: string;
    form_type?: string;
    limit?: number;
    offset?: number;
}
declare class ApprovalsDAO {
    static getStats(): Promise<ApprovalStats>;
    static getById(id: number): Promise<ApprovalRow | null>;
    static saveToBolsaTrabajo(data: Record<string, any>, ipAddress: string, userAgent: string): Promise<number | null>;
    static saveToEgresados(data: Record<string, any>, ipAddress: string, userAgent: string): Promise<number | null>;
    static approve(id: number, reviewedBy: string | null, reviewNotes: string | null): Promise<ApprovalRow | null>;
    static reject(id: number, reviewedBy: string | null, reviewNotes: string | null, rejectionReason: string | null): Promise<ApprovalRow | null>;
    static getHistory(filters: ApprovalHistoryFilters): Promise<{
        data: ApprovalRow[];
        total: number;
    }>;
}
export default ApprovalsDAO;
//# sourceMappingURL=approvals.dao.d.ts.map