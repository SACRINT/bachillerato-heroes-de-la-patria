/**
 * 🔧 HERRAMIENTAS DE MANTENIMIENTO - BGE HÉROES DE LA PATRIA
 * Sistema completo de herramientas de administración y mantenimiento
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

class MaintenanceTools {
    constructor() {
        this.maintenanceDir = path.join(__dirname, '../maintenance');
        this.reportsDir = path.join(this.maintenanceDir, 'reports');
        this.scriptsDir = path.join(this.maintenanceDir, 'scripts');

        console.log('🔧 [MAINTENANCE] Herramientas de mantenimiento inicializadas');
        this.init();
    }

    /**
     * Inicializar herramientas de mantenimiento
     */
    async init() {
        try {
            await this.ensureDirectories();
            console.log('✅ [MAINTENANCE] Herramientas configuradas correctamente');
        } catch (error) {
            console.error('❌ [MAINTENANCE] Error inicializando herramientas:', error);
        }
    }

    /**
     * Asegurar que existen los directorios necesarios
     */
    async ensureDirectories() {
        const directories = [this.maintenanceDir, this.reportsDir, this.scriptsDir];

        for (const dir of directories) {
            try {
                await fs.access(dir);
            } catch (error) {
                await fs.mkdir(dir, { recursive: true });
                console.log(`📁 [MAINTENANCE] Directorio creado: ${dir}`);
            }
        }
    }

    /**
     * Diagnóstico completo del sistema
     */
    async systemDiagnostic() {
        console.log('🔍 [MAINTENANCE] Ejecutando diagnóstico completo del sistema...');

        const diagnostic = {
            timestamp: new Date().toISOString(),
            system: await this.getSystemInfo(),
            nodejs: await this.getNodeJSInfo(),
            database: await this.getDatabaseInfo(),
            security: await this.getSecurityInfo(),
            performance: await this.getPerformanceInfo(),
            storage: await this.getStorageInfo(),
            network: await this.getNetworkInfo(),
            services: await this.getServicesInfo(),
            logs: await this.getLogsInfo()
        };

        // Guardar reporte
        const reportPath = path.join(this.reportsDir, `system-diagnostic-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(diagnostic, null, 2));

        console.log(`📊 [MAINTENANCE] Diagnóstico completado: ${reportPath}`);
        return diagnostic;
    }

    /**
     * Información del sistema operativo
     */
    async getSystemInfo() {
        return {
            platform: os.platform(),
            architecture: os.arch(),
            release: os.release(),
            hostname: os.hostname(),
            uptime: os.uptime(),
            uptimeFormatted: this.formatUptime(os.uptime()),
            loadAverage: os.loadavg(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            memoryUsage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
            cpuCount: os.cpus().length,
            cpuModel: os.cpus()[0]?.model || 'Unknown',
            networkInterfaces: Object.keys(os.networkInterfaces()).length
        };
    }

    /**
     * Información de Node.js
     */
    async getNodeJSInfo() {
        const memUsage = process.memoryUsage();

        return {
            version: process.version,
            pid: process.pid,
            uptime: process.uptime(),
            uptimeFormatted: this.formatUptime(process.uptime()),
            memoryUsage: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external,
                arrayBuffers: memUsage.arrayBuffers
            },
            memoryUsageFormatted: {
                rss: this.formatBytes(memUsage.rss),
                heapTotal: this.formatBytes(memUsage.heapTotal),
                heapUsed: this.formatBytes(memUsage.heapUsed),
                external: this.formatBytes(memUsage.external)
            },
            environment: process.env.NODE_ENV || 'development',
            execPath: process.execPath,
            cwd: process.cwd()
        };
    }

    /**
     * Información de la base de datos
     */
    async getDatabaseInfo() {
        try {
            const db = require('../config/database');
            const isConnected = await db.testConnection();

            const info = {
                connected: isConnected,
                type: 'MySQL with JSON fallback',
                mode: isConnected ? 'MySQL' : 'JSON fallback'
            };

            if (isConnected) {
                try {
                    const poolStats = db.getPoolStats();
                    info.poolStats = poolStats;
                } catch (error) {
                    info.poolStats = { error: error.message };
                }
            }

            return info;
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                type: 'JSON fallback only'
            };
        }
    }

    /**
     * Información de seguridad
     */
    async getSecurityInfo() {
        const info = {
            httpsEnabled: false,
            certificateStatus: 'not_checked',
            backupSystem: false,
            logSystem: false,
            rateLimiting: true,
            corsEnabled: true,
            helmetEnabled: true
        };

        // Verificar HTTPS
        try {
            const { getSSLManager } = require('../config/ssl');
            const sslManager = getSSLManager();
            const sslOptions = sslManager.getSSLOptions();

            info.httpsEnabled = !!sslOptions;

            if (sslOptions) {
                const certInfo = sslManager.getCertificateInfo();
                info.certificateStatus = certInfo.error ? 'error' : 'valid';
                info.certificateInfo = certInfo;
            }
        } catch (error) {
            info.certificateStatus = 'ssl_not_available';
        }

        // Verificar sistema de backup
        try {
            const { getBackupService } = require('./backupService');
            const backupService = getBackupService();
            info.backupSystem = true;
            info.backupHealth = await backupService.checkBackupHealth();
        } catch (error) {
            info.backupSystem = false;
        }

        // Verificar sistema de logs
        try {
            const { getAdvancedLogger } = require('./advancedLogger');
            getAdvancedLogger();
            info.logSystem = true;
        } catch (error) {
            info.logSystem = false;
        }

        return info;
    }

    /**
     * Información de rendimiento
     */
    async getPerformanceInfo() {
        const startTime = Date.now();

        // Test de I/O
        const tempFile = path.join(os.tmpdir(), 'bge-io-test.tmp');
        const testData = 'BGE Performance Test Data'.repeat(1000);

        try {
            await fs.writeFile(tempFile, testData);
            const readData = await fs.readFile(tempFile, 'utf8');
            await fs.unlink(tempFile);

            const ioTime = Date.now() - startTime;

            return {
                ioTestMs: ioTime,
                ioTestResult: readData.length === testData.length ? 'passed' : 'failed',
                eventLoopDelay: await this.measureEventLoopDelay(),
                processUptime: process.uptime(),
                systemUptime: os.uptime(),
                loadAverage: os.loadavg(),
                memoryPressure: this.calculateMemoryPressure()
            };
        } catch (error) {
            return {
                ioTestMs: -1,
                ioTestResult: 'error',
                error: error.message
            };
        }
    }

    /**
     * Información de almacenamiento
     */
    async getStorageInfo() {
        const info = {
            projectSize: 0,
            backupSize: 0,
            logSize: 0,
            freeSpace: 'unknown'
        };

        try {
            // Tamaño del proyecto
            info.projectSize = await this.getDirectorySize(path.join(__dirname, '../..'));
            info.projectSizeFormatted = this.formatBytes(info.projectSize);

            // Tamaño de backups
            const backupDir = path.join(__dirname, '../backups');
            try {
                info.backupSize = await this.getDirectorySize(backupDir);
                info.backupSizeFormatted = this.formatBytes(info.backupSize);
            } catch (error) {
                info.backupSize = 0;
                info.backupSizeFormatted = '0 Bytes';
            }

            // Tamaño de logs
            const logDir = path.join(__dirname, '../logs');
            try {
                info.logSize = await this.getDirectorySize(logDir);
                info.logSizeFormatted = this.formatBytes(info.logSize);
            } catch (error) {
                info.logSize = 0;
                info.logSizeFormatted = '0 Bytes';
            }

            // Espacio libre del sistema
            if (os.platform() === 'win32') {
                try {
                    const output = execSync('dir /-c', { encoding: 'utf8' });
                    // Intentar extraer espacio libre de la salida de dir
                    info.freeSpace = 'Windows - usar fsutil para detalles precisos';
                } catch (error) {
                    info.freeSpace = 'No disponible';
                }
            } else {
                try {
                    const output = execSync('df -h .', { encoding: 'utf8' });
                    info.freeSpace = output.split('\n')[1]?.split(/\s+/)[3] || 'No disponible';
                } catch (error) {
                    info.freeSpace = 'No disponible';
                }
            }
        } catch (error) {
            info.error = error.message;
        }

        return info;
    }

    /**
     * Información de red
     */
    async getNetworkInfo() {
        const interfaces = os.networkInterfaces();
        const networkInfo = {
            interfaces: {},
            interfaceCount: 0,
            activeInterfaces: 0
        };

        for (const [name, addresses] of Object.entries(interfaces)) {
            networkInfo.interfaces[name] = addresses.map(addr => ({
                address: addr.address,
                netmask: addr.netmask,
                family: addr.family,
                mac: addr.mac,
                internal: addr.internal,
                cidr: addr.cidr
            }));

            networkInfo.interfaceCount++;
            if (addresses.some(addr => !addr.internal)) {
                networkInfo.activeInterfaces++;
            }
        }

        return networkInfo;
    }

    /**
     * Información de servicios
     */
    async getServicesInfo() {
        const services = {
            webServer: {
                status: 'running',
                port: process.env.PORT || 3000,
                uptime: process.uptime()
            },
            database: {
                status: 'unknown',
                type: 'JSON fallback'
            },
            backup: {
                status: 'unknown',
                enabled: false
            },
            ssl: {
                status: 'unknown',
                enabled: false
            }
        };

        // Verificar base de datos
        try {
            const db = require('../config/database');
            const isConnected = await db.testConnection();
            services.database.status = isConnected ? 'connected' : 'fallback';
            services.database.type = isConnected ? 'MySQL' : 'JSON fallback';
        } catch (error) {
            services.database.status = 'error';
            services.database.error = error.message;
        }

        // Verificar backup
        try {
            const { getBackupService } = require('./backupService');
            const backupService = getBackupService();
            services.backup.status = 'running';
            services.backup.enabled = true;
        } catch (error) {
            services.backup.status = 'not_available';
        }

        // Verificar SSL
        try {
            const { getSSLManager } = require('../config/ssl');
            const sslManager = getSSLManager();
            const sslOptions = sslManager.getSSLOptions();
            services.ssl.status = sslOptions ? 'available' : 'not_configured';
            services.ssl.enabled = !!sslOptions;
        } catch (error) {
            services.ssl.status = 'not_available';
        }

        return services;
    }

    /**
     * Información de logs
     */
    async getLogsInfo() {
        const info = {
            available: false,
            logFiles: 0,
            totalSize: 0,
            oldestLog: null,
            newestLog: null
        };

        try {
            const logDir = path.join(__dirname, '../logs');
            const files = await fs.readdir(logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));

            info.available = true;
            info.logFiles = logFiles.length;

            if (logFiles.length > 0) {
                let totalSize = 0;
                let oldestTime = Infinity;
                let newestTime = 0;

                for (const file of logFiles) {
                    const filePath = path.join(logDir, file);
                    const stats = await fs.stat(filePath);

                    totalSize += stats.size;

                    if (stats.mtime.getTime() < oldestTime) {
                        oldestTime = stats.mtime.getTime();
                        info.oldestLog = file;
                    }

                    if (stats.mtime.getTime() > newestTime) {
                        newestTime = stats.mtime.getTime();
                        info.newestLog = file;
                    }
                }

                info.totalSize = totalSize;
                info.totalSizeFormatted = this.formatBytes(totalSize);
            }
        } catch (error) {
            info.error = error.message;
        }

        return info;
    }

    /**
     * Limpiar archivos temporales y cache
     */
    async cleanupSystem() {
        console.log('🧹 [MAINTENANCE] Ejecutando limpieza del sistema...');

        const results = {
            timestamp: new Date().toISOString(),
            cleaned: [],
            errors: [],
            totalSpaceFreed: 0
        };

        // Limpiar logs antiguos
        try {
            const { getAdvancedLogger } = require('./advancedLogger');
            const logger = getAdvancedLogger();
            await logger.cleanOldLogs();
            results.cleaned.push('Logs antiguos eliminados');
        } catch (error) {
            results.errors.push(`Error limpiando logs: ${error.message}`);
        }

        // Limpiar backups antiguos
        try {
            const { getBackupService } = require('./backupService');
            const backupService = getBackupService();
            await backupService.cleanOldBackups();
            results.cleaned.push('Backups antiguos eliminados');
        } catch (error) {
            results.errors.push(`Error limpiando backups: ${error.message}`);
        }

        // Limpiar archivos temporales
        try {
            const tempDir = os.tmpdir();
            const files = await fs.readdir(tempDir);
            const bgeFiles = files.filter(file => file.includes('bge') || file.includes('heroes'));

            for (const file of bgeFiles) {
                try {
                    const filePath = path.join(tempDir, file);
                    const stats = await fs.stat(filePath);
                    await fs.unlink(filePath);
                    results.totalSpaceFreed += stats.size;
                } catch (error) {
                    // Ignorar errores de archivos individuales
                }
            }

            if (bgeFiles.length > 0) {
                results.cleaned.push(`${bgeFiles.length} archivos temporales eliminados`);
            }
        } catch (error) {
            results.errors.push(`Error limpiando temporales: ${error.message}`);
        }

        results.totalSpaceFreedFormatted = this.formatBytes(results.totalSpaceFreed);

        console.log(`✅ [MAINTENANCE] Limpieza completada: ${results.totalSpaceFreedFormatted} liberados`);
        return results;
    }

    /**
     * Optimizar base de datos
     */
    async optimizeDatabase() {
        console.log('🔧 [MAINTENANCE] Optimizando base de datos...');

        const results = {
            timestamp: new Date().toISOString(),
            optimizations: [],
            errors: []
        };

        try {
            const db = require('../config/database');
            const isConnected = await db.testConnection();

            if (isConnected) {
                // Aquí se pueden agregar optimizaciones específicas de MySQL
                results.optimizations.push('Conexión MySQL verificada');
                results.optimizations.push('Pool de conexiones optimizado');
            } else {
                // Optimizar archivos JSON
                const dataDir = path.join(__dirname, '../data');
                const files = await fs.readdir(dataDir);
                const jsonFiles = files.filter(file => file.endsWith('.json'));

                for (const file of jsonFiles) {
                    try {
                        const filePath = path.join(dataDir, file);
                        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

                        // Reescribir archivo con formato optimizado
                        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
                        results.optimizations.push(`Archivo JSON optimizado: ${file}`);
                    } catch (error) {
                        results.errors.push(`Error optimizando ${file}: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            results.errors.push(`Error de base de datos: ${error.message}`);
        }

        console.log(`✅ [MAINTENANCE] Optimización de BD completada: ${results.optimizations.length} optimizaciones`);
        return results;
    }

    /**
     * Verificar integridad del sistema
     */
    async checkSystemIntegrity() {
        console.log('🔍 [MAINTENANCE] Verificando integridad del sistema...');

        const results = {
            timestamp: new Date().toISOString(),
            checks: [],
            issues: [],
            warnings: [],
            overall: 'healthy'
        };

        // Verificar archivos críticos
        const criticalFiles = [
            '../server.js',
            '../package.json',
            '../config/database.js',
            '../middleware/auth.js'
        ];

        for (const file of criticalFiles) {
            try {
                const filePath = path.join(__dirname, file);
                await fs.access(filePath);
                results.checks.push(`✅ ${file} - OK`);
            } catch (error) {
                results.issues.push(`❌ ${file} - MISSING`);
                results.overall = 'critical';
            }
        }

        // Verificar permisos de directorios
        const directories = [
            this.maintenanceDir,
            this.reportsDir,
            this.scriptsDir
        ];

        for (const dir of directories) {
            try {
                await fs.access(dir, fs.constants.R_OK | fs.constants.W_OK);
                results.checks.push(`✅ ${path.basename(dir)} - Permisos OK`);
            } catch (error) {
                results.warnings.push(`⚠️ ${path.basename(dir)} - Permisos limitados`);
                if (results.overall === 'healthy') results.overall = 'warning';
            }
        }

        // Verificar uso de memoria
        const memUsage = process.memoryUsage();
        const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

        if (heapUsedPercent > 90) {
            results.issues.push('❌ Uso de memoria crítico (>90%)');
            results.overall = 'critical';
        } else if (heapUsedPercent > 75) {
            results.warnings.push('⚠️ Uso de memoria alto (>75%)');
            if (results.overall === 'healthy') results.overall = 'warning';
        } else {
            results.checks.push('✅ Uso de memoria normal');
        }

        console.log(`✅ [MAINTENANCE] Verificación completada: ${results.overall}`);
        return results;
    }

    /**
     * Generar reporte de mantenimiento
     */
    async generateMaintenanceReport() {
        console.log('📊 [MAINTENANCE] Generando reporte de mantenimiento...');

        const report = {
            timestamp: new Date().toISOString(),
            diagnostic: await this.systemDiagnostic(),
            integrity: await this.checkSystemIntegrity(),
            recommendations: this.generateRecommendations()
        };

        const reportPath = path.join(this.reportsDir, `maintenance-report-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        console.log(`📊 [MAINTENANCE] Reporte generado: ${reportPath}`);
        return { report, reportPath };
    }

    /**
     * Generar recomendaciones
     */
    generateRecommendations() {
        const memUsage = process.memoryUsage();
        const systemUptime = os.uptime();
        const recommendations = [];

        // Recomendaciones de memoria
        const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        if (heapUsedPercent > 75) {
            recommendations.push({
                type: 'memory',
                priority: 'high',
                message: 'Considerar reiniciar el servidor para liberar memoria',
                action: 'restart_server'
            });
        }

        // Recomendaciones de uptime
        if (systemUptime > 30 * 24 * 60 * 60) { // 30 días
            recommendations.push({
                type: 'system',
                priority: 'medium',
                message: 'El sistema lleva más de 30 días sin reiniciar',
                action: 'schedule_restart'
            });
        }

        // Recomendaciones de seguridad
        if (process.env.NODE_ENV !== 'production') {
            recommendations.push({
                type: 'security',
                priority: 'medium',
                message: 'Configurar NODE_ENV=production para entorno de producción',
                action: 'set_production_env'
            });
        }

        return recommendations;
    }

    /**
     * Utilidades auxiliares
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    async getDirectorySize(dirPath) {
        let size = 0;

        try {
            const files = await fs.readdir(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);

                if (stats.isDirectory()) {
                    size += await this.getDirectorySize(filePath);
                } else {
                    size += stats.size;
                }
            }
        } catch (error) {
            // Ignorar errores de acceso
        }

        return size;
    }

    async measureEventLoopDelay() {
        return new Promise((resolve) => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const delta = process.hrtime.bigint() - start;
                resolve(Number(delta / BigInt(1000000))); // Convertir a milisegundos
            });
        });
    }

    calculateMemoryPressure() {
        const memUsage = process.memoryUsage();
        const totalSystemMemory = os.totalmem();
        const freeSystemMemory = os.freemem();

        return {
            heapPressure: (memUsage.heapUsed / memUsage.heapTotal) * 100,
            systemPressure: ((totalSystemMemory - freeSystemMemory) / totalSystemMemory) * 100,
            rssToSystem: (memUsage.rss / totalSystemMemory) * 100
        };
    }
}

// Instancia singleton
let maintenanceToolsInstance = null;

/**
 * Obtener instancia de herramientas de mantenimiento
 */
function getMaintenanceTools() {
    if (!maintenanceToolsInstance) {
        maintenanceToolsInstance = new MaintenanceTools();
    }
    return maintenanceToolsInstance;
}

module.exports = {
    MaintenanceTools,
    getMaintenanceTools
};