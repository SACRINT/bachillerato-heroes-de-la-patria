/**
 * 💾 BACKUP AUTOMATION DAO - TypeScript
 * Data Access Object para backups automatizados
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface BackupState {
    level: string;
    last_backup: Date;
}
export interface TableInfo {
    name: string;
}
export interface SimpleTableList {
    table_name: string;
}
export interface BackupLogEntry {
    backup_id: string;
    level: string;
    status: string;
    started_at: Date;
    completed_at?: Date;
    size_bytes?: number;
    duration_ms?: number;
    path?: string;
    error_message?: string;
}
declare class BackupAutomationDAO {
    static getLastBackupState(): Promise<BackupState[]>;
    static getModifiedTables(): Promise<TableInfo[]>;
    static getAllTables(): Promise<SimpleTableList[]>;
    static getTableData(tableName: string, since?: Date | string | null): Promise<any[]>;
    static executeStatement(statement: string): Promise<void>;
    static logBackupStart(backupId: string, level: string): Promise<void>;
    static logBackupComplete(backupId: string, size: number, duration: number, path: string): Promise<void>;
    static logBackupError(backupId: string, errorMessage: string): Promise<void>;
}
export default BackupAutomationDAO;
//# sourceMappingURL=backup-automation.dao.d.ts.map