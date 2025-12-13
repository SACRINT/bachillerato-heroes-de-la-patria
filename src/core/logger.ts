/**
 * ✅ LOGGER-MANAGER.TS
 *
 * Sistema de logging condicional para BGE
 * Reemplaza console.log con niveles controlables (DEBUG, INFO, WARN, ERROR)
 *
 * Propósito:
 * - Controlar output de logs por nivel
 * - Facilitar debugging sin logs en producción
 * - Centralizar prefijos y formatos de log
 *
 * Uso:
 *   logger.debug('[MODULO]', 'Mensaje de debug');
 *   logger.info('[MODULO]', 'Información');
 *   logger.warn('[MODULO]', 'Advertencia');
 *   logger.error('[MODULO]', 'Error crítico');
 *
 * Migrado a TypeScript: 13 Diciembre 2025
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

export interface LoggerConfig {
    level?: LogLevel | keyof typeof LogLevel;
    enableTimestamp?: boolean;
    enableColors?: boolean;
}

export interface LoggerInfo {
    currentLevel: string;
    isProduction: boolean;
    availableLevels: string[];
    description: string;
}

export class Logger {
    private static instance: Logger;
    private currentLevel: LogLevel;
    private isProduction: boolean;
    private enableTimestamp: boolean;
    private enableColors: boolean;

    private constructor(config: LoggerConfig = {}) {
        // Detect production environment
        this.isProduction = typeof window !== 'undefined' &&
            window.location &&
            window.location.hostname !== 'localhost' &&
            !window.location.hostname.includes('127.0.0.1');

        // Set level based on config or environment
        if (config.level !== undefined) {
            this.currentLevel = typeof config.level === 'string'
                ? LogLevel[config.level]
                : config.level;
        } else {
            this.currentLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
        }

        this.enableTimestamp = config.enableTimestamp ?? false;
        this.enableColors = config.enableColors ?? true;
    }

    /**
     * Singleton pattern
     */
    static getInstance(config?: LoggerConfig): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }

    /**
     * Logger de nivel DEBUG
     */
    debug(prefix: string, ...args: any[]): void {
        if (this.currentLevel <= LogLevel.DEBUG) {
            this.log('debug', '#007bff', prefix, ...args);
        }
    }

    /**
     * Logger de nivel INFO
     */
    info(prefix: string, ...args: any[]): void {
        if (this.currentLevel <= LogLevel.INFO) {
            this.log('info', '#28a745', prefix, ...args);
        }
    }

    /**
     * Logger de nivel WARN
     */
    warn(prefix: string, ...args: any[]): void {
        if (this.currentLevel <= LogLevel.WARN) {
            this.log('warn', '#ff9800', prefix, ...args);
        }
    }

    /**
     * Logger de nivel ERROR
     */
    error(prefix: string, ...args: any[]): void {
        if (this.currentLevel <= LogLevel.ERROR) {
            this.log('error', '#d32f2f', prefix, ...args);
        }
    }

    /**
     * Internal log method
     */
    private log(type: 'debug' | 'info' | 'warn' | 'error', color: string, prefix: string, ...args: any[]): void {
        const timestamp = this.enableTimestamp ? `[${new Date().toISOString()}] ` : '';
        const fullPrefix = `${timestamp}${prefix}`;

        if (this.enableColors) {
            const method = type === 'debug' ? 'log' : type;
            (console as any)[method](`%c${fullPrefix}`, `color: ${color}; font-weight: bold;`, ...args);
        } else {
            (console as any)[type === 'debug' ? 'log' : type](fullPrefix, ...args);
        }
    }

    /**
     * Establecer el nivel mínimo de logging
     */
    setLevel(level: LogLevel | keyof typeof LogLevel): void {
        const levelValue = typeof level === 'string' ? LogLevel[level] : level;
        if (levelValue !== undefined) {
            this.currentLevel = levelValue;
            this.info('[LOGGER]', `Nivel de logging establecido a: ${LogLevel[this.currentLevel]}`);
        } else {
            this.error('[LOGGER]', `Nivel desconocido: ${level}`);
        }
    }

    /**
     * Obtener el nivel actual
     */
    getLevel(): string {
        return LogLevel[this.currentLevel];
    }

    /**
     * Get logger info
     */
    getInfo(): LoggerInfo {
        return {
            currentLevel: this.getLevel(),
            isProduction: this.isProduction,
            availableLevels: Object.keys(LogLevel).filter(k => isNaN(Number(k))),
            description: 'Logger centralizado para BGE - Controla output de console.log'
        };
    }

    /**
     * Log con marca de tiempo
     */
    timestampedLog(prefix: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        this.info(`[${timestamp}] ${prefix}`, ...args);
    }

    /**
     * Log con información de contexto
     */
    contextLog(prefix: string, context: Record<string, any>, ...args: any[]): void {
        this.info(prefix, 'Contexto:', context, ...args);
    }

    /**
     * Grupo de logs (para mejor organización)
     */
    group(groupName: string, fn: () => void): void {
        if (this.currentLevel <= LogLevel.DEBUG) {
            console.group(`%c${groupName}`, 'color: #9c27b0; font-weight: bold; font-size: 12px;');
            fn();
            console.groupEnd();
        }
    }

    /**
     * Collapsed group
     */
    groupCollapsed(groupName: string, fn: () => void): void {
        if (this.currentLevel <= LogLevel.DEBUG) {
            console.groupCollapsed(`%c${groupName}`, 'color: #9c27b0; font-weight: bold;');
            fn();
            console.groupEnd();
        }
    }

    /**
     * Performance tracking
     */
    async measure<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
        const start = performance.now();
        try {
            const result = await fn();
            const duration = performance.now() - start;
            this.info(`[PERF] ${label}`, `${duration.toFixed(2)}ms`);
            return result;
        } catch (err) {
            const duration = performance.now() - start;
            this.error(`[PERF] ${label}`, `Error después de ${duration.toFixed(2)}ms:`, err);
            throw err;
        }
    }

    /**
     * Tabla de datos para visualización
     */
    table(prefix: string, data: any[]): void {
        if (this.currentLevel <= LogLevel.DEBUG) {
            console.log(`%c${prefix}`, 'color: #007bff; font-weight: bold;');
            console.table(data);
        }
    }

    /**
     * Time tracking start
     */
    time(label: string): void {
        if (this.currentLevel <= LogLevel.DEBUG) {
            console.time(label);
        }
    }

    /**
     * Time tracking end
     */
    timeEnd(label: string): void {
        if (this.currentLevel <= LogLevel.DEBUG) {
            console.timeEnd(label);
        }
    }

    /**
     * Assert with logging
     */
    assert(condition: boolean, prefix: string, ...args: any[]): void {
        if (!condition) {
            this.error(prefix, 'Assertion failed:', ...args);
        }
    }

    /**
     * Clear console
     */
    clear(): void {
        console.clear();
    }
}

// Singleton instance
export const logger = Logger.getInstance();

// Expose globally
if (typeof window !== 'undefined') {
    (window as any).logger = logger;
    (window as any).Logger = Logger;
    (window as any).LogLevel = LogLevel;
}

logger.info('[LOGGER]', `Logger-Manager TS inicializado en modo ${logger.getLevel()}`);

export default logger;
