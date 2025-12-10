export = soc2Service;
declare const soc2Service: SOC2ComplianceService;
declare class SOC2ComplianceService {
    constructor(config?: {});
    config: {
        retentionDays: any;
        logAllActions: boolean;
        logSensitiveDataAccess: boolean;
        encryptionAlgorithm: any;
        keyRotationDays: any;
        incidentDetectionEnabled: boolean;
        autoResponseEnabled: boolean;
        failedLoginThreshold: any;
        privilegeEscalationAlert: boolean;
        dataExfiltrationThreshold: any;
    };
    stats: {
        auditEventsLogged: number;
        incidentsDetected: number;
        complianceReportsGenerated: number;
        accessControlViolations: number;
        encryptionOperations: number;
    };
    recentIncidents: any[];
    failedLoginAttempts: Map<any, any>;
    /**
     * AUDIT LOGGING (SOC2: Security + Availability)
     * Log all critical system events with complete audit trail
     */
    logAuditEvent(event: any): Promise<{
        id: string;
        timestamp: number;
        action: any;
        userId: any;
        performedBy: any;
        resourceType: any;
        resourceId: any;
        ipAddress: any;
        userAgent: any;
        details: any;
        severity: any;
        status: any;
        category: any;
    }>;
    /**
     * STORE AUDIT EVENT IN DATABASE
     */
    storeAuditEvent(event: any): Promise<void>;
    /**
     * CATEGORIZE ACTION
     */
    categorizeAction(action: any): any;
    /**
     * INCIDENT DETECTION (SOC2: Security)
     * Detect suspicious patterns and security incidents
     */
    detectIncidents(event: any): Promise<void>;
    /**
     * HANDLE SECURITY INCIDENT
     */
    handleIncident(incident: any, originatingEvent: any): Promise<void>;
    /**
     * STORE INCIDENT IN DATABASE
     */
    storeIncident(incident: any, originatingEvent: any): Promise<void>;
    /**
     * EXECUTE INCIDENT RESPONSE
     */
    executeIncidentResponse(incident: any): Promise<void>;
    /**
     * ACCESS CONTROL ENFORCEMENT (SOC2: Security)
     * Verify user has permission to perform action
     */
    enforceAccessControl(userId: any, action: any, resourceType: any, resourceId?: any): Promise<{
        allowed: boolean;
        reason: string;
        userRole?: undefined;
    } | {
        allowed: boolean;
        userRole: any;
        reason?: undefined;
    }>;
    /**
     * DATA ENCRYPTION (SOC2: Confidentiality)
     * Encrypt sensitive data at rest
     */
    encryptData(data: any, key?: any): Promise<{
        encrypted: string;
        iv: string;
        authTag: string;
    }>;
    /**
     * DATA DECRYPTION
     */
    decryptData(encryptedData: any, iv: any, authTag: any, key?: any): Promise<string>;
    /**
     * GET ENCRYPTION KEY
     * In production, this should fetch from secure key management service (AWS KMS, HashiCorp Vault, etc)
     */
    getEncryptionKey(): NonSharedBuffer;
    /**
     * COMPLIANCE REPORTING (SOC2: All Principles)
     * Generate SOC2-ready compliance reports
     */
    generateComplianceReport(startDate: any, endDate: any): Promise<{
        reportPeriod: {
            startDate: any;
            endDate: any;
        };
        generatedAt: string;
        summary: {};
        details: {};
    }>;
    /**
     * CALCULATE COMPLIANCE SCORE
     */
    calculateComplianceScore(report: any): {
        score: number;
        grade: string;
        compliant: boolean;
    };
    /**
     * GET SOC2 COMPLIANCE STATISTICS
     */
    getComplianceStats(): {
        recentIncidentsCount: number;
        failedLoginAttemptsCount: number;
        config: {
            retentionDays: any;
            encryptionAlgorithm: any;
            incidentDetectionEnabled: boolean;
        };
        auditEventsLogged: number;
        incidentsDetected: number;
        complianceReportsGenerated: number;
        accessControlViolations: number;
        encryptionOperations: number;
    };
    /**
     * GENERATE UNIQUE ID
     */
    generateId(): string;
}
//# sourceMappingURL=soc2ComplianceService.d.ts.map