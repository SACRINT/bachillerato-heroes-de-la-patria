export class AdvancedLogger {
    constructor(options?: {});
    logDir: any;
    maxFileSize: any;
    maxFiles: any;
    environment: string;
    levels: {
        error: number;
        warn: number;
        info: number;
        http: number;
        verbose: number;
        debug: number;
        silly: number;
    };
    colors: {
        error: string;
        warn: string;
        info: string;
        http: string;
        verbose: string;
        debug: string;
        silly: string;
        reset: string;
    };
    currentLevel: any;
    streams: Map<any, any>;
    /**
     * Inicializar sistema de logs
     */
    init(): Promise<void>;
    /**
     * Asegurar que existe el directorio de logs
     */
    ensureLogDirectory(): Promise<void>;
    /**
     * Configurar streams de archivos
     */
    setupFileStreams(): Promise<void>;
    /**
     * Escribir log en archivo y consola
     */
    writeLog(level: any, message: any, meta?: {}, category?: string): void;
    /**
     * Formatear entrada de log
     */
    formatLogEntry(logEntry: any): string;
    /**
     * Escribir en consola con colores
     */
    writeToConsole(level: any, formattedLog: any): void;
    /**
     * Escribir en archivo
     */
    writeToFile(level: any, formattedLog: any, category: any): void;
    /**
     * Métodos de logging por nivel
     */
    error(message: any, meta?: {}, category?: string): void;
    warn(message: any, meta?: {}, category?: string): void;
    info(message: any, meta?: {}, category?: string): void;
    http(message: any, meta?: {}, category?: string): void;
    verbose(message: any, meta?: {}, category?: string): void;
    debug(message: any, meta?: {}, category?: string): void;
    silly(message: any, meta?: {}, category?: string): void;
    /**
     * Métodos especializados por categoría
     */
    security(message: any, meta?: {}): void;
    activity(message: any, meta?: {}): void;
    performance(message: any, meta?: {}): void;
    database(message: any, meta?: {}): void;
    audit(message: any, meta?: {}): void;
    /**
     * Log de request HTTP
     */
    logRequest(req: any, res: any, responseTime: any): void;
    /**
     * Log de autenticación
     */
    logAuth(action: any, success: any, meta?: {}): void;
    /**
     * Log de error con stack trace
     */
    logError(error: any, context?: {}): void;
    /**
     * Limpiar logs antiguos
     */
    cleanOldLogs(): Promise<void>;
    /**
     * Rotar logs si exceden el tamaño máximo
     */
    rotateLogs(): Promise<void>;
    /**
     * Obtener estadísticas de logs
     */
    getLogStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        totalSizeFormatted: string;
        files: {
            name: string;
            size: number;
            sizeFormatted: string;
            created: Date;
            modified: Date;
        }[];
        maxFiles: any;
        maxFileSize: any;
        currentLevel: any;
    }>;
    /**
     * Formatear bytes a tamaño legible
     */
    formatBytes(bytes: any, decimals?: number): string;
    /**
     * Cambiar nivel de logging
     */
    setLevel(level: any): boolean;
    /**
     * Búsqueda en logs
     */
    searchLogs(query: any, options?: {}): Promise<{
        query: any;
        total: number;
        results: {
            file: string;
            line: string;
            timestamp: any;
        }[];
        options: {};
        error?: undefined;
    } | {
        query: any;
        total: number;
        results: any[];
        error: any;
        options?: undefined;
    }>;
    /**
     * Extraer timestamp de línea de log
     */
    extractTimestamp(line: any): any;
    /**
     * Cerrar todos los streams
     */
    close(): void;
}
/**
 * Obtener instancia del logger avanzado
 */
export function getAdvancedLogger(options?: {}): any;
//# sourceMappingURL=advancedLogger.d.ts.map