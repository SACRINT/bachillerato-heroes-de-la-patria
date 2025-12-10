/**
 * 🧹 CLEANUP SERVICE - TypeScript Version
 * Servicio de Limpieza Automática
 * Refactorizado: 07 Diciembre 2025
 */
export interface CleanupResult {
    table: string;
    cleaned: number;
}
export interface CleanupAction {
    table?: string;
    count?: number;
    status: 'success' | 'error';
    error?: string;
    results?: CleanupResult[];
}
/**
 * Limpiar registros antiguos de una tabla específica
 */
declare function cleanupTable(tableName: string): Promise<CleanupResult>;
/**
 * Ejecutar todas las tareas de limpieza
 */
declare function runAllCleanups(): Promise<CleanupResult[] | undefined>;
/**
 * Iniciar servicio de limpieza automática
 */
declare function startCleanupService(intervalHours?: number): void;
export { cleanupTable, runAllCleanups, startCleanupService };
//# sourceMappingURL=cleanup.service.d.ts.map