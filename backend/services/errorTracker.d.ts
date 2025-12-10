export = errorTracker;
declare const errorTracker: ErrorTracker;
declare class ErrorTracker {
    constructor(config?: {});
    config: {
        alertThreshold: any;
        criticalErrorPatterns: any;
        errorRetention: any;
        maxErrors: any;
        deduplicationWindow: any;
        alertingEnabled: boolean;
        stackTraceEnabled: boolean;
    };
    errors: any[];
    errorGroups: Map<any, any>;
    stats: {
        totalErrors: number;
        errorsByType: Map<any, any>;
        errorsBySeverity: Map<any, any>;
        errorsByContext: Map<any, any>;
        recentErrors: any[];
    };
    /**
     * TRACK ERROR
     */
    trackError(error: any, options?: {}): {
        id: string;
        timestamp: number;
        message: any;
        name: any;
        stack: any;
        code: any;
        context: any;
        userId: any;
        requestId: any;
        endpoint: any;
        method: any;
        severity: any;
        fingerprint: string;
        metadata: any;
    };
    /**
     * GROUP ERRORS BY FINGERPRINT
     */
    groupError(errorInfo: any): void;
    /**
     * GENERATE ERROR FINGERPRINT (para deduplicación)
     */
    generateFingerprint(error: any): string;
    /**
     * DETERMINE ERROR SEVERITY
     */
    determineSeverity(error: any): "low" | "high" | "medium" | "critical";
    /**
     * CHECK ALERTS
     */
    checkAlerts(errorInfo: any): void;
    /**
     * LOG ERROR
     */
    logError(errorInfo: any): void;
    /**
     * SEVERITY TO LOG LEVEL
     */
    severityToLogLevel(severity: any): any;
    /**
     * GET ERROR STATISTICS
     */
    getErrorStats(): {
        totalErrors: number;
        uniqueErrorTypes: number;
        errorRate: string;
        byType: any;
        bySeverity: any;
        byContext: any;
        topErrorGroups: {
            fingerprint: any;
            message: any;
            name: any;
            count: any;
            firstSeen: string;
            lastSeen: string;
        }[];
        recentErrors: {
            id: any;
            timestamp: string;
            message: any;
            severity: any;
            context: any;
            fingerprint: any;
        }[];
    };
    /**
     * GET ERROR GROUP DETAILS
     */
    getErrorGroup(fingerprint: any): {
        fingerprint: any;
        message: any;
        name: any;
        count: any;
        firstSeen: string;
        lastSeen: string;
        errors: any;
    };
    /**
     * CLEANUP OLD ERRORS
     */
    cleanup(): void;
    /**
     * GENERATE UNIQUE ID
     */
    generateId(): string;
    /**
     * RESET STATISTICS
     */
    reset(): void;
}
//# sourceMappingURL=errorTracker.d.ts.map