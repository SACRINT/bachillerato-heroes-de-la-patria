/**
 * 💾 BACKUP SERVICE - TypeScript
 * Servicio para respaldo automático de datos críticos del sistema
 *
 * Features:
 * - Backup completo y parcial (solo datos)
 * - Programación automática con cron
 * - Limpieza de backups antiguos
 * - Health checks
 * - Estadísticas
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface BackupResult {
    success: boolean;
    filename?: string;
    path?: string;
    size?: number;
    timestamp?: string;
    type?: string;
    message?: string;
    error?: string;
}
export interface BackupFileInfo {
    filename: string;
    size: number;
    sizeFormatted: string;
    created: Date;
    type: 'complete' | 'data-only';
}
export interface BackupListResult {
    success: boolean;
    backups?: BackupFileInfo[];
    count?: number;
    error?: string;
}
export interface BackupStats {
    totalBackups: number;
    totalSize: number;
    totalSizeFormatted?: string;
    oldestBackup: Date | null;
    newestBackup: Date | null;
    fullBackups: number;
    dataBackups: number;
}
export interface BackupStatsResult {
    success: boolean;
    stats?: BackupStats;
    error?: string;
}
export interface BackupHealth {
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    lastBackup: Date | null;
    diskSpace: any;
    scheduledJobs: string;
}
declare class BackupService {
    private backupDir;
    private maxBackups;
    private isRunning;
    constructor();
    /**
     * Inicializar servicio de backup
     */
    private init;
    /**
     * Asegurar que existe el directorio de backups
     */
    private ensureBackupDirectory;
    /**
     * Programar backups automáticos
     */
    private scheduleBackups;
    /**
     * Crear backup completo del sistema
     */
    createFullBackup(type?: string): Promise<BackupResult>;
    /**
     * Crear backup solo de datos
     */
    createDataBackup(): Promise<BackupResult>;
    /**
     * Agregar archivos del sistema al backup
     */
    private addSystemFilesToBackup;
    /**
     * Agregar archivos de datos al backup
     */
    private addDataFilesToBackup;
    /**
     * Agregar archivos de configuración al backup
     */
    private addConfigFilesToBackup;
    /**
     * Limpiar backups antiguos
     */
    cleanOldBackups(): Promise<void>;
    /**
     * Restaurar desde backup
     */
    restoreFromBackup(backupFilename: string): Promise<BackupResult>;
    /**
     * Listar backups disponibles
     */
    listBackups(): Promise<BackupListResult>;
    /**
     * Obtener estadísticas de backups
     */
    getBackupStats(): Promise<BackupStatsResult>;
    /**
     * Crear backup manual inmediato
     */
    createManualBackup(): Promise<BackupResult>;
    /**
     * Formatear bytes a tamaño legible
     */
    formatBytes(bytes: number, decimals?: number): string;
    /**
     * Verificar salud del sistema de backup
     */
    checkBackupHealth(): Promise<BackupHealth>;
    /**
     * Parar el servicio de backup
     */
    stop(): void;
}
export declare function getBackupService(): BackupService;
export { BackupService };
declare const _default: BackupService;
export default _default;
//# sourceMappingURL=backup.service.d.ts.map