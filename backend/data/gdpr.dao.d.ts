/**
 * 🛡️ GDPR DAO - TypeScript
 * Data Access Object consolidado para GDPR, Consent Management y Email Confirmation
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface GDPRConsent {
    id: number;
    user_id: number;
    consents: any;
    ip_address: string;
    created_at: Date;
}
export interface UserConsent {
    id: number;
    user_id: number;
    consent_type: string;
    granted: boolean;
    ip_address: string;
    user_agent: string;
    metadata: any;
    granted_at: Date;
    revoked_at?: Date;
    updated_at?: Date;
}
export interface GDPRRequest {
    id?: number;
    user_id: number;
    request_type: string;
    status: string;
    details: any;
    created_at: Date;
}
export interface PendingConfirmation {
    id: number;
    uuid: string;
    confirmation_token: string;
    email: string;
    nombre: string;
    telefono?: string;
    profesion?: string;
    experiencia?: string;
    habilidades?: string;
    mensaje?: string;
    ip_address: string;
    user_agent: string;
    confirmed: boolean;
    confirmed_at?: Date;
    expires_at: Date;
    created_at: Date;
}
export interface PrivacyPolicyVersion {
    id: number;
    version: string;
    content: string;
    effective_date: Date;
    is_active: boolean;
    created_at: Date;
}
export interface ConsentReportItem {
    consent_type: string;
    total: number;
    granted: number;
    revoked: number;
}
declare class GDPRDAO {
    static recordConsent(userId: number, consents: any, ipAddress: string): Promise<number>;
    static getConsent(userId: number): Promise<GDPRConsent | null>;
    static grantConsent(userId: number, consentType: string, granted: boolean, ipAddress: string, userAgent: string, metadata: any): Promise<UserConsent>;
    static revokeConsent(userId: number, consentType: string): Promise<boolean>;
    static getUserConsents(userId: number): Promise<UserConsent[]>;
    static hasActiveConsent(userId: number, consentType: string): Promise<boolean>;
    static getUser(userId: number): Promise<any>;
    static getStudentData(userId: number): Promise<any>;
    static getGrades(userId: number): Promise<any[]>;
    static getAttendance(userId: number): Promise<any[]>;
    static getNotifications(userId: number): Promise<any[]>;
    static getActivity(userId: number): Promise<any[]>;
    static deleteUserData(userId: number, keepAuditLogs: boolean): Promise<boolean>;
    static logRequest(userId: number, type: string, status: string, details: any): Promise<void>;
    static getRequests(userId: number, status: string, limit: number, offset: number): Promise<GDPRRequest[]>;
    static applyRetentionPolicy(daysToKeep: number): Promise<number>;
    static savePendingConfirmation(uuid: string, token: string, formData: any, ipAddress: string, userAgent: string, expiresAt: Date): Promise<number>;
    static findPendingToken(token: string): Promise<PendingConfirmation | null>;
    static markConfirmed(token: string): Promise<void>;
    static getPendingConfirmations(limit: number, offset: number): Promise<{
        rows: PendingConfirmation[];
        total: number;
    }>;
    static cleanExpiredTokens(): Promise<number>;
    static createPrivacyPolicyVersion(version: string, content: string, options: {
        effectiveDate?: Date;
    }): Promise<PrivacyPolicyVersion>;
    static getCurrentPrivacyPolicyVersion(): Promise<PrivacyPolicyVersion | null>;
    static generateConsentReport(filters: any): Promise<ConsentReportItem[]>;
}
export default GDPRDAO;
//# sourceMappingURL=gdpr.dao.d.ts.map