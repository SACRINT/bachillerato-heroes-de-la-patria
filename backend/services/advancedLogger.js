/**
 * 📝 SISTEMA DE LOGS AVANZADO - BGE HÉROES DE LA PATRIA
 * Sistema completo de logging con niveles, rotación y almacenamiento
 */

const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');

class AdvancedLogger {
    constructor(options = {}) {
        this.logDir = options.logDir || path.join(__dirname, '../logs');
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
        this.maxFiles = options.maxFiles || 30; // 30 archivos de rotación
        this.environment = process.env.NODE_ENV || 'development';

        // Configuración de niveles de log
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            http: 3,
            verbose: 4,
            debug: 5,
            silly: 6
        };

        this.colors = {
            error: '\x1b[31m',   // Rojo
            warn: '\x1b[33m',    // Amarillo
            info: '\x1b[36m',    // Cian
            http: '\x1b[35m',    // Magenta
            verbose: '\x1b[32m', // Verde
            debug: '\x1b[34m',   // Azul
            silly: '\x1b[37m',   // Blanco
            reset: '\x1b[0m'     // Reset
        };

        this.currentLevel = options.level || (this.environment === 'production' ? 'info' : 'debug');
        this.streams = new Map();

        console.log('📝 [LOGGER] Sistema de logs avanzado inicializado');
        this.init();
    }

    /**
     * Inicializar sistema de logs
     */
    async init() {
        try {
            await this.ensureLogDirectory();
            await this.setupFileStreams();
            await this.cleanOldLogs();

            console.log('✅ [LOGGER] Sistema configurado correctamente');

            // Log de inicio del sistema
            this.info('Sistema de logs avanzado iniciado', {
                environment: this.environment,
                level: this.currentLevel,
                logDir: this.logDir
            });
        } catch (error) {
            console.error('❌ [LOGGER] Error inicializando sistema:', error);
        }
    }

    /**
     * Asegurar que existe el directorio de logs
     */
    async ensureLogDirectory() {
        try {
            await fs.access(this.logDir);
        } catch (error) {
            await fs.mkdir(this.logDir, { recursive: true });
            console.log(`📁 [LOGGER] Directorio creado: ${this.logDir}`);
        }
    }

    /**
     * Configurar streams de archivos
     */
    async setupFileStreams() {
        const today = new Date().toISOString().split('T')[0];

        // Stream para logs generales
        const generalLogPath = path.join(this.logDir, `app-${today}.log`);
        this.streams.set('general', createWriteStream(generalLogPath, { flags: 'a' }));

        // Stream para errores
        const errorLogPath = path.join(this.logDir, `error-${today}.log`);
        this.streams.set('error', createWriteStream(errorLogPath, { flags: 'a' }));

        // Stream para accesos HTTP
        const httpLogPath = path.join(this.logDir, `http-${today}.log`);
        this.streams.set('http', createWriteStream(httpLogPath, { flags: 'a' }));

        // Stream para actividad de usuarios
        const activityLogPath = path.join(this.logDir, `activity-${today}.log`);
        this.streams.set('activity', createWriteStream(activityLogPath, { flags: 'a' }));

        // Stream para seguridad
        const securityLogPath = path.join(this.logDir, `security-${today}.log`);
        this.streams.set('security', createWriteStream(securityLogPath, { flags: 'a' }));
    }

    /**
     * Escribir log en archivo y consola
     */
    writeLog(level, message, meta = {}, category = 'general') {
        // Verificar si el nivel debe ser registrado
        if (this.levels[level] > this.levels[this.currentLevel]) {
            return;
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            meta,
            environment: this.environment,
            pid: process.pid,
            category
        };

        const formattedLog = this.formatLogEntry(logEntry);

        // Escribir en consola con colores
        this.writeToConsole(level, formattedLog);

        // Escribir en archivo
        this.writeToFile(level, formattedLog, category);
    }

    /**
     * Formatear entrada de log
     */
    formatLogEntry(logEntry) {
        const { timestamp, level, message, meta, environment, pid, category } = logEntry;

        const baseLog = `[${timestamp}] [${level}] [${category.toUpperCase()}] [PID:${pid}] ${message}`;

        if (Object.keys(meta).length > 0) {
            return `${baseLog} ${JSON.stringify(meta, null, 2)}`;
        }

        return baseLog;
    }

    /**
     * Escribir en consola con colores
     */
    writeToConsole(level, formattedLog) {
        const color = this.colors[level] || this.colors.reset;
        console.log(`${color}${formattedLog}${this.colors.reset}`);
    }

    /**
     * Escribir en archivo
     */
    writeToFile(level, formattedLog, category) {
        try {
            // Escribir en stream general
            const generalStream = this.streams.get('general');
            if (generalStream) {
                generalStream.write(formattedLog + '\n');
            }

            // Escribir en stream específico para errores
            if (level === 'error') {
                const errorStream = this.streams.get('error');
                if (errorStream) {
                    errorStream.write(formattedLog + '\n');
                }
            }

            // Escribir en stream específico para HTTP
            if (level === 'http' || category === 'http') {
                const httpStream = this.streams.get('http');
                if (httpStream) {
                    httpStream.write(formattedLog + '\n');
                }
            }

            // Escribir en stream de actividad para logs de usuarios
            if (category === 'activity' || category === 'user') {
                const activityStream = this.streams.get('activity');
                if (activityStream) {
                    activityStream.write(formattedLog + '\n');
                }
            }

            // Escribir en stream de seguridad
            if (category === 'security' || level === 'warn') {
                const securityStream = this.streams.get('security');
                if (securityStream) {
                    securityStream.write(formattedLog + '\n');
                }
            }
        } catch (error) {
            console.error('❌ [LOGGER] Error escribiendo en archivo:', error);
        }
    }

    /**
     * Métodos de logging por nivel
     */
    error(message, meta = {}, category = 'general') {
        this.writeLog('error', message, meta, category);
    }

    warn(message, meta = {}, category = 'general') {
        this.writeLog('warn', message, meta, category);
    }

    info(message, meta = {}, category = 'general') {
        this.writeLog('info', message, meta, category);
    }

    http(message, meta = {}, category = 'http') {
        this.writeLog('http', message, meta, category);
    }

    verbose(message, meta = {}, category = 'general') {
        this.writeLog('verbose', message, meta, category);
    }

    debug(message, meta = {}, category = 'general') {
        this.writeLog('debug', message, meta, category);
    }

    silly(message, meta = {}, category = 'general') {
        this.writeLog('silly', message, meta, category);
    }

    /**
     * Métodos especializados por categoría
     */
    security(message, meta = {}) {
        this.warn(message, { ...meta, securityEvent: true }, 'security');
    }

    activity(message, meta = {}) {
        this.info(message, meta, 'activity');
    }

    performance(message, meta = {}) {
        this.info(message, { ...meta, performanceMetric: true }, 'performance');
    }

    database(message, meta = {}) {
        this.debug(message, { ...meta, databaseOperation: true }, 'database');
    }

    audit(message, meta = {}) {
        this.info(message, { ...meta, auditEvent: true }, 'audit');
    }

    /**
     * Log de request HTTP
     */
    logRequest(req, res, responseTime) {
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user?.id || 'anonymous'
        };

        const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`;
        this.http(message, logData);
    }

    /**
     * Log de autenticación
     */
    logAuth(action, success, meta = {}) {
        const level = success ? 'info' : 'warn';
        const message = `Authentication ${action}: ${success ? 'SUCCESS' : 'FAILED'}`;

        this.writeLog(level, message, {
            ...meta,
            authAction: action,
            success,
            timestamp: new Date().toISOString()
        }, 'security');
    }

    /**
     * Log de error con stack trace
     */
    logError(error, context = {}) {
        const errorData = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };

        this.error(`Error occurred: ${error.message}`, errorData);
    }

    /**
     * Limpiar logs antiguos
     */
    async cleanOldLogs() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files
                .filter(file => file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(this.logDir, file),
                    stat: null
                }));

            // Obtener información de archivos
            for (let file of logFiles) {
                try {
                    file.stat = await fs.stat(file.path);
                } catch (error) {
                    console.warn(`No se pudo acceder al archivo: ${file.name}`);
                }
            }

            // Filtrar archivos válidos y ordenar por fecha
            const validFiles = logFiles
                .filter(file => file.stat)
                .sort((a, b) => b.stat.mtime - a.stat.mtime);

            // Eliminar archivos antiguos
            if (validFiles.length > this.maxFiles) {
                const filesToDelete = validFiles.slice(this.maxFiles);
                for (let file of filesToDelete) {
                    await fs.unlink(file.path);
                    console.log(`🗑️ [LOGGER] Log antiguo eliminado: ${file.name}`);
                }
            }

            console.log(`🧹 [LOGGER] Limpieza completada. Logs actuales: ${Math.min(validFiles.length, this.maxFiles)}`);
        } catch (error) {
            console.error('❌ [LOGGER] Error limpiando logs antiguos:', error);
        }
    }

    /**
     * Rotar logs si exceden el tamaño máximo
     */
    async rotateLogs() {
        try {
            for (let [category, stream] of this.streams) {
                const logPath = stream.path;
                if (!logPath) continue;

                try {
                    const stat = await fs.stat(logPath);
                    if (stat.size > this.maxFileSize) {
                        // Cerrar stream actual
                        stream.end();

                        // Renombrar archivo actual
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const rotatedPath = logPath.replace('.log', `-rotated-${timestamp}.log`);
                        await fs.rename(logPath, rotatedPath);

                        // Crear nuevo stream
                        this.streams.set(category, createWriteStream(logPath, { flags: 'a' }));

                        this.info(`Log rotado: ${category}`, {
                            oldFile: rotatedPath,
                            newFile: logPath,
                            size: stat.size
                        });
                    }
                } catch (error) {
                    this.warn(`Error rotando log para categoría ${category}:`, error.message);
                }
            }
        } catch (error) {
            console.error('❌ [LOGGER] Error durante rotación de logs:', error);
        }
    }

    /**
     * Obtener estadísticas de logs
     */
    async getLogStats() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));

            let totalSize = 0;
            const fileStats = [];

            for (let file of logFiles) {
                try {
                    const filePath = path.join(this.logDir, file);
                    const stat = await fs.stat(filePath);
                    totalSize += stat.size;

                    fileStats.push({
                        name: file,
                        size: stat.size,
                        sizeFormatted: this.formatBytes(stat.size),
                        created: stat.birthtime,
                        modified: stat.mtime
                    });
                } catch (error) {
                    console.warn(`Error obteniendo stats de ${file}:`, error.message);
                }
            }

            return {
                totalFiles: logFiles.length,
                totalSize,
                totalSizeFormatted: this.formatBytes(totalSize),
                files: fileStats.sort((a, b) => b.modified - a.modified),
                maxFiles: this.maxFiles,
                maxFileSize: this.maxFileSize,
                currentLevel: this.currentLevel
            };
        } catch (error) {
            this.error('Error obteniendo estadísticas de logs', { error: error.message });
            return null;
        }
    }

    /**
     * Formatear bytes a tamaño legible
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Cambiar nivel de logging
     */
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.currentLevel = level;
            this.info(`Nivel de logging cambiado a: ${level}`);
            return true;
        }
        this.warn(`Nivel de logging inválido: ${level}`);
        return false;
    }

    /**
     * Búsqueda en logs
     */
    async searchLogs(query, options = {}) {
        try {
            const {
                level = null,
                category = null,
                startDate = null,
                endDate = null,
                limit = 100
            } = options;

            const files = await fs.readdir(this.logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));

            let results = [];

            for (let file of logFiles) {
                try {
                    const filePath = path.join(this.logDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const lines = content.split('\n').filter(line => line.trim());

                    for (let line of lines) {
                        if (line.includes(query)) {
                            // Aplicar filtros adicionales
                            if (level && !line.includes(`[${level.toUpperCase()}]`)) continue;
                            if (category && !line.includes(`[${category.toUpperCase()}]`)) continue;

                            results.push({
                                file,
                                line,
                                timestamp: this.extractTimestamp(line)
                            });

                            if (results.length >= limit) break;
                        }
                    }

                    if (results.length >= limit) break;
                } catch (error) {
                    this.warn(`Error buscando en archivo ${file}:`, error.message);
                }
            }

            return {
                query,
                total: results.length,
                results: results.slice(0, limit),
                options
            };
        } catch (error) {
            this.error('Error buscando en logs', { error: error.message, query });
            return { query, total: 0, results: [], error: error.message };
        }
    }

    /**
     * Extraer timestamp de línea de log
     */
    extractTimestamp(line) {
        const match = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
        return match ? match[1] : null;
    }

    /**
     * Cerrar todos los streams
     */
    close() {
        for (let [category, stream] of this.streams) {
            try {
                stream.end();
                console.log(`📝 [LOGGER] Stream cerrado: ${category}`);
            } catch (error) {
                console.error(`Error cerrando stream ${category}:`, error);
            }
        }
        this.streams.clear();
        console.log('🛑 [LOGGER] Sistema de logs detenido');
    }
}

// Instancia singleton del logger
let loggerInstance = null;

/**
 * Obtener instancia del logger avanzado
 */
function getAdvancedLogger(options = {}) {
    if (!loggerInstance) {
        loggerInstance = new AdvancedLogger(options);
    }
    return loggerInstance;
}

module.exports = {
    AdvancedLogger,
    getAdvancedLogger
};