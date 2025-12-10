/**
 * 🔒 GDPR DATA EXPORT DAO - TypeScript
 * Data Access Object para GDPR/FERPA compliance
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface GDPRRequestExport {
    id: string | number;
    user_id: number;
    type: string;
    status: string;
    reason: string;
    requested_by: number;
    metadata: any;
    created_at: Date;
    expires_at: Date;
    updated_at?: Date;
    completed_at?: Date;
}
export interface ConsentReportEntry {
    id: number;
    email: string;
    consent_type: string;
    given_at: Date;
    revoked_at?: Date;
    ip_address: string;
}
declare class GDPRDataExportDAO {
    static createRequest(requestId: string | number, userId: number, type: string, status: string, reason: string, requestedBy: number): Promise<GDPRRequestExport>;
    static getRequest(requestId: string | number): Promise<GDPRRequestExport | null>;
    static updateRequestStatus(requestId: string | number, status: string, metadata?: any, isCompleted?: boolean): Promise<void>;
    static listUserRequests(userId: number): Promise<GDPRRequestExport[]>;
    static getUserData(userId: number): Promise<any>;
    static getTableData(tableName: string, identifier: string, targetId: number | string): Promise<any[]>;
    static getStudentData(userId: number): Promise<any>;
    static getConsentReport(tenantId?: number | null): Promise<ConsentReportEntry[]>;
    static giveConsent(userId: number, type: string, ipAddress: string): Promise<any>;
    static revokeConsent(userId: number, type: string): Promise<any>;
    static anonymizeTable(tableName: string, columns: string[], identifier: string, targetId: number | string): Promise<number>;
    static deleteFromTable(tableName: string, identifier: string, targetId: number | string): Promise<number>;
}
export default GDPRDataExportDAO;
//# sourceMappingURL=gdpr-data-export.dao.d.ts.map