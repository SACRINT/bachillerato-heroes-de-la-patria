/**
 * 🛡️ GDPR COMPLIANCE SERVICE - TypeScript Version
 * Sistema de cumplimiento GDPR
 * Refactorizado: 07 Diciembre 2025
 */
export type ConsentType = 'essential' | 'marketing' | 'analytics' | 'third_party';
export interface ConsentRecord {
    id: number;
    user_id: number;
    essential: boolean;
    marketing: boolean;
    analytics: boolean;
    third_party: boolean;
    ip_address?: string;
    created_at: Date;
    updated_at: Date;
}
export interface ConsentData {
    essential?: boolean;
    marketing?: boolean;
    analytics?: boolean;
    third_party?: boolean;
    ip_address?: string;
}
export interface UserExportData {
    usuario?: Record<string, any>;
    estudiante?: Record<string, any>;
    calificaciones?: any[];
    asistencias?: any[];
    notificaciones?: any[];
    actividad?: any[];
}
export interface ExportResult {
    success: boolean;
    data: UserExportData;
    exportedAt: string;
    format: string;
}
export interface DeleteOptions {
    keepAuditLogs?: boolean;
}
export interface DeleteResult {
    success: boolean;
    message: string;
    deletedAt: string;
}
export interface GDPRRequest {
    id: number;
    user_id: number;
    type: string;
    status: string;
    details?: Record<string, any>;
    created_at: Date;
}
export interface RequestsQueryOptions {
    userId?: number;
    status?: string;
    page?: number;
    limit?: number;
}
export interface RetentionResult {
    success: boolean;
    deleted: number;
    appliedAt: string;
}
declare class GDPRService {
    consentTypes: ConsentType[];
    constructor();
    recordConsent(userId: number, consents: ConsentData): Promise<{
        success: boolean;
        consentId: number;
    }>;
    getConsent(userId: number): Promise<{
        success: boolean;
        consent: ConsentRecord | null;
    }>;
    exportUserData(userId: number): Promise<ExportResult>;
    deleteUserData(userId: number, options?: DeleteOptions): Promise<DeleteResult>;
    logRequest(userId: number, type: string, status: string, details?: Record<string, any> | null): Promise<void>;
    getRequests(options?: RequestsQueryOptions): Promise<{
        success: boolean;
        requests: GDPRRequest[];
    }>;
    applyRetentionPolicy(daysToKeep?: number): Promise<RetentionResult>;
}
declare const gdprService: GDPRService;
export { GDPRService };
export default gdprService;
//# sourceMappingURL=gdpr.service.d.ts.map