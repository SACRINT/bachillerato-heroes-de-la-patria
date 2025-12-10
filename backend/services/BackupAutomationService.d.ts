export class ServiceError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
}
export namespace BACKUP_LEVELS {
    namespace INCREMENTAL {
        let level: number;
        let name: string;
        let retention: number;
        let interval: number;
        let compress: boolean;
    }
    namespace DAILY {
        let level_1: number;
        export { level_1 as level };
        let name_1: string;
        export { name_1 as name };
        let retention_1: number;
        export { retention_1 as retention };
        let interval_1: number;
        export { interval_1 as interval };
        let compress_1: boolean;
        export { compress_1 as compress };
    }
    namespace WEEKLY_OFFSITE {
        let level_2: number;
        export { level_2 as level };
        let name_2: string;
        export { name_2 as name };
        let retention_2: number;
        export { retention_2 as retention };
        let interval_2: number;
        export { interval_2 as interval };
        let compress_2: boolean;
        export { compress_2 as compress };
        export let encrypt: boolean;
    }
}
export declare let isRunning: boolean;
export declare namespace lastBackups {
    let incremental: any;
    let daily: any;
    let weekly: any;
}
export declare namespace stats {
    let totalBackups: number;
    let successfulBackups: number;
    let failedBackups: number;
    let totalSize: number;
}
export declare function initialize(): Promise<boolean>;
export declare function runBackup(level: any): Promise<{
    duration: number;
    path: string;
    size: number;
    tables: any;
    type: string;
    success: boolean;
    backupId: string;
    level: any;
}>;
export declare function _runIncrementalBackup(backupId: any): Promise<{
    path: string;
    size: number;
    tables: any;
    type: string;
}>;
export declare function _runDailyBackup(backupId: any): Promise<{
    path: string;
    size: number;
    tables: any;
    type: string;
    compressed: boolean;
}>;
export declare function _runWeeklyBackup(backupId: any): Promise<{
    path: string;
    size: number;
    tables: any;
    type: string;
    compressed: boolean;
    encrypted: boolean;
    offsite: boolean;
} | {
    path: string;
    size: number;
    tables: any;
    type: string;
    compressed: boolean;
    encrypted: boolean;
    offsite?: undefined;
}>;
export declare function restore(backupPath: any, options?: {}): Promise<{
    success: boolean;
    statementsExecuted: number;
}>;
export declare function listBackups(level?: any): Promise<{
    name: string;
    path: string;
    size: number;
    sizeFormatted: string;
    created: Date;
    level: string;
}[]>;
export declare function getStats(): Promise<{
    total: number;
    byLevel: {
        incremental: number;
        daily: number;
        weekly: number;
    };
    totalSize: number;
    totalSizeFormatted: string;
    lastBackup: {
        name: string;
        path: string;
        size: number;
        sizeFormatted: string;
        created: Date;
        level: string;
    };
    runtime: {
        totalBackups: number;
        successfulBackups: number;
        failedBackups: number;
        totalSize: number;
    };
}>;
export declare function verifyIntegrity(backupPath: any): Promise<{
    valid: boolean;
    checksum: string;
    size: number;
    sizeFormatted: string;
    error?: undefined;
} | {
    valid: boolean;
    error: any;
    checksum?: undefined;
    size?: undefined;
    sizeFormatted?: undefined;
}>;
export declare function _loadLastBackupState(): Promise<void>;
export declare function _generateInsertSQL(tableName: any, rows: any): string;
export declare function _encryptFile(inputPath: any, outputPath: any, key: any): Promise<void>;
export declare function _decryptFile(inputPath: any, outputPath: any, key: any): Promise<void>;
export declare function _uploadToOffsite(filePath: any, backupId: any): Promise<void>;
export declare function _cleanOldBackups(level: any, retentionDays: any): Promise<void>;
export declare function _formatSize(bytes: any): string;
export declare function _getLevelFromPath(dir: any): "unknown" | "weekly" | "daily" | "incremental";
//# sourceMappingURL=BackupAutomationService.d.ts.map