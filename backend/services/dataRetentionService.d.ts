declare const _exports: DataRetentionService;
export = _exports;
declare class DataRetentionService {
    cleanupSystemLogs(): Promise<{
        success: boolean;
        deletedCount: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        deletedCount?: undefined;
    }>;
    anonymizeInactiveUsers(): Promise<void>;
}
//# sourceMappingURL=dataRetentionService.d.ts.map