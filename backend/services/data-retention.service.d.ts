/**
 * 🗃️ DATA RETENTION SERVICE - TypeScript Version
 * GDPR & Data Retention
 * Refactorizado: 07 Diciembre 2025
 */
export interface CleanupResult {
    success: boolean;
    deletedCount?: number;
    error?: string;
}
declare class DataRetentionService {
    cleanupSystemLogs(): Promise<CleanupResult>;
    anonymizeInactiveUsers(): Promise<void>;
}
declare const dataRetentionService: DataRetentionService;
export { DataRetentionService };
export default dataRetentionService;
//# sourceMappingURL=data-retention.service.d.ts.map