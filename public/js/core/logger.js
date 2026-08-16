/**
 * 📝 SISTEMA DE LOGGING CENTRALIZADO BGE
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Reemplaza console.log dispersos por sistema unificado
 * Niveles: ERROR, WARN, INFO, DEBUG
 */

class BGELogger {
    constructor() {
        // Definir LEVELS PRIMERO antes de usarlo
        this.LEVELS = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };

        this.logLevel = this.getLogLevel();
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();

        this.init();
    }

    init() {
        // Interceptar errores globales
        window.addEventListener('error', (event) => {
            this.error('Global Error', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error?.stack
            });
        });

        // Interceptar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });

        this.info('BGE Logger inicializado', {
            sessionId: this.sessionId,
            logLevel: this.getLogLevelName(),
            timestamp: new Date().toISOString()
        });
    }

    getLogLevel() {
        // En desarrollo: DEBUG, en producción: INFO
        if (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1') {
            return this.LEVELS.DEBUG;
        }
        return this.LEVELS.INFO;
    }

    getLogLevelName() {
        return Object.keys(this.LEVELS)[this.logLevel];
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    shouldLog(level) {
        return level <= this.logLevel;
    }

    formatMessage(level, module, message, data = null) {
        const timestamp = new Date().toISOString();
        const levelName = Object.keys(this.LEVELS)[level];
        const elapsed = Date.now() - this.startTime;

        const logEntry = {
            timestamp,
            level: levelName,
            module,
            message,
            sessionId: this.sessionId,
            elapsed: `${elapsed}ms`,
            url: window.location.href
        };

        if (data) {
            logEntry.data = data;
        }

        return logEntry;
    }

    log(level, module, message, data = null) {
        if (!this.shouldLog(level)) return;

        const logEntry = this.formatMessage(level, module, message, data);
        const levelName = Object.keys(this.LEVELS)[level];

        // Colores para consola
        const colors = {
            ERROR: '#ff4757',
            WARN: '#ffa502',
            INFO: '#3742fa',
            DEBUG: '#747d8c'
        };

        const style = `color: ${colors[levelName]}; font-weight: bold;`;

        console.groupCollapsed(`%c[${levelName}] ${module}: ${message}`, style);
        void 0;
        if (data) {
            void 0;
        }
        console.groupEnd();

        // Enviar a analytics en producción
        this.sendToAnalytics(logEntry);
    }

    error(module, message, data = null) {
        this.log(this.LEVELS.ERROR, module, message, data);
    }

    warn(module, message, data = null) {
        this.log(this.LEVELS.WARN, module, message, data);
    }

    info(module, message, data = null) {
        this.log(this.LEVELS.INFO, module, message, data);
    }

    debug(module, message, data = null) {
        this.log(this.LEVELS.DEBUG, module, message, data);
    }

    // Métricas de rendimiento
    startTimer(label) {
        this.debug('Performance', `⏱️ Timer iniciado: ${label}`);
        const timerStartTime = performance.now();
        return {
            label,
            startTime: timerStartTime,
            end: () => {
                const duration = performance.now() - timerStartTime;
                this.info('Performance', `⏱️ ${label} completado en ${duration.toFixed(2)}ms`);
                return duration;
            }
        };
    }

    // Log de user interactions
    userAction(action, element = null, data = null) {
        this.info('User Action', `👆 ${action}`, {
            element: element?.tagName || 'unknown',
            elementId: element?.id || null,
            elementClass: element?.className || null,
            data
        });
    }

    // Log de API calls
    apiCall(method, url, status = null, duration = null) {
        const level = status >= 400 ? this.LEVELS.ERROR : this.LEVELS.INFO;
        this.log(level, 'API', `${method} ${url}`, {
            status,
            duration: duration ? `${duration}ms` : null
        });
    }

    // Enviar logs a analytics (solo en producción)
    sendToAnalytics(logEntry) {
        if (this.logLevel <= this.LEVELS.INFO && logEntry.level === 'ERROR') {
            // En producción, enviar errores a servicio de analytics
            try {
                // Aquí iría la integración con servicio de analytics
                // fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) });
            } catch (e) {
                // Fallar silenciosamente para no crear loops
            }
        }
    }

    // Utilidades para migration de console.log existentes
    static migrate() {
        const originalConsole = { ...console };

        // Override console methods
        console.log = (...args) => window.BGELogger.debug('Console', args.join(' '));
        console.info = (...args) => window.BGELogger.info('Console', args.join(' '));
        console.warn = (...args) => window.BGELogger.warn('Console', args.join(' '));
        console.error = (...args) => window.BGELogger.error('Console', args.join(' '));

        // Mantener referencia al console original
        console._original = originalConsole;

        window.BGELogger.info('Logger', '🔄 Console methods migradas al BGE Logger');
    }

    // Estadísticas de logging
    getStats() {
        return {
            sessionId: this.sessionId,
            uptime: Date.now() - this.startTime,
            logLevel: this.getLogLevelName(),
            errorsCount: this.errorsCount || 0,
            warningsCount: this.warningsCount || 0
        };
    }
}

// Inicialización global
if (!window.BGELogger) {
    window.BGELogger = new BGELogger();

    // En desarrollo, migrar console automáticamente (DESHABILITADO por ahora)
    // if (window.location.hostname === 'localhost' ||
    //     window.location.hostname === '127.0.0.1') {
    //     BGELogger.migrate();
    // }
}

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGELogger;
}

void 0;