/**
 * Debug Logger - Logging condicional para desarrollo (TypeScript)
 * Solo loguea si DEBUG_MODE está activado
 * Migrado a TypeScript: 13 Diciembre 2025
 * Versión: 2.0
 */

// Extended window interface
declare global {
    interface Window {
        DEBUG_MODE?: boolean;
        debugLog?: IDebugLog;
    }
}

export interface IDebugLog {
    log: (tag: string, message: string, data?: any) => void;
    warn: (tag: string, message: string, data?: any) => void;
    error: (tag: string, message: string, data?: any) => void;
    info: (tag: string, message: string, data?: any) => void;
    debug: (tag: string, message: string, data?: any) => void;
    group: (tag: string, label: string) => void;
    groupEnd: () => void;
    time: (label: string) => void;
    timeEnd: (label: string) => void;
}

class DebugLogger implements IDebugLog {
    private enabled: boolean;

    constructor() {
        this.enabled = typeof window !== 'undefined' && !!window.DEBUG_MODE;
    }

    /**
     * Check if debug mode is enabled
     */
    isEnabled(): boolean {
        return typeof window !== 'undefined' && !!window.DEBUG_MODE;
    }

    /**
     * Enable/disable debug mode
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (typeof window !== 'undefined') {
            window.DEBUG_MODE = enabled;
        }
    }

    /**
     * Log informational message
     * @param tag - Prefijo del log (ej: 'AUTH', 'API', 'FORM')
     * @param message - Mensaje
     * @param data - Datos adicionales (opcional)
     */
    log(tag: string, message: string, data: any = null): void {
        if (!this.isEnabled()) return;
        const timestamp = new Date().toLocaleTimeString();
        
    }

    /**
     * Log informational message (alias for log)
     */
    info(tag: string, message: string, data: any = null): void {
        if (!this.isEnabled()) return;
        const timestamp = new Date().toLocaleTimeString();
        
    }

    /**
     * Log debug message (verbose)
     */
    debug(tag: string, message: string, data: any = null): void {
        if (!this.isEnabled()) return;
        const timestamp = new Date().toLocaleTimeString();
        console.debug(
            `%c[${timestamp}] [${tag}] 🔍 ${message}`,
            'color: #6c757d; font-weight: normal;',
            data ?? ''
        );
    }

    /**
     * Log de warning
     * @param tag - Prefijo del log
     * @param message - Mensaje
     * @param data - Datos adicionales (opcional)
     */
    warn(tag: string, message: string, data: any = null): void {
        if (!this.isEnabled()) return;
        const timestamp = new Date().toLocaleTimeString();
        
    }

    /**
     * Log de error
     * @param tag - Prefijo del log
     * @param message - Mensaje
     * @param data - Datos adicionales (opcional)
     */
    error(tag: string, message: string, data: any = null): void {
        if (!this.isEnabled()) return;
        const timestamp = new Date().toLocaleTimeString();
        console.error(
            `%c[${timestamp}] [${tag}] ❌ ${message}`,
            'color: #ff3333; font-weight: bold;',
            data ?? ''
        );
    }

    /**
     * Start a console group
     */
    group(tag: string, label: string): void {
        if (!this.isEnabled()) return;
        const timestamp = new Date().toLocaleTimeString();
        console.group(`[${timestamp}] [${tag}] ${label}`);
    }

    /**
     * End a console group
     */
    groupEnd(): void {
        if (!this.isEnabled()) return;
        console.groupEnd();
    }

    /**
     * Start a timer
     */
    time(label: string): void {
        if (!this.isEnabled()) return;
        console.time(label);
    }

    /**
     * End a timer and log the duration
     */
    timeEnd(label: string): void {
        if (!this.isEnabled()) return;
        console.timeEnd(label);
    }
}

// Singleton instance
export const debugLog = new DebugLogger();

// Exponer globalmente para compatibilidad legacy
if (typeof window !== 'undefined') {
    // Solo asignar si no existe ya
    if (!window.debugLog) {
        window.debugLog = debugLog;
    }
}

export default debugLog;
