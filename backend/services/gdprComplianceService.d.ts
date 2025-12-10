export = gdprService;
declare const gdprService: GDPRComplianceService;
declare class GDPRComplianceService {
    constructor(config?: {});
    config: {
        dataRetentionDays: any;
        deletedDataRetention: any;
        exportFormats: any;
        anonymizeFields: any;
        breachNotificationHours: any;
        auditLoggingEnabled: boolean;
        consentTrackingEnabled: boolean;
    };
    stats: {
        dataExports: number;
        dataDeletions: number;
        consentRecorded: number;
        accessRequests: number;
        breachesReported: number;
    };
    /**
     * RIGHT TO ACCESS (Artículo 15 GDPR)
     * Exportar todos los datos personales de un usuario
     */
    exportUserData(userId: any, format?: string, options?: {}): Promise<{
        userId: any;
        format: string;
        exportedAt: string;
        dataSize: number;
        tables: string[];
        data: string;
    }>;
    /**
     * GATHER ALL USER DATA FROM DATABASE
     */
    gatherUserData(userId: any): Promise<{
        usuario: any;
    }>;
    /**
     * SANITIZE USER DATA (remove internal fields)
     */
    sanitizeUserData(user: any): any;
    /**
     * SANITIZE SENSITIVE DATA (hash/mask)
     */
    sanitizeSensitiveData(data: any): any;
    /**
     * FORMAT AS JSON
     */
    formatAsJSON(userData: any): {
        content: string;
        size: number;
        mimeType: string;
    };
    /**
     * FORMAT AS CSV
     */
    formatAsCSV(userData: any): {
        content: string;
        size: number;
        mimeType: string;
    };
    /**
     * FORMAT AS XML
     */
    formatAsXML(userData: any): {
        content: string;
        size: number;
        mimeType: string;
    };
    /**
     * ESCAPE XML SPECIAL CHARACTERS
     */
    escapeXML(str: any): any;
    /**
     * RIGHT TO ERASURE (Artículo 17 GDPR)
     * Eliminar todos los datos personales de un usuario
     */
    deleteUserData(userId: any, options?: {}): Promise<{
        userId: any;
        deletedAt: string;
        reason: any;
        backupRetentionDays: any;
    }>;
    /**
     * ANONYMIZE USER DATA (instead of delete)
     * Useful when data must be retained for legal reasons
     */
    anonymizeUserData(userId: any, options?: {}): Promise<{
        userId: any;
        anonymousId: string;
        anonymizedAt: string;
    }>;
    /**
     * CONSENT MANAGEMENT (Artículo 7 GDPR)
     */
    recordConsent(userId: any, consentType: any, granted: any, options?: {}): Promise<{
        userId: any;
        consentType: any;
        granted: any;
        recordedAt: string;
    }>;
    /**
     * GET USER CONSENTS
     */
    getUserConsents(userId: any): Promise<any>;
    /**
     * DATA BREACH NOTIFICATION (Artículo 33-34 GDPR)
     */
    reportDataBreach(breachInfo: any): Promise<{
        breachId: string;
        reportedAt: string;
        notificationDeadline: string;
    }>;
    /**
     * CALCULATE 72-HOUR BREACH NOTIFICATION DEADLINE
     */
    calculateBreachDeadline(detectedAt: any): string;
    /**
     * AUDIT LOGGING FOR DATA ACCESS
     */
    logDataAccess(userId: any, action: any, requestedBy?: any, reason?: any): Promise<void>;
    /**
     * RECORD DATA EXPORT
     */
    recordExport(userId: any, format: any, size: any): Promise<void>;
    /**
     * GET GDPR COMPLIANCE STATISTICS
     */
    getComplianceStats(): {
        config: {
            dataRetentionDays: any;
            breachNotificationHours: any;
            auditLoggingEnabled: boolean;
            consentTrackingEnabled: boolean;
        };
        dataExports: number;
        dataDeletions: number;
        consentRecorded: number;
        accessRequests: number;
        breachesReported: number;
    };
    /**
     * GENERATE UNIQUE ID
     */
    generateId(): string;
}
//# sourceMappingURL=gdprComplianceService.d.ts.map